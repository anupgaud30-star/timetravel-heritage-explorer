import { useMemo, useState } from "react";
import { IconArrowUpRight, IconBuildingArch, IconMapPin, IconSearch } from "@tabler/icons-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { historicalKnowledge, knowledgeCategories, type KnowledgeRecord } from "@/lib/knowledge-data";

function KnowledgeImage({
  src,
  alt,
  category,
}: {
  src: string;
  alt: string;
  category: string;
}) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#241f17]">
      {status === "loading" && (
        <div
          role="status"
          aria-label="Loading image"
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#302a20] to-[#1c1813]"
        />
      )}
      {status === "error" ? (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#2a2318] to-[#171512] p-4 text-center">
          <IconBuildingArch className="h-8 w-8 text-[#d7b879]/70" aria-hidden="true" />
          <span className="mt-1 text-xs text-[#eee6d7]/70">{alt}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          className={`h-full w-full object-cover transition-transform duration-700 hover:scale-105 ${status === "loaded" ? "opacity-100" : "opacity-0"}`}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#171512] via-[#171512]/20 to-transparent" />
      <span className="absolute bottom-2.5 left-3 rounded-full border border-white/20 bg-[#171512]/85 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[.18em] text-[#d7b879] backdrop-blur-md">
        {category}
      </span>
    </div>
  );
}

export function KnowledgeExplorerSection() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<KnowledgeRecord | null>(null);

  const records = useMemo(() => {
    const rawSearch = query.trim().toLocaleLowerCase();
    const tokens = rawSearch ? rawSearch.split(/[,\s]+/).filter((t) => t.length > 0) : [];

    return historicalKnowledge.filter((record) => {
      const matchesCategory = category === "all" || record.category === category;
      const searchableText = [
        record.title,
        record.category,
        record.period,
        record.dates,
        record.summary,
        record.location ?? "",
        record.state ?? "",
        record.architecture ?? "",
        record.significance ?? "",
        ...(record.aliases ?? []),
        ...record.relatedMonuments,
        ...record.relatedEvents,
      ]
        .join(" ")
        .toLocaleLowerCase();

      const matchesQuery = tokens.length === 0 || tokens.every((token) => searchableText.includes(token));
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const clearSearch = () => {
    setQuery("");
    setCategory("all");
  };

  return (
    <section id="knowledge" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 pb-20 md:px-10 xl:px-16" aria-labelledby="knowledge-title">
      <div className="overflow-hidden rounded-2xl border border-[#d7b879]/20 bg-[radial-gradient(ellipse_at_top_left,rgba(142,103,46,.13),transparent_38%),linear-gradient(145deg,#211e19,#191714)] p-5 md:p-9 shadow-[0_28px_80px_-55px_rgba(215,184,121,.38)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.28em] text-[#d7b879]">People, places & ideas</p>
            <h2 id="knowledge-title" className="mt-2 font-serif text-3xl text-[#f4ecdd] md:text-5xl">Historical Knowledge Explorer</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#eee6d7]/70">Search across famous places, personalities, dynasties, battles, monuments, civilizations, art, and architecture.</p>
          </div>
          <span className="rounded-full border border-[#d7b879]/25 px-3 py-1.5 text-[11px] uppercase tracking-[.17em] text-[#e2cfaa]/85">Verified collection · {historicalKnowledge.length} entries</span>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-[minmax(0,1fr)_240px]">
          <label className="relative block">
            <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#d7b879]/85" aria-hidden="true" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search places (Mumbai, Ayodhya, Delhi…), rulers, events…"
              aria-label="Search historical knowledge"
              className="h-11 rounded-lg border-[#d7b879]/20 bg-[#171512] pl-10 text-sm text-[#f6f0e4] placeholder:text-[#eee6d7]/70 focus-visible:ring-[#d7b879]"
            />
          </label>
          <Select value={category} onValueChange={(value) => setCategory(value)}>
            <SelectTrigger aria-label="Filter knowledge by category" className="h-11 rounded-lg border-[#d7b879]/20 bg-[#171512] text-xs text-[#eee6d7] focus:ring-[#d7b879]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent className="border-[#d7b879]/20 bg-[#211e19] text-[#f6f0e4]">
              <SelectItem value="all">All categories</SelectItem>
              {knowledgeCategories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#eee6d7]/70" aria-live="polite">
          <span>Showing {records.length} of {historicalKnowledge.length} historical entries</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-[#eee6d7]/50">Popular:</span>
            {["Mumbai", "Ram Mandir", "Delhi", "Varanasi", "Rajasthan", "Hampi"].map((shortcut) => (
              <button
                key={shortcut}
                type="button"
                onClick={() => setQuery(shortcut)}
                className="rounded-full border border-[#d7b879]/20 bg-[#171512]/60 px-2.5 py-0.5 text-[10px] text-[#e4c47f] transition-colors hover:border-[#d7b879]/60 hover:bg-[#d7b879]/15"
              >
                {shortcut}
              </button>
            ))}
            {(query || category !== "all") && (
              <button type="button" onClick={clearSearch} className="ml-2 text-[#e1c17e] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]">
                Clear search
              </button>
            )}
          </div>
        </div>

        {records.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {records.map((record) => (
              <article
                key={record.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#d7b879]/20 bg-[#1a1713]/85 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#d7b879]/55 hover:shadow-2xl"
              >
                {record.image ? (
                  <KnowledgeImage src={record.image} alt={record.title} category={record.category} />
                ) : (
                  <div className="flex h-28 items-center justify-between border-b border-[#d7b879]/15 bg-gradient-to-r from-[#2a241b] to-[#1c1813] px-5">
                    <span className="rounded-full border border-[#d7b879]/30 bg-[#171512]/80 px-2.5 py-1 text-[11px] uppercase tracking-[.15em] text-[#d7b879]">
                      {record.category}
                    </span>
                    <IconBuildingArch className="h-8 w-8 text-[#d7b879]/50" />
                  </div>
                )}

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[#eee6d7]/65">
                    <span className="font-semibold uppercase tracking-[.14em] text-[#d7b879]">{record.period}</span>
                    <span className="line-clamp-1 text-right text-[10px]">{record.dates}</span>
                  </div>

                  <h3 className="mt-2.5 font-serif text-lg font-medium text-[#f5ebd7] transition-colors group-hover:text-[#ffdca2]">
                    {record.title}
                  </h3>

                  {record.location && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-[#eee6d7]/70">
                      <IconMapPin className="h-3.5 w-3.5 shrink-0 text-[#d7b879]" aria-hidden="true" />
                      <span className="line-clamp-1">{record.location}</span>
                    </p>
                  )}

                  <p className="mt-3 line-clamp-3 flex-1 text-xs leading-5 text-[#eee6d7]/70">
                    {record.summary}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-[#d7b879]/10 pt-3">
                    <button
                      type="button"
                      onClick={() => setSelected(record)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[.16em] text-[#e4c47f] transition-colors hover:text-[#faebd0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]"
                    >
                      Read full entry <IconArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    {record.state && (
                      <span className="rounded-full border border-white/10 bg-white/[.04] px-2 py-0.5 text-[10px] text-[#eee6d7]/60">
                        {record.state}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-[#d7b879]/25 p-12 text-center">
            <p className="font-serif text-2xl text-[#f4ecdd]">No historical records found for "{query}"</p>
            <p className="mt-2 text-sm text-[#eee6d7]/70">Try searching for famous places like Mumbai, Ayodhya, Delhi, Varanasi, or a state like Maharashtra.</p>
            <button type="button" onClick={clearSearch} className="mt-4 rounded-full border border-[#d7b879]/35 bg-[#d7b879]/10 px-4 py-2 text-xs font-semibold text-[#e1c17e] hover:bg-[#d7b879]/20">
              Reset search & filters
            </button>
          </div>
        )}
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        {selected && (
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-[#d7b879]/25 bg-[#201d18] p-0 text-[#f6f0e4] shadow-2xl">
            {selected.image && (
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#241f17]">
                <img
                  src={selected.image}
                  alt={selected.title}
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#201d18] via-transparent to-transparent opacity-95" />
                <span className="absolute bottom-3 left-4 rounded-full border border-white/20 bg-[#171512]/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[.18em] text-[#d7b879] backdrop-blur-md">
                  {selected.category}
                </span>
                {selected.state && (
                  <span className="absolute bottom-3 right-4 rounded-full border border-white/20 bg-[#171512]/85 px-3 py-1 text-[11px] text-[#eee6d7] backdrop-blur-md">
                    {selected.state}
                  </span>
                )}
              </div>
            )}

            <div className="space-y-6 p-6">
              <DialogHeader className="text-left">
                {!selected.image && (
                  <span className="w-fit rounded-full border border-[#d7b879]/25 px-3 py-1 text-[11px] uppercase tracking-[.17em] text-[#d7b879]">
                    {selected.category}
                  </span>
                )}
                <DialogTitle className="font-serif text-2xl text-[#f6f0e4] sm:text-3xl">
                  {selected.title}
                </DialogTitle>
                <DialogDescription className="text-sm text-[#eee6d7]/70">
                  {selected.period} <span className="mx-1 text-[#d7b879]">·</span> {selected.dates}
                </DialogDescription>
                {selected.location && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-[#d7b879]">
                    <IconMapPin className="h-4 w-4" aria-hidden="true" />
                    <span>{selected.location}</span>
                  </p>
                )}
              </DialogHeader>

              <div className="rounded-xl border border-[#d7b879]/20 bg-[#171512]/60 p-4">
                <p className="text-sm leading-6 text-[#eee6d7]/90">{selected.summary}</p>
              </div>

              {selected.architecture && (
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#d7b879]">Architecture & Design</h4>
                  <p className="mt-1.5 text-xs leading-5 text-[#eee6d7]/75">{selected.architecture}</p>
                </div>
              )}

              {selected.significance && (
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#d7b879]">Historical Significance</h4>
                  <p className="mt-1.5 text-xs leading-5 text-[#eee6d7]/75">{selected.significance}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#d7b879]">Related monuments & sites</h4>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selected.relatedMonuments.map((item) => (
                      <span key={item} className="rounded-lg border border-[#d7b879]/20 bg-[#171512]/60 px-2.5 py-1 text-xs text-[#eee6d7]/80">
                        ✦ {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#d7b879]">Key events</h4>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selected.relatedEvents.map((item) => (
                      <span key={item} className="rounded-lg border border-white/10 bg-white/[.04] px-2.5 py-1 text-xs text-[#eee6d7]/75">
                        • {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {selected.references && selected.references.length > 0 && (
                <div className="border-t border-[#d7b879]/15 pt-4">
                  <h4 className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#d7b879]">References & Authorities</h4>
                  <ul className="mt-2 space-y-1.5 text-xs text-[#eee6d7]/70">
                    {selected.references.map((reference) => (
                      <li key={reference.label}>
                        {reference.url ? (
                          <a
                            href={reference.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#e4c47f] underline decoration-[#d7b879]/40 underline-offset-4 hover:text-[#f8e5bd]"
                          >
                            {reference.label} ↗
                          </a>
                        ) : (
                          <span>· {reference.label}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </section>
  );
}
