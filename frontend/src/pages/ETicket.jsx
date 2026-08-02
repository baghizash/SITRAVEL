import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import { api, formatIDR } from "@/lib/api";
import { Loader2, Ticket, Bus, MapPin, Clock, User, Phone, Download, RotateCw, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function ETicket() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/bookings/${bookingId}`)
      .then(({ data }) => setBooking(data))
      .catch(() => setBooking(false))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const downloadPDF = () => {
    const url = `${process.env.REACT_APP_BACKEND_URL}/api/bookings/${bookingId}/ticket.pdf`;
    fetch(url, { credentials: "include" })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `etiket-${booking.booking_code}.pdf`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => toast.error("Gagal download PDF"));
  };

  const cancel = async () => {
    if (!confirm("Batalkan booking ini?")) return;
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      toast.success("Booking dibatalkan");
      const { data } = await api.get(`/bookings/${bookingId}`);
      setBooking(data);
    } catch (e) { toast.error(e.response?.data?.detail || "Gagal membatalkan"); }
  };

  if (loading) return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      <SiteHeader />
      <div className="p-10 flex items-center gap-2" style={{ color: "#4b4b4b" }}>
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#8b0000" }} /> Memuat tiket…
      </div>
    </div>
  );

  if (!booking) return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      <SiteHeader />
      <div className="p-10" style={{ color: "#8b0000" }}>Booking tidak ditemukan.</div>
    </div>
  );

  const isCancelled = booking.status === "cancelled";

  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      <SiteHeader />
      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-10">

        {/* Ticket card */}
        <div className="rounded-3xl overflow-hidden shadow-lg" style={{ background: "#fff", border: `2px solid ${isCancelled ? "#4b4b4b" : "#8b0000"}` }}
          data-testid="eticket-card">

          {/* Header */}
          <div className="px-7 py-5 flex items-center justify-between"
            style={{ background: isCancelled ? "#4b4b4b" : "#141414" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#8b0000" }}>
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-display text-base font-black text-white">Si-Travel Riau</div>
                <div className="text-[9px] tracking-[0.3em] uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>E-Tiket Perjalanan</div>
              </div>
            </div>
            <span className="text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full"
              style={{ background: isCancelled ? "rgba(255,255,255,0.1)" : "rgba(139,0,0,0.3)", color: isCancelled ? "#fff" : "#ff9999" }}>
              {booking.status}
            </span>
          </div>

          {/* Route bar */}
          <div className="px-7 py-5 flex items-center justify-between"
            style={{ background: "#f2f2f2", borderBottom: "2px dashed #e0e0e0" }}>
            <div>
              <div className="text-[9px] tracking-[0.3em] uppercase" style={{ color: "#4b4b4b" }}>Asal</div>
              <div className="font-display text-2xl font-bold" style={{ color: "#141414" }}>{booking.origin}</div>
            </div>
            <MapPin className="w-6 h-6" style={{ color: "#8b0000" }} />
            <div className="text-right">
              <div className="text-[9px] tracking-[0.3em] uppercase" style={{ color: "#4b4b4b" }}>Tujuan</div>
              <div className="font-display text-2xl font-bold" style={{ color: "#141414" }}>{booking.destination}</div>
            </div>
          </div>

          {/* Details */}
          <div className="px-7 py-6 grid grid-cols-2 gap-5">
            {[
              { icon: Clock,  label: "Berangkat",   value: `${booking.depart_date} · ${booking.depart_time}` },
              { icon: Bus,    label: "Travel",       value: booking.travel?.name || "-" },
              { icon: User,   label: "Penumpang",    value: booking.passenger_name },
              { icon: Phone,  label: "No. HP",       value: booking.passenger_phone },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label}>
                <div className="flex items-center gap-1.5 text-[9px] tracking-[0.25em] uppercase mb-1" style={{ color: "#4b4b4b" }}>
                  <Icon className="w-3 h-3" style={{ color: "#8b0000" }} /> {label}
                </div>
                <div className="text-sm font-semibold" style={{ color: "#141414" }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Code bar */}
          <div className="px-7 py-4 flex items-center justify-between"
            style={{ background: "#141414", borderTop: "2px dashed #e0e0e0" }}>
            <div>
              <div className="text-[9px] tracking-[0.25em] uppercase text-white/50">Kode Booking</div>
              <div className="font-mono text-xl font-bold tracking-widest" style={{ color: "#fff" }}>
                {booking.booking_code}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] tracking-[0.25em] uppercase text-white/50">Kursi</div>
              <div className="font-display text-3xl font-black" style={{ color: "#8b0000" }}>#{booking.seat_number}</div>
            </div>
          </div>

          {/* Price */}
          <div className="px-7 py-4 flex items-center justify-between" style={{ borderTop: "1px solid #e0e0e0" }}>
            <div className="text-[9px] tracking-[0.25em] uppercase" style={{ color: "#4b4b4b" }}>Total Bayar</div>
            <div className="font-display text-2xl font-bold" style={{ color: "#8b0000" }}>{formatIDR(booking.price)}</div>
          </div>
        </div>

        {/* Reschedule history */}
        {booking.reschedule_history?.length > 0 && (
          <div className="mt-6 rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #e0e0e0" }}>
            <div className="text-[10px] tracking-[0.3em] uppercase font-semibold mb-3" style={{ color: "#8b0000" }}>
              Riwayat Reschedule
            </div>
            <div className="space-y-2">
              {booking.reschedule_history.map((h, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-2"
                  style={{ borderBottom: "1px solid #f2f2f2" }}>
                  <span style={{ color: "#4b4b4b" }}>{h.depart_date} · {h.depart_time}</span>
                  <span style={{ color: "#6e6e6e" }}>Kursi #{h.seat_number}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={downloadPDF}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-colors"
            style={{ background: "#8b0000" }}
            data-testid="download-pdf-btn">
            <Download className="w-4 h-4" /> Download PDF
          </button>

          {!isCancelled && (
            <>
              <button onClick={() => navigate(`/reschedule/${bookingId}`)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
                style={{ border: "1px solid #141414", color: "#141414" }}
                data-testid="reschedule-btn">
                <RotateCw className="w-4 h-4" /> Reschedule
              </button>
              <button onClick={cancel}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
                style={{ border: "1px solid #e0e0e0", color: "#8b0000" }}
                data-testid="cancel-btn">
                <XCircle className="w-4 h-4" /> Batalkan
              </button>
            </>
          )}

          <button onClick={() => navigate("/dashboard")}
            className="px-5 py-2.5 rounded-full text-sm transition-colors"
            style={{ color: "#4b4b4b" }}
            data-testid="back-dashboard-btn">
            ← Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
