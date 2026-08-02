import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import { api, formatIDR } from "@/lib/api";
import { getSessionId } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, Loader2, ArrowRight, Bus, Clock, RadioTower, RotateCw } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 3000;

export default function Reschedule() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const sessionId = useRef(getSessionId()).current;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [chosen, setChosen] = useState(null); // schedule obj
  const [seats, setSeats] = useState({ taken_seats: [], locked_by_others: [], schedule: null });
  const [seat, setSeat] = useState(null);
  const seatRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/bookings/${bookingId}`).then(({ data }) => {
      setBooking(data);
      // default new date = original depart_date, or today if past
      const orig = new Date(data.depart_date);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      setDate(orig >= today ? orig : today);
    }).catch(() => setBooking(false)).finally(() => setLoading(false));
  }, [bookingId]);

  // Load schedules for chosen date
  useEffect(() => {
    if (!booking) return;
    const d = format(date, "yyyy-MM-dd");
    api.get("/search", {
      params: { origin: booking.origin, destination: booking.destination, date: d },
    }).then(({ data }) => setSchedules(data)).catch(() => setSchedules([]));
    // reset picked when date changes
    setChosen(null); setSeat(null); seatRef.current = null;
  }, [date, booking]);

  // Poll seats when a schedule is chosen
  useEffect(() => {
    if (!chosen) return;
    const load = async () => {
      try {
        const { data } = await api.get(`/schedules/${chosen.id}/seats`, { params: { session_id: sessionId } });
        // exclude own current booking from taken seats when rescheduling to same schedule
        const filteredTaken = data.taken_seats.filter(
          (n) => !(chosen.id === booking?.schedule_id && n === booking?.seat_number)
        );
        setSeats({ ...data, taken_seats: filteredTaken });
        if (seatRef.current && (filteredTaken.includes(seatRef.current) || data.locked_by_others.includes(seatRef.current))) {
          seatRef.current = null;
          setSeat(null);
          toast.warning("Kursi pilihan Anda diambil pengguna lain");
        }
      } catch {}
    };
    load();
    const t = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      clearInterval(t);
      if (seatRef.current) {
        api.post(`/schedules/${chosen.id}/release-seat`, { seat_number: seatRef.current, session_id: sessionId }).catch(() => {});
      }
    };
  }, [chosen, sessionId, booking]);

  const pickSeat = async (num) => {
    if (!chosen) return;
    try {
      await api.post(`/schedules/${chosen.id}/lock-seat`, { seat_number: num, session_id: sessionId });
      seatRef.current = num;
      setSeat(num);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Kursi tidak bisa dikunci");
    }
  };

  const submit = async () => {
    if (!chosen || !seat) return toast.error("Pilih jadwal dan kursi baru");
    setSubmitting(true);
    try {
      await api.post(`/bookings/${bookingId}/reschedule`, {
        new_schedule_id: chosen.id, new_seat_number: seat,
      });
      toast.success("Jadwal berhasil diubah");
      seatRef.current = null;
      navigate(`/ticket/${bookingId}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal reschedule");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#F5F2EC]"><SiteHeader /><div className="p-10 flex items-center gap-2 text-[#4A5257]"><Loader2 className="w-4 h-4 animate-spin" /> Memuat…</div></div>;
  }
  if (!booking) {
    return <div className="min-h-screen bg-[#F5F2EC]"><SiteHeader /><div className="p-10 text-[#8B2520]">Booking tidak ditemukan.</div></div>;
  }

  return (
    <div className="min-h-screen bg-[#F5F2EC]">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
        <div className="flex items-center gap-3">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[#8B2520]">Reschedule</div>
          <div className="flex items-center gap-1.5 text-[10px] tracking-[0.25em] uppercase text-[#1E3A2F]">
            <RadioTower className="w-3 h-3 animate-pulse" /> Live sync
          </div>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#14281F] tracking-tight mt-1">
          Ubah jadwal booking <span className="font-mono text-2xl">{booking.booking_code}</span>
        </h1>
        <p className="text-sm text-[#4A5257] mt-1">
          Rute tetap: <b>{booking.origin}</b> <ArrowRight className="inline w-4 h-4 mx-1 text-[#E6B325]" /> <b>{booking.destination}</b>
        </p>

        <div className="mt-6 rounded-2xl bg-white border border-[#E6E2D8] p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Info label="Jadwal saat ini" value={`${booking.depart_date} · ${booking.depart_time}`} />
            <Info label="Kursi saat ini" value={`#${booking.seat_number}`} />
          </div>
        </div>

        {/* Date + schedules */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-12 rounded-full border-[#1E3A2F] text-[#1E3A2F] hover:bg-[#1E3A2F] hover:text-white" data-testid="resched-date-btn">
                    <CalendarDays className="w-4 h-4 mr-2" />
                    {format(date, "EEE, d MMM yyyy", { locale: idLocale })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)}
                            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {schedules.length === 0 ? (
                <div className="rounded-2xl bg-white border border-[#E6E2D8] p-6 text-center text-[#4A5257]">
                  Tidak ada jadwal pada tanggal ini.
                </div>
              ) : schedules.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setChosen(r); setSeat(null); seatRef.current = null; }}
                  className={`text-left rounded-2xl bg-white border p-4 flex items-center gap-4 card-lift ${chosen?.id === r.id ? "border-[#1E3A2F] ring-2 ring-[#1E3A2F]/20" : "border-[#E6E2D8]"}`}
                  data-testid={`resched-option-${r.id}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#1E3A2F] flex items-center justify-center flex-shrink-0">
                    <Bus className="w-5 h-5 text-[#F2D06B]" />
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-[10px] tracking-[0.25em] uppercase text-[#7C8489]">Berangkat</div>
                      <div className="font-display text-xl font-bold text-[#14281F] flex items-center gap-1"><Clock className="w-4 h-4 text-[#1E3A2F]" /> {r.depart_time}</div>
                    </div>
                    <div>
                      <div className="text-[10px] tracking-[0.25em] uppercase text-[#7C8489]">Travel</div>
                      <div className="text-sm text-[#11181C] font-medium">{r.travel?.name}</div>
                    </div>
                    <div>
                      <div className="text-[10px] tracking-[0.25em] uppercase text-[#7C8489]">Kursi sisa</div>
                      <div className="text-sm text-[#11181C]">{r.seats_available}/{r.total_seats}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] tracking-[0.25em] uppercase text-[#7C8489]">Harga</div>
                    <div className="font-display text-lg font-black text-[#8B2520]">{formatIDR(r.price)}</div>
                  </div>
                </button>
              ))}
            </div>

            {chosen && (
              <div className="mt-8 rounded-2xl bg-white border border-[#E6E2D8] p-6">
                <div className="text-[10px] tracking-[0.3em] uppercase text-[#7C8489] mb-4">Pilih kursi baru — {chosen.depart_time}</div>
                <div className="w-fit mx-auto grid grid-cols-4 gap-3">
                  {Array.from({ length: chosen.total_seats }, (_, i) => i + 1).map((num) => {
                    const isTaken = seats.taken_seats.includes(num);
                    const isLocked = seats.locked_by_others.includes(num);
                    const isSel = seat === num;
                    const cls = isTaken ? "seat-cell seat-taken" : isLocked ? "seat-cell seat-locked" : isSel ? "seat-cell seat-selected" : "seat-cell seat-available";
                    return (
                      <button key={num} disabled={isTaken || isLocked} onClick={() => pickSeat(num)} className={cls} data-testid={`resched-seat-${num}`}>
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-2xl bg-white border border-[#E6E2D8] p-6">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[#7C8489]">Ringkasan Reschedule</div>
              <div className="mt-3 space-y-2 text-sm text-[#11181C]">
                <div className="flex justify-between"><span className="text-[#4A5257]">Dari</span><b>{booking.depart_date} · {booking.depart_time}</b></div>
                <div className="flex justify-between"><span className="text-[#4A5257]">Kursi lama</span><b>#{booking.seat_number}</b></div>
                <div className="border-t border-dashed border-[#E6E2D8] my-2" />
                <div className="flex justify-between"><span className="text-[#4A5257]">Tujuan tgl</span><b>{format(date, "d MMM yyyy", { locale: idLocale })}</b></div>
                <div className="flex justify-between"><span className="text-[#4A5257]">Jadwal baru</span><b>{chosen ? `${chosen.depart_time} · ${chosen.travel?.code}` : "-"}</b></div>
                <div className="flex justify-between"><span className="text-[#4A5257]">Kursi baru</span><b>{seat ? `#${seat}` : "-"}</b></div>
                <div className="flex justify-between"><span className="text-[#4A5257]">Harga baru</span><b className="text-[#8B2520]">{chosen ? formatIDR(chosen.price) : "-"}</b></div>
              </div>
              <Button
                onClick={submit}
                disabled={submitting || !chosen || !seat}
                className="mt-6 w-full h-12 rounded-full bg-[#1E3A2F] text-[#F2D06B] hover:bg-[#14281F] hover:text-[#F2D06B] font-semibold"
                data-testid="confirm-reschedule-btn"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RotateCw className="w-4 h-4 mr-2" /> Konfirmasi Reschedule</>}
              </Button>
              <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mt-2 w-full rounded-full text-[#4A5257] hover:bg-[#F5F2EC] hover:text-[#14281F]" data-testid="resched-cancel-btn">
                Batal
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.25em] uppercase text-[#7C8489]">{label}</div>
      <div className="mt-0.5 text-[#11181C] font-medium">{value}</div>
    </div>
  );
}
