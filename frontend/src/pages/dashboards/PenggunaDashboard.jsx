import { useEffect, useState } from "react";
import DashboardShell, { StatCard } from "@/components/DashboardShell";
import { api, formatIDR } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Ticket, MapPin, Loader2, Printer, XCircle, RotateCw,
  User, KeyRound, Download, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function PenggunaDashboard() {
  const [tab, setTab] = useState("bookings");
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

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

  const downloadPDF = (id, code) => {
    const url = `${process.env.REACT_APP_BACKEND_URL}/api/bookings/${id}/ticket.pdf`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `etiket-${code}.pdf`;
    // Sertakan credentials (cookie)
    fetch(url, { credentials: "include" })
      .then(r => r.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        a.click();
        URL.revokeObjectURL(blobUrl);
      })
      .catch(() => toast.error("Gagal download PDF"));
  };

  return (
    <DashboardShell
      title="Dashboard Pengguna"
      subtitle="Perjalanan Anda"
      nav={[
        { key: "bookings", label: "Booking Saya",  icon: Ticket,   active: tab === "bookings",  onClick: () => setTab("bookings")  },
        { key: "profile",  label: "Profil & Akun", icon: User,     active: tab === "profile",   onClick: () => setTab("profile")   },
        { key: "search",   label: "Cari Tiket Baru",icon: MapPin,  onClick: () => navigate("/") },
      ]}
    >
      {loading ? (
        <div className="flex items-center gap-2 text-[#4A5257]"><Loader2 className="w-4 h-4 animate-spin" /> Memuat…</div>
      ) : tab === "bookings" ? (
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
                    <div className="flex items-center gap-2 flex-wrap">
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
                          <Button size="sm" variant="outline" onClick={() => downloadPDF(b.id, b.booking_code)} className="rounded-full border-[#4A5257] text-[#4A5257] hover:bg-[#4A5257] hover:text-white" data-testid={`pdf-${b.id}`}>
                            <Download className="w-3.5 h-3.5 mr-1" /> PDF
                          </Button>
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
      ) : (
        <ProfileTab user={user} onUpdate={(u) => setUser && setUser(u)} />
      )}
    </DashboardShell>
  );
}

// ── Tab Profil ────────────────────────────────────────────────────────────────
function ProfileTab({ user, onUpdate }) {
  const [name,  setName]  = useState(user?.name  ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);

  const [curPw,  setCurPw]  = useState("");
  const [newPw,  setNewPw]  = useState("");
  const [saving2, setSaving2] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/auth/profile", { name, phone });
      toast.success("Profil berhasil disimpan");
      onUpdate?.(data.user);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal menyimpan");
    } finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!curPw || !newPw) return toast.error("Isi semua field password");
    if (newPw.length < 6) return toast.error("Password baru minimal 6 karakter");
    setSaving2(true);
    try {
      await api.put("/auth/change-password", { current_password: curPw, new_password: newPw });
      toast.success("Password berhasil diubah");
      setCurPw(""); setNewPw("");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal mengubah password");
    } finally { setSaving2(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-3xl">
      {/* Edit Profil */}
      <div className="rounded-2xl bg-white border border-[#E6E2D8] p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-5 h-5 text-[#1E3A2F]" />
          <h3 className="font-display text-lg font-bold text-[#14281F]">Edit Profil</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-xs tracking-[0.15em] uppercase text-[#7C8489]">Email</Label>
            <Input value={user?.email ?? ""} disabled className="mt-1 rounded-lg bg-[#F5F2EC] border-[#E6E2D8] text-[#7C8489]" />
          </div>
          <div>
            <Label className="text-xs tracking-[0.15em] uppercase text-[#7C8489]">Nama Lengkap</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="mt-1 rounded-lg border-[#E6E2D8]" />
          </div>
          <div>
            <Label className="text-xs tracking-[0.15em] uppercase text-[#7C8489]">Nomor HP</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 rounded-lg border-[#E6E2D8]" placeholder="08xxxxxxxxxx" />
          </div>
          <Button onClick={saveProfile} disabled={saving} className="w-full rounded-full bg-[#1E3A2F] text-[#F2D06B] hover:bg-[#14281F]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Simpan Profil</>}
          </Button>
        </div>
      </div>

      {/* Ganti Password */}
      <div className="rounded-2xl bg-white border border-[#E6E2D8] p-6">
        <div className="flex items-center gap-2 mb-5">
          <KeyRound className="w-5 h-5 text-[#1E3A2F]" />
          <h3 className="font-display text-lg font-bold text-[#14281F]">Ganti Password</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-xs tracking-[0.15em] uppercase text-[#7C8489]">Password Saat Ini</Label>
            <Input type="password" value={curPw} onChange={e => setCurPw(e.target.value)} className="mt-1 rounded-lg border-[#E6E2D8]" />
          </div>
          <div>
            <Label className="text-xs tracking-[0.15em] uppercase text-[#7C8489]">Password Baru</Label>
            <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="mt-1 rounded-lg border-[#E6E2D8]" />
            <p className="text-[10px] text-[#7C8489] mt-1">Minimal 6 karakter</p>
          </div>
          <Button onClick={changePassword} disabled={saving2} className="w-full rounded-full bg-[#E6B325] text-[#14281F] hover:bg-[#F2D06B]">
            {saving2 ? <Loader2 className="w-4 h-4 animate-spin" /> : <><KeyRound className="w-4 h-4 mr-2" /> Ubah Password</>}
          </Button>
        </div>
      </div>
    </div>
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
