import { useEffect, useState } from "react";
import DashboardShell, { StatCard } from "@/components/DashboardShell";
import { api, formatIDR } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Ticket, MapPin, Loader2, Download, XCircle, RotateCw, User, KeyRound, CheckCircle2, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function PenggunaDashboard() {
  const [tab,      setTab]      = useState("bookings");
  const [stats,    setStats]    = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
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
    if (!confirm("Batalkan booking ini?")) return;
    try { await api.post(`/bookings/${id}/cancel`); toast.success("Booking dibatalkan"); load(); }
    catch (e) { toast.error(e.response?.data?.detail || "Gagal membatalkan"); }
  };

  const downloadPDF = (id, code) => {
    const url = `${process.env.REACT_APP_BACKEND_URL}/api/bookings/${id}/ticket.pdf`;
    fetch(url, { credentials: "include" })
      .then(r => r.blob()).then(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = `etiket-${code}.pdf`; a.click();
        URL.revokeObjectURL(a.href);
      }).catch(() => toast.error("Gagal download PDF"));
  };

  return (
    <DashboardShell title="Dashboard Pengguna" subtitle="Perjalanan Anda"
      nav={[
        { key: "bookings", label: "Booking Saya",   icon: Ticket, active: tab === "bookings", onClick: () => setTab("bookings") },
        { key: "profile",  label: "Profil & Akun",  icon: User,   active: tab === "profile",  onClick: () => setTab("profile")  },
        { key: "search",   label: "Cari Tiket Baru",icon: MapPin, onClick: () => navigate("/") },
      ]}>

      {loading ? (
        <div className="flex items-center gap-2" style={{ color: "#4b4b4b" }}>
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#8b0000" }} /> Memuat…
        </div>
      ) : tab === "bookings" ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total Booking"    value={stats?.my_bookings ?? 0} />
            <StatCard label="Akan Datang"      value={stats?.upcoming ?? 0} hint="Perjalanan mendatang" />
            <StatCard label="Total Pengeluaran" value={formatIDR(bookings.reduce((a, b) => a + (b.status !== "cancelled" ? b.price : 0), 0))} />
          </div>

          <div className="mt-10">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-2xl font-bold tracking-tight" style={{ color: "#141414" }}>Riwayat Booking</h2>
              <button onClick={() => navigate("/")}
                className="px-4 py-2 rounded-full text-sm font-semibold text-white"
                style={{ background: "#8b0000" }}
                data-testid="new-booking-btn">
                + Pesan Tiket Baru
              </button>
            </div>

            {bookings.length === 0 ? (
              <div className="rounded-2xl p-10 text-center" style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#4b4b4b" }}>
                Belum ada booking.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {bookings.map((b) => (
                  <div key={b.id} className="rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4"
                    style={{ background: "#fff", border: "1px solid #e0e0e0" }}
                    data-testid={`booking-${b.id}`}>

                    <div className="flex items-center gap-3 min-w-[180px]">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "#141414" }}>
                        <Ticket className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-[9px] tracking-[0.25em] uppercase" style={{ color: "#4b4b4b" }}>Kode</div>
                        <div className="font-mono font-semibold" style={{ color: "#141414" }}>{b.booking_code}</div>
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Info label="Rute"      value={`${b.origin} → ${b.destination}`} />
                      <Info label="Berangkat" value={`${b.depart_date} · ${b.depart_time}`} />
                      <Info label="Kursi"     value={`#${b.seat_number}`} />
                      <Info label="Total"     value={formatIDR(b.price)} />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] px-2.5 py-1 rounded-full font-medium tracking-wider uppercase text-white"
                        style={{ background: b.status === "confirmed" ? "#8b0000" : "#4b4b4b" }}>
                        {b.status}
                      </span>
                      {b.status !== "cancelled" && (
                        <>
                          <Link to={`/ticket/${b.id}`} data-testid={`view-ticket-${b.id}`}>
                            <button className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                              style={{ border: "1px solid #141414", color: "#141414" }}>
                              <Printer className="w-3 h-3" /> E-Tiket
                            </button>
                          </Link>
                          <button onClick={() => downloadPDF(b.id, b.booking_code)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                            style={{ border: "1px solid #4b4b4b", color: "#4b4b4b" }}
                            data-testid={`pdf-${b.id}`}>
                            <Download className="w-3 h-3" /> PDF
                          </button>
                          <Link to={`/reschedule/${b.id}`} data-testid={`reschedule-${b.id}`}>
                            <button className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                              style={{ border: "1px solid #8b0000", color: "#8b0000" }}>
                              <RotateCw className="w-3 h-3" /> Reschedule
                            </button>
                          </Link>
                          <button onClick={() => cancel(b.id)}
                            className="p-1.5 rounded-full transition-colors"
                            style={{ color: "#8b0000" }}
                            data-testid={`cancel-booking-${b.id}`}>
                            <XCircle className="w-4 h-4" />
                          </button>
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
        <ProfileTab user={user} onUpdate={u => setUser?.(u)} />
      )}
    </DashboardShell>
  );
}

function ProfileTab({ user, onUpdate }) {
  const [name, setName]     = useState(user?.name  ?? "");
  const [phone, setPhone]   = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [curPw, setCurPw]   = useState("");
  const [newPw, setNewPw]   = useState("");
  const [saving2, setSaving2] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/auth/profile", { name, phone });
      toast.success("Profil disimpan"); onUpdate?.(data.user);
    } catch (e) { toast.error(e.response?.data?.detail || "Gagal menyimpan"); }
    finally { setSaving(false); }
  };

  const changePw = async () => {
    if (!curPw || !newPw) return toast.error("Isi semua field");
    if (newPw.length < 6)  return toast.error("Password baru min 6 karakter");
    setSaving2(true);
    try {
      await api.put("/auth/change-password", { current_password: curPw, new_password: newPw });
      toast.success("Password berhasil diubah"); setCurPw(""); setNewPw("");
    } catch (e) { toast.error(e.response?.data?.detail || "Gagal mengubah password"); }
    finally { setSaving2(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-3xl">
      <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #e0e0e0" }}>
        <div className="flex items-center gap-2 mb-5">
          <User className="w-5 h-5" style={{ color: "#8b0000" }} />
          <h3 className="font-display text-lg font-bold" style={{ color: "#141414" }}>Edit Profil</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-xs tracking-[0.15em] uppercase" style={{ color: "#4b4b4b" }}>Email</Label>
            <Input value={user?.email ?? ""} disabled className="mt-1 rounded-xl" style={{ background: "#f2f2f2", borderColor: "#e0e0e0", color: "#4b4b4b" }} />
          </div>
          <div>
            <Label className="text-xs tracking-[0.15em] uppercase" style={{ color: "#4b4b4b" }}>Nama Lengkap</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="mt-1 rounded-xl" style={{ borderColor: "#e0e0e0" }} />
          </div>
          <div>
            <Label className="text-xs tracking-[0.15em] uppercase" style={{ color: "#4b4b4b" }}>Nomor HP</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 rounded-xl" style={{ borderColor: "#e0e0e0" }} />
          </div>
          <button onClick={saveProfile} disabled={saving}
            className="w-full h-11 rounded-full text-white font-semibold text-sm flex items-center justify-center gap-2"
            style={{ background: saving ? "#4b4b4b" : "#8b0000" }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Simpan Profil</>}
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #e0e0e0" }}>
        <div className="flex items-center gap-2 mb-5">
          <KeyRound className="w-5 h-5" style={{ color: "#8b0000" }} />
          <h3 className="font-display text-lg font-bold" style={{ color: "#141414" }}>Ganti Password</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-xs tracking-[0.15em] uppercase" style={{ color: "#4b4b4b" }}>Password Saat Ini</Label>
            <Input type="password" value={curPw} onChange={e => setCurPw(e.target.value)} className="mt-1 rounded-xl" style={{ borderColor: "#e0e0e0" }} />
          </div>
          <div>
            <Label className="text-xs tracking-[0.15em] uppercase" style={{ color: "#4b4b4b" }}>Password Baru</Label>
            <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="mt-1 rounded-xl" style={{ borderColor: "#e0e0e0" }} />
            <p className="text-[10px] mt-1" style={{ color: "#6e6e6e" }}>Minimal 6 karakter</p>
          </div>
          <button onClick={changePw} disabled={saving2}
            className="w-full h-11 rounded-full text-white font-semibold text-sm flex items-center justify-center gap-2"
            style={{ background: saving2 ? "#4b4b4b" : "#141414" }}>
            {saving2 ? <Loader2 className="w-4 h-4 animate-spin" /> : <><KeyRound className="w-4 h-4" /> Ubah Password</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-[9px] tracking-[0.25em] uppercase" style={{ color: "#4b4b4b" }}>{label}</div>
      <div className="mt-0.5 text-sm font-medium" style={{ color: "#141414" }}>{value}</div>
    </div>
  );
}
