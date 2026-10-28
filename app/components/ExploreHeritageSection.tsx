import { useMemo, useState } from "react";
import {
  IconArrowUpRight,
  IconHeart,
  IconMapPin,
  IconSearch,
} from "@tabler/icons-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { monuments, type Monument } from "@/lib/monuments";

const filterOptions = {
  era: [...new Set(monuments.map((monument) => monument.era))],
  state: [...new Set(monuments.map((monument) => monument.state))],
  dynasty: [...new Set(monuments.flatMap((monument) => monument.dynasty ?? []))],
  category: [...new Set(monuments.map((monument) => monument.category))],
};

type FilterKey = keyof typeof filterOptions;

const filterLabels: Record<FilterKey, string> = {
  era: "eras",
  state: "states",
  dynasty: "dynasties",
  category: "categories",
};

function MonumentImage({ monument }: { monument: Monument }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <div className="relative aspect-[1.65] overflow-hidden bg-[#2c261e]">
      {status === "loading" && (
        <div role="status" aria-label="Loading monument image" className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#302a20] to-[#211e19]" />
      )}
      {status === "error" ? (
        <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-[#2a2318] to-[#1a1713] p-4 text-center">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-[#d7b879]/75" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
            <path d="M12 3v18M5 8h14M7 8l5-5 5 5M6 21h12M8 8v9m4-9v9m4-9v9M4 17h16" />
          </svg>
          <span className="mt-2 font-serif text-sm text-[#f3e8d0]">{monument.name}</span>
          <span className="mt-0.5 text-[10px] uppercase tracking-[.18em] text-[#cbb887]/80">{monument.category}</span>
        </div>
      ) : (
        <img
          src={monument.image}
          alt={`${monument.name} in ${monument.state}`}
          loading="lazy"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          className={`h-full w-full object-cover transition duration-700 group-hover:scale-[1.04] ${status === "loaded" ? "opacity-100" : "opacity-0"}`}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#171512]/55 via-transparent to-transparent" />
      <span className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-[#171512]/70 px-3 py-1 text-[11px] uppercase tracking-[.18em] text-[#f3e8d0] backdrop-blur-sm">{monument.era}</span>
    </div>
  );
}

function ModalImage({ monument }: { monument: Monument }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#2a2318] to-[#1a1713] p-6 text-center">
        <svg viewBox="0 0 24 24" className="h-10 w-10 text-[#d7b879]/75" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
          <path d="M12 3v18M5 8h14M7 8l5-5 5 5M6 21h12M8 8v9m4-9v9m4-9v9M4 17h16" />
        </svg>
        <span className="mt-2 font-serif text-lg text-[#f3e8d0]">{monument.name}</span>
        <span className="mt-1 text-xs uppercase tracking-[.18em] text-[#cbb887]/80">{monument.location}</span>
      </div>
    );
  }
  return <img src={monument.image} alt={`${monument.name} monument`} onError={() => setFailed(true)} className="h-full w-full object-cover" />;
}

export function ExploreHeritageSection({
  favoriteMonumentIds,
  onToggleFavorite,
  onViewMonument,
}: {
  favoriteMonumentIds: string[];
  onToggleFavorite: (monumentId: string) => void;
  onViewMonument: (monumentId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<FilterKey, string>>({
    era: "all",
    state: "all",
    dynasty: "all",
    category: "all",
  });
  const favorites = new Set(favoriteMonumentIds);
  const [selected, setSelected] = useState<Monument | null>(null);

  const filteredMonuments = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const tokens = query ? query.split(/[,\s]+/).filter((t) => t.length > 0) : [];

    return monuments.filter((monument) => {
      const fullText = [
        monument.name,
        monument.location,
        monument.state,
        monument.category,
        monument.dynasty ?? "",
        monument.era,
        monument.description,
        monument.background,
        monument.significance,
        ...(monument.aliases ?? []),
      ]
        .join(" ")
        .toLocaleLowerCase();

      const matchesQuery = tokens.length === 0 || tokens.every((token) => fullText.includes(token));
      return (
        matchesQuery &&
        (Object.keys(filters) as FilterKey[]).every(
          (key) => filters[key] === "all" || monument[key] === filters[key]
        )
      );
    });
  }, [filters, search]);

  const resetFilters = () => {
    setSearch("");
    setFilters({ era: "all", state: "all", dynasty: "all", category: "all" });
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.28em] text-[#d7b879]">The living archive</p>
          <h2 className="mt-2 font-serif text-3xl text-[#f4ecdd] md:text-4xl">Explore Heritage</h2>
        </div>
        <span className="rounded-full border border-[#d7b879]/25 px-3 py-1.5 text-[11px] uppercase tracking-[.17em] text-[#e2cfaa]/85">Demo collection · {monuments.length} places</span>
      </div>

      <div className="mt-7 grid gap-3 lg:grid-cols-[minmax(220px,1.5fr)_repeat(4,minmax(130px,1fr))]">
        <label className="relative block">
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#d7b879]/85" aria-hidden="true" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search places or locations"
            aria-label="Search by place name or location"
            className="h-11 rounded-lg border-[#d7b879]/20 bg-[#211e19] pl-10 text-sm text-[#f6f0e4] placeholder:text-[#eee6d7]/70 focus-visible:ring-[#d7b879]"
          />
        </label>
        {(Object.keys(filterOptions) as FilterKey[]).map((key) => (
          <Select key={key} value={filters[key]} onValueChange={(value) => setFilters((current) => ({ ...current, [key]: value }))}>
            <SelectTrigger aria-label={`Filter by ${key}`} className="h-11 rounded-lg border-[#d7b879]/20 bg-[#211e19] text-xs text-[#eee6d7] focus:ring-[#d7b879]">
              <SelectValue placeholder={`All ${filterLabels[key]}`} />
            </SelectTrigger>
            <SelectContent className="border-[#d7b879]/20 bg-[#211e19] text-[#f6f0e4]">
              <SelectItem value="all">All {filterLabels[key]}</SelectItem>
              {filterOptions[key].map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
            </SelectContent>
          </Select>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 text-xs text-[#eee6d7]/70" aria-live="polite">
        <span>Showing {filteredMonuments.length} of {monuments.length} places</span>
        {(search || Object.values(filters).some((value) => value !== "all")) && (
          <button type="button" onClick={resetFilters} className="rounded px-2 py-1 text-[#e1c17e] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]">Clear filters</button>
        )}
      </div>

      {filteredMonuments.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredMonuments.map((monument) => {
            const isFavorite = favorites.has(monument.id);
            return (
              <article key={monument.id} className="group overflow-hidden rounded-xl border border-[#d7b879]/15 bg-[#211e19] transition-all duration-300 hover:-translate-y-1 hover:border-[#d7b879]/40 hover:shadow-[0_18px_50px_-30px_rgba(215,184,121,.35)]">
                <div className="relative">
                  <MonumentImage monument={monument} />
                  <button
                    type="button"
                    aria-label={isFavorite ? `Remove ${monument.name} from favorites` : `Add ${monument.name} to favorites`}
                    aria-pressed={isFavorite}
                    onClick={() => onToggleFavorite(monument.id)}
                    className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879] ${isFavorite ? "border-[#d7b879] bg-[#d7b879] text-[#211b12]" : "border-white/25 bg-[#171512]/60 text-[#f5ead5] hover:border-[#d7b879] hover:text-[#e4c47f]"}`}
                  >
                    <IconHeart className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" />
                  </button>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-xl text-[#f4ecdd]">{monument.name}</h3>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-[#eee6d7]/70"><IconMapPin className="h-3.5 w-3.5 text-[#d7b879]" aria-hidden="true" />{monument.location}</p>
                    </div>
                    <span className="mt-1 shrink-0 rounded-full border border-[#d7b879]/20 px-2 py-1 text-[11px] uppercase tracking-[.12em] text-[#d7b879]">{monument.category}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-[#d9cdb5]/70">
                    <span className="rounded-full bg-white/[.045] px-2.5 py-1">{monument.period}</span>
                    {monument.dynasty && <span className="rounded-full bg-white/[.045] px-2.5 py-1">{monument.dynasty}</span>}
                  </div>
                  <p className="mt-4 line-clamp-2 min-h-10 text-xs leading-5 text-[#eee6d7]/65">{monument.description}</p>
                  <button type="button" onClick={() => { setSelected(monument); onViewMonument(monument.id); }} className="mt-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.16em] text-[#e4c47f] transition-colors hover:text-[#f4d99b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]">
                    Explore Details <IconArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-[#d7b879]/25 bg-[#211e19]/70 px-6 py-16 text-center">
          <p className="font-serif text-2xl text-[#f4ecdd]">No places found</p>
          <p className="mt-2 text-sm text-[#eee6d7]/70">Try another name or broaden your filters.</p>
          <button type="button" onClick={resetFilters} className="mt-5 rounded-full border border-[#d7b879]/45 px-5 py-2 text-[11px] uppercase tracking-[.15em] text-[#e4c47f] hover:bg-[#d7b879]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]">Reset search</button>
        </div>
      )}

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        {selected && (
          <DialogContent className="max-w-3xl border-[#d7b879]/25 bg-[#201d18] p-0 text-[#f6f0e4]">
            <div className="relative h-52 sm:h-72">
              <ModalImage monument={selected} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#201d18] via-[#201d18]/15 to-transparent" />
              <span className="absolute bottom-4 left-5 rounded-full border border-[#d7b879]/35 bg-[#171512]/70 px-3 py-1 text-[11px] uppercase tracking-[.2em] text-[#e4c47f]">Demo historical record</span>
            </div>
            <div className="max-h-[calc(90vh-13rem)] overflow-y-auto px-5 pb-6 sm:px-8 sm:pb-8">
              <DialogHeader className="-mt-2 text-left">
                <DialogTitle className="font-serif text-3xl text-[#f6f0e4] sm:text-4xl">{selected.name}</DialogTitle>
                <DialogDescription className="text-sm text-[#eee6d7]/70">{selected.location} <span className="mx-1 text-[#d7b879]">·</span> {selected.period} <span className="mx-1 text-[#d7b879]">·</span> {selected.dynasty ?? selected.era}</DialogDescription>
              </DialogHeader>
              <p className="mt-5 border-l border-[#d7b879]/50 pl-4 text-sm leading-6 text-[#eee6d7]/80">{selected.description}</p>
              <div className="mt-7 grid gap-6 sm:grid-cols-2">
                <div><h4 className="font-serif text-lg text-[#e7d4ac]">Historical background</h4><p className="mt-2 text-sm leading-6 text-[#eee6d7]/65">{selected.background}</p></div>
                <div><h4 className="font-serif text-lg text-[#e7d4ac]">Architecture</h4><p className="mt-2 text-sm leading-6 text-[#eee6d7]/65">{selected.architecture}</p></div>
                <div><h4 className="font-serif text-lg text-[#e7d4ac]">Historical significance</h4><p className="mt-2 text-sm leading-6 text-[#eee6d7]/65">{selected.significance}</p></div>
                <div><h4 className="font-serif text-lg text-[#e7d4ac]">Approximate dates</h4><p className="mt-2 text-sm leading-6 text-[#eee6d7]/65">{selected.approximateDates}</p></div>
              </div>
              <div className="mt-7 grid gap-6 border-t border-[#d7b879]/15 pt-6 sm:grid-cols-2">
                <div><h4 className="text-[11px] font-semibold uppercase tracking-[.2em] text-[#d7b879]">Related events</h4><ul className="mt-3 space-y-2 text-xs leading-5 text-[#eee6d7]/65">{selected.relatedEvents.map((event) => <li key={event}>· {event}</li>)}</ul></div>
                <div><h4 className="text-[11px] font-semibold uppercase tracking-[.2em] text-[#d7b879]">References</h4><ul className="mt-3 space-y-2 text-xs leading-5 text-[#eee6d7]/65">{selected.references.map((reference) => <li key={reference}>· {reference}</li>)}</ul></div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
