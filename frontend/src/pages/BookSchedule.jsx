import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import { api, formatIDR } from "@/lib/api";
import { getSessionId } from "@/lib/session";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Bus, Clock, ArrowRight, Ticket, RadioTower } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const POLL_MS = 3000;

export default function BookSchedule() {
  const { scheduleId } = useParams();
  const { user }       = useAuth();
  const navigate       = useNavigate();
  const sessionId      = useRef(getSessionId()).current;

  const [data,           setData]         = useState(null);
  const [loading,        setLoading]      = useState(true);
  const [seat,           setSeat]         = useState(null);
  const [name,           setName]         = useState("");
  const [phone,          setPhone]        = useState("");
  const [pickup,         setPickup]       = useState("");
  const [dropoff,        setDropoff]      = useState("");
  const [submitting,     setSubmitting]   = useState(false);
  const [confirmation,   setConfirmation] = useState(null);
  const seatRef = useRef(null);

  const refresh = async () => {
    try {
      const { data: d } = await api.get(`/schedules/${scheduleId}/seats`, { params: { session_id: sessionId } });
      setData(d);
      if (seatRef.current && (d.taken_seats.includes(seatRef.current) || d.locked_by_others.includes(seatRef.current))) {
        seatRef.current = null; setSeat(null);
        toast.warning("Kursi pilihan Anda diambil pengguna lain — pilih kursi lain");
      }
    } catch {}
  };

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
    const t = setInterval(refresh, POLL_MS);
    return () => {
      clearInterval(t);
      if (seatRef.current)
        api.post(`/schedules/${scheduleId}/release-seat`, { seat_number: seatRef.current, session_id: sessionId }).catch(() => {});
    };
    // eslint-disable-next-line
  }, [scheduleId]);

  useEffect(() => {
    if (user && user !== false) {
      setName(n => n || user.name || "");
      setPhone(p => p || user.phone || "");
    }
  }, [user]);

  const pickSeat = async (num) => {
    try {
      await api.post(`/schedules/${scheduleId}/lock-seat`, { seat_number: num, session_id: sessionId });
      seatRef.current = num; setSeat(num); refresh();
    } catch (e) { toast.error(e.response?.data?.detail || "Kursi tidak bisa dikunci"); refresh(); }
  };

  const submit = async () => {
    if (!user || user === false) { toast.error("Silakan login terlebih dahulu"); return navigate(`/login?next=/book/${scheduleId}`); }
    if (!seat)         return toast.error("Pilih kursi terlebih dahulu");
    if (!name || !phone) return toast.error("Isi nama & nomor HP penumpang");
    if (!pickup)       return toast.error("Isi lokasi jemput");
    setSubmitting(true);
    try {
      const { data: d } = await api.post("/bookings", {
        schedule_id:      scheduleId,
        seat_number:      seat,
        passenger_name:   name,
        passenger_phone:  phone,
        notes:            "",
        pickup_location:  pickup,
        dropoff_location: dropoff || undefined,
      });
      seatRef.current = null; setConfirmation(d); toast.success("Booking berhasil!");
    } catch (e) { toast.error(e.response?.data?.detail || "Gagal booking"); refresh(); }
    finally { setSubmitting(false); }
  };

  if (loading || !data) return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      <SiteHeader />
      <div className="max-w-3xl mx-auto p-10 flex items-center gap-2" style={{ color: "#4b4b4b" }}>
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#8b0000" }} /> Memuat…
      </div>
    </div>
  );

  if (confirmation) return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      <SiteHeader />
      <div className="max-w-2xl mx-auto p-6 sm:p-10">
        <div className="rounded-3xl p-8 shadow-lg" style={{ background: "#fff", border: "1px solid #e0e0e0" }}
          data-testid="booking-confirmation">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs tracking-[0.2em] uppercase text-white"
            style={{ background: "#8b0000" }}>
            <Ticket className="w-3.5 h-3.5" /> E-Tiket terbit
          </div>
          <h1 className="font-display mt-4 text-4xl font-bold tracking-tight" style={{ color: "#141414" }}>
            Perjalanan Anda siap.
          </h1>
          <div className="mt-6 grid grid-cols-2 gap-4 py-6" style={{ borderTop: "1px dashed #e0e0e0", borderBottom: "1px dashed #e0e0e0" }}>
            {[
              ["Kode Booking", confirmation.booking_code],
              ["Kursi", `#${confirmation.seat_number}`],
              ["Rute", `${confirmation.origin} → ${confirmation.destination}`],
              ["Berangkat", `${confirmation.depart_date} · ${confirmation.depart_time}`],
              ["Penumpang", confirmation.passenger_name],
              ["Lokasi Jemput", confirmation.pickup_location || "-"],
              ["Total Bayar", formatIDR(confirmation.price)],
            ].map(([l, v]) => (
              <div key={l}>
                <div className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "#4b4b4b" }}>{l}</div>
                <div className="mt-0.5 text-sm font-semibold" style={{ color: "#141414" }}>{v}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-6">
            <button onClick={() => navigate(`/ticket/${confirmation.id}`)}
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-white" style={{ background: "#8b0000" }}
              data-testid="conf-ticket-btn">Lihat E-Tiket</button>
            <button onClick={() => navigate("/dashboard")}
              className="px-5 py-2.5 rounded-full text-sm font-semibold" style={{ border: "1px solid #141414", color: "#141414" }}
              data-testid="conf-dashboard-btn">Ke Dashboard</button>
            <button onClick={() => navigate("/")}
              className="px-5 py-2.5 rounded-full text-sm" style={{ color: "#4b4b4b" }}
              data-testid="conf-home-btn">Beranda</button>
          </div>
        </div>
      </div>
    </div>
  );

  const { schedule: s, travel, taken_seats, locked_by_others } = data;

  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">

        {/* Left */}
        <div>
          <div className="flex items-center gap-3">
            <div className="text-[10px] tracking-[0.3em] uppercase font-semibold" style={{ color: "#8b0000" }}>Pilih kursi</div>
            <div className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase" style={{ color: "#4b4b4b" }}>
              <RadioTower className="w-3 h-3 animate-pulse" style={{ color: "#8b0000" }} /> Live sync
            </div>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-1" style={{ color: "#141414" }}>
            {s.origin} <ArrowRight className="inline w-6 h-6 mx-1" style={{ color: "#8b0000" }} /> {s.destination}
          </h1>
          <div className="text-sm mt-1 flex flex-wrap items-center gap-x-3" style={{ color: "#4b4b4b" }}>
            <span className="flex items-center gap-1"><Bus className="w-4 h-4" style={{ color: "#8b0000" }} /> {travel?.name}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" style={{ color: "#8b0000" }} /> {s.depart_date} · {s.depart_time}</span>
          </div>

          {/* Seat map */}
          <div className="mt-8 rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #e0e0e0" }}>
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-6">
              {[
                { color: "#fff",     border: "#4b4b4b", label: "Tersedia" },
                { color: "#8b0000", border: "#6b0000", label: "Pilihan Anda", isText: true },
                { striped: true,                        label: "Dikunci lain" },
                { color: "#4b4b4b", border: "#4b4b4b", label: "Terisi",       isText: true },
              ].map((l, i) => (
                <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "#4b4b4b" }}>
                  <span className="w-4 h-4 rounded border flex-shrink-0" style={
                    l.striped
                      ? { background: "repeating-linear-gradient(45deg,#f2f2f2,#f2f2f2 4px,#4b4b4b 4px,#4b4b4b 6px)", borderColor: "#4b4b4b" }
                      : { background: l.color, borderColor: l.border }
                  } />
                  {l.label}
                </div>
              ))}
            </div>

            <div className="w-fit mx-auto">
              <div className="text-[10px] tracking-[0.3em] uppercase text-center mb-3" style={{ color: "#6e6e6e" }}>Sopir</div>
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: s.total_seats }, (_, i) => i + 1).map((num) => {
                  const isTaken  = taken_seats.includes(num);
                  const isLocked = locked_by_others.includes(num);
                  const isSel    = seat === num;
                  const cls = isTaken ? "seat-cell seat-taken" : isLocked ? "seat-cell seat-locked" : isSel ? "seat-cell seat-selected" : "seat-cell seat-available";
                  return (
                    <button key={num} disabled={isTaken || isLocked} onClick={() => pickSeat(num)} className={cls}
                      data-testid={`seat-${num}`}
                      aria-label={`Kursi ${num} — ${isTaken ? "terisi" : isLocked ? "dikunci" : "tersedia"}`}>
                      {num}
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-[11px] text-center" style={{ color: "#6e6e6e" }}>
                Kursi terkunci otomatis selama <b>5 menit</b> setelah dipilih.
              </p>
            </div>
          </div>
        </div>

        {/* Right — summary */}
        <aside className="lg:sticky lg:top-24 h-fit">
          <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #e0e0e0" }}>
            <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "#4b4b4b" }}>Ringkasan</div>
            <div className="mt-3 space-y-2 text-sm">
              {[
                ["Travel",  travel?.name],
                ["Rute",    `${s.origin} → ${s.destination}`],
                ["Tanggal", s.depart_date],
                ["Jam",     s.depart_time],
                ["Kursi",   seat ? `#${seat}` : "-"],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <span style={{ color: "#4b4b4b" }}>{l}</span>
                  <b style={{ color: "#141414" }}>{v}</b>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 flex justify-between items-baseline" style={{ borderTop: "1px dashed #e0e0e0" }}>
              <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "#4b4b4b" }}>Total</span>
              <span className="font-display text-3xl font-black" style={{ color: "#8b0000" }}>{formatIDR(s.price)}</span>
            </div>

            <div className="mt-6 space-y-3">
              <div>
                <Label htmlFor="pname" className="text-xs tracking-[0.2em] uppercase" style={{ color: "#4b4b4b" }}>
                  Nama Penumpang
                </Label>
                <Input id="pname" value={name} onChange={e => setName(e.target.value)}
                  className="mt-1 rounded-xl" style={{ borderColor: "#e0e0e0" }}
                  data-testid="passenger-name-input" />
              </div>
              <div>
                <Label htmlFor="pphone" className="text-xs tracking-[0.2em] uppercase" style={{ color: "#4b4b4b" }}>
                  Nomor HP
                </Label>
                <Input id="pphone" value={phone} onChange={e => setPhone(e.target.value)}
                  className="mt-1 rounded-xl" style={{ borderColor: "#e0e0e0" }}
                  data-testid="passenger-phone-input" />
              </div>
              <div>
                <Label htmlFor="pickup" className="text-xs tracking-[0.2em] uppercase" style={{ color: "#4b4b4b" }}>
                  Lokasi Jemput <span style={{ color: "#8b0000" }}>*</span>
                </Label>
                <Input id="pickup" value={pickup} onChange={e => setPickup(e.target.value)}
                  placeholder="Contoh: Jl. Sudirman No. 10"
                  className="mt-1 rounded-xl" style={{ borderColor: "#e0e0e0" }}
                  data-testid="pickup-location-input" />
              </div>
              <div>
                <Label htmlFor="dropoff" className="text-xs tracking-[0.2em] uppercase" style={{ color: "#4b4b4b" }}>
                  Lokasi Turun <span style={{ color: "#687076", fontWeight: 400 }}>(opsional)</span>
                </Label>
                <Input id="dropoff" value={dropoff} onChange={e => setDropoff(e.target.value)}
                  placeholder={`Default: ${data?.schedule?.destination ?? "kota tujuan"}`}
                  className="mt-1 rounded-xl" style={{ borderColor: "#e0e0e0" }}
                  data-testid="dropoff-location-input" />
              </div>
            </div>

            <button onClick={submit} disabled={submitting}
              className="mt-6 w-full h-12 rounded-full text-white font-semibold text-sm transition-colors flex items-center justify-center"
              style={{ background: submitting ? "#4b4b4b" : "#8b0000" }}
              data-testid="confirm-booking-btn">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Konfirmasi & Pesan"}
            </button>
            {!user && (
              <p className="text-xs text-center mt-3" style={{ color: "#8b0000" }}>Anda perlu login untuk memesan.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
