import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SearchBox from "@/components/SearchBox";
import { api, formatIDR } from "@/lib/api";
import { Bus, Clock, Users, ArrowRight, Loader2 } from "lucide-react";

export default function SearchResults() {
  const [params] = useSearchParams();
  const navigate  = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);

  const origin      = params.get("origin");
  const destination = params.get("destination");
  const date        = params.get("date");

  useEffect(() => {
    if (!origin || !destination || !date) return;
    setLoading(true);
    api.get("/search", { params: { origin, destination, date } })
      .then(({ data }) => setResults(data))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [origin, destination, date]);

  const totalSeats = useMemo(() => results.reduce((a, r) => a + (r.seats_available || 0), 0), [results]);

  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      <SiteHeader />

      {/* Search bar strip */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0" }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5">
          <SearchBox variant="compact" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
        {/* Heading */}
        <div className="mb-8">
          <div className="text-[10px] tracking-[0.3em] uppercase font-semibold" style={{ color: "#8b0000" }}>Hasil pencarian</div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-1" style={{ color: "#141414" }}>
            {origin} <ArrowRight className="inline w-6 h-6 mx-1" style={{ color: "#8b0000" }} /> {destination}
          </h1>
          <div className="text-sm mt-1" style={{ color: "#4b4b4b" }}>
            {date} · <b>{totalSeats}</b> kursi tersedia
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2" style={{ color: "#4b4b4b" }}>
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#8b0000" }} /> Memuat jadwal…
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: "#fff", border: "1px solid #e0e0e0" }}
            data-testid="no-results">
            <Bus className="w-10 h-10 mx-auto" style={{ color: "#8b0000" }} />
            <div className="font-display text-2xl font-bold mt-4" style={{ color: "#141414" }}>Tidak ada jadwal ditemukan</div>
            <p className="text-sm mt-2" style={{ color: "#4b4b4b" }}>Coba tanggal lain atau cek rute serupa.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {results.map((r) => (
              <div key={r.id} className="card-lift rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-6"
                style={{ background: "#fff", border: "1px solid #e0e0e0" }}
                data-testid={`result-${r.id}`}>

                {/* Travel info */}
                <div className="flex items-center gap-3 min-w-[220px]">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#141414" }}>
                    <Bus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-display text-lg font-bold leading-tight" style={{ color: "#141414" }}>
                      {r.travel?.name || "-"}
                    </div>
                    <div className="text-[10px] tracking-[0.2em] uppercase mt-0.5" style={{ color: "#4b4b4b" }}>
                      {r.vehicle}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "#4b4b4b" }}>Berangkat</div>
                    <div className="font-display text-2xl font-bold mt-1 flex items-center gap-1.5" style={{ color: "#141414" }}>
                      <Clock className="w-5 h-5" style={{ color: "#8b0000" }} /> {r.depart_time}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "#4b4b4b" }}>Rute</div>
                    <div className="mt-1 text-sm font-medium" style={{ color: "#141414" }}>
                      <b>{r.origin}</b> → <b>{r.destination}</b>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "#4b4b4b" }}>Kursi</div>
                    <div className="mt-1 text-sm flex items-center gap-1.5" style={{ color: "#141414" }}>
                      <Users className="w-4 h-4" style={{ color: "#8b0000" }} />
                      {r.seats_available} / {r.total_seats}
                    </div>
                  </div>
                </div>

                {/* Price + CTA */}
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="text-right">
                    <div className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "#4b4b4b" }}>Harga</div>
                    <div className="font-display text-2xl font-bold" style={{ color: "#8b0000" }}>
                      {formatIDR(r.price)}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/book/${r.id}`)}
                    disabled={r.seats_available === 0}
                    className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-colors"
                    style={{ background: r.seats_available === 0 ? "#4b4b4b" : "#8b0000", cursor: r.seats_available === 0 ? "not-allowed" : "pointer" }}
                    data-testid={`book-btn-${r.id}`}>
                    {r.seats_available === 0 ? "Habis" : "Pilih Kursi"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
