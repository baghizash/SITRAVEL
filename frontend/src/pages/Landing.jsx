import SiteHeader from "@/components/SiteHeader";
import SearchBox from "@/components/SearchBox";
import { Link } from "react-router-dom";
import { ArrowUpRight, ShieldCheck, Ticket, Clock3, Users } from "lucide-react";

const POPULAR = [
  { from: "Pekanbaru", to: "Bagansiapiapi", price: 150000, img: "https://images.unsplash.com/photo-1553193094-d7add06beb10?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { from: "Pekanbaru", to: "Dumai", price: 90000, img: "https://images.unsplash.com/photo-1608724590235-f91a3dbafffc?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { from: "Pekanbaru", to: "Rengat", price: 110000, img: "https://images.unsplash.com/photo-1512100356356-de1b84283e18?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { from: "Dumai", to: "Bagansiapiapi", price: 80000, img: "https://images.unsplash.com/photo-1762813634449-a82f8f72750a?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
];

const ROUTES_MARQUEE = [
  "Pekanbaru → Bagansiapiapi", "Dumai → Selatpanjang", "Duri → Pekanbaru",
  "Rengat → Tembilahan", "Bengkalis → Pekanbaru", "Pekanbaru → Siak",
  "Ujung Batu → Bangkinang", "Pekanbaru → Tembilahan",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F5F2EC]">
      <SiteHeader transparent />

      {/* Hero */}
      <section className="relative overflow-hidden grain">
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1553193094-d7add06beb10?crop=entropy&cs=srgb&fm=jpg&q=85&w=2000)",
            backgroundSize: "cover", backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#14281F]/85 via-[#1E3A2F]/75 to-[#1E3A2F]/55" />

        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-14 pb-24 md:pt-24 md:pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur px-3 py-1.5 text-xs tracking-[0.25em] uppercase text-[#F2D06B]" data-testid="hero-badge">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E6B325]" /> Travel Antar Kota — Provinsi Riau
            </div>
            <h1 className="font-display mt-6 text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-[1.02]">
              Pulang kampung.<br />
              Rapat luar kota.<br />
              <span className="text-[#F2D06B] italic font-light">Semua satu klik.</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-white/80 max-w-xl leading-relaxed">
              Cari jadwal travel dari <b>Pekanbaru</b>, <b>Dumai</b>, <b>Duri</b>,
              hingga <b>Bagansiapiapi</b> dan pesan kursi favorit Anda dalam hitungan detik.
            </p>
          </div>

          <div className="mt-10 md:mt-14 max-w-5xl">
            <SearchBox variant="hero" />
          </div>

          {/* Trust strip */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl">
            {[
              { icon: ShieldCheck, label: "Terverifikasi", desc: "Operator resmi" },
              { icon: Ticket, label: "E-Tiket", desc: "Langsung ke email" },
              { icon: Clock3, label: "Real-time", desc: "Kursi update live" },
              { icon: Users, label: "16.000+", desc: "Pelanggan aktif" },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur px-4 py-3 text-white">
                <t.icon className="w-5 h-5 text-[#F2D06B]" />
                <div>
                  <div className="text-sm font-semibold">{t.label}</div>
                  <div className="text-[11px] text-white/70">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="border-y border-[#E6E2D8] bg-white overflow-hidden">
        <div className="flex gap-10 marquee whitespace-nowrap py-4 text-sm tracking-[0.25em] uppercase text-[#4A5257]">
          {[...ROUTES_MARQUEE, ...ROUTES_MARQUEE, ...ROUTES_MARQUEE].map((r, i) => (
            <span key={i} className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E6B325]" /> {r}
            </span>
          ))}
        </div>
      </div>

      {/* Popular routes */}
      <section id="rute" className="max-w-7xl mx-auto px-5 sm:px-8 py-20 md:py-28">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-[#8B2520]">Rute pilihan</div>
            <h2 className="font-display mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold text-[#14281F] tracking-tight">
              Populer minggu ini di Riau.
            </h2>
          </div>
          <p className="text-[#4A5257] max-w-md">
            Rute yang paling banyak dipesan pengguna kami. Semua kursi dijamin real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {POPULAR.map((r, i) => (
            <Link
              key={i}
              to={`/search?origin=${encodeURIComponent(r.from)}&destination=${encodeURIComponent(r.to)}&date=${new Date().toISOString().slice(0,10)}`}
              className="card-lift group rounded-2xl overflow-hidden bg-white border border-[#E6E2D8] shadow-[0_2px_8px_rgba(30,58,47,0.04)]"
              data-testid={`popular-${i}`}
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img src={r.img} alt={r.to} className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500" />
              </div>
              <div className="p-4 flex items-start justify-between">
                <div>
                  <div className="text-[10px] tracking-[0.25em] uppercase text-[#7C8489]">{r.from}</div>
                  <div className="font-display text-xl font-bold text-[#14281F] mt-0.5">{r.to}</div>
                  <div className="text-sm text-[#4A5257] mt-1">Mulai <b className="text-[#8B2520]">Rp {r.price.toLocaleString("id-ID")}</b></div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-[#1E3A2F] group-hover:rotate-45 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Roles / Peran */}
      <section id="tentang" className="bg-[#14281F] text-white py-20 md:py-28 grain">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[#F2D06B]">Satu platform · empat peran</div>
          <h2 className="font-display mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Dibangun untuk semua sisi ekosistem travel.
          </h2>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { t: "Pengguna", d: "Cari, pilih kursi, bayar, terima e-tiket dalam satu alur.", n: "01" },
              { t: "Admin Loket", d: "Input pemesanan walk-in, kelola jadwal harian, cetak tiket.", n: "02" },
              { t: "Manager/Kepala", d: "Awasi banyak loket, lihat laporan pendapatan gabungan.", n: "03" },
              { t: "Admin Aplikasi", d: "Kelola mitra travel, rute, pengguna, dan seluruh sistem.", n: "04" },
            ].map((r, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 hover:bg-white/10 transition-colors" data-testid={`role-card-${i}`}>
                <div className="text-[#F2D06B] font-display text-4xl font-black">{r.n}</div>
                <div className="mt-4 text-lg font-semibold">{r.t}</div>
                <p className="mt-2 text-sm text-white/70 leading-relaxed">{r.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#F5F2EC] border-t border-[#E6E2D8] py-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="text-sm text-[#4A5257]">
            © {new Date().getFullYear()} <b className="text-[#14281F]">Si-Travel Riau</b>. Semua rute untuk Bumi Lancang Kuning.
          </div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-[#7C8489]">Pekanbaru · Dumai · Duri · Bagansiapiapi · Rengat</div>
        </div>
      </footer>
    </div>
  );
}
