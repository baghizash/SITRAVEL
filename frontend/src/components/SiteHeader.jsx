import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { MapPin, LogOut, LayoutDashboard } from "lucide-react";
import { roleLabel } from "@/lib/api";

export default function SiteHeader({ transparent = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const bg      = transparent ? "rgba(20,20,20,0.85)"  : "#ffffff";
  const border  = transparent ? "rgba(139,0,0,0.2)"    : "#e0e0e0";
  const txtMain = transparent ? "#ffffff"              : "#141414";
  const txtSub  = transparent ? "rgba(255,255,255,0.55)" : "#4b4b4b";

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl" style={{ background: bg, borderBottom: `1px solid ${border}` }} data-testid="site-header">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5" data-testid="brand-link">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#8b0000" }}>
            <MapPin className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-black" style={{ color: txtMain }}>Si-Travel</div>
            <div className="text-[10px] tracking-[0.25em] uppercase -mt-0.5" style={{ color: txtSub }}>Riau</div>
          </div>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          {[
            { label: "Beranda",       href: "/",        testid: "nav-home"    },
            { label: "Rute Populer",  href: "#rute",    testid: "nav-rute",   isAnchor: true },
            { label: "Tentang",       href: "#tentang", testid: "nav-tentang",isAnchor: true },
          ].map((n) => n.isAnchor
            ? <a key={n.href} href={n.href} style={{ color: txtSub }} className="hover:opacity-100 transition-opacity" data-testid={n.testid}>{n.label}</a>
            : <Link key={n.href} to={n.href} style={{ color: txtSub }} className="hover:opacity-100 transition-opacity" data-testid={n.testid}>{n.label}</Link>
          )}
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-2">
          {user && user !== false ? (
            <>
              <div className="hidden sm:block text-right mr-2">
                <div className="text-sm font-medium" style={{ color: txtMain }}>{user.name}</div>
                <div className="text-[10px] tracking-[0.2em] uppercase" style={{ color: txtSub }}>{roleLabel(user.role)}</div>
              </div>
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={{ border: "1px solid #8b0000", color: "#8b0000", background: "transparent" }}
                onMouseEnter={e => { e.currentTarget.style.background="#8b0000"; e.currentTarget.style.color="#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#8b0000"; }}
                data-testid="header-dashboard-btn"
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </button>
              <button
                onClick={async () => { navigate("/"); await logout(); }}
                className="p-2 rounded-full transition-colors"
                style={{ color: "#4b4b4b" }}
                onMouseEnter={e => { e.currentTarget.style.color="#8b0000"; }}
                onMouseLeave={e => { e.currentTarget.style.color="#4b4b4b"; }}
                data-testid="header-logout-btn"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={{ color: txtSub, background: "transparent" }}
                data-testid="header-login-btn"
              >
                Masuk
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-4 py-1.5 rounded-full text-sm font-semibold text-white transition-colors"
                style={{ background: "#8b0000" }}
                onMouseEnter={e => e.currentTarget.style.background="#6b0000"}
                onMouseLeave={e => e.currentTarget.style.background="#8b0000"}
                data-testid="header-register-btn"
              >
                Daftar
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
