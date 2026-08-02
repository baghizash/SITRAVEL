import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SearchBox from "@/components/SearchBox";
import { api, formatIDR } from "@/lib/api";
import { Bus, Clock, Users, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SearchResults() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);

  const origin = params.get("origin");
  const destination = params.get("destination");
  const date = params.get("date");

  useEffect(() => {
    if (!origin || !destination || !date) return;
    setLoading(true);
    api
      .get("/search", { params: { origin, destination, date } })
      .then(({ data }) => setResults(data))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [origin, destination, date]);

  const totalSeats = useMemo(() => results.reduce((a, r) => a + (r.seats_available || 0), 0), [results]);

  return (
    <div className="min-h-screen bg-[#F5F2EC]">
      <SiteHeader />

      <div className="border-b border-[#E6E2D8] bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-6">
          <SearchBox variant="compact" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-[#8B2520]">Hasil pencarian</div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#14281F] tracking-tight mt-1">
              {origin} <ArrowRight className="inline w-6 h-6 mx-1 text-[#E6B325]" /> {destination}
            </h1>
            <div className="text-sm text-[#4A5257] mt-1">{date} · {totalSeats} kursi tersedia</div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-[#4A5257]">
            <Loader2 className="w-4 h-4 animate-spin" /> Memuat jadwal…
          </div>
        ) : results.length === 0 ? (
          <div className="bg-white border border-[#E6E2D8] rounded-2xl p-10 text-center" data-testid="no-results">
            <Bus className="w-10 h-10 mx-auto text-[#8B2520]" />
            <div className="mt-4 font-display text-2xl font-bold text-[#14281F]">Tidak ada jadwal ditemukan</div>
            <p className="text-sm text-[#4A5257] mt-2">Coba tanggal lain atau cek rute serupa.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {results.map((r) => (
              <div
                key={r.id}
                className="bg-white border border-[#E6E2D8] rounded-2xl p-5 sm:p-6 card-lift flex flex-col md:flex-row md:items-center gap-4 md:gap-6"
                data-testid={`result-${r.id}`}
              >
                <div className="flex items-center gap-3 min-w-[220px]">
                  <div className="w-12 h-12 rounded-xl bg-[#1E3A2F] flex items-center justify-center">
                    <Bus className="w-6 h-6 text-[#F2D06B]" />
                  </div>
                  <div>
                    <div className="font-display text-lg font-bold text-[#14281F] leading-tight">{r.travel?.name || "-"}</div>
                    <div className="text-[10px] tracking-[0.25em] uppercase text-[#7C8489]">{r.vehicle}</div>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-[10px] tracking-[0.25em] uppercase text-[#7C8489]">Berangkat</div>
                    <div className="mt-1 font-display text-2xl font-bold text-[#14281F] flex items-center gap-1.5">
                      <Clock className="w-5 h-5 text-[#1E3A2F]" /> {r.depart_time}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] tracking-[0.25em] uppercase text-[#7C8489]">Rute</div>
                    <div className="mt-1 text-sm text-[#11181C]">
                      <b>{r.origin}</b> → <b>{r.destination}</b>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] tracking-[0.25em] uppercase text-[#7C8489]">Kursi</div>
                    <div className="mt-1 text-sm text-[#11181C] flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#1E3A2F]" /> {r.seats_available} / {r.total_seats}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 md:gap-6">
                  <div className="text-right">
                    <div className="text-[10px] tracking-[0.25em] uppercase text-[#7C8489]">Harga</div>
                    <div className="font-display text-2xl font-bold text-[#8B2520]">{formatIDR(r.price)}</div>
                  </div>
                  <Button
                    onClick={() => navigate(`/book/${r.id}`)}
                    disabled={r.seats_available === 0}
                    className="rounded-full bg-[#1E3A2F] text-[#F2D06B] hover:bg-[#14281F] hover:text-[#F2D06B] px-5"
                    data-testid={`book-btn-${r.id}`}
                  >
                    {r.seats_available === 0 ? "Habis" : "Pilih Kursi"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
