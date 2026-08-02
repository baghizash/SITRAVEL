import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import { api, formatIDR } from "@/lib/api";
import { getSessionId } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Bus, Clock, ArrowRight, Ticket, RadioTower } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 3000;

export default function BookSchedule() {
  const { scheduleId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const sessionId = useRef(getSessionId()).current;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seat, setSeat] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const seatRef = useRef(null);

  // Poll for taken + locked-by-others every 3s
  const refresh = async () => {
    try {
      const { data } = await api.get(`/schedules/${scheduleId}/seats`, { params: { session_id: sessionId } });
      setData(data);
      // if my selected seat is now taken by someone else (or a booking landed), drop it
      if (seatRef.current && (data.taken_seats.includes(seatRef.current) || data.locked_by_others.includes(seatRef.current))) {
        seatRef.current = null;
        setSeat(null);
        toast.warning("Kursi pilihan Anda diambil pengguna lain — pilih kursi lain");
      }
    } catch {}
  };

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
    const t = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      clearInterval(t);
      // release the lock when leaving
      if (seatRef.current) {
        api.post(`/schedules/${scheduleId}/release-seat`, { seat_number: seatRef.current, session_id: sessionId }).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId]);

  useEffect(() => {
    if (user && user !== false) {
      setName((n) => n || user.name || "");
      setPhone((p) => p || user.phone || "");
    }
  }, [user]);

  const pickSeat = async (num) => {
    try {
      await api.post(`/schedules/${scheduleId}/lock-seat`, { seat_number: num, session_id: sessionId });
      seatRef.current = num;
      setSeat(num);
      refresh();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Kursi tidak bisa dikunci");
      refresh();
    }
  };

  const submit = async () => {
    if (!user || user === false) {
      toast.error("Silakan login terlebih dahulu");
      return navigate(`/login?next=/book/${scheduleId}`);
    }
    if (!seat) return toast.error("Pilih kursi terlebih dahulu");
    if (!name || !phone) return toast.error("Isi nama & nomor HP penumpang");
    setSubmitting(true);
    try {
      const { data } = await api.post("/bookings", {
        schedule_id: scheduleId, seat_number: seat,
        passenger_name: name, passenger_phone: phone, notes: "",
      });
      seatRef.current = null; // lock released server-side on booking
      setConfirmation(data);
      toast.success("Booking berhasil!");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal booking");
      refresh();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#F5F2EC]">
        <SiteHeader />
        <div className="max-w-3xl mx-auto p-10 flex items-center gap-2 text-[#4A5257]">
          <Loader2 className="w-4 h-4 animate-spin" /> Memuat…
        </div>
      </div>
    );
  }

  if (confirmation) {
    return (
      <div className="min-h-screen bg-[#F5F2EC]">
        <SiteHeader />
        <div className="max-w-2xl mx-auto p-6 sm:p-10">
          <div className="rounded-3xl bg-white border border-[#E6E2D8] p-8 shadow-[0_18px_60px_-24px_rgba(20,40,31,0.35)]" data-testid="booking-confirmation">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#1E3A2F] text-[#F2D06B] px-3 py-1 text-xs tracking-[0.25em] uppercase">
              <Ticket className="w-3.5 h-3.5" /> E-Tiket terbit
            </div>
            <h1 className="font-display mt-4 text-4xl font-bold text-[#14281F] tracking-tight">Perjalanan Anda siap.</h1>
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-b border-dashed border-[#E6E2D8] py-6">
              <Info label="Kode Booking" value={confirmation.booking_code} />
              <Info label="Kursi" value={`#${confirmation.seat_number}`} />
              <Info label="Rute" value={`${confirmation.origin} → ${confirmation.destination}`} />
              <Info label="Berangkat" value={`${confirmation.depart_date} · ${confirmation.depart_time}`} />
              <Info label="Penumpang" value={confirmation.passenger_name} />
              <Info label="Total Bayar" value={formatIDR(confirmation.price)} />
            </div>
            <div className="flex flex-wrap gap-3 mt-6">
              <Button onClick={() => navigate(`/ticket/${confirmation.id}`)} className="rounded-full bg-[#E6B325] text-[#14281F] hover:bg-[#F2D06B] hover:text-[#14281F]" data-testid="conf-ticket-btn">
                Lihat E-Tiket
              </Button>
              <Button onClick={() => navigate("/dashboard")} variant="outline" className="rounded-full border-[#1E3A2F] text-[#1E3A2F] hover:bg-[#1E3A2F] hover:text-white" data-testid="conf-dashboard-btn">
                Ke Dashboard
              </Button>
              <Button variant="ghost" onClick={() => navigate("/")} className="rounded-full text-[#4A5257] hover:bg-[#F5F2EC] hover:text-[#14281F]" data-testid="conf-home-btn">
                Beranda
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { schedule: s, travel, taken_seats, locked_by_others } = data;
  const totalSeats = s.total_seats;

  return (
    <div className="min-h-screen bg-[#F5F2EC]">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="text-[10px] tracking-[0.3em] uppercase text-[#8B2520]">Pilih kursi</div>
            <div className="flex items-center gap-1.5 text-[10px] tracking-[0.25em] uppercase text-[#1E3A2F]">
              <RadioTower className="w-3 h-3 animate-pulse" /> Live sync
            </div>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#14281F] tracking-tight mt-1">
            {s.origin} <ArrowRight className="inline w-6 h-6 mx-1 text-[#E6B325]" /> {s.destination}
          </h1>
          <div className="text-sm text-[#4A5257] mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1"><Bus className="w-4 h-4 text-[#1E3A2F]" /> {travel?.name}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-[#1E3A2F]" /> {s.depart_date} · {s.depart_time}</span>
          </div>

          <div className="mt-8 rounded-2xl bg-white border border-[#E6E2D8] p-6">
            <div className="flex flex-wrap items-center gap-4 mb-5">
              <Legend color="#ffffff" border="#1E3A2F" label="Tersedia" />
              <Legend color="#E6B325" label="Pilihan Anda" border="#1E3A2F" />
              <Legend striped label="Dikunci pengguna lain" />
              <Legend color="#8B2520" label="Terisi" border="#8B2520" />
            </div>
            <div className="w-fit mx-auto">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[#7C8489] text-center mb-3">Sopir</div>
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: totalSeats }, (_, i) => i + 1).map((num) => {
                  const isTaken = taken_seats.includes(num);
                  const isLocked = locked_by_others.includes(num);
                  const isSel = seat === num;
                  const cls =
                    isTaken ? "seat-cell seat-taken"
                    : isLocked ? "seat-cell seat-locked"
                    : isSel ? "seat-cell seat-selected"
                    : "seat-cell seat-available";
                  return (
                    <button
                      key={num}
                      disabled={isTaken || isLocked}
                      onClick={() => pickSeat(num)}
                      className={cls}
                      data-testid={`seat-${num}`}
                      aria-label={`Kursi ${num} — ${isTaken ? "terisi" : isLocked ? "dikunci pengguna lain" : "tersedia"}`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-[11px] text-[#7C8489] text-center max-w-xs">
                Kursi terkunci otomatis untuk Anda selama <b>5 menit</b> setelah dipilih.
              </p>
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 h-fit">
          <div className="rounded-2xl bg-white border border-[#E6E2D8] p-6">
            <div className="text-[10px] tracking-[0.3em] uppercase text-[#7C8489]">Ringkasan</div>
            <div className="mt-3 space-y-2 text-sm text-[#11181C]">
              <div className="flex justify-between"><span className="text-[#4A5257]">Travel</span><b>{travel?.name}</b></div>
              <div className="flex justify-between"><span className="text-[#4A5257]">Rute</span><b>{s.origin} → {s.destination}</b></div>
              <div className="flex justify-between"><span className="text-[#4A5257]">Tanggal</span><b>{s.depart_date}</b></div>
              <div className="flex justify-between"><span className="text-[#4A5257]">Jam</span><b>{s.depart_time}</b></div>
              <div className="flex justify-between"><span className="text-[#4A5257]">Kursi</span><b>{seat ? `#${seat}` : "-"}</b></div>
            </div>
            <div className="border-t border-dashed border-[#E6E2D8] mt-4 pt-4 flex justify-between items-baseline">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#7C8489]">Total</span>
              <span className="font-display text-3xl font-black text-[#8B2520]">{formatIDR(s.price)}</span>
            </div>

            <div className="mt-6 space-y-3">
              <div>
                <Label htmlFor="name" className="text-xs tracking-[0.2em] uppercase text-[#7C8489]">Nama Penumpang</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 rounded-lg border-[#E6E2D8]" data-testid="passenger-name-input" />
              </div>
              <div>
                <Label htmlFor="phone" className="text-xs tracking-[0.2em] uppercase text-[#7C8489]">Nomor HP</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 rounded-lg border-[#E6E2D8]" data-testid="passenger-phone-input" />
              </div>
            </div>

            <Button
              onClick={submit}
              disabled={submitting}
              className="mt-6 w-full h-12 rounded-full bg-[#E6B325] text-[#14281F] hover:bg-[#F2D06B] hover:text-[#14281F] font-semibold"
              data-testid="confirm-booking-btn"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Konfirmasi & Pesan"}
            </Button>
            {!user && (
              <p className="text-xs text-[#8B2520] mt-3 text-center">Anda perlu login untuk memesan.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Legend({ color, border, striped, label }) {
  return (
    <div className="flex items-center gap-2 text-xs text-[#4A5257]">
      <span
        className="w-4 h-4 rounded border"
        style={striped
          ? { background: "repeating-linear-gradient(45deg,#F5F2EC,#F5F2EC 3px,#E6B325 3px,#E6B325 5px)", borderColor: "#B5871A" }
          : { background: color, borderColor: border }}
      />
      {label}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.25em] uppercase text-[#7C8489]">{label}</div>
      <div className="mt-1 text-[#11181C] font-medium">{value}</div>
    </div>
  );
}
