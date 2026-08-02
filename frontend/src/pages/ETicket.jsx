import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, formatIDR } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Bus, Printer, ArrowLeft, Loader2, Ticket, MapPin, Clock, User, Phone } from "lucide-react";

export default function ETicket() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef(null);

  useEffect(() => {
    api.get(`/bookings/${bookingId}`)
      .then(({ data }) => setBooking(data))
      .catch(() => setBooking(false))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const print = () => window.print();

  if (loading) {
    return <div className="min-h-screen bg-[#F5F2EC] p-10 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Memuat…</div>;
  }
  if (!booking) {
    return (
      <div className="min-h-screen bg-[#F5F2EC] p-10">
        <div className="max-w-md mx-auto rounded-2xl bg-white border border-[#E6E2D8] p-8 text-center">
          <div className="font-display text-2xl font-bold text-[#14281F]">Tiket tidak ditemukan</div>
          <Link to="/dashboard" className="text-[#1E3A2F] underline mt-4 inline-block">Kembali ke Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2EC] py-10 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto px-5 print:px-0">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-full text-[#1E3A2F] hover:bg-[#1E3A2F]/10 hover:text-[#1E3A2F]" data-testid="ticket-back">
            <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
          </Button>
          <Button onClick={print} className="rounded-full bg-[#1E3A2F] text-[#F2D06B] hover:bg-[#14281F] hover:text-[#F2D06B]" data-testid="ticket-print-btn">
            <Printer className="w-4 h-4 mr-2" /> Cetak Tiket
          </Button>
        </div>

        <div ref={printRef} className="rounded-3xl overflow-hidden bg-white border border-[#E6E2D8] shadow-[0_18px_60px_-24px_rgba(20,40,31,0.35)] print:shadow-none print:border-0" data-testid="e-ticket">
          {/* Header */}
          <div className="bg-[#14281F] text-white p-6 grain relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#E6B325] flex items-center justify-center">
                  <Bus className="w-5 h-5 text-[#14281F]" />
                </div>
                <div className="leading-tight">
                  <div className="font-display text-lg font-black">Si-Travel</div>
                  <div className="text-[9px] tracking-[0.3em] uppercase text-[#F2D06B]">Riau</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] tracking-[0.3em] uppercase text-[#F2D06B]">E-Tiket</div>
                <div className="font-mono text-lg font-bold">{booking.booking_code}</div>
              </div>
            </div>
            <div className="mt-6">
              <div className="text-[10px] tracking-[0.3em] uppercase text-white/60">Rute</div>
              <div className="font-display text-3xl sm:text-4xl font-black tracking-tighter mt-1">
                {booking.origin} <span className="text-[#F2D06B]">→</span> {booking.destination}
              </div>
              <div className="text-sm text-white/70 mt-1">{booking.travel?.name || "-"}</div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 grid grid-cols-2 gap-5">
            <Row icon={Clock} label="Berangkat" value={`${booking.depart_date}\n${booking.depart_time}`} />
            <Row icon={Ticket} label="Kursi" value={`#${booking.seat_number}`} />
            <Row icon={User} label="Penumpang" value={booking.passenger_name} />
            <Row icon={Phone} label="No. HP" value={booking.passenger_phone} />
            <Row icon={MapPin} label="Titik Naik" value={`${booking.origin} (Loket ${booking.travel?.code || ""})`} />
            <Row icon={MapPin} label="Titik Turun" value={booking.destination} />
          </div>

          <div className="border-t border-dashed border-[#E6E2D8] mx-6" />

          <div className="p-6 flex items-center justify-between">
            <div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-[#7C8489]">Total Bayar</div>
              <div className="font-display text-3xl font-black text-[#8B2520]">{formatIDR(booking.price)}</div>
            </div>
            <div className={`text-xs px-3 py-1.5 rounded-full font-medium ${booking.status === "confirmed" ? "bg-[#1E3A2F] text-[#F2D06B]" : "bg-[#8B2520] text-white"}`}>
              {booking.status === "confirmed" ? "TERKONFIRMASI" : booking.status.toUpperCase()}
            </div>
          </div>

          {/* Footer strip */}
          <div className="bg-[#F5F2EC] border-t border-[#E6E2D8] p-4 text-[10px] tracking-[0.25em] uppercase text-[#7C8489] text-center">
            Tunjukkan e-tiket ini kepada Admin Loket · Berlaku hanya untuk tanggal & jam yang tertera
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A5; margin: 12mm; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-lg bg-[#F5F2EC] flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-[#1E3A2F]" />
      </div>
      <div>
        <div className="text-[10px] tracking-[0.25em] uppercase text-[#7C8489]">{label}</div>
        <div className="text-sm font-medium text-[#11181C] whitespace-pre-line mt-0.5">{value}</div>
      </div>
    </div>
  );
}
