import { useEffect, useState } from "react";
import DashboardShell, { StatCard } from "@/components/DashboardShell";
import { api, formatIDR } from "@/lib/api";
import { Ticket, MapPin, Loader2, Printer, XCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function PenggunaDashboard() {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    Promise.all([api.get("/stats"), api.get("/bookings/me")])
      .then(([s, b]) => { setStats(s.data); setBookings(b.data); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    if (!confirm("Batalkan booking ini? Kursi akan dilepaskan.")) return;
    try {
      await api.post(`/bookings/${id}/cancel`);
      toast.success("Booking dibatalkan");
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal membatalkan");
    }
  };

  return (
    <DashboardShell
      title="Dashboard Pengguna"
      subtitle="Perjalanan Anda"
      nav={[
        { key: "bookings", label: "Booking Saya", icon: Ticket, active: true },
        { key: "search", label: "Cari Tiket Baru", icon: MapPin, onClick: () => navigate("/") },
      ]}
    >
      {loading ? (
        <div className="flex items-center gap-2 text-[#4A5257]"><Loader2 className="w-4 h-4 animate-spin" /> Memuat…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total Booking" value={stats?.my_bookings ?? 0} />
            <StatCard label="Akan Datang" value={stats?.upcoming ?? 0} hint="Perjalanan mendatang" />
            <StatCard label="Total Pengeluaran" value={formatIDR(bookings.reduce((a, b) => a + (b.status !== "cancelled" ? b.price : 0), 0))} />
          </div>

          <div className="mt-10">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-2xl font-bold text-[#14281F] tracking-tight">Riwayat Booking</h2>
              <Button onClick={() => navigate("/")} className="rounded-full bg-[#E6B325] text-[#14281F] hover:bg-[#F2D06B] hover:text-[#14281F]" data-testid="new-booking-btn">
                + Pesan Tiket Baru
              </Button>
            </div>
            {bookings.length === 0 ? (
              <div className="rounded-2xl bg-white border border-[#E6E2D8] p-10 text-center text-[#4A5257]">Belum ada booking.</div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {bookings.map((b) => (
                  <div key={b.id} className="rounded-2xl bg-white border border-[#E6E2D8] p-5 flex flex-col md:flex-row md:items-center gap-4" data-testid={`booking-${b.id}`}>
                    <div className="flex items-center gap-3 min-w-[180px]">
                      <div className="w-10 h-10 rounded-lg bg-[#1E3A2F] flex items-center justify-center">
                        <Ticket className="w-5 h-5 text-[#F2D06B]" />
                      </div>
                      <div>
                        <div className="text-[10px] tracking-[0.25em] uppercase text-[#7C8489]">Kode</div>
                        <div className="font-mono font-semibold text-[#14281F]">{b.booking_code}</div>
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Info label="Rute" value={`${b.origin} → ${b.destination}`} />
                      <Info label="Berangkat" value={`${b.depart_date} · ${b.depart_time}`} />
                      <Info label="Kursi" value={`#${b.seat_number}`} />
                      <Info label="Total" value={formatIDR(b.price)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium tracking-wider uppercase ${b.status === "confirmed" ? "bg-[#1E3A2F] text-[#F2D06B]" : "bg-[#8B2520] text-white"}`}>
                        {b.status}
                      </span>
                      {b.status !== "cancelled" && (
                        <>
                          <Link to={`/ticket/${b.id}`} data-testid={`view-ticket-${b.id}`}>
                            <Button size="sm" variant="outline" className="rounded-full border-[#1E3A2F] text-[#1E3A2F] hover:bg-[#1E3A2F] hover:text-white">
                              <Printer className="w-3.5 h-3.5 mr-1" /> E-Tiket
                            </Button>
                          </Link>
                          <Link to={`/reschedule/${b.id}`} data-testid={`reschedule-${b.id}`}>
                            <Button size="sm" variant="outline" className="rounded-full border-[#E6B325] text-[#8B2520] hover:bg-[#E6B325] hover:text-[#14281F]">
                              <RotateCw className="w-3.5 h-3.5 mr-1" /> Reschedule
                            </Button>
                          </Link>
                          <Button size="sm" variant="ghost" onClick={() => cancel(b.id)} className="rounded-full text-[#8B2520] hover:bg-[#8B2520]/10 hover:text-[#8B2520]" data-testid={`cancel-booking-${b.id}`}>
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </DashboardShell>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.25em] uppercase text-[#7C8489]">{label}</div>
      <div className="mt-0.5 text-sm text-[#11181C] font-medium">{value}</div>
    </div>
  );
}
