import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { formatApiErrorDetail } from "@/lib/api";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

const DEMO = [
  { role: "Admin Aplikasi",      email: "baghiz678@gmail.com", pw: "Admin@2026" },
  { role: "Admin Loket",         email: "loket@sitravel.id",   pw: "Loket@2026" },
  { role: "Manager / Kepala",    email: "manager@sitravel.id", pw: "Manager@2026" },
  { role: "Pengguna",            email: "user@sitravel.id",    pw: "User@2026" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Selamat datang!");
      navigate(next);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Gagal login");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* Form */}
        <div>
          <div className="text-[10px] tracking-[0.3em] uppercase font-semibold" style={{ color: "#8b0000" }}>Masuk</div>
          <h1 className="font-display mt-2 text-4xl sm:text-5xl font-bold tracking-tighter" style={{ color: "#141414" }}>
            Selamat datang<br />kembali.
          </h1>
          <p className="mt-4 max-w-md" style={{ color: "#4b4b4b" }}>
            Kelola perjalanan, jadwal, atau seluruh sistem Si-Travel Riau dari satu tempat.
          </p>

          <form onSubmit={submit} className="mt-8 max-w-md space-y-4">
            <div>
              <Label htmlFor="email" className="text-xs tracking-[0.2em] uppercase" style={{ color: "#4b4b4b" }}>Email</Label>
              <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="mt-1 h-12 rounded-xl" style={{ borderColor: "#e0e0e0", background: "#fff" }}
                data-testid="login-email" />
            </div>
            <div>
              <Label htmlFor="pw" className="text-xs tracking-[0.2em] uppercase" style={{ color: "#4b4b4b" }}>Password</Label>
              <Input id="pw" type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="mt-1 h-12 rounded-xl" style={{ borderColor: "#e0e0e0", background: "#fff" }}
                data-testid="login-password" />
            </div>
            <button type="submit" disabled={busy}
              className="w-full h-12 rounded-full text-white font-semibold text-sm transition-colors flex items-center justify-center"
              style={{ background: busy ? "#4b4b4b" : "#8b0000" }}
              data-testid="login-submit-btn">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Masuk"}
            </button>
            <p className="text-sm" style={{ color: "#4b4b4b" }}>
              Belum punya akun?{" "}
              <Link to="/register" className="font-semibold underline" style={{ color: "#8b0000" }} data-testid="to-register">
                Daftar
              </Link>
            </p>
          </form>
        </div>

        {/* Demo card */}
        <div className="lg:pl-6">
          <div className="rounded-3xl p-8 relative overflow-hidden grain" style={{ background: "#141414" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#8b0000" }}>
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="mt-6 text-[10px] tracking-[0.3em] uppercase" style={{ color: "#8b0000" }}>Akun demo</div>
            <h2 className="font-display text-2xl font-bold tracking-tight mt-2 text-white">Coba semua peran.</h2>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>Klik untuk mengisi otomatis.</p>
            <div className="mt-6 space-y-2">
              {DEMO.map((d) => (
                <button key={d.email}
                  onClick={() => { setEmail(d.email); setPassword(d.pw); }}
                  className="w-full text-left rounded-xl px-4 py-3 transition-colors"
                  style={{ background: "rgba(139,0,0,0.08)", border: "1px solid rgba(139,0,0,0.2)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(139,0,0,0.18)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(139,0,0,0.08)"}
                  data-testid={`demo-${d.role.replace(/[^a-z]/gi,"").toLowerCase()}`}>
                  <div className="text-xs tracking-[0.25em] uppercase" style={{ color: "#8b0000" }}>{d.role}</div>
                  <div className="text-sm font-medium mt-0.5 text-white">{d.email}</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{d.pw}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
