"""Backend API tests for Si-Travel Riau."""
import os
import pytest
import requests
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://destination-search-4.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN = ("baghiz678@gmail.com", "Admin@2026")
LOKET = ("loket@sitravel.id", "Loket@2026")
LOKET2 = ("loket2@sitravel.id", "Loket@2026")
MANAGER = ("manager@sitravel.id", "Manager@2026")
USER = ("user@sitravel.id", "User@2026")

TODAY = datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _session(creds=None):
    s = requests.Session()
    if creds:
        r = s.post(f"{API}/auth/login", json={"email": creds[0], "password": creds[1]}, timeout=20)
        assert r.status_code == 200, f"Login {creds[0]} failed: {r.status_code} {r.text}"
    return s


# ---------- Public ----------
def test_root():
    r = requests.get(f"{API}/", timeout=20)
    assert r.status_code == 200
    assert "Si-Travel" in r.json().get("message", "")


def test_cities_12():
    r = requests.get(f"{API}/cities", timeout=20)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) == 12
    names = {c["name"] for c in data}
    assert "Pekanbaru" in names and "Bagansiapiapi" in names


def test_search_returns_schedules():
    r = requests.get(f"{API}/search", params={"origin": "Pekanbaru", "destination": "Bagansiapiapi", "date": TODAY}, timeout=20)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) >= 1
    s = data[0]
    for k in ("id", "travel", "seats_available", "depart_time", "price"):
        assert k in s, f"missing key {k}"
    assert s["travel"] is not None
    assert isinstance(s["seats_available"], int)


def test_schedule_seats_public():
    r = requests.get(f"{API}/search", params={"origin": "Pekanbaru", "destination": "Dumai", "date": TODAY}, timeout=20)
    sid = r.json()[0]["id"]
    r2 = requests.get(f"{API}/schedules/{sid}/seats", timeout=20)
    assert r2.status_code == 200
    d = r2.json()
    assert "schedule" in d and "taken_seats" in d and "travel" in d
    assert isinstance(d["taken_seats"], list)


# ---------- Auth ----------
def test_login_admin_and_cookie():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN[0], "password": ADMIN[1]}, timeout=20)
    assert r.status_code == 200
    body = r.json()
    assert body["user"]["role"] == "admin_app"
    assert body["user"]["email"] == ADMIN[0]
    assert "access_token" in s.cookies
    # cookie-authenticated me
    r2 = s.get(f"{API}/auth/me", timeout=20)
    assert r2.status_code == 200
    assert r2.json()["user"]["email"] == ADMIN[0]


def test_login_wrong_password():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN[0], "password": "wrong"}, timeout=20)
    assert r.status_code == 401


def test_register_forces_pengguna():
    email = f"TEST_reg_{os.urandom(4).hex()}@example.com"
    r = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "Passw0rd!", "name": "Test User", "role": "admin_app"
    }, timeout=20)
    assert r.status_code == 200
    assert r.json()["user"]["role"] == "pengguna"


def test_register_duplicate():
    r = requests.post(f"{API}/auth/register", json={
        "email": USER[0], "password": "whatever123", "name": "dup"
    }, timeout=20)
    assert r.status_code == 400


# ---------- Admin ----------
def test_admin_stats():
    s = _session(ADMIN)
    r = s.get(f"{API}/stats", timeout=20)
    assert r.status_code == 200
    d = r.json()
    for k in ("total_users", "total_travels", "total_schedules", "total_bookings", "revenue"):
        assert k in d


def test_travel_partners_forbidden_for_non_admin():
    s = _session(USER)
    r = s.post(f"{API}/travel-partners", json={"name": "x", "code": "XX"}, timeout=20)
    assert r.status_code == 403
    s2 = _session(LOKET)
    r2 = s2.post(f"{API}/travel-partners", json={"name": "x", "code": "XX"}, timeout=20)
    assert r2.status_code == 403


def test_admin_can_list_users():
    s = _session(ADMIN)
    r = s.get(f"{API}/users", timeout=20)
    assert r.status_code == 200
    assert any(u["email"] == USER[0] for u in r.json())


# ---------- Travel loket ----------
def test_travel_schedules_scoped():
    s = _session(LOKET)
    r = s.get(f"{API}/schedules", timeout=20)
    assert r.status_code == 200
    # Get user's travel_id
    me = s.get(f"{API}/auth/me", timeout=20).json()["user"]
    tid = me["travel_id"]
    assert tid
    for sched in r.json():
        assert sched["travel_id"] == tid


def test_travel_cannot_create_schedule_for_other_travel():
    s = _session(LOKET)
    r = s.post(f"{API}/schedules", json={
        "travel_id": "bogus-other-travel-id",
        "origin": "Pekanbaru", "destination": "Dumai",
        "depart_date": TODAY, "depart_time": "23:00",
        "price": 90000, "total_seats": 16,
    }, timeout=20)
    assert r.status_code == 403


def test_travel_can_create_own_schedule():
    s = _session(LOKET)
    me = s.get(f"{API}/auth/me").json()["user"]
    tomorrow = (datetime.now(timezone.utc) + timedelta(days=30)).strftime("%Y-%m-%d")
    r = s.post(f"{API}/schedules", json={
        "travel_id": me["travel_id"],
        "origin": "Pekanbaru", "destination": "Dumai",
        "depart_date": tomorrow, "depart_time": "22:00",
        "price": 100000, "total_seats": 16,
    }, timeout=20)
    assert r.status_code == 200
    sched_id = r.json()["id"]
    # cleanup
    s.delete(f"{API}/schedules/{sched_id}", timeout=20)


def test_travel_bookings_scoped():
    s = _session(LOKET)
    r = s.get(f"{API}/bookings", timeout=20)
    assert r.status_code == 200


# ---------- Manager ----------
def test_manager_stats_scoped():
    s = _session(MANAGER)
    r = s.get(f"{API}/stats", timeout=20)
    assert r.status_code == 200
    d = r.json()
    for k in ("total_schedules", "total_bookings", "revenue", "today_bookings"):
        assert k in d


# ---------- Pengguna booking ----------
def test_pengguna_booking_flow():
    s = _session(USER)
    # find a schedule
    r = requests.get(f"{API}/search", params={"origin": "Pekanbaru", "destination": "Dumai", "date": TODAY}, timeout=20)
    schedules = r.json()
    assert schedules
    # pick schedule with available seats
    sched = next((x for x in schedules if x["seats_available"] > 0), schedules[0])
    sid = sched["id"]
    seats_info = requests.get(f"{API}/schedules/{sid}/seats").json()
    taken = set(seats_info["taken_seats"])
    seat = next(n for n in range(1, sched["total_seats"] + 1) if n not in taken)
    r2 = s.post(f"{API}/bookings", json={
        "schedule_id": sid, "passenger_name": "TEST Pax",
        "passenger_phone": "0812", "seat_number": seat,
    }, timeout=20)
    assert r2.status_code == 200, r2.text
    booking = r2.json()
    assert booking["booking_code"].startswith("TR")
    assert booking["seat_number"] == seat
    # duplicate seat -> 400
    r3 = s.post(f"{API}/bookings", json={
        "schedule_id": sid, "passenger_name": "TEST Pax2",
        "passenger_phone": "0813", "seat_number": seat,
    }, timeout=20)
    assert r3.status_code == 400
    # bookings/me includes it
    r4 = s.get(f"{API}/bookings/me", timeout=20)
    assert r4.status_code == 200
    assert any(b["id"] == booking["id"] for b in r4.json())


def test_pengguna_cannot_list_all_bookings():
    s = _session(USER)
    r = s.get(f"{API}/bookings", timeout=20)
    assert r.status_code == 403


def test_unauth_me():
    r = requests.get(f"{API}/auth/me", timeout=20)
    assert r.status_code == 401


# ---------- Phase 2: Cancel booking ----------
def _create_fresh_booking(session):
    """Helper: create a fresh confirmed booking for USER."""
    r = requests.get(f"{API}/search", params={"origin": "Pekanbaru", "destination": "Dumai", "date": TODAY}, timeout=20)
    schedules = r.json()
    assert schedules
    sched = next((x for x in schedules if x["seats_available"] > 0), schedules[0])
    sid = sched["id"]
    seats_info = requests.get(f"{API}/schedules/{sid}/seats").json()
    taken = set(seats_info["taken_seats"])
    seat = next(n for n in range(1, sched["total_seats"] + 1) if n not in taken)
    r2 = session.post(f"{API}/bookings", json={
        "schedule_id": sid, "passenger_name": "TEST CancelPax",
        "passenger_phone": "0812", "seat_number": seat,
    }, timeout=20)
    assert r2.status_code == 200, r2.text
    return r2.json()


def test_cancel_own_booking_success():
    s = _session(USER)
    booking = _create_fresh_booking(s)
    r = s.post(f"{API}/bookings/{booking['id']}/cancel", timeout=20)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "cancelled"
    assert body["id"] == booking["id"]
    # second call -> 400
    r2 = s.post(f"{API}/bookings/{booking['id']}/cancel", timeout=20)
    assert r2.status_code == 400


def test_cancel_booking_non_owner_forbidden():
    s_owner = _session(USER)
    booking = _create_fresh_booking(s_owner)
    # Register a second pengguna to try to cancel
    email = f"TEST_other_{os.urandom(4).hex()}@example.com"
    r = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "Passw0rd!", "name": "Other"
    }, timeout=20)
    assert r.status_code == 200
    s_other = requests.Session()
    lr = s_other.post(f"{API}/auth/login", json={"email": email, "password": "Passw0rd!"}, timeout=20)
    assert lr.status_code == 200
    r2 = s_other.post(f"{API}/bookings/{booking['id']}/cancel", timeout=20)
    assert r2.status_code == 403
    # cleanup: owner cancels
    s_owner.post(f"{API}/bookings/{booking['id']}/cancel", timeout=20)


# ---------- Phase 2: GET /bookings/{id} ----------
def test_get_booking_owner_and_admin_ok_nonowner_403():
    s_owner = _session(USER)
    booking = _create_fresh_booking(s_owner)
    # owner
    r1 = s_owner.get(f"{API}/bookings/{booking['id']}", timeout=20)
    assert r1.status_code == 200
    body = r1.json()
    assert body["id"] == booking["id"]
    assert "travel" in body and body["travel"] is not None
    assert body["travel"].get("name")
    # admin
    s_admin = _session(ADMIN)
    r2 = s_admin.get(f"{API}/bookings/{booking['id']}", timeout=20)
    assert r2.status_code == 200
    # non-owner pengguna
    email = f"TEST_other2_{os.urandom(4).hex()}@example.com"
    requests.post(f"{API}/auth/register", json={"email": email, "password": "Passw0rd!", "name": "O2"}, timeout=20)
    s_other = requests.Session()
    s_other.post(f"{API}/auth/login", json={"email": email, "password": "Passw0rd!"}, timeout=20)
    r3 = s_other.get(f"{API}/bookings/{booking['id']}", timeout=20)
    assert r3.status_code == 403
    # cleanup
    s_owner.post(f"{API}/bookings/{booking['id']}/cancel", timeout=20)


# ---------- Phase 2: Admin creates users ----------
def test_admin_create_user_pengguna_ok():
    s = _session(ADMIN)
    email = f"TEST_adminmade_{os.urandom(4).hex()}@example.com"
    r = s.post(f"{API}/users", json={
        "email": email, "password": "Passw0rd!", "name": "Made By Admin", "role": "pengguna"
    }, timeout=20)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["email"] == email.lower()
    assert body["role"] == "pengguna"
    assert "id" in body
    assert "password_hash" not in body
    # verify persisted via listing
    r2 = s.get(f"{API}/users", timeout=20)
    assert any(u["email"] == email.lower() for u in r2.json())


def test_admin_create_user_non_admin_forbidden():
    s = _session(USER)
    r = s.post(f"{API}/users", json={
        "email": "TEST_forbid@example.com", "password": "Passw0rd!", "name": "x", "role": "pengguna"
    }, timeout=20)
    assert r.status_code == 403


def test_admin_create_travel_user_requires_travel_id():
    s = _session(ADMIN)
    email = f"TEST_travel_{os.urandom(4).hex()}@example.com"
    # missing travel_id -> 400
    r = s.post(f"{API}/users", json={
        "email": email, "password": "Passw0rd!", "name": "Travel Guy", "role": "travel"
    }, timeout=20)
    assert r.status_code == 400
    # invalid travel_id -> 400
    r2 = s.post(f"{API}/users", json={
        "email": email, "password": "Passw0rd!", "name": "Travel Guy",
        "role": "travel", "travel_id": "bogus-id",
    }, timeout=20)
    assert r2.status_code == 400
    # valid travel_id -> 200
    travels = requests.get(f"{API}/search", params={"origin": "Pekanbaru", "destination": "Dumai", "date": TODAY}, timeout=20).json()
    tid = travels[0]["travel"]["id"]
    r3 = s.post(f"{API}/users", json={
        "email": email, "password": "Passw0rd!", "name": "Travel Guy",
        "role": "travel", "travel_id": tid,
    }, timeout=20)
    assert r3.status_code == 200
    assert r3.json()["travel_id"] == tid


def test_admin_create_user_email_unique():
    s = _session(ADMIN)
    r = s.post(f"{API}/users", json={
        "email": USER[0], "password": "Passw0rd!", "name": "dup", "role": "pengguna"
    }, timeout=20)
    assert r.status_code == 400
