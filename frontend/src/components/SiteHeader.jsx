import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Bus, LogOut, LayoutDashboard } from "lucide-react";
import { roleLabel } from "@/lib/api";

export default function SiteHeader({ transparent = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header
      className={`sticky top-0 z-40 ${
        transparent
          ? "bg-white/70 backdrop-blur-xl border-b border-white/30"
          : "bg-white/90 backdrop-blur-xl border-b border-[#E6E2D8]"
      }`}
      data-testid="site-header"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5" data-testid="brand-link">
          <div className="w-9 h-9 rounded-xl bg-[#1E3A2F] flex items-center justify-center">
            <Bus className="w-5 h-5 text-[#E6B325]" strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-black text-[#1E3A2F]">Si-Travel</div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-[#7C8489] -mt-0.5">Riau</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-[#4A5257]">
          <Link to="/" className="hover:text-[#1E3A2F] transition-colors" data-testid="nav-home">Beranda</Link>
          <a href="#rute" className="hover:text-[#1E3A2F] transition-colors" data-testid="nav-rute">Rute Populer</a>
          <a href="#tentang" className="hover:text-[#1E3A2F] transition-colors" data-testid="nav-tentang">Tentang</a>
        </nav>

        <div className="flex items-center gap-2">
          {user && user !== false ? (
            <>
              <div className="hidden sm:block text-right mr-2">
                <div className="text-sm font-medium text-[#11181C]">{user.name}</div>
                <div className="text-[10px] tracking-[0.2em] uppercase text-[#7C8489]">{roleLabel(user.role)}</div>
              </div>
              <Button
                variant="outline"
                className="rounded-full border-[#1E3A2F] text-[#1E3A2F] hover:bg-[#1E3A2F] hover:text-white"
                onClick={() => navigate("/dashboard")}
                data-testid="header-dashboard-btn"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
              </Button>
              <Button
                variant="ghost"
                className="rounded-full text-[#8B2520] hover:bg-[#8B2520]/10 hover:text-[#8B2520]"
                onClick={async () => { navigate("/"); await logout(); }}
                data-testid="header-logout-btn"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                className="rounded-full text-[#1E3A2F] hover:bg-[#1E3A2F]/10 hover:text-[#1E3A2F]"
                onClick={() => navigate("/login")}
                data-testid="header-login-btn"
              >
                Masuk
              </Button>
              <Button
                className="rounded-full bg-[#1E3A2F] text-[#F2D06B] hover:bg-[#14281F] hover:text-[#F2D06B]"
                onClick={() => navigate("/register")}
                data-testid="header-register-btn"
              >
                Daftar
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
