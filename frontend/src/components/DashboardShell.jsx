import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Bus, LogOut, Home } from "lucide-react";
import { roleLabel } from "@/lib/api";

export default function DashboardShell({ nav = [], children, title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F2EC] flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#14281F] text-white p-5 sticky top-0 h-screen">
        <Link to="/" className="flex items-center gap-2.5" data-testid="dash-brand">
          <div className="w-9 h-9 rounded-xl bg-[#E6B325] flex items-center justify-center">
            <Bus className="w-5 h-5 text-[#14281F]" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-base font-black">Si-Travel</div>
            <div className="text-[9px] tracking-[0.3em] uppercase text-[#F2D06B]">Riau</div>
          </div>
        </Link>

        <div className="mt-8 text-[10px] tracking-[0.3em] uppercase text-[#F2D06B]">Peran</div>
        <div className="mt-1 text-sm font-medium">{roleLabel(user?.role)}</div>
        <div className="text-xs text-white/60">{user?.name}</div>

        <nav className="mt-8 space-y-1 text-sm">
          {nav.map((n) => (
            <button
              key={n.key}
              onClick={() => n.onClick?.()}
              className={`w-full text-left rounded-lg px-3 py-2 flex items-center gap-2 transition-colors ${
                n.active ? "bg-white/10 text-[#F2D06B]" : "text-white/80 hover:bg-white/5"
              }`}
              data-testid={`dash-nav-${n.key}`}
            >
              {n.icon && <n.icon className="w-4 h-4" />} {n.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 space-y-1 text-sm">
          <button onClick={() => navigate("/")} className="w-full text-left rounded-lg px-3 py-2 flex items-center gap-2 text-white/80 hover:bg-white/5" data-testid="dash-home-btn">
            <Home className="w-4 h-4" /> Beranda
          </button>
          <button onClick={async () => { navigate("/"); await logout(); }} className="w-full text-left rounded-lg px-3 py-2 flex items-center gap-2 text-[#F2D06B] hover:bg-white/5" data-testid="dash-logout-btn">
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="bg-white border-b border-[#E6E2D8] px-6 lg:px-10 py-6">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[#8B2520]">{subtitle}</div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#14281F] tracking-tight mt-1">{title}</h1>
        </header>
        <div className="px-6 lg:px-10 py-8">{children}</div>
      </main>
    </div>
  );
}

export function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl bg-white border border-[#E6E2D8] p-5 card-lift" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="text-[10px] tracking-[0.3em] uppercase text-[#7C8489]">{label}</div>
      <div className="mt-2 font-display text-3xl font-bold text-[#14281F]">{value}</div>
      {hint && <div className="text-xs text-[#4A5257] mt-1">{hint}</div>}
    </div>
  );
}
