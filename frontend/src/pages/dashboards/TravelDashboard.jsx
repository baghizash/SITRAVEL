import { useEffect, useState } from "react";
import DashboardShell, { StatCard } from "@/components/DashboardShell";
import { api, formatIDR } from "@/lib/api";
import { CalendarDays, Ticket, Plus, Loader2, Trash2, Users, UserCheck, UserX, MapPin, Phone, Navigation, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const CITIES_FALLBACK = ["Pekanbaru","Dumai","Duri","Bagansiapiapi","Rengat","Bengkalis","Selatpanjang","Tembilahan","Bangkinang","Siak Sri Indrapura"];

export default function TravelDashboard() {
  const { user } = useAuth();
  const [stats,     setStats]     = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [bookings,  setBookings]  = useState([]);
  const [drivers,   setDrivers]   = useState([]);
  const [cities,    setCities]    = useState(CITIES_FALLBACK);
  const [loading,   setLoading]   = useState(true);
  const [open,      setOpen]      = useState(false);

  // assign supir state
  const [assignOpen,      setAssignOpen]      = useState(false);
  const [assignSchedule,  setAssignSchedule]  = useState(null);
  const [assignDriverUid, setAssignDriverUid] = useState("");
  const [assignLoading,   setAssignLoading]   = useState(false);

  // manifest state
  const [manifests,   setManifests]   = useState({});  // { scheduleId: data }
  const [manifestLoad,setManifestLoad]= useState({});  // { scheduleId: bool }
  const [manifestOpen,setManifestOpen]= useState({});  // { scheduleId: bool }

  const [form, setForm] = useState({
    origin: "Pekanbaru", destination: "Dumai",
    depart_date: new Date().toISOString().slice(0, 10),
    depart_time: "08:00", price: 90000, total_seats: 16, vehicle: "Minibus 16 Seat",
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get("/stats"),
      api.get("/schedules"),
      api.get("/bookings"),
      api.get("/cities"),
      api.get("/driver/list"),
    ])
      .then(([s, sc, b, c, d]) => {
        setStats(s.data);
        setSchedules(sc.data);
        setBookings(b.data);
        setCities(c.data.map(x => x.name));
        setDrivers(d.data);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  const submit = async () => {
    if (!user?.travel_id) return toast.error("Akun Anda belum terhubung ke travel");
    try {
      await api.post("/schedules", { ...form, travel_id: user.travel_id, price: Number(form.price), total_seats: Number(form.total_seats) });
      toast.success("Jadwal dibuat");
      setOpen(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal membuat jadwal");
    }
  };

  const del = async (id) => {
    if (!confirm("Hapus jadwal ini?")) return;
    try {
      await api.delete(`/schedules/${id}`);
      toast.success("Jadwal dihapus");
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal");
    }
  };

  const openAssign = (schedule) => {
    setAssignSchedule(schedule);
    setAssignDriverUid(schedule.driver_uid ?? "");
    setAssignOpen(true);
  };

  const submitAssign = async () => {
    if (!assignSchedule) return;
    setAssignLoading(true);
    try {
      await api.post(`/schedules/${assignSchedule.id}/assign-driver`, {
        driver_uid: assignDriverUid || null,
      });
      toast.success(assignDriverUid ? "Supir berhasil ditugaskan" : "Penugasan supir dilepas");
      setAssignOpen(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal menugaskan supir");
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <DashboardShell
      title="Dashboard Loket"
      subtitle="Kelola jadwal & pemesanan"
      nav={[
        { key: "sched",   label: "Jadwal",    icon: CalendarDays, active: true },
        { key: "book",    label: "Pemesanan", icon: Ticket },
        { key: "drivers", label: "Supir",     icon: Users },
      ]}
    >
      {loading ? (
        <div className="flex items-center gap-2 text-[#4b4b4b]"><Loader2 className="w-4 h-4 animate-spin" /> Memuat…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatCard label="Jadwal"            value={stats?.total_schedules ?? 0} />
            <StatCard label="Booking"           value={stats?.total_bookings  ?? 0} />
            <StatCard label="Berangkat Hari Ini" value={stats?.today_bookings ?? 0} />
            <StatCard label="Pendapatan"        value={formatIDR(stats?.revenue ?? 0)} />
          </div>

          <Tabs defaultValue="schedules" className="mt-10">
            <TabsList className="bg-white border border-[#e0e0e0]">
              <TabsTrigger value="schedules" data-testid="tab-schedules">Jadwal</TabsTrigger>
              <TabsTrigger value="bookings"  data-testid="tab-bookings">Pemesanan</TabsTrigger>
              <TabsTrigger value="drivers"   data-testid="tab-drivers">Supir</TabsTrigger>
            </TabsList>

            {/* ── Tab Jadwal ──────────────────────────────────── */}
            <TabsContent value="schedules" className="mt-6">
              <div className="flex justify-end mb-4">
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-full bg-[#8b0000] text-white hover:bg-[#6b0000] hover:text-white" data-testid="new-schedule-btn">
                      <Plus className="w-4 h-4 mr-1" /> Tambah Jadwal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white">
                    <DialogHeader><DialogTitle className="font-display text-2xl">Tambah Jadwal Baru</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-2 gap-3">
                      <CitySelect label="Asal"   value={form.origin}      onChange={(v)=>setForm({...form, origin:v})}      cities={cities} testid="sf-origin" />
                      <CitySelect label="Tujuan" value={form.destination} onChange={(v)=>setForm({...form, destination:v})} cities={cities} testid="sf-dest" />
                      <FormField label="Tanggal"     type="date"   value={form.depart_date}  onChange={(e)=>setForm({...form, depart_date:e.target.value})}  testid="sf-date" />
                      <FormField label="Jam"         type="time"   value={form.depart_time}  onChange={(e)=>setForm({...form, depart_time:e.target.value})}  testid="sf-time" />
                      <FormField label="Harga (Rp)"  type="number" value={form.price}        onChange={(e)=>setForm({...form, price:e.target.value})}        testid="sf-price" />
                      <FormField label="Total Kursi" type="number" value={form.total_seats}  onChange={(e)=>setForm({...form, total_seats:e.target.value})}  testid="sf-seats" />
                      <div className="col-span-2">
                        <FormField label="Kendaraan" value={form.vehicle} onChange={(e)=>setForm({...form, vehicle:e.target.value})} testid="sf-vehicle" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={submit} className="rounded-full bg-[#8b0000] text-white hover:bg-[#6b0000] hover:text-white" data-testid="sf-submit">Simpan</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Dialog Assign Supir */}
              <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
                <DialogContent className="bg-white">
                  <DialogHeader>
                    <DialogTitle className="font-display text-xl">Tugaskan Supir</DialogTitle>
                  </DialogHeader>
                  {assignSchedule && (
                    <div className="space-y-4">
                      <div className="rounded-xl p-4 text-sm" style={{ background: "#f9f8f6", border: "1px solid #e0e0e0" }}>
                        <div className="font-semibold" style={{ color: "#141414" }}>
                          {assignSchedule.origin} → {assignSchedule.destination}
                        </div>
                        <div style={{ color: "#4b4b4b" }}>{assignSchedule.depart_date} · {assignSchedule.depart_time}</div>
                      </div>
                      <div>
                        <Label className="text-xs tracking-[0.2em] uppercase text-[#4b4b4b]">Pilih Supir</Label>
                        <Select value={assignDriverUid} onValueChange={setAssignDriverUid}>
                          <SelectTrigger className="mt-1 rounded-lg border-[#e0e0e0]" data-testid="assign-driver-select">
                            <SelectValue placeholder="— Tidak ada supir —" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">— Lepas penugasan —</SelectItem>
                            {drivers.map(d => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.name} · {d.phone || "-"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button onClick={submitAssign} disabled={assignLoading}
                      className="rounded-full bg-[#1E3A2F] text-white hover:bg-[#14281F] hover:text-white"
                      data-testid="assign-driver-submit">
                      {assignLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="rounded-2xl bg-white border border-[#e0e0e0] overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_120px_90px_110px_110px_160px_80px] px-5 py-3 border-b border-[#e0e0e0] text-[10px] tracking-[0.25em] uppercase text-[#4b4b4b] bg-[#f2f2f2]">
                  <div>Rute</div><div>Kendaraan</div><div>Tanggal</div><div>Jam</div><div>Harga</div><div>Terisi</div><div>Supir</div><div></div>
                </div>
                {schedules.length === 0 ? (
                  <div className="p-10 text-center text-[#4b4b4b]">Belum ada jadwal.</div>
                ) : schedules.map((s) => (
                  <div key={s.id}
                    className="grid grid-cols-[1fr_1fr_120px_90px_110px_110px_160px_80px] px-5 py-3 border-b border-[#e0e0e0] items-center text-sm"
                    data-testid={`sched-row-${s.id}`}>
                    <div className="font-medium">{s.origin} → {s.destination}</div>
                    <div className="text-[#4b4b4b]">{s.vehicle}</div>
                    <div className="text-[#4b4b4b]">{s.depart_date}</div>
                    <div>{s.depart_time}</div>
                    <div className="font-semibold text-[#8b0000]">{formatIDR(s.price)}</div>
                    <div>{s.booked}/{s.total_seats}</div>
                    {/* Supir badge */}
                    <div>
                      {s.driver ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-medium"
                          style={{ background: "rgba(30,58,47,0.08)", color: "#1E3A2F" }}>
                          <UserCheck className="w-3 h-3" /> {s.driver.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-medium"
                          style={{ background: "rgba(139,0,0,0.06)", color: "#8b0000" }}>
                          <UserX className="w-3 h-3" /> Belum
                        </span>
                      )}
                    </div>
                    {/* Aksi */}
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openAssign(s)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: "#1E3A2F" }} title="Assign supir"
                        data-testid={`assign-${s.id}`}>
                        <Users className="w-4 h-4" />
                      </button>
                      <button onClick={() => del(s.id)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: "#8b0000" }}
                        data-testid={`del-${s.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* ── Tab Pemesanan ───────────────────────────────── */}
            <TabsContent value="bookings" className="mt-6">
              <div className="rounded-2xl bg-white border border-[#e0e0e0] overflow-hidden">
                <div className="grid grid-cols-[110px_1fr_1fr_1fr_100px_120px_160px] px-5 py-3 border-b border-[#e0e0e0] text-[10px] tracking-[0.25em] uppercase text-[#4b4b4b] bg-[#f2f2f2]">
                  <div>Kode</div><div>Penumpang</div><div>Rute</div><div>Berangkat</div><div>Kursi</div><div>Total</div><div>Lokasi Jemput</div>
                </div>
                {bookings.length === 0 ? (
                  <div className="p-10 text-center text-[#4b4b4b]">Belum ada pemesanan.</div>
                ) : bookings.map((b) => (
                  <div key={b.id} className="grid grid-cols-[110px_1fr_1fr_1fr_100px_120px_160px] px-5 py-3 border-b border-[#e0e0e0] items-center text-sm">
                    <div className="font-mono text-xs">{b.booking_code}</div>
                    <div>
                      <div className="font-medium">{b.passenger_name}</div>
                      <div className="text-xs text-[#4b4b4b]">{b.passenger_phone}</div>
                    </div>
                    <div>{b.origin} → {b.destination}</div>
                    <div>{b.depart_date} · {b.depart_time}</div>
                    <div>#{b.seat_number}</div>
                    <div className="font-semibold text-[#8b0000]">{formatIDR(b.price)}</div>
                    <div className="text-xs text-[#4b4b4b] truncate" title={b.pickup_location}>{b.pickup_location || "-"}</div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* ── Tab Supir ───────────────────────────────────── */}
            <TabsContent value="drivers" className="mt-6">
              <div className="rounded-2xl bg-white border border-[#e0e0e0] overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_160px] px-5 py-3 border-b border-[#e0e0e0] text-[10px] tracking-[0.25em] uppercase text-[#4b4b4b] bg-[#f2f2f2]">
                  <div>Nama Supir</div><div>Email</div><div>No. HP</div>
                </div>
                {drivers.length === 0 ? (
                  <div className="p-10 text-center text-[#4b4b4b]">
                    Belum ada supir terdaftar. Minta Admin Aplikasi untuk membuat akun supir.
                  </div>
                ) : drivers.map((d) => (
                  <div key={d.id} className="grid grid-cols-[1fr_1fr_160px] px-5 py-3 border-b border-[#e0e0e0] items-center text-sm"
                    data-testid={`driver-row-${d.id}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: "#1E3A2F" }}>
                        {d.name.charAt(0)}
                      </div>
                      <span className="font-medium" style={{ color: "#141414" }}>{d.name}</span>
                    </div>
                    <div style={{ color: "#4b4b4b" }}>{d.email}</div>
                    <div style={{ color: "#4b4b4b" }}>{d.phone || "-"}</div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </DashboardShell>
  );
}

function FormField({ label, testid, ...props }) {
  return (
    <div>
      <Label className="text-xs tracking-[0.2em] uppercase text-[#4b4b4b]">{label}</Label>
      <Input className="mt-1 rounded-lg border-[#e0e0e0]" data-testid={testid} {...props} />
    </div>
  );
}

function CitySelect({ label, value, onChange, cities, testid }) {
  return (
    <div>
      <Label className="text-xs tracking-[0.2em] uppercase text-[#4b4b4b]">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1 rounded-lg border-[#e0e0e0]" data-testid={testid}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
