import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
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
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2EC]">
      <SiteHeader />
      <div className="max-w-md mx-auto px-5 sm:px-8 py-14">
        <div className="text-[10px] tracking-[0.3em] uppercase text-[#8B2520]">Daftar</div>
        <h1 className="font-display mt-2 text-4xl font-bold text-[#14281F] tracking-tighter">Buat akun pengguna.</h1>
        <p className="mt-3 text-sm text-[#4A5257]">
          Pesan tiket, simpan histori perjalanan, dan dapatkan promo rute Riau.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <Field label="Nama Lengkap" id="name" value={form.name} onChange={upd("name")} required />
          <Field label="Email" id="email" type="email" value={form.email} onChange={upd("email")} required />
          <Field label="Nomor HP" id="phone" value={form.phone} onChange={upd("phone")} />
          <Field label="Password (min 6)" id="pw" type="password" value={form.password} onChange={upd("password")} required minLength={6} />
          <Button type="submit" disabled={busy}
                  className="w-full h-12 rounded-full bg-[#1E3A2F] text-[#F2D06B] hover:bg-[#14281F] hover:text-[#F2D06B]"
                  data-testid="register-submit-btn">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Daftar"}
          </Button>
          <p className="text-sm text-[#4A5257]">
            Sudah punya akun? <Link to="/login" className="text-[#1E3A2F] font-semibold underline" data-testid="to-login">Masuk</Link>
          </p>
          <p className="text-xs text-[#7C8489]">
            Akun untuk peran Admin Loket, Manager, dan Admin Aplikasi disediakan oleh administrator sistem.
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({ label, id, ...props }) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs tracking-[0.2em] uppercase text-[#7C8489]">{label}</Label>
      <Input id={id} className="mt-1 h-12 rounded-lg border-[#E6E2D8] bg-white" data-testid={`register-${id}`} {...props} />
    </div>
  );
}
