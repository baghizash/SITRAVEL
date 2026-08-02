import { useEffect, useMemo, useState } from "react";
import DashboardShell, { StatCard } from "@/components/DashboardShell";
import { api, formatIDR } from "@/lib/api";
import { BarChart3, Users, Loader2, Ticket } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export default function ManagerDashboard() {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/stats"), api.get("/bookings")])
      .then(([s, b]) => { setStats(s.data); setBookings(b.data); })
      .finally(() => setLoading(false));
  }, []);

  const routeStats = useMemo(() => {
    const map = {};
    for (const b of bookings) {
      const k = `${b.origin} → ${b.destination}`;
      map[k] = map[k] || { route: k, bookings: 0, revenue: 0 };
      map[k].bookings += 1;
      map[k].revenue += b.price;
    }
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [bookings]);

  return (
    <DashboardShell
      title="Dashboard Manager"
      subtitle="Laporan gabungan travel"
      nav={[
        { key: "overview", label: "Overview", icon: BarChart3, active: true },
        { key: "bookings", label: "Pemesanan", icon: Ticket },
        { key: "loket", label: "Loket", icon: Users },
      ]}
    >
      {loading ? (
        <div className="flex items-center gap-2 text-[#4A5257]"><Loader2 className="w-4 h-4 animate-spin" /> Memuat…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatCard label="Total Jadwal" value={stats?.total_schedules ?? 0} />
            <StatCard label="Total Booking" value={stats?.total_bookings ?? 0} />
            <StatCard label="Booking Hari Ini" value={stats?.today_bookings ?? 0} />
            <StatCard label="Pendapatan" value={formatIDR(stats?.revenue ?? 0)} />
          </div>

          <div className="mt-10 rounded-2xl bg-white border border-[#E6E2D8] p-6">
            <div className="text-[10px] tracking-[0.3em] uppercase text-[#8B2520]">Pendapatan per rute</div>
            <h2 className="font-display text-2xl font-bold text-[#14281F] tracking-tight mt-1">Top rute travel Anda</h2>
            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={routeStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E2D8" />
                  <XAxis dataKey="route" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => formatIDR(v)} />
                  <Bar dataKey="revenue" fill="#1E3A2F" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-white border border-[#E6E2D8] overflow-hidden">
            <div className="p-5 border-b border-[#E6E2D8]">
              <h3 className="font-display text-xl font-bold text-[#14281F]">Pemesanan Terbaru</h3>
            </div>
            <div className="grid grid-cols-[110px_1fr_1fr_1fr_120px] px-5 py-3 border-b border-[#E6E2D8] text-[10px] tracking-[0.25em] uppercase text-[#7C8489] bg-[#F5F2EC]">
              <div>Kode</div><div>Penumpang</div><div>Rute</div><div>Berangkat</div><div>Total</div>
            </div>
            {bookings.slice(0, 10).map((b) => (
              <div key={b.id} className="grid grid-cols-[110px_1fr_1fr_1fr_120px] px-5 py-3 border-b border-[#E6E2D8] items-center text-sm">
                <div className="font-mono text-xs">{b.booking_code}</div>
                <div className="font-medium">{b.passenger_name}</div>
                <div>{b.origin} → {b.destination}</div>
                <div>{b.depart_date} · {b.depart_time}</div>
                <div className="font-semibold text-[#8B2520]">{formatIDR(b.price)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
