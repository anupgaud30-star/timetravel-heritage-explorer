import { useMemo, useState } from "react";
import { IconArrowUpRight, IconSearch } from "@tabler/icons-react";

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

export function KnowledgeExplorerSection() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<KnowledgeRecord | null>(null);

  const records = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return historicalKnowledge.filter((record) => {
      const matchesCategory = category === "all" || record.category === category;
      const searchableText = [record.title, record.category, record.period, record.summary, ...record.relatedMonuments, ...record.relatedEvents].join(" ").toLocaleLowerCase();
      return matchesCategory && (!search || searchableText.includes(search));
    });
  }, [category, query]);

  const clearSearch = () => {
    setQuery("");
    setCategory("all");
  };

  return (
    <section id="knowledge" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 pb-20 md:px-10 xl:px-16" aria-labelledby="knowledge-title">
      <div className="overflow-hidden rounded-2xl border border-[#d7b879]/20 bg-[radial-gradient(ellipse_at_top_left,rgba(142,103,46,.13),transparent_38%),linear-gradient(145deg,#211e19,#191714)] p-5 md:p-9">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#d7b879]">People, places & ideas</p>
            <h2 id="knowledge-title" className="mt-2 font-serif text-3xl text-[#f4ecdd] md:text-5xl">Historical Knowledge Explorer</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#eee6d7]/60">Search across personalities, dynasties, battles, monuments, civilizations, art, and architecture.</p>
          </div>
          <span className="rounded-full border border-[#d7b879]/25 px-3 py-1.5 text-[9px] uppercase tracking-[.17em] text-[#e2cfaa]/70">Demo records · {historicalKnowledge.length} entries</span>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-[minmax(0,1fr)_240px]">
          <label className="relative block">
            <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#d7b879]/70" aria-hidden="true" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people, places, events, ideas…" aria-label="Search historical knowledge" className="h-11 rounded-lg border-[#d7b879]/20 bg-[#171512] pl-10 text-sm text-[#f6f0e4] placeholder:text-[#eee6d7]/35 focus-visible:ring-[#d7b879]" />
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

        <div className="mt-4 flex items-center justify-between text-xs text-[#eee6d7]/55" aria-live="polite">
          <span>Showing {records.length} of {historicalKnowledge.length} demo records</span>
          {(query || category !== "all") && <button type="button" onClick={clearSearch} className="text-[#e1c17e] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]">Clear search</button>}
        </div>

        {records.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {records.map((record) => (
              <article key={record.id} className="flex min-h-[250px] flex-col rounded-xl border border-[#d7b879]/15 bg-[#171512]/70 p-5 transition-all hover:-translate-y-1 hover:border-[#d7b879]/40">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full border border-[#d7b879]/20 px-2.5 py-1 text-[9px] uppercase tracking-[.15em] text-[#d7b879]">{record.category}</span>
                  <span className="text-right text-[10px] leading-4 text-[#eee6d7]/45">{record.dates}</span>
                </div>
                <h3 className="mt-4 font-serif text-xl text-[#f4ecdd]">{record.title}</h3>
                <p className="mt-1 text-[11px] uppercase tracking-[.12em] text-[#d7b879]/75">{record.period}</p>
                <p className="mt-3 line-clamp-3 flex-1 text-xs leading-5 text-[#eee6d7]/65">{record.summary}</p>
                <button type="button" onClick={() => setSelected(record)} className="mt-5 inline-flex w-fit items-center gap-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#e4c47f] hover:text-[#f4d99b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]">
                  Read entry <IconArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-[#d7b879]/25 px-6 py-14 text-center">
            <p className="font-serif text-2xl text-[#f4ecdd]">No records found</p>
            <p className="mt-2 text-sm text-[#eee6d7]/55">Try another search or category.</p>
            <button type="button" onClick={clearSearch} className="mt-4 text-xs text-[#e1c17e] underline-offset-4 hover:underline">Reset filters</button>
          </div>
        )}
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        {selected && (
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-[#d7b879]/25 bg-[#201d18] text-[#f6f0e4]">
            <DialogHeader className="text-left">
              <span className="w-fit rounded-full border border-[#d7b879]/25 px-3 py-1 text-[9px] uppercase tracking-[.17em] text-[#d7b879]">{selected.category} · Demo record</span>
              <DialogTitle className="font-serif text-3xl text-[#f6f0e4]">{selected.title}</DialogTitle>
              <DialogDescription className="text-[#eee6d7]/60">{selected.period} <span className="mx-1 text-[#d7b879]">·</span> {selected.dates}</DialogDescription>
            </DialogHeader>
            <p className="border-l border-[#d7b879]/50 pl-4 text-sm leading-6 text-[#eee6d7]/80">{selected.summary}</p>
            <div className="grid gap-6 sm:grid-cols-2">
              <div><h3 className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#d7b879]">Related monuments</h3><ul className="mt-3 space-y-2 text-sm text-[#eee6d7]/70">{selected.relatedMonuments.map((item) => <li key={item}>· {item}</li>)}</ul></div>
              <div><h3 className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#d7b879]">Related events</h3><ul className="mt-3 space-y-2 text-sm text-[#eee6d7]/70">{selected.relatedEvents.map((item) => <li key={item}>· {item}</li>)}</ul></div>
            </div>
            <div className="border-t border-[#d7b879]/15 pt-5">
              <h3 className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#d7b879]">References</h3>
              <ul className="mt-3 space-y-2 text-sm text-[#eee6d7]/70">
                {selected.references.map((reference) => <li key={reference.label}>{reference.url ? <a href={reference.url} target="_blank" rel="noreferrer" className="underline decoration-[#d7b879]/40 underline-offset-4 hover:text-[#e7cb8e]">{reference.label} ↗</a> : reference.label}</li>)}
              </ul>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </section>
  );
}
