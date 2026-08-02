import { useEffect, useState } from "react";
import DashboardShell, { StatCard } from "@/components/DashboardShell";
import { api, formatIDR } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  CalendarDays, Loader2, Users, MapPin, Clock,
  Bus, Phone, ChevronDown, ChevronUp, Navigation,
} from "lucide-react";
import { toast } from "sonner";

export default function DriverDashboard() {
  const { user }                          = useAuth();
  const [schedules,    setSchedules]      = useState([]);
  const [loading,      setLoading]        = useState(true);
  const [days,         setDays]           = useState(1);
  const [manifests,    setManifests]      = useState({});   // { scheduleId: data }
  const [loadingMfd,   setLoadingMfd]     = useState({});   // { scheduleId: bool }
  const [expanded,     setExpanded]       = useState({});   // { scheduleId: bool }

  const load = () => {
    setLoading(true);
    api.get("/driver/schedules", { params: { days } })
      .then(({ data }) => setSchedules(data))
      .catch(() => toast.error("Gagal memuat jadwal"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [days]); // eslint-disable-line

  const toggleManifest = async (scheduleId) => {
    const isOpen = expanded[scheduleId];
    setExpanded(p => ({ ...p, [scheduleId]: !isOpen }));

    // Jika sudah ada data manifest, tidak perlu fetch ulang
    if (manifests[scheduleId] || isOpen) return;

    setLoadingMfd(p => ({ ...p, [scheduleId]: true }));
    try {
      const { data } = await api.get(`/driver/schedules/${scheduleId}/manifest`);
      setManifests(p => ({ ...p, [scheduleId]: data }));
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal memuat manifest");
      setExpanded(p => ({ ...p, [scheduleId]: false }));
    } finally {
      setLoadingMfd(p => ({ ...p, [scheduleId]: false }));
    }
  };

  const todaySchedules  = schedules.filter(s => s.depart_date === new Date().toISOString().slice(0, 10));
  const totalPassengers = schedules.reduce((a, s) => a + (s.booked ?? 0), 0);

  return (
    <DashboardShell
      title="Dashboard Supir"
      subtitle={`Selamat datang, ${user?.name}`}
      nav={[
        { key: "jadwal",  label: "Jadwal Saya",     icon: CalendarDays, active: true },
        { key: "profile", label: "Profil",           icon: Users },
      ]}
    >
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Jadwal Hari Ini"   value={todaySchedules.length} hint="Keberangkatan hari ini" />
        <StatCard label="Total Jadwal"      value={schedules.length}      hint={`${days} hari ke depan`} />
        <StatCard label="Total Penumpang"   value={totalPassengers}       hint="Seluruh jadwal ditampilkan" />
      </div>

      {/* Filter range hari */}
      <div className="mt-8 flex items-center gap-3 flex-wrap">
        <div className="text-[10px] tracking-[0.3em] uppercase font-semibold" style={{ color: "#4b4b4b" }}>
          Tampilkan
        </div>
        {[1, 3, 7].map(d => (
          <button key={d} onClick={() => setDays(d)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={{
              background: days === d ? "#1E3A2F" : "#fff",
              color:      days === d ? "#fff"    : "#4b4b4b",
              border:     days === d ? "none"    : "1px solid #e0e0e0",
            }}
            data-testid={`filter-days-${d}`}>
            {d === 1 ? "Hari ini" : `${d} hari`}
          </button>
        ))}
      </div>

      {/* Jadwal list */}
      <div className="mt-6">
        {loading ? (
          <div className="flex items-center gap-2" style={{ color: "#4b4b4b" }}>
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#8b0000" }} /> Memuat jadwal…
          </div>
        ) : schedules.length === 0 ? (
          <div className="rounded-2xl p-10 text-center"
            style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#4b4b4b" }}>
            Tidak ada jadwal yang ditugaskan dalam {days === 1 ? "hari ini" : `${days} hari ke depan`}.
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map(s => (
              <div key={s.id} className="rounded-2xl overflow-hidden"
                style={{ background: "#fff", border: "1px solid #e0e0e0" }}>

                {/* Header jadwal */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Ikon */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#1E3A2F" }}>
                    <Bus className="w-6 h-6 text-white" />
                  </div>

                  {/* Info jadwal */}
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <div className="text-[9px] tracking-[0.25em] uppercase" style={{ color: "#4b4b4b" }}>Rute</div>
                      <div className="font-semibold text-sm" style={{ color: "#141414" }}>
                        {s.origin} → {s.destination}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] tracking-[0.25em] uppercase" style={{ color: "#4b4b4b" }}>Berangkat</div>
                      <div className="flex items-center gap-1 font-semibold text-sm" style={{ color: "#141414" }}>
                        <Clock className="w-3.5 h-3.5" style={{ color: "#8b0000" }} />
                        {s.depart_date} · {s.depart_time}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] tracking-[0.25em] uppercase" style={{ color: "#4b4b4b" }}>Kendaraan</div>
                      <div className="text-sm" style={{ color: "#141414" }}>{s.vehicle}</div>
                    </div>
                    <div>
                      <div className="text-[9px] tracking-[0.25em] uppercase" style={{ color: "#4b4b4b" }}>Penumpang</div>
                      <div className="text-sm font-semibold" style={{ color: "#1E3A2F" }}>
                        {s.booked ?? 0} / {s.total_seats}
                      </div>
                    </div>
                  </div>

                  {/* Toggle manifest */}
                  <button
                    onClick={() => toggleManifest(s.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors flex-shrink-0"
                    style={{ background: expanded[s.id] ? "#1E3A2F" : "transparent", color: expanded[s.id] ? "#fff" : "#4b4b4b", border: "1px solid #e0e0e0" }}
                    data-testid={`toggle-manifest-${s.id}`}>
                    <Users className="w-3.5 h-3.5" />
                    Manifest
                    {expanded[s.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Manifest penumpang */}
                {expanded[s.id] && (
                  <div style={{ borderTop: "1px solid #e0e0e0" }}>
                    {loadingMfd[s.id] ? (
                      <div className="p-5 flex items-center gap-2" style={{ color: "#4b4b4b" }}>
                        <Loader2 className="w-4 h-4 animate-spin" /> Memuat manifest…
                      </div>
                    ) : manifests[s.id]?.manifest?.length === 0 ? (
                      <div className="p-5 text-sm" style={{ color: "#4b4b4b" }}>
                        Belum ada penumpang yang memesan jadwal ini.
                      </div>
                    ) : (
                      <div>
                        {/* Header tabel */}
                        <div className="grid grid-cols-[50px_1fr_130px_1fr_1fr] px-5 py-2.5 text-[9px] tracking-[0.25em] uppercase"
                          style={{ background: "#f9f8f6", color: "#4b4b4b", borderBottom: "1px solid #e0e0e0" }}>
                          <div>Kursi</div>
                          <div>Penumpang</div>
                          <div>No. HP</div>
                          <div>Lokasi Jemput</div>
                          <div>Lokasi Turun</div>
                        </div>
                        {manifests[s.id]?.manifest?.map(p => (
                          <div key={p.seat_number}
                            className="grid grid-cols-[50px_1fr_130px_1fr_1fr] px-5 py-3 text-sm items-center"
                            style={{ borderBottom: "1px solid #f0f0f0" }}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                              style={{ background: "#1E3A2F" }}>
                              {p.seat_number}
                            </div>
                            <div className="font-medium" style={{ color: "#141414" }}>{p.passenger_name}</div>
                            <div className="flex items-center gap-1" style={{ color: "#4b4b4b" }}>
                              <Phone className="w-3 h-3" /> {p.passenger_phone}
                            </div>
                            <div className="flex items-center gap-1" style={{ color: "#4b4b4b" }}>
                              <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: "#8b0000" }} />
                              <span className="truncate" title={p.pickup_location}>{p.pickup_location}</span>
                            </div>
                            <div className="flex items-center gap-1" style={{ color: "#4b4b4b" }}>
                              <Navigation className="w-3 h-3 flex-shrink-0" style={{ color: "#1E3A2F" }} />
                              <span className="truncate" title={p.dropoff_location}>{p.dropoff_location}</span>
                            </div>
                          </div>
                        ))}
                        {/* Footer total */}
                        <div className="px-5 py-3 text-xs font-semibold"
                          style={{ background: "#f9f8f6", color: "#1E3A2F" }}>
                          Total penumpang: {manifests[s.id]?.total ?? 0} orang
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
