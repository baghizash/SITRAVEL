from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# ------------ Setup ------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Si-Travel Riau API")
api = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ["JWT_SECRET"]

Role = Literal["admin_app", "travel", "manager", "pengguna"]

# ------------ Helpers ------------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode(), hashed.encode())

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id, "email": email, "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token", value=token,
        httponly=True, secure=True, samesite="none",
        max_age=7 * 24 * 3600, path="/",
    )

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Belum login")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User tidak ditemukan")
        user.pop("_id", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sesi berakhir")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token tidak valid")

def require_roles(*roles: str):
    async def checker(user: dict = Depends(get_current_user)):
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Akses ditolak")
        return user
    return checker

# ------------ Models ------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=2)
    role: Role = "pengguna"
    phone: Optional[str] = None
    travel_id: Optional[str] = None  # for travel admin loket & manager

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TravelPartnerIn(BaseModel):
    name: str
    code: str
    description: Optional[str] = ""
    contact: Optional[str] = ""

class ScheduleIn(BaseModel):
    travel_id: str
    origin: str
    destination: str
    depart_date: str  # YYYY-MM-DD
    depart_time: str  # HH:MM
    price: int
    total_seats: int = 20
    vehicle: str = "Minibus"

class BookingIn(BaseModel):
    schedule_id: str
    passenger_name: str
    passenger_phone: str
    seat_number: int
    notes: Optional[str] = ""

class AdminCreateUserIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str
    role: Role
    phone: Optional[str] = ""
    travel_id: Optional[str] = None

class SeatLockIn(BaseModel):
    seat_number: int
    session_id: str = Field(min_length=6, max_length=64)

class RescheduleIn(BaseModel):
    new_schedule_id: str
    new_seat_number: int

LOCK_TTL_SECONDS = 300  # 5 minutes

# ------------ Auth Endpoints ------------
@api.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    # Public register only allows pengguna role; other roles must be seeded/created by admin
    role = payload.role if payload.role == "pengguna" else "pengguna"
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "name": payload.name,
        "role": role,
        "phone": payload.phone or "",
        "travel_id": None,
        "password_hash": hash_password(payload.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    token = create_access_token(user_doc["id"], email, role)
    set_auth_cookie(response, token)
    user_doc.pop("password_hash", None)
    user_doc.pop("_id", None)
    return {"user": user_doc, "token": token}

@api.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email atau password salah")
    token = create_access_token(user["id"], email, user["role"])
    set_auth_cookie(response, token)
    user.pop("password_hash", None)
    user.pop("_id", None)
    return {"user": user, "token": token}

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"user": user}

# ------------ Public: Cities & Search ------------
@api.get("/cities")
async def list_cities():
    docs = await db.cities.find({}, {"_id": 0}).sort("name", 1).to_list(200)
    return docs

@api.get("/travels")
async def list_travels():
    docs = await db.travels.find({}, {"_id": 0}).to_list(200)
    return docs

@api.get("/search")
async def search_schedules(origin: str, destination: str, date: str):
    """Cari jadwal keberangkatan dari origin -> destination pada tanggal tertentu."""
    cursor = db.schedules.find({
        "origin": origin,
        "destination": destination,
        "depart_date": date,
    }, {"_id": 0})
    schedules = await cursor.to_list(200)
    # enrich with travel info + seats available
    travel_map = {t["id"]: t for t in await db.travels.find({}, {"_id": 0}).to_list(200)}
    results = []
    for s in schedules:
        booked = await db.bookings.count_documents({"schedule_id": s["id"], "status": {"$ne": "cancelled"}})
        results.append({
            **s,
            "travel": travel_map.get(s["travel_id"]),
            "seats_available": max(0, s["total_seats"] - booked),
        })
    results.sort(key=lambda x: x["depart_time"])
    return results

# ------------ Schedules (Travel/Admin) ------------
@api.get("/schedules")
async def get_schedules(user: dict = Depends(get_current_user)):
    query = {}
    if user["role"] == "travel" and user.get("travel_id"):
        query["travel_id"] = user["travel_id"]
    elif user["role"] == "manager" and user.get("travel_id"):
        query["travel_id"] = user["travel_id"]
    docs = await db.schedules.find(query, {"_id": 0}).sort("depart_date", 1).to_list(500)
    travel_map = {t["id"]: t for t in await db.travels.find({}, {"_id": 0}).to_list(200)}
    for d in docs:
        d["travel"] = travel_map.get(d["travel_id"])
        d["booked"] = await db.bookings.count_documents({"schedule_id": d["id"], "status": {"$ne": "cancelled"}})
    return docs

@api.post("/schedules")
async def create_schedule(payload: ScheduleIn, user: dict = Depends(require_roles("admin_app", "travel"))):
    if user["role"] == "travel":
        if not user.get("travel_id") or user["travel_id"] != payload.travel_id:
            raise HTTPException(status_code=403, detail="Hanya bisa membuat jadwal untuk travel Anda")
    doc = {
        "id": str(uuid.uuid4()),
        **payload.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.schedules.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.delete("/schedules/{schedule_id}")
async def delete_schedule(schedule_id: str, user: dict = Depends(require_roles("admin_app", "travel"))):
    sched = await db.schedules.find_one({"id": schedule_id})
    if not sched:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
    if user["role"] == "travel" and sched["travel_id"] != user.get("travel_id"):
        raise HTTPException(status_code=403, detail="Bukan jadwal Anda")
    await db.schedules.delete_one({"id": schedule_id})
    return {"ok": True}

# ------------ Bookings ------------
@api.post("/bookings")
async def create_booking(payload: BookingIn, user: dict = Depends(get_current_user)):
    sched = await db.schedules.find_one({"id": payload.schedule_id}, {"_id": 0})
    if not sched:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
    # seat check
    taken = await db.bookings.find_one({
        "schedule_id": payload.schedule_id,
        "seat_number": payload.seat_number,
        "status": {"$ne": "cancelled"},
    })
    if taken:
        raise HTTPException(status_code=400, detail=f"Kursi {payload.seat_number} sudah dipesan")
    if payload.seat_number < 1 or payload.seat_number > sched["total_seats"]:
        raise HTTPException(status_code=400, detail="Nomor kursi tidak valid")
    doc = {
        "id": str(uuid.uuid4()),
        "booking_code": "TR" + uuid.uuid4().hex[:8].upper(),
        "user_id": user["id"],
        "schedule_id": payload.schedule_id,
        "travel_id": sched["travel_id"],
        "origin": sched["origin"],
        "destination": sched["destination"],
        "depart_date": sched["depart_date"],
        "depart_time": sched["depart_time"],
        "price": sched["price"],
        "seat_number": payload.seat_number,
        "passenger_name": payload.passenger_name,
        "passenger_phone": payload.passenger_phone,
        "notes": payload.notes or "",
        "status": "confirmed",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.bookings.insert_one(doc)
    # release any lock this booker had on that seat
    await db.seat_locks.delete_many({
        "schedule_id": payload.schedule_id,
        "seat_number": payload.seat_number,
    })
    doc.pop("_id", None)
    return doc

@api.get("/bookings/me")
async def my_bookings(user: dict = Depends(get_current_user)):
    docs = await db.bookings.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs

@api.get("/bookings")
async def list_bookings(user: dict = Depends(require_roles("admin_app", "travel", "manager"))):
    query = {}
    if user["role"] in ("travel", "manager") and user.get("travel_id"):
        query["travel_id"] = user["travel_id"]
    docs = await db.bookings.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs

@api.get("/bookings/{booking_id}")
async def get_booking(booking_id: str, user: dict = Depends(get_current_user)):
    doc = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")
    # access: owner, or admin_app, or travel/manager of same travel_id
    if user["role"] == "pengguna" and doc["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    if user["role"] in ("travel", "manager") and doc["travel_id"] != user.get("travel_id"):
        raise HTTPException(status_code=403, detail="Akses ditolak")
    travel = await db.travels.find_one({"id": doc["travel_id"]}, {"_id": 0})
    doc["travel"] = travel
    return doc

@api.post("/bookings/{booking_id}/reschedule")
async def reschedule_booking(booking_id: str, payload: RescheduleIn, user: dict = Depends(get_current_user)):
    doc = await db.bookings.find_one({"id": booking_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")
    if user["role"] == "pengguna" and doc["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    if user["role"] in ("travel", "manager") and doc["travel_id"] != user.get("travel_id"):
        raise HTTPException(status_code=403, detail="Akses ditolak")
    if doc.get("status") == "cancelled":
        raise HTTPException(status_code=400, detail="Booking sudah dibatalkan, tidak bisa dijadwalkan ulang")
    new_sched = await db.schedules.find_one({"id": payload.new_schedule_id}, {"_id": 0})
    if not new_sched:
        raise HTTPException(status_code=404, detail="Jadwal baru tidak ditemukan")
    if new_sched["origin"] != doc["origin"] or new_sched["destination"] != doc["destination"]:
        raise HTTPException(status_code=400, detail="Rute jadwal baru harus sama dengan booking asli")
    if payload.new_seat_number < 1 or payload.new_seat_number > new_sched["total_seats"]:
        raise HTTPException(status_code=400, detail="Nomor kursi tidak valid")
    if new_sched["id"] == doc["schedule_id"] and payload.new_seat_number == doc["seat_number"]:
        raise HTTPException(status_code=400, detail="Jadwal & kursi tujuan sama dengan booking saat ini")
    taken = await db.bookings.find_one({
        "schedule_id": payload.new_schedule_id,
        "seat_number": payload.new_seat_number,
        "status": {"$ne": "cancelled"},
        "id": {"$ne": booking_id},
    })
    if taken:
        raise HTTPException(status_code=400, detail=f"Kursi {payload.new_seat_number} sudah dipesan")
    history_entry = {
        "schedule_id": doc["schedule_id"],
        "depart_date": doc["depart_date"],
        "depart_time": doc["depart_time"],
        "seat_number": doc["seat_number"],
        "changed_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.bookings.update_one(
        {"id": booking_id},
        {
            "$set": {
                "schedule_id": payload.new_schedule_id,
                "travel_id": new_sched["travel_id"],
                "depart_date": new_sched["depart_date"],
                "depart_time": new_sched["depart_time"],
                "seat_number": payload.new_seat_number,
                "price": new_sched["price"],
                "rescheduled_at": datetime.now(timezone.utc).isoformat(),
            },
            "$push": {"reschedule_history": history_entry},
        }
    )
    # clear any locks on the new seat
    await db.seat_locks.delete_many({
        "schedule_id": payload.new_schedule_id,
        "seat_number": payload.new_seat_number,
    })
    updated = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    return updated

@api.post("/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: str, user: dict = Depends(get_current_user)):
    doc = await db.bookings.find_one({"id": booking_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")
    if user["role"] == "pengguna" and doc["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    if user["role"] in ("travel", "manager") and doc["travel_id"] != user.get("travel_id"):
        raise HTTPException(status_code=403, detail="Akses ditolak")
    if doc.get("status") == "cancelled":
        raise HTTPException(status_code=400, detail="Booking sudah dibatalkan")
    await db.bookings.update_one({"id": booking_id}, {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat()}})
    updated = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    return updated

@api.get("/schedules/{schedule_id}/seats")
async def schedule_seats(schedule_id: str, session_id: Optional[str] = None):
    sched = await db.schedules.find_one({"id": schedule_id}, {"_id": 0})
    if not sched:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
    booked = await db.bookings.find(
        {"schedule_id": schedule_id, "status": {"$ne": "cancelled"}},
        {"_id": 0, "seat_number": 1}
    ).to_list(200)
    taken = [b["seat_number"] for b in booked]
    travel = await db.travels.find_one({"id": sched["travel_id"]}, {"_id": 0})
    # Locked by others: seats locked by a different session (exclude caller's own lock)
    now = datetime.now(timezone.utc)
    lock_query: dict = {"schedule_id": schedule_id, "expires_at": {"$gt": now.isoformat()}}
    if session_id:
        lock_query["session_id"] = {"$ne": session_id}
    locks = await db.seat_locks.find(lock_query, {"_id": 0, "seat_number": 1}).to_list(200)
    locked_by_others = list({l["seat_number"] for l in locks} - set(taken))
    return {
        "schedule": sched,
        "travel": travel,
        "taken_seats": taken,
        "locked_by_others": locked_by_others,
    }

@api.post("/schedules/{schedule_id}/lock-seat")
async def lock_seat(schedule_id: str, payload: SeatLockIn):
    """Kunci kursi sementara (5 menit) selama proses pemilihan."""
    sched = await db.schedules.find_one({"id": schedule_id}, {"_id": 0})
    if not sched:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
    if payload.seat_number < 1 or payload.seat_number > sched["total_seats"]:
        raise HTTPException(status_code=400, detail="Nomor kursi tidak valid")
    # Cek apakah kursi sudah di-booking
    taken = await db.bookings.find_one({
        "schedule_id": schedule_id,
        "seat_number": payload.seat_number,
        "status": {"$ne": "cancelled"},
    })
    if taken:
        raise HTTPException(status_code=400, detail=f"Kursi {payload.seat_number} sudah dipesan")
    now = datetime.now(timezone.utc)
    # Cek apakah sudah ada lock dari session lain yang masih aktif
    existing_lock = await db.seat_locks.find_one({
        "schedule_id": schedule_id,
        "seat_number": payload.seat_number,
        "session_id": {"$ne": payload.session_id},
        "expires_at": {"$gt": now.isoformat()},
    })
    if existing_lock:
        raise HTTPException(status_code=409, detail=f"Kursi {payload.seat_number} sedang dipilih pengguna lain")
    expires_at = (now + timedelta(seconds=LOCK_TTL_SECONDS)).isoformat()
    # Upsert: update lock milik session ini atau buat baru
    await db.seat_locks.update_one(
        {"schedule_id": schedule_id, "seat_number": payload.seat_number, "session_id": payload.session_id},
        {"$set": {
            "schedule_id": schedule_id,
            "seat_number": payload.seat_number,
            "session_id": payload.session_id,
            "expires_at": expires_at,
            "locked_at": now.isoformat(),
        }},
        upsert=True,
    )
    # Lepas lock lama milik session ini pada kursi lain di jadwal yang sama
    await db.seat_locks.delete_many({
        "schedule_id": schedule_id,
        "session_id": payload.session_id,
        "seat_number": {"$ne": payload.seat_number},
    })
    return {"ok": True, "seat_number": payload.seat_number, "expires_at": expires_at}

@api.post("/schedules/{schedule_id}/release-seat")
async def release_seat(schedule_id: str, payload: SeatLockIn):
    """Lepaskan kunci kursi (dipanggil saat user pergi dari halaman booking)."""
    await db.seat_locks.delete_many({
        "schedule_id": schedule_id,
        "seat_number": payload.seat_number,
        "session_id": payload.session_id,
    })
    return {"ok": True}

# ------------ Travel Partners (admin) ------------
@api.get("/travel-partners")
async def list_travel_partners(user: dict = Depends(require_roles("admin_app"))):
    docs = await db.travels.find({}, {"_id": 0}).to_list(200)
    return docs

@api.post("/travel-partners")
async def create_travel_partner(payload: TravelPartnerIn, user: dict = Depends(require_roles("admin_app"))):
    doc = {
        "id": str(uuid.uuid4()),
        **payload.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.travels.insert_one(doc)
    doc.pop("_id", None)
    return doc

# ------------ Users (admin) ------------
@api.get("/users")
async def list_users(user: dict = Depends(require_roles("admin_app"))):
    docs = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(500)
    return docs

@api.post("/users")
async def admin_create_user(payload: AdminCreateUserIn, user: dict = Depends(require_roles("admin_app"))):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    if payload.role in ("travel", "manager") and not payload.travel_id:
        raise HTTPException(status_code=400, detail="travel_id wajib untuk peran travel/manager")
    if payload.travel_id:
        t = await db.travels.find_one({"id": payload.travel_id})
        if not t:
            raise HTTPException(status_code=400, detail="travel_id tidak valid")
    doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "name": payload.name,
        "role": payload.role,
        "phone": payload.phone or "",
        "travel_id": payload.travel_id,
        "password_hash": hash_password(payload.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    doc.pop("password_hash", None)
    doc.pop("_id", None)
    return doc

# ------------ Dashboard Stats ------------
@api.get("/stats")
async def stats(user: dict = Depends(get_current_user)):
    role = user["role"]
    if role == "admin_app":
        return {
            "total_users": await db.users.count_documents({}),
            "total_travels": await db.travels.count_documents({}),
            "total_schedules": await db.schedules.count_documents({}),
            "total_bookings": await db.bookings.count_documents({"status": {"$ne": "cancelled"}}),
            "revenue": sum([b.get("price", 0) async for b in db.bookings.find({"status": {"$ne": "cancelled"}}, {"_id": 0, "price": 1})]),
        }
    if role in ("travel", "manager"):
        travel_id = user.get("travel_id")
        q = {"travel_id": travel_id, "status": {"$ne": "cancelled"}}
        return {
            "total_schedules": await db.schedules.count_documents({"travel_id": travel_id}),
            "total_bookings": await db.bookings.count_documents(q),
            "revenue": sum([b.get("price", 0) async for b in db.bookings.find(q, {"_id": 0, "price": 1})]),
            "today_bookings": await db.bookings.count_documents({**q, "depart_date": datetime.now(timezone.utc).strftime("%Y-%m-%d")}),
        }
    # pengguna
    return {
        "my_bookings": await db.bookings.count_documents({"user_id": user["id"]}),
        "upcoming": await db.bookings.count_documents({
            "user_id": user["id"],
            "depart_date": {"$gte": datetime.now(timezone.utc).strftime("%Y-%m-%d")},
            "status": {"$ne": "cancelled"},
        }),
    }

# ------------ Root ------------
@api.get("/")
async def root():
    return {"message": "Si-Travel Riau API", "version": "1.0"}

# ------------ App wiring ------------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ------------ Seed ------------
RIAU_CITIES = [
    "Pekanbaru", "Dumai", "Duri", "Bagansiapiapi", "Rengat",
    "Bengkalis", "Selatpanjang", "Tembilahan", "Bangkinang", "Pasir Pengaraian",
    "Siak Sri Indrapura", "Ujung Batu",
]

SEED_TRAVELS = [
    {"code": "REX", "name": "PO Riau Express", "description": "Layanan travel andalan Pekanbaru - Dumai", "contact": "0761-11111"},
    {"code": "MLT", "name": "Melayu Trans", "description": "Nyaman ke pelosok Riau", "contact": "0761-22222"},
    {"code": "SMP", "name": "Sumatra Prima", "description": "Armada baru, sopir berpengalaman", "contact": "0761-33333"},
    {"code": "BSA", "name": "Bagansiapiapi Line", "description": "Spesialis rute pesisir Rokan Hilir", "contact": "0762-44444"},
]

SEED_ROUTES = [
    ("Pekanbaru", "Dumai", [("07:00", 90000), ("10:00", 90000), ("13:00", 95000), ("16:00", 95000)]),
    ("Pekanbaru", "Duri", [("08:00", 75000), ("14:00", 75000)]),
    ("Pekanbaru", "Bagansiapiapi", [("06:00", 150000), ("12:00", 155000), ("18:00", 160000)]),
    ("Pekanbaru", "Rengat", [("09:00", 110000), ("15:00", 115000)]),
    ("Pekanbaru", "Bengkalis", [("07:30", 130000), ("13:30", 135000)]),
    ("Pekanbaru", "Selatpanjang", [("08:30", 160000)]),
    ("Pekanbaru", "Tembilahan", [("07:00", 170000), ("14:00", 175000)]),
    ("Dumai", "Pekanbaru", [("07:00", 90000), ("11:00", 90000), ("15:00", 95000)]),
    ("Duri", "Pekanbaru", [("06:00", 75000), ("13:00", 75000)]),
    ("Bagansiapiapi", "Pekanbaru", [("06:00", 150000), ("13:00", 155000)]),
    ("Dumai", "Bagansiapiapi", [("08:00", 80000), ("14:00", 85000)]),
]

async def ensure_indexes():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.schedules.create_index("id", unique=True)
    await db.travels.create_index("id", unique=True)
    await db.bookings.create_index("id", unique=True)
    await db.bookings.create_index("booking_code", unique=True)
    await db.cities.create_index("name", unique=True)
    await db.seat_locks.create_index("expires_at", expireAfterSeconds=0)
    await db.seat_locks.create_index([("schedule_id", 1), ("seat_number", 1)])

async def seed_data():
    # Cities
    for c in RIAU_CITIES:
        await db.cities.update_one({"name": c}, {"$setOnInsert": {"name": c, "province": "Riau"}}, upsert=True)

    # Travel partners
    travel_ids = {}
    for t in SEED_TRAVELS:
        existing = await db.travels.find_one({"code": t["code"]})
        if existing:
            travel_ids[t["code"]] = existing["id"]
        else:
            tid = str(uuid.uuid4())
            travel_ids[t["code"]] = tid
            await db.travels.insert_one({
                "id": tid, **t,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })

    # Users: admin, travel loket, manager, pengguna demo
    async def upsert_user(email, name, role, password, travel_id=None, phone=""):
        existing = await db.users.find_one({"email": email})
        if existing:
            # keep password fresh
            if not verify_password(password, existing["password_hash"]):
                await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(password), "role": role, "travel_id": travel_id, "name": name}})
            return existing["id"]
        uid = str(uuid.uuid4())
        await db.users.insert_one({
            "id": uid, "email": email, "name": name, "role": role,
            "phone": phone, "travel_id": travel_id,
            "password_hash": hash_password(password),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        return uid

    await upsert_user(os.environ["ADMIN_EMAIL"], "Admin Aplikasi", "admin_app", os.environ["ADMIN_PASSWORD"])
    await upsert_user("loket@sitravel.id", "Admin Loket Riau Express", "travel", "Loket@2026", travel_ids["REX"])
    await upsert_user("loket2@sitravel.id", "Admin Loket Melayu Trans", "travel", "Loket@2026", travel_ids["MLT"])
    await upsert_user("manager@sitravel.id", "Kepala Riau Express", "manager", "Manager@2026", travel_ids["REX"])
    await upsert_user("user@sitravel.id", "Budi Santoso", "pengguna", "User@2026", phone="081234567890")

    # Schedules: next 14 days from today
    today = datetime.now(timezone.utc).date()
    for i in range(14):
        date_str = (today + timedelta(days=i)).isoformat()
        for origin, dest, slots in SEED_ROUTES:
            for idx, (time, price) in enumerate(slots):
                travel_code = list(travel_ids.keys())[(hash(origin + dest) + idx) % len(travel_ids)]
                exists = await db.schedules.find_one({
                    "origin": origin, "destination": dest,
                    "depart_date": date_str, "depart_time": time,
                    "travel_id": travel_ids[travel_code],
                })
                if exists:
                    continue
                await db.schedules.insert_one({
                    "id": str(uuid.uuid4()),
                    "travel_id": travel_ids[travel_code],
                    "origin": origin, "destination": dest,
                    "depart_date": date_str, "depart_time": time,
                    "price": price, "total_seats": 16,
                    "vehicle": "Minibus 16 Seat",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })

@app.on_event("startup")
async def on_startup():
    await ensure_indexes()
    await seed_data()
    logger.info("Si-Travel Riau: seed complete")

@app.on_event("shutdown")
async def on_shutdown():
    client.close()
