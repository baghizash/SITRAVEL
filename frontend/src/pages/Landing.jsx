import SiteHeader from "@/components/SiteHeader";
import SearchBox from "@/components/SearchBox";
import { Link } from "react-router-dom";
import { ArrowUpRight, ShieldCheck, Ticket, Clock3, MapPin, ChevronRight } from "lucide-react";

const POPULAR = [
  { from: "Pekanbaru", to: "Bagansiapiapi", price: 150000, duration: "±5 jam", img: "https://images.unsplash.com/photo-1553193094-d7add06beb10?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { from: "Pekanbaru", to: "Dumai",         price: 90000,  duration: "±3 jam", img: "https://images.unsplash.com/photo-1608724590235-f91a3dbafffc?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { from: "Pekanbaru", to: "Rengat",        price: 110000, duration: "±4 jam", img: "https://images.unsplash.com/photo-1512100356356-de1b84283e18?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { from: "Dumai",     to: "Bagansiapiapi", price: 80000,  duration: "±3 jam", img: "https://images.unsplash.com/photo-1762813634449-a82f8f72750a?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
];

const MARQUEE = [
  "Pekanbaru → Bagansiapiapi","Dumai → Selatpanjang","Duri → Pekanbaru",
  "Rengat → Tembilahan","Bengkalis → Pekanbaru","Pekanbaru → Siak",
  "Ujung Batu → Bangkinang","Pekanbaru → Tembilahan",
];

const STATS = [
  { value: "12+",     label: "Kota tujuan" },
  { value: "4",       label: "Mitra travel" },
  { value: "350+",    label: "Jadwal/minggu" },
  { value: "16.000+", label: "Penumpang" },
];

const FEATURES = [
  { icon: ShieldCheck, title: "Terpercaya",      desc: "Semua mitra travel terverifikasi dan beroperasi resmi di Provinsi Riau." },
  { icon: Ticket,      title: "E-Tiket PDF",     desc: "Tiket digital langsung bisa didownload dengan QR code untuk verifikasi loket." },
  { icon: Clock3,      title: "Kursi Real-time", desc: "Kursi terkunci otomatis saat Anda memilih. Tidak ada dobel booking." },
  { icon: MapPin,      title: "Banyak Rute",     desc: "Dari Pekanbaru ke seluruh Riau — Dumai, Bengkalis, Tembilahan, dan lainnya." },
];

export default function Landing() {
  return (
    <div className="min-h-screen" style={{ background: "#fafafa", color: "#141414" }}>
      <SiteHeader transparent />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden grain" style={{ background: "#141414" }}>
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #8b0000 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #8b0000 0%, transparent 70%)" }} />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-28 md:pt-24 md:pb-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs tracking-[0.2em] uppercase font-medium border"
              style={{ background: "rgba(139,0,0,0.15)", borderColor: "rgba(139,0,0,0.3)", color: "#ff6b6b" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#8b0000" }} />
              Travel Antar Kota — Provinsi Riau
            </div>

            <h1 className="font-display mt-6 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] text-white">
              Perjalanan Riau<br />
              jadi lebih<br />
              <span style={{ color: "#8b0000" }}>mudah & cepat.</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg max-w-xl leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
              Pesan tiket travel dari <b className="text-white">Pekanbaru</b>, <b className="text-white">Dumai</b>,{" "}
              <b className="text-white">Duri</b>, hingga <b className="text-white">Bagansiapiapi</b> dalam hitungan detik.
            </p>
          </div>

          {/* Search card */}
          <div className="mt-10 md:mt-12 max-w-4xl">
            <div className="rounded-2xl p-5 sm:p-7" style={{ background: "#1f1f1f", border: "1px solid #2e2e2e" }}>
              <SearchBox variant="hero" />
            </div>
          </div>

          {/* Trust strip */}
          <div className="mt-10 flex flex-wrap gap-6">
            {[
              { icon: ShieldCheck, label: "Operator Terverifikasi" },
              { icon: Ticket,      label: "E-Tiket Instan" },
              { icon: Clock3,      label: "Kursi Real-time" },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                <t.icon className="w-4 h-4" style={{ color: "#8b0000" }} />
                {t.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ background: "#8b0000" }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            {STATS.map((s, i) => (
              <div key={i} className="py-6 px-4 text-center" style={{ borderRight: i < 3 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
                <div className="font-display text-3xl font-black text-white">{s.value}</div>
                <div className="text-xs mt-1 tracking-wide uppercase" style={{ color: "rgba(255,255,255,0.6)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="overflow-hidden" style={{ borderBottom: "1px solid #e0e0e0", background: "#f2f2f2" }}>
        <div className="flex gap-10 marquee whitespace-nowrap py-3.5 text-sm tracking-[0.2em] uppercase" style={{ color: "#4b4b4b" }}>
          {[...MARQUEE,...MARQUEE,...MARQUEE].map((r, i) => (
            <span key={i} className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#8b0000" }} /> {r}
            </span>
          ))}
        </div>
      </div>

      {/* ── POPULAR ROUTES ── */}
      <section id="rute" className="max-w-7xl mx-auto px-5 sm:px-8 py-20 md:py-28">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <div className="text-xs tracking-[0.3em] uppercase font-semibold" style={{ color: "#8b0000" }}>Rute pilihan</div>
            <h2 className="font-display mt-2 text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "#141414" }}>
              Populer minggu ini di Riau.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed" style={{ color: "#4b4b4b" }}>
            Rute paling banyak dipesan. Kursi update real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {POPULAR.map((r, i) => (
            <Link key={i}
              to={`/search?origin=${encodeURIComponent(r.from)}&destination=${encodeURIComponent(r.to)}&date=${new Date().toISOString().slice(0,10)}`}
              className="card-lift group rounded-2xl overflow-hidden"
              style={{ background: "#fff", border: "1px solid #e0e0e0" }}
              data-testid={`popular-${i}`}
            >
              <div className="aspect-[4/3] overflow-hidden relative">
                <img src={r.img} alt={r.to} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,20,20,0.6), transparent)" }} />
                <div className="absolute bottom-3 left-3">
                  <span className="text-white text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(139,0,0,0.85)" }}>
                    {r.duration}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "#4b4b4b" }}>{r.from}</div>
                    <div className="font-display text-xl font-bold mt-0.5" style={{ color: "#141414" }}>{r.to}</div>
                    <div className="mt-2 text-sm font-semibold" style={{ color: "#8b0000" }}>
                      Rp {r.price.toLocaleString("id-ID")}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{ background: "#f2f2f2" }}>
                    <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" style={{ color: "#8b0000" }} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ background: "#f2f2f2", borderTop: "1px solid #e0e0e0", borderBottom: "1px solid #e0e0e0" }}
        className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-xs tracking-[0.3em] uppercase font-semibold" style={{ color: "#8b0000" }}>Mengapa Si-Travel</div>
            <h2 className="font-display mt-3 text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "#141414" }}>
              Platform travel terlengkap di Riau.
            </h2>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "#4b4b4b" }}>
              Dirancang untuk penumpang, loket, hingga manajemen — semua dalam satu sistem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="card-lift rounded-2xl p-6"
                style={{ background: "#fff", border: "1px solid #e0e0e0" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(139,0,0,0.08)" }}>
                  <f.icon className="w-6 h-6" style={{ color: "#8b0000" }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: "#141414" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#4b4b4b" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section id="tentang" className="grain py-20 md:py-28" style={{ background: "#141414" }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-xs tracking-[0.3em] uppercase font-semibold" style={{ color: "#8b0000" }}>
              Satu platform · empat peran
            </div>
            <h2 className="font-display mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Dibangun untuk semua sisi ekosistem travel.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { t: "Pengguna",       d: "Cari, pilih kursi, bayar, terima e-tiket dalam satu alur yang mudah.", n: "01" },
              { t: "Admin Loket",    d: "Input pemesanan walk-in, kelola jadwal harian, cetak tiket penumpang.", n: "02" },
              { t: "Manager/Kepala", d: "Awasi banyak loket, lihat laporan pendapatan gabungan real-time.", n: "03" },
              { t: "Admin Aplikasi", d: "Kelola mitra travel, rute, pengguna, dan seluruh sistem dari satu panel.", n: "04" },
            ].map((r, i) => (
              <div key={i} className="rounded-2xl p-6 transition-colors"
                style={{ border: "1px solid rgba(139,0,0,0.25)", background: "rgba(139,0,0,0.06)" }}
                data-testid={`role-card-${i}`}
              >
                <div className="font-display text-4xl font-black" style={{ color: "#8b0000" }}>{r.n}</div>
                <div className="mt-4 text-lg font-semibold text-white">{r.t}</div>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{r.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: "#8b0000" }} className="py-16">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Siap pesan tiket perjalanan Anda?
          </h2>
          <p className="mt-4 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
            Bergabung dengan ribuan pengguna yang sudah mempercayai Si-Travel Riau.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/search"
              className="inline-flex items-center gap-2 font-semibold px-8 py-3.5 rounded-full transition-colors"
              style={{ background: "#fff", color: "#8b0000" }}>
              Cari Tiket Sekarang <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="/register"
              className="inline-flex items-center gap-2 font-semibold px-8 py-3.5 rounded-full transition-colors"
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff" }}>
              Daftar Gratis
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0a0a0a", borderTop: "1px solid #1f1f1f" }} className="py-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#8b0000" }}>
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-display text-base font-black text-white">Si-Travel Riau</div>
              <div className="text-[10px] tracking-wider uppercase" style={{ color: "#4b4b4b" }}>Sistem Informasi Travel</div>
            </div>
          </div>
          <div className="text-sm" style={{ color: "#4b4b4b" }}>
            © {new Date().getFullYear()} Si-Travel Riau. Semua rute untuk Bumi Lancang Kuning.
          </div>
          <div className="text-[10px] tracking-[0.25em] uppercase" style={{ color: "#4b4b4b" }}>
            Pekanbaru · Dumai · Duri · Bagansiapiapi · Rengat
          </div>
        </div>
      </footer>
    </div>
  );
}
