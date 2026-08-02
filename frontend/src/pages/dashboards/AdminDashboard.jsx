import { useEffect, useState } from "react";
import DashboardShell, { StatCard } from "@/components/DashboardShell";
import { api, formatIDR, roleLabel } from "@/lib/api";
import { Building2, Users, Ticket, Loader2, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [travels, setTravels] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [travelOpen, setTravelOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [tab, setTab] = useState("travels");
  const [tForm, setTForm] = useState({ name: "", code: "", description: "", contact: "" });
  const [uForm, setUForm] = useState({ name: "", email: "", password: "", role: "travel", phone: "", travel_id: "" });

  const load = () => {
    setLoading(true);
    Promise.all([api.get("/stats"), api.get("/travel-partners"), api.get("/users"), api.get("/bookings")])
      .then(([s, t, u, b]) => { setStats(s.data); setTravels(t.data); setUsers(u.data); setBookings(b.data); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const submitTravel = async () => {
    try {
      await api.post("/travel-partners", tForm);
      toast.success("Travel partner ditambahkan");
      setTravelOpen(false);
      setTForm({ name: "", code: "", description: "", contact: "" });
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal");
    }
  };

  const submitUser = async () => {
    try {
      const payload = { ...uForm };
      if (payload.role === "pengguna" || payload.role === "admin_app") delete payload.travel_id;
      if (!payload.travel_id) delete payload.travel_id;
      await api.post("/users", payload);
      toast.success("Akun dibuat");
      setUserOpen(false);
      setUForm({ name: "", email: "", password: "", role: "travel", phone: "", travel_id: "" });
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal");
    }
  };

  return (
    <DashboardShell
      title="Dashboard Admin Aplikasi"
      subtitle="Kontrol pusat Si-Travel"
      nav={[
        { key: "over", label: "Overview", icon: Building2, active: true },
        { key: "part", label: "Mitra Travel", icon: Building2 },
        { key: "user", label: "Pengguna", icon: Users },
        { key: "book", label: "Semua Booking", icon: Ticket },
      ]}
    >
      {loading ? (
        <div className="flex items-center gap-2 text-[#4b4b4b]"><Loader2 className="w-4 h-4 animate-spin" /> Memuat…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="Pengguna" value={stats?.total_users ?? 0} />
            <StatCard label="Mitra Travel" value={stats?.total_travels ?? 0} />
            <StatCard label="Jadwal" value={stats?.total_schedules ?? 0} />
            <StatCard label="Booking" value={stats?.total_bookings ?? 0} />
            <StatCard label="Total Revenue" value={formatIDR(stats?.revenue ?? 0)} />
          </div>

          <Tabs value={tab} onValueChange={setTab} className="mt-10">
            <TabsList className="bg-white border border-[#e0e0e0]">
              <TabsTrigger value="travels" data-testid="admin-tab-travels">Mitra Travel</TabsTrigger>
              <TabsTrigger value="users" data-testid="admin-tab-users">Pengguna</TabsTrigger>
              <TabsTrigger value="bookings" data-testid="admin-tab-bookings">Booking</TabsTrigger>
            </TabsList>

            <TabsContent value="travels" className="mt-6">
              <div className="flex justify-end mb-4">
                <Dialog open={travelOpen} onOpenChange={setTravelOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-full bg-[#8b0000] text-white hover:bg-[#6b0000] hover:text-white" data-testid="new-travel-btn">
                      <Plus className="w-4 h-4 mr-1" /> Tambah Mitra
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white">
                    <DialogHeader><DialogTitle className="font-display text-2xl">Tambah Mitra Travel</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <F label="Nama" value={tForm.name} onChange={(e)=>setTForm({...tForm, name:e.target.value})} testid="tf-name" />
                      <F label="Kode (3 huruf)" value={tForm.code} onChange={(e)=>setTForm({...tForm, code:e.target.value.toUpperCase()})} testid="tf-code" />
                      <F label="Deskripsi" value={tForm.description} onChange={(e)=>setTForm({...tForm, description:e.target.value})} testid="tf-desc" />
                      <F label="Kontak" value={tForm.contact} onChange={(e)=>setTForm({...tForm, contact:e.target.value})} testid="tf-contact" />
                    </div>
                    <DialogFooter>
                      <Button onClick={submitTravel} className="rounded-full bg-[#8b0000] text-white hover:bg-[#6b0000] hover:text-white" data-testid="tf-submit">Simpan</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="rounded-2xl bg-white border border-[#e0e0e0] overflow-hidden">
                <div className="grid grid-cols-[80px_1fr_1fr_180px] px-5 py-3 border-b border-[#e0e0e0] text-[10px] tracking-[0.25em] uppercase text-[#4b4b4b] bg-[#f2f2f2]">
                  <div>Kode</div><div>Nama</div><div>Deskripsi</div><div>Kontak</div>
                </div>
                {travels.map((t) => (
                  <div key={t.id} className="grid grid-cols-[80px_1fr_1fr_180px] px-5 py-3 border-b border-[#e0e0e0] text-sm">
                    <div className="font-mono font-semibold text-[#8b0000]">{t.code}</div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-[#4b4b4b]">{t.description}</div>
                    <div className="text-[#4b4b4b]">{t.contact}</div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <div className="flex justify-end mb-4">
                <Dialog open={userOpen} onOpenChange={setUserOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-full bg-[#8b0000] text-white hover:bg-[#6b0000] hover:text-white" data-testid="new-user-btn">
                      <Plus className="w-4 h-4 mr-1" /> Buat Akun
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white">
                    <DialogHeader><DialogTitle className="font-display text-2xl">Buat Akun Baru</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-2 gap-3">
                      <F label="Nama" value={uForm.name} onChange={(e)=>setUForm({...uForm, name:e.target.value})} testid="uf-name" />
                      <F label="Email" type="email" value={uForm.email} onChange={(e)=>setUForm({...uForm, email:e.target.value})} testid="uf-email" />
                      <F label="Password (min 6)" type="password" value={uForm.password} onChange={(e)=>setUForm({...uForm, password:e.target.value})} testid="uf-pw" />
                      <F label="No. HP" value={uForm.phone} onChange={(e)=>setUForm({...uForm, phone:e.target.value})} testid="uf-phone" />
                      <div>
                        <Label className="text-xs tracking-[0.2em] uppercase text-[#7C8489]">Peran</Label>
                        <Select value={uForm.role} onValueChange={(v)=>setUForm({...uForm, role:v, travel_id: (v==='pengguna'||v==='admin_app')?'':uForm.travel_id})}>
                          <SelectTrigger className="mt-1 rounded-lg border-[#E6E2D8]" data-testid="uf-role"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="travel">Admin Loket (Travel)</SelectItem>
                            <SelectItem value="manager">Manager/Kepala</SelectItem>
                            <SelectItem value="admin_app">Admin Aplikasi</SelectItem>
                            <SelectItem value="pengguna">Pengguna</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {(uForm.role === "travel" || uForm.role === "manager") && (
                        <div>
                          <Label className="text-xs tracking-[0.2em] uppercase text-[#7C8489]">Travel</Label>
                          <Select value={uForm.travel_id} onValueChange={(v)=>setUForm({...uForm, travel_id:v})}>
                            <SelectTrigger className="mt-1 rounded-lg border-[#E6E2D8]" data-testid="uf-travel"><SelectValue placeholder="Pilih travel" /></SelectTrigger>
                            <SelectContent>
                              {travels.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button onClick={submitUser} className="rounded-full bg-[#1E3A2F] text-[#F2D06B] hover:bg-[#14281F] hover:text-[#F2D06B]" data-testid="uf-submit">Simpan</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="rounded-2xl bg-white border border-[#E6E2D8] overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_1fr_160px] px-5 py-3 border-b border-[#E6E2D8] text-[10px] tracking-[0.25em] uppercase text-[#7C8489] bg-[#F5F2EC]">
                  <div>Nama</div><div>Email</div><div>Telepon</div><div>Peran</div>
                </div>
                {users.map((u) => (
                  <div key={u.id} className="grid grid-cols-[1fr_1fr_1fr_160px] px-5 py-3 border-b border-[#E6E2D8] text-sm">
                    <div className="font-medium">{u.name}</div>
                    <div className="text-[#4A5257]">{u.email}</div>
                    <div className="text-[#4A5257]">{u.phone || "-"}</div>
                    <div>
                      <span className="inline-block text-[10px] tracking-[0.2em] uppercase bg-[#1E3A2F] text-[#F2D06B] px-2 py-1 rounded-full">
                        {roleLabel(u.role)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="bookings" className="mt-6">
              <div className="rounded-2xl bg-white border border-[#E6E2D8] overflow-hidden">
                <div className="grid grid-cols-[110px_1fr_1fr_1fr_120px_100px] px-5 py-3 border-b border-[#E6E2D8] text-[10px] tracking-[0.25em] uppercase text-[#7C8489] bg-[#F5F2EC]">
                  <div>Kode</div><div>Penumpang</div><div>Rute</div><div>Berangkat</div><div>Total</div><div>Status</div>
                </div>
                {bookings.slice(0, 30).map((b) => (
                  <div key={b.id} className="grid grid-cols-[110px_1fr_1fr_1fr_120px_100px] px-5 py-3 border-b border-[#E6E2D8] text-sm items-center">
                    <div className="font-mono text-xs">{b.booking_code}</div>
                    <div className="font-medium">{b.passenger_name}</div>
                    <div>{b.origin} → {b.destination}</div>
                    <div>{b.depart_date} · {b.depart_time}</div>
                    <div className="font-semibold text-[#8B2520]">{formatIDR(b.price)}</div>
                    <div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${b.status === "confirmed" ? "bg-[#1E3A2F] text-[#F2D06B]" : "bg-[#8B2520] text-white"}`}>{b.status}</span>
                    </div>
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

function F({ label, testid, ...p }) {
  return (
    <div>
      <Label className="text-xs tracking-[0.2em] uppercase text-[#7C8489]">{label}</Label>
      <Input className="mt-1 rounded-lg border-[#E6E2D8]" data-testid={testid} {...p} />
    </div>
  );
}
