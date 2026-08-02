import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { formatApiErrorDetail } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register({ ...form, role: "pengguna" });
      toast.success("Akun terdaftar!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Gagal daftar");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      <SiteHeader />
      <div className="max-w-md mx-auto px-5 sm:px-8 py-14">
        <div className="text-[10px] tracking-[0.3em] uppercase font-semibold" style={{ color: "#8b0000" }}>Daftar</div>
        <h1 className="font-display mt-2 text-4xl font-bold tracking-tighter" style={{ color: "#141414" }}>
          Buat akun pengguna.
        </h1>
        <p className="mt-3 text-sm" style={{ color: "#4b4b4b" }}>
          Pesan tiket, simpan histori perjalanan, dan nikmati kemudahan travel Riau.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          {[
            { label: "Nama Lengkap",     id: "name",     type: "text",     required: true  },
            { label: "Email",            id: "email",    type: "email",    required: true  },
            { label: "Nomor HP",         id: "phone",    type: "tel",      required: false },
            { label: "Password (min 6)", id: "password", type: "password", required: true, minLength: 6 },
          ].map((f) => (
            <div key={f.id}>
              <Label htmlFor={f.id} className="text-xs tracking-[0.2em] uppercase" style={{ color: "#4b4b4b" }}>
                {f.label}
              </Label>
              <Input id={f.id} type={f.type} required={f.required} minLength={f.minLength}
                value={form[f.id === "password" ? "password" : f.id]}
                onChange={upd(f.id === "password" ? "password" : f.id)}
                className="mt-1 h-12 rounded-xl" style={{ borderColor: "#e0e0e0", background: "#fff" }}
                data-testid={`register-${f.id}`} />
            </div>
          ))}

          <button type="submit" disabled={busy}
            className="w-full h-12 rounded-full text-white font-semibold text-sm transition-colors flex items-center justify-center"
            style={{ background: busy ? "#4b4b4b" : "#8b0000" }}
            data-testid="register-submit-btn">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Daftar Sekarang"}
          </button>

          <p className="text-sm" style={{ color: "#4b4b4b" }}>
            Sudah punya akun?{" "}
            <Link to="/login" className="font-semibold underline" style={{ color: "#8b0000" }} data-testid="to-login">
              Masuk
            </Link>
          </p>
          <p className="text-xs" style={{ color: "#6e6e6e" }}>
            Akun Admin Loket, Manager, dan Admin Aplikasi disediakan oleh administrator sistem.
          </p>
        </form>
      </div>
    </div>
  );
}
