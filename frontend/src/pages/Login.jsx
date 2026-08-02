import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { formatApiErrorDetail } from "@/lib/api";
import { Loader2, Bus } from "lucide-react";
import { toast } from "sonner";

const DEMO = [
  { role: "Admin Aplikasi", email: "baghiz678@gmail.com", pw: "Admin@2026" },
  { role: "Admin Loket (Travel)", email: "loket@sitravel.id", pw: "Loket@2026" },
  { role: "Manager/Kepala", email: "manager@sitravel.id", pw: "Manager@2026" },
  { role: "Pengguna", email: "user@sitravel.id", pw: "User@2026" },
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
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2EC]">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-[#8B2520]">Masuk</div>
          <h1 className="font-display mt-2 text-4xl sm:text-5xl font-bold text-[#14281F] tracking-tighter">
            Selamat datang <br /> kembali.
          </h1>
          <p className="mt-4 text-[#4A5257] max-w-md">
            Kelola perjalanan, jadwal, atau seluruh sistem Si-Travel Riau — semua dari satu tempat.
          </p>

          <form onSubmit={submit} className="mt-8 max-w-md space-y-4">
            <div>
              <Label htmlFor="email" className="text-xs tracking-[0.2em] uppercase text-[#7C8489]">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                     className="mt-1 h-12 rounded-lg border-[#E6E2D8] bg-white" data-testid="login-email" />
            </div>
            <div>
              <Label htmlFor="pw" className="text-xs tracking-[0.2em] uppercase text-[#7C8489]">Password</Label>
              <Input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                     className="mt-1 h-12 rounded-lg border-[#E6E2D8] bg-white" data-testid="login-password" />
            </div>
            <Button type="submit" disabled={busy}
                    className="w-full h-12 rounded-full bg-[#1E3A2F] text-[#F2D06B] hover:bg-[#14281F] hover:text-[#F2D06B]"
                    data-testid="login-submit-btn">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Masuk"}
            </Button>
            <p className="text-sm text-[#4A5257]">
              Belum punya akun? <Link to="/register" className="text-[#1E3A2F] font-semibold underline" data-testid="to-register">Daftar</Link>
            </p>
          </form>
        </div>

        <div className="lg:pl-6">
          <div className="rounded-3xl bg-[#14281F] text-white p-8 relative overflow-hidden grain">
            <Bus className="w-8 h-8 text-[#F2D06B]" />
            <div className="mt-6 text-[10px] tracking-[0.3em] uppercase text-[#F2D06B]">Akun demo</div>
            <h2 className="font-display text-2xl font-bold tracking-tight mt-2">Coba semua peran.</h2>
            <p className="text-sm text-white/70 mt-1">Klik untuk mengisi otomatis.</p>
            <div className="mt-6 space-y-2">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  onClick={() => { setEmail(d.email); setPassword(d.pw); }}
                  className="w-full text-left rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors px-4 py-3"
                  data-testid={`demo-${d.role.replace(/[^a-z]/gi, "").toLowerCase()}`}
                >
                  <div className="text-xs tracking-[0.25em] uppercase text-[#F2D06B]">{d.role}</div>
                  <div className="text-sm font-medium mt-0.5">{d.email}</div>
                  <div className="text-xs text-white/60">{d.pw}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
