import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, ArrowLeftRight, Search, MapPin } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";

export default function SearchBox({ variant = "hero" }) {
  const [cities, setCities] = useState([]);
  const [origin, setOrigin] = useState("Pekanbaru");
  const [destination, setDestination] = useState("Bagansiapiapi");
  const [date, setDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/cities").then(({ data }) => setCities(data)).catch(() => {});
  }, []);

  const swap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const submit = () => {
    if (!origin || !destination) return toast.error("Pilih kota asal dan tujuan");
    if (origin === destination) return toast.error("Asal dan tujuan tidak boleh sama");
    const d = format(date, "yyyy-MM-dd");
    navigate(`/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&date=${d}`);
  };

  const wrap =
    variant === "hero"
      ? "bg-white/95 backdrop-blur-xl border border-white/40 shadow-[0_18px_60px_-24px_rgba(20,40,31,0.45)] rounded-3xl p-5 md:p-6"
      : "bg-white border border-[#E6E2D8] rounded-2xl p-4";

  return (
    <div className={wrap} data-testid="search-box">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_1fr_auto] gap-3 items-end">
        {/* Origin */}
        <div>
          <label className="text-[10px] tracking-[0.25em] uppercase text-[#7C8489]">Dari</label>
          <div className="relative mt-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1E3A2F]" />
            <Select value={origin} onValueChange={setOrigin}>
              <SelectTrigger
                data-testid="search-origin"
                className="h-12 pl-9 rounded-xl border-[#E6E2D8] bg-white text-[#11181C] focus:ring-[#1E3A2F]"
              >
                <SelectValue placeholder="Pilih kota asal" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c.name} value={c.name} data-testid={`opt-origin-${c.name}`}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Swap */}
        <div className="hidden md:flex justify-center pb-1">
          <button
            onClick={swap}
            className="w-10 h-10 rounded-full border border-[#1E3A2F] text-[#1E3A2F] hover:bg-[#1E3A2F] hover:text-[#F2D06B] transition-colors flex items-center justify-center"
            data-testid="search-swap"
            aria-label="Tukar asal dan tujuan"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* Destination */}
        <div>
          <label className="text-[10px] tracking-[0.25em] uppercase text-[#7C8489]">Tujuan</label>
          <div className="relative mt-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B2520]" />
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger
                data-testid="search-destination"
                className="h-12 pl-9 rounded-xl border-[#E6E2D8] bg-white text-[#11181C]"
              >
                <SelectValue placeholder="Pilih kota tujuan" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c.name} value={c.name} data-testid={`opt-dest-${c.name}`}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="text-[10px] tracking-[0.25em] uppercase text-[#7C8489]">Tanggal</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="mt-1 h-12 w-full justify-start rounded-xl border-[#E6E2D8] bg-white text-[#11181C] hover:bg-[#F5F2EC] hover:text-[#11181C]"
                data-testid="search-date"
              >
                <CalendarDays className="w-4 h-4 mr-2 text-[#1E3A2F]" />
                {format(date, "EEE, d MMM yyyy", { locale: idLocale })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Submit */}
        <Button
          onClick={submit}
          className="h-12 md:h-12 rounded-xl md:rounded-full bg-[#E6B325] text-[#14281F] hover:bg-[#F2D06B] hover:text-[#14281F] font-semibold px-6"
          data-testid="search-submit-btn"
        >
          <Search className="w-4 h-4 mr-2" /> Cari
        </Button>
      </div>
    </div>
  );
}
