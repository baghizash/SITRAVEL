import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import { api, formatIDR } from "@/lib/api";
import { getSessionId } from "@/lib/session";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, Loader2, ArrowRight, Bus, Clock, RadioTower, RotateCw, AlertTriangle, Info } from "lucide-react";
import { format, differenceInHours, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";

const MAX_RESCHEDULE        = 2;   // harus sinkron dengan BookingController::MAX_RESCHEDULE
const RESCHEDULE_DEADLINE_H = 48;  // jam sebelum keberangkatan
const POLL_MS = 3000;

export default function Reschedule() {
  const { bookingId } = useParams();
  const navigate      = useNavigate();
  const sessionId     = useRef(getSessionId()).current;

  const [booking,    setBooking]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [date,       setDate]       = useState(new Date());
  const [schedules,  setSchedules]  = useState([]);
  const [chosen,     setChosen]     = useState(null);
  const [seats,      setSeats]      = useState({ taken_seats: [], locked_by_others: [], schedule: null });
  const [seat,       setSeat]       = useState(null);
  const [pickup,     setPickup]     = useState("");
  const [dropoff,    setDropoff]    = useState("");
  const seatRef   = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Computed: cek batas reschedule ──────────────────────────────────────
  const rescheduleCount  = booking?.reschedule_count ?? 0;
  const rescheduleBlocked = useMemo(() => {
    if (!booking) return { blocked: false, reason: "" };
    if (rescheduleCount >= MAX_RESCHEDULE)
      return { blocked: true, reason: `Batas reschedule (${MAX_RESCHEDULE}x) telah tercapai.` };
    const departAt   = new Date(`${booking.depart_date}T${booking.depart_time}`);
    const hoursLeft  = differenceInHours(departAt, new Date());
    if (hoursLeft < RESCHEDULE_DEADLINE_H)
      return { blocked: true, reason: `Reschedule hanya bisa dilakukan minimal ${RESCHEDULE_DEADLINE_H} jam sebelum keberangkatan. Sisa waktu: ${hoursLeft < 0 ? "sudah berangkat" : `${hoursLeft} jam`}.` };
    return { blocked: false, reason: "" };
  }, [booking, rescheduleCount]);

  useEffect(() => {
    api.get(`/bookings/${bookingId}`).then(({ data }) => {
      setBooking(data);
      setPickup(data.pickup_location || "");
      setDropoff(data.dropoff_location || "");
      const orig = new Date(data.depart_date);
      const today = new Date(); today.setHours(0,0,0,0);
      setDate(orig >= today ? orig : today);
    }).catch(() => setBooking(false)).finally(() => setLoading(false));
  }, [bookingId]);

  useEffect(() => {
    if (!booking) return;
    const d = format(date, "yyyy-MM-dd");
    api.get("/search", { params: { origin: booking.origin, destination: booking.destination, date: d } })
      .then(({ data }) => setSchedules(data)).catch(() => setSchedules([]));
    setChosen(null); setSeat(null); seatRef.current = null;
  }, [date, booking]);

  useEffect(() => {
    if (!chosen) return;
    const load = async () => {
      try {
        const { data } = await api.get(`/schedules/${chosen.id}/seats`, { params: { session_id: sessionId } });
        const filteredTaken = data.taken_seats.filter(
          n => !(chosen.id === booking?.schedule_id && n === booking?.seat_number)
        );
        setSeats({ ...data, taken_seats: filteredTaken });
        if (seatRef.current && (filteredTaken.includes(seatRef.current) || data.locked_by_others.includes(seatRef.current))) {
          seatRef.current = null; setSeat(null);
          toast.warning("Kursi pilihan Anda diambil pengguna lain");
        }
      } catch {}
    };
    load();
    const t = setInterval(load, POLL_MS);
    return () => {
      clearInterval(t);
      if (seatRef.current)
        api.post(`/schedules/${chosen.id}/release-seat`, { seat_number: seatRef.current, session_id: sessionId }).catch(() => {});
    };
  }, [chosen, sessionId, booking]);

  const pickSeat = async (num) => {
    if (!chosen) return;
    try {
      await api.post(`/schedules/${chosen.id}/lock-seat`, { seat_number: num, session_id: sessionId });
      seatRef.current = num; setSeat(num);
    } catch (e) { toast.error(e.response?.data?.detail || "Kursi tidak bisa dikunci"); }
  };

  const submit = async () => {
    if (!chosen || !seat) return toast.error("Pilih jadwal dan kursi baru");
    setSubmitting(true);
    try {
      const { data: result } = await api.post(`/bookings/${bookingId}/reschedule`, {
        new_schedule_id:  chosen.id,
        new_seat_number:  seat,
        pickup_location:  pickup || undefined,
        dropoff_location: dropoff || undefined,
      });
      
      // Tampilkan info selisih harga
      if (result.price_diff !== undefined && result.price_diff !== 0) {
        const diff = result.price_diff;
        if (diff > 0) {
          toast.success(`✓ Berhasil. Tambahan: +${formatIDR(diff)}`);
        } else {
          toast.success(`✓ Berhasil. Potongan: ${formatIDR(Math.abs(diff))}`);
        }
      } else {
        toast.success("✓ Jadwal berhasil diubah");
      }
      seatRef.current = null;
      navigate(`/ticket/${bookingId}`);
    } catch (e) { toast.error(e.response?.data?.detail || "Gagal reschedule"); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}><SiteHeader />
      <div className="p-10 flex items-center gap-2" style={{ color: "#4b4b4b" }}>
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#8b0000" }} /> Memuat…
      </div>
    </div>
  );
  if (!booking) return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}><SiteHeader />
      <div className="p-10" style={{ color: "#8b0000" }}>Booking tidak ditemukan.</div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">

        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-[10px] tracking-[0.3em] uppercase font-semibold" style={{ color: "#8b0000" }}>Reschedule</div>
          <div className="flex items-center gap-1.5 text-[10px] tracking-[0.25em] uppercase" style={{ color: "#4b4b4b" }}>
            <RadioTower className="w-3 h-3 animate-pulse" style={{ color: "#8b0000" }} /> Live sync
          </div>
          {/* Badge sisa reschedule */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider"
            style={{
              background: rescheduleCount >= MAX_RESCHEDULE ? "rgba(139,0,0,0.1)" : "rgba(30,58,47,0.08)",
              color:      rescheduleCount >= MAX_RESCHEDULE ? "#8b0000" : "#1E3A2F",
            }}>
            <Info className="w-3 h-3" />
            Reschedule {rescheduleCount}/{MAX_RESCHEDULE}x
          </div>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-1" style={{ color: "#141414" }}>
          Ubah jadwal <span className="font-mono text-2xl">{booking.booking_code}</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: "#4b4b4b" }}>
          Rute tetap: <b>{booking.origin}</b> <ArrowRight className="inline w-4 h-4 mx-1" style={{ color: "#8b0000" }} /> <b>{booking.destination}</b>
        </p>

        {/* Banner blokir jika tidak bisa reschedule */}
        {rescheduleBlocked.blocked && (
          <div className="mt-4 flex items-start gap-3 rounded-xl p-4"
            style={{ background: "rgba(139,0,0,0.06)", border: "1px solid rgba(139,0,0,0.15)" }}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#8b0000" }} />
            <div>
              <div className="text-sm font-semibold" style={{ color: "#8b0000" }}>Reschedule tidak tersedia</div>
              <div className="text-sm mt-0.5" style={{ color: "#4b4b4b" }}>{rescheduleBlocked.reason}</div>
            </div>
          </div>
        )}

        {/* Current booking info */}
        <div className="mt-6 rounded-2xl p-5 grid grid-cols-2 gap-4" style={{ background: "#fff", border: "1px solid #e0e0e0" }}>
          {[
            ["Jadwal saat ini", `${booking.depart_date} · ${booking.depart_time}`],
            ["Kursi saat ini",  `#${booking.seat_number}`],
            ["Lokasi Jemput",   booking.pickup_location  || "-"],
            ["Lokasi Turun",    booking.dropoff_location || "-"],
          ].map(([l, v]) => (
            <div key={l}>
              <div className="text-[10px] tracking-[0.25em] uppercase" style={{ color: "#4b4b4b" }}>{l}</div>
              <div className="mt-0.5 font-semibold" style={{ color: "#141414" }}>{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          <div>
            {/* Date picker */}
            <div className="flex items-center gap-3 mb-4">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="h-11 px-5 rounded-full text-sm font-medium flex items-center gap-2 transition-colors"
                    style={{ border: "1px solid #141414", color: "#141414" }}
                    data-testid="resched-date-btn">
                    <CalendarDays className="w-4 h-4" style={{ color: "#8b0000" }} />
                    {format(date, "EEE, d MMM yyyy", { locale: idLocale })}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={d => d && setDate(d)}
                    disabled={d => d < new Date(new Date().setHours(0,0,0,0))} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Schedule list */}
            <div className="grid grid-cols-1 gap-3">
              {schedules.length === 0 ? (
                <div className="rounded-2xl p-6 text-center" style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#4b4b4b" }}>
                  Tidak ada jadwal pada tanggal ini.
                </div>
              ) : schedules.map(r => (
                <button key={r.id} onClick={() => { setChosen(r); setSeat(null); seatRef.current = null; }}
                  className="text-left rounded-2xl p-4 flex items-center gap-4 transition-all"
                  style={{
                    background: "#fff",
                    border: chosen?.id === r.id ? "2px solid #8b0000" : "1px solid #e0e0e0",
                    boxShadow: chosen?.id === r.id ? "0 0 0 3px rgba(139,0,0,0.08)" : "none",
                  }}
                  data-testid={`resched-option-${r.id}`}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#141414" }}>
                    <Bus className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-[9px] tracking-[0.25em] uppercase" style={{ color: "#4b4b4b" }}>Berangkat</div>
                      <div className="font-display text-xl font-bold flex items-center gap-1" style={{ color: "#141414" }}>
                        <Clock className="w-4 h-4" style={{ color: "#8b0000" }} /> {r.depart_time}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] tracking-[0.25em] uppercase" style={{ color: "#4b4b4b" }}>Travel</div>
                      <div className="text-sm font-medium" style={{ color: "#141414" }}>{r.travel?.name}</div>
                    </div>
                    <div>
                      <div className="text-[9px] tracking-[0.25em] uppercase" style={{ color: "#4b4b4b" }}>Sisa</div>
                      <div className="text-sm" style={{ color: "#141414" }}>{r.seats_available}/{r.total_seats}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] tracking-[0.25em] uppercase" style={{ color: "#4b4b4b" }}>Harga</div>
                    <div className="font-display text-lg font-black" style={{ color: "#8b0000" }}>{formatIDR(r.price)}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Seat map */}
            {chosen && (
              <div className="mt-8 rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #e0e0e0" }}>
                <div className="text-[10px] tracking-[0.3em] uppercase font-semibold mb-4" style={{ color: "#4b4b4b" }}>
                  Pilih kursi baru — {chosen.depart_time}
                </div>
                <div className="w-fit mx-auto grid grid-cols-4 gap-3">
                  {Array.from({ length: chosen.total_seats }, (_, i) => i + 1).map(num => {
                    const isTaken  = seats.taken_seats.includes(num);
                    const isLocked = seats.locked_by_others.includes(num);
                    const isSel    = seat === num;
                    const cls = isTaken ? "seat-cell seat-taken" : isLocked ? "seat-cell seat-locked" : isSel ? "seat-cell seat-selected" : "seat-cell seat-available";
                    return (
                      <button key={num} disabled={isTaken || isLocked} onClick={() => pickSeat(num)}
                        className={cls} data-testid={`resched-seat-${num}`}>
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #e0e0e0" }}>
              <div className="text-[10px] tracking-[0.3em] uppercase font-semibold" style={{ color: "#4b4b4b" }}>Ringkasan</div>
              <div className="mt-3 space-y-2 text-sm">
                {[
                  ["Dari",       `${booking.depart_date} · ${booking.depart_time}`],
                  ["Kursi lama", `#${booking.seat_number}`],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between">
                    <span style={{ color: "#4b4b4b" }}>{l}</span><b style={{ color: "#141414" }}>{v}</b>
                  </div>
                ))}
                <div style={{ borderTop: "1px dashed #e0e0e0", margin: "8px 0" }} />
                {[
                  ["Tujuan tgl",  chosen ? format(date, "d MMM yyyy", { locale: idLocale }) : "-"],
                  ["Jadwal baru", chosen ? `${chosen.depart_time} · ${chosen.travel?.code}` : "-"],
                  ["Kursi baru",  seat ? `#${seat}` : "-"],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between">
                    <span style={{ color: "#4b4b4b" }}>{l}</span><b style={{ color: "#141414" }}>{v}</b>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span style={{ color: "#4b4b4b" }}>Harga baru</span>
                  <b style={{ color: "#8b0000" }}>{chosen ? formatIDR(chosen.price) : "-"}</b>
                </div>
              </div>

              {/* Lokasi jemput/turun — bisa diubah saat reschedule */}
              <div className="mt-4 space-y-3">
                <div>
                  <Label className="text-xs tracking-[0.2em] uppercase" style={{ color: "#4b4b4b" }}>
                    Lokasi Jemput <span style={{ color: "#8b0000" }}>*</span>
                  </Label>
                  <Input value={pickup} onChange={e => setPickup(e.target.value)}
                    placeholder="Contoh: Jl. Sudirman No. 10"
                    className="mt-1 rounded-xl" style={{ borderColor: "#e0e0e0" }}
                    data-testid="resched-pickup-input" />
                </div>
                <div>
                  <Label className="text-xs tracking-[0.2em] uppercase" style={{ color: "#4b4b4b" }}>
                    Lokasi Turun <span style={{ color: "#687076", fontWeight: 400 }}>(opsional)</span>
                  </Label>
                  <Input value={dropoff} onChange={e => setDropoff(e.target.value)}
                    placeholder={booking?.destination ?? "kota tujuan"}
                    className="mt-1 rounded-xl" style={{ borderColor: "#e0e0e0" }}
                    data-testid="resched-dropoff-input" />
                </div>
              </div>

              <button onClick={submit} disabled={submitting || !chosen || !seat || rescheduleBlocked.blocked}
                className="mt-6 w-full h-12 rounded-full text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                style={{ background: (submitting || !chosen || !seat || rescheduleBlocked.blocked) ? "#4b4b4b" : "#8b0000" }}
                data-testid="confirm-reschedule-btn">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RotateCw className="w-4 h-4" /> Konfirmasi Reschedule</>}
              </button>
              <button onClick={() => navigate("/dashboard")}
                className="mt-2 w-full h-10 rounded-full text-sm transition-colors"
                style={{ color: "#4b4b4b" }}
                data-testid="resched-cancel-btn">
                Batal
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
