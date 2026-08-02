import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { MapPin, LogOut, Home } from "lucide-react";
import { roleLabel } from "@/lib/api";

export default function DashboardShell({ nav = [], children, title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex" style={{ background: "#f2f2f2" }}>

      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-64 sticky top-0 h-screen"
        style={{ background: "#141414", borderRight: "1px solid #1f1f1f" }}>

        {/* Brand */}
        <div style={{ borderBottom: "1px solid #1f1f1f" }} className="p-5">
          <Link to="/" className="flex items-center gap-2.5" data-testid="dash-brand">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#8b0000" }}>
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-base font-black text-white">Si-Travel</div>
              <div className="text-[9px] tracking-[0.3em] uppercase" style={{ color: "#8b0000" }}>Riau</div>
            </div>
          </Link>
        </div>

        {/* User info */}
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #1f1f1f" }}>
          <div className="text-[10px] tracking-[0.3em] uppercase mb-1" style={{ color: "#8b0000" }}>Peran</div>
          <div className="text-sm font-semibold text-white">{roleLabel(user?.role)}</div>
          <div className="text-xs mt-0.5" style={{ color: "#4b4b4b" }}>{user?.name}</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map((n) => (
            <button key={n.key} onClick={() => n.onClick?.()}
              className="w-full text-left rounded-lg px-3 py-2.5 flex items-center gap-2.5 text-sm font-medium transition-all"
              style={{
                background: n.active ? "rgba(139,0,0,0.15)" : "transparent",
                color:      n.active ? "#ffffff" : "#4b4b4b",
                borderLeft: n.active ? "2px solid #8b0000" : "2px solid transparent",
              }}
              data-testid={`dash-nav-${n.key}`}
            >
              {n.icon && <n.icon className="w-4 h-4 flex-shrink-0"
                style={{ color: n.active ? "#8b0000" : "#4b4b4b" }} />}
              {n.label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 space-y-0.5" style={{ borderTop: "1px solid #1f1f1f" }}>
          <button onClick={() => navigate("/")}
            className="w-full text-left rounded-lg px-3 py-2.5 flex items-center gap-2.5 text-sm transition-colors"
            style={{ color: "#4b4b4b" }}
            data-testid="dash-home-btn">
            <Home className="w-4 h-4" /> Beranda
          </button>
          <button onClick={async () => { navigate("/"); await logout(); }}
            className="w-full text-left rounded-lg px-3 py-2.5 flex items-center gap-2.5 text-sm font-medium transition-colors"
            style={{ color: "#8b0000" }}
            data-testid="dash-logout-btn">
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 min-w-0">
        {/* Page header */}
        <header className="px-6 lg:px-10 py-6"
          style={{ background: "#fff", borderBottom: "1px solid #e0e0e0" }}>
          <div className="text-[10px] tracking-[0.3em] uppercase font-medium" style={{ color: "#8b0000" }}>{subtitle}</div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-1" style={{ color: "#141414" }}>{title}</h1>
        </header>

        <div className="px-6 lg:px-10 py-8">{children}</div>
      </main>
    </div>
  );
}

export function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl p-5 card-lift" style={{ background: "#fff", border: "1px solid #e0e0e0" }}
      data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "#4b4b4b" }}>{label}</div>
      <div className="mt-2 font-display text-3xl font-bold" style={{ color: "#141414" }}>{value}</div>
      {hint && <div className="text-xs mt-1" style={{ color: "#4b4b4b" }}>{hint}</div>}
    </div>
  );
}
