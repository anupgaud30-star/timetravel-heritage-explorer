import { useMemo, useState } from "react";
import { IconArrowDown, IconArrowRight, IconClock, IconMapPin } from "@tabler/icons-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatHistoricalYear,
  historicalPeriods,
  timelineDynastiesByEvent,
  timelineEvents,
} from "@/lib/timeline-data";

const defaultPeriod = historicalPeriods.find((period) => period.id === "mughal") ?? historicalPeriods[0];

export function TimeMachineSection({
  onExplore,
}: {
  onExplore: (exploration: { periodId: string; periodName: string; year: number; dynasty: string | null; eventTitle: string | null }) => void;
}) {
  const [periodId, setPeriodId] = useState(defaultPeriod.id);
  const [year, setYear] = useState(defaultPeriod.startYear);
  const [dynasty, setDynasty] = useState("all");
  const [eventId, setEventId] = useState("all");
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  const period = historicalPeriods.find((item) => item.id === periodId) ?? defaultPeriod;
  const periodEvents = useMemo(
    () => timelineEvents.filter((event) => event.periodId === period.id),
    [period.id],
  );
  const dynastyOptions = useMemo(
    () => [...new Set(periodEvents.map((event) => timelineDynastiesByEvent[event.id]))],
    [periodEvents],
  );
  const filteredEvents = useMemo(
    () => periodEvents.filter((event) =>
      (dynasty === "all" || timelineDynastiesByEvent[event.id] === dynasty) &&
      (eventId === "all" || event.id === eventId),
    ),
    [dynasty, eventId, periodEvents],
  );
  const selectedEvent = filteredEvents.find((event) => event.id === activeEventId) ?? null;
  const relevantEvents = useMemo(() => {
    const range = Math.max(25, Math.round((period.endYear - period.startYear) * 0.035));
    const nearby = filteredEvents.filter((event) => Math.abs(event.year - year) <= range);
    return nearby.length
      ? { events: nearby, label: `Within about ${range.toLocaleString()} years of ${formatHistoricalYear(year)}` }
      : {
          events: [...filteredEvents].sort((a, b) => Math.abs(a.year - year) - Math.abs(b.year - year)).slice(0, 3),
          label: `Closest sample records to ${formatHistoricalYear(year)}`,
        };
  }, [filteredEvents, period.endYear, period.startYear, year]);

  const changePeriod = (nextPeriodId: string) => {
    const nextPeriod = historicalPeriods.find((item) => item.id === nextPeriodId);
    if (!nextPeriod) return;
    setPeriodId(nextPeriod.id);
    setYear((current) => current < nextPeriod.startYear || current > nextPeriod.endYear ? nextPeriod.startYear : current);
    setDynasty("all");
    setEventId("all");
    setActiveEventId(null);
  };

  const updateYear = (nextYear: number) => {
    setYear(Math.max(period.startYear, Math.min(period.endYear, nextYear)));
    setActiveEventId(null);
  };

  const exploreEra = () => {
    document.getElementById("timeline-events")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="timeline" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 pb-20 md:px-10 xl:px-16" aria-labelledby="time-machine-title">
      <div className="overflow-hidden rounded-2xl border border-[#d7b879]/20 bg-[radial-gradient(ellipse_at_top_right,rgba(142,103,46,.14),transparent_38%),linear-gradient(145deg,#211e19,#191714)] p-5 shadow-[0_28px_80px_-55px_rgba(215,184,121,.42)] md:p-9">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.28em] text-[#d7b879]"><IconClock className="h-4 w-4" aria-hidden="true" /> A journey through the ages</p>
            <h2 id="time-machine-title" className="mt-3 font-serif text-3xl text-[#f4ecdd] md:text-5xl">Time Machine</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#eee6d7]/70">Set a year, choose a historical period, and follow the people and places that shaped it.</p>
          </div>
          <span className="rounded-full border border-[#d7b879]/25 px-3 py-1.5 text-[11px] uppercase tracking-[.16em] text-[#e2cfaa]/85">Demo timeline · sample history</span>
        </div>

        <div className="mt-8 grid gap-4 rounded-xl border border-[#d7b879]/15 bg-[#171512]/65 p-4 md:grid-cols-2 md:p-5 xl:grid-cols-[1.25fr_1fr_1fr_1.2fr_auto] xl:items-end">
          <label className="block text-[11px] font-semibold uppercase tracking-[.18em] text-[#d8c49b]">
            Year
            <div className="relative mt-2">
              <input
                type="number"
                min={period.startYear}
                max={period.endYear}
                value={year}
                onChange={(event) => updateYear(Number(event.target.value) || 0)}
                aria-label="Explore historical year; negative numbers are BCE"
                className="h-11 w-full rounded-lg border border-[#d7b879]/20 bg-[#211e19] px-3 pr-20 text-sm text-[#f6f0e4] outline-none focus:border-[#d7b879] focus:ring-2 focus:ring-[#d7b879]/20"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] tracking-wide text-[#d7b879]">{year < 0 ? "BCE" : "CE"}</span>
            </div>
          </label>
          <label className="block text-[11px] font-semibold uppercase tracking-[.18em] text-[#d8c49b]">
            Era
            <Select value={periodId} onValueChange={changePeriod}>
              <SelectTrigger aria-label="Select historical era" className="mt-2 h-11 border-[#d7b879]/20 bg-[#211e19] text-xs text-[#f6f0e4] focus:ring-[#d7b879]"><SelectValue /></SelectTrigger>
              <SelectContent className="border-[#d7b879]/20 bg-[#211e19] text-[#f6f0e4]">
                {historicalPeriods.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
          <label className="block text-[11px] font-semibold uppercase tracking-[.18em] text-[#d8c49b]">
            Dynasty
            <Select value={dynasty} onValueChange={(value) => { setDynasty(value); setEventId("all"); setActiveEventId(null); }}>
              <SelectTrigger aria-label="Filter by dynasty" className="mt-2 h-11 border-[#d7b879]/20 bg-[#211e19] text-xs text-[#f6f0e4] focus:ring-[#d7b879]"><SelectValue placeholder="All dynasties" /></SelectTrigger>
              <SelectContent className="border-[#d7b879]/20 bg-[#211e19] text-[#f6f0e4]">
                <SelectItem value="all">All dynasties</SelectItem>
                {dynastyOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
          <label className="block text-[11px] font-semibold uppercase tracking-[.18em] text-[#d8c49b]">
            Event
            <Select value={eventId} onValueChange={(value) => {
              setEventId(value);
              setActiveEventId(value === "all" ? null : value);
              const event = periodEvents.find((item) => item.id === value);
              if (event) setYear(event.year);
            }}>
              <SelectTrigger aria-label="Filter by event" className="mt-2 h-11 border-[#d7b879]/20 bg-[#211e19] text-xs text-[#f6f0e4] focus:ring-[#d7b879]"><SelectValue placeholder="All events" /></SelectTrigger>
              <SelectContent className="border-[#d7b879]/20 bg-[#211e19] text-[#f6f0e4]">
                <SelectItem value="all">All events</SelectItem>
                {filteredEvents.map((event) => <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
          <button type="button" onClick={() => { onExplore({ periodId: period.id, periodName: period.name, year, dynasty: dynasty === "all" ? null : dynasty, eventTitle: selectedEvent?.title ?? null }); exploreEra(); }} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#d7b879] px-5 text-[11px] font-semibold uppercase tracking-[.13em] text-[#211b12] transition-colors hover:bg-[#ead19a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1dcae] focus-visible:ring-offset-2 focus-visible:ring-offset-[#171512]">
            Explore This Era <IconArrowDown className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="md:col-span-2 xl:col-span-5">
            <div className="flex items-center justify-between gap-3 text-[11px] text-[#eee6d7]/70"><span>{formatHistoricalYear(period.startYear)}</span><span className="text-sm font-medium text-[#e7cb8e]">{formatHistoricalYear(year)}</span><span>{formatHistoricalYear(period.endYear)}</span></div>
            <input
              type="range"
              min={period.startYear}
              max={period.endYear}
              step={1}
              value={year}
              onChange={(event) => updateYear(Number(event.target.value))}
              aria-label="Timeline year slider"
              className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-[#5d4b2d] accent-[#d7b879] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c47f]"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#d7b879]/15 pb-5">
          <div>
            <h3 className="font-serif text-xl text-[#ead9b7]">{period.name}</h3>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-[#eee6d7]/70">{period.description}</p>
          </div>
          <span className="text-[11px] uppercase tracking-[.15em] text-[#d6c29b]/80">{filteredEvents.length} sample {filteredEvents.length === 1 ? "event" : "events"}</span>
        </div>

        {filteredEvents.length ? (
          <div className="mt-6">
            <h3 className="text-[11px] font-semibold uppercase tracking-[.22em] text-[#d7b879]">Timeline markers <span className="font-normal tracking-normal text-[#eee6d7]/70">· select a marker to inspect</span></h3>
            <div className="mt-4 overflow-x-auto pb-3">
              <div className="relative flex min-w-max items-start pt-3">
                <div className="absolute left-2 right-10 top-[2.9rem] h-px bg-[#d7b879]/35" />
                {filteredEvents.map((event, index) => {
                  const isActive = selectedEvent?.id === event.id || (!selectedEvent && activeEventId === event.id);
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => { setActiveEventId(event.id); setYear(event.year); }}
                      aria-pressed={isActive}
                      className="relative z-10 flex w-48 flex-col items-start px-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879] sm:w-56"
                    >
                      <span className="h-7 text-[11px] font-medium text-[#d9c394]">{event.date}</span>
                      <span className={`mb-3 h-3 w-3 rounded-full border-2 transition-all ${isActive ? "scale-125 border-[#f3d894] bg-[#d7b879] shadow-[0_0_15px_rgba(215,184,121,.75)]" : "border-[#d7b879] bg-[#211e19] hover:bg-[#d7b879]"}`} />
                      <span className={`pr-4 text-xs leading-5 ${isActive ? "text-[#f6e7c4]" : "text-[#eee6d7]/65"}`}><span className="mr-2 text-[11px] text-[#bca77e]">{String(index + 1).padStart(2, "0")}</span>{event.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-[#d7b879]/25 bg-[#171512]/50 px-5 py-10 text-center">
            <p className="font-serif text-xl text-[#f4ecdd]">No sample events match these filters</p>
            <p className="mt-2 text-xs text-[#eee6d7]/70">Choose another dynasty or event to return to the timeline.</p>
          </div>
        )}

        <div id="timeline-events" className="mt-5 scroll-mt-28 grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
          <section className="rounded-xl border border-[#d7b879]/20 bg-[#171512]/70 p-5 md:p-6" aria-labelledby="time-context-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-[11px] font-semibold uppercase tracking-[.22em] text-[#d7b879]">What Happened During This Time?</p><h3 id="time-context-title" className="mt-2 font-serif text-2xl text-[#f4ecdd]">{formatHistoricalYear(year)}</h3></div>
              <span className="rounded-full border border-[#d7b879]/20 px-2.5 py-1 text-[11px] text-[#d8c49b]/80">{selectedEvent ? "Selected event" : relevantEvents.label}</span>
            </div>
            {selectedEvent ? (
              <EventSummary event={selectedEvent} />
            ) : relevantEvents.events.length ? (
              <div className="mt-5 space-y-4">
                {relevantEvents.events.map((event) => <EventSummary key={event.id} event={event} compact />)}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-6 text-[#eee6d7]/70">No events are included for this period in the current sample data.</p>
            )}
          </section>

          <section className="rounded-xl border border-[#d7b879]/20 bg-gradient-to-br from-[#262119] to-[#1b1915] p-5 md:p-6" aria-labelledby="related-sites-title">
            <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-[#d7b879]">Places connected to the story</p>
            <h3 id="related-sites-title" className="mt-2 font-serif text-2xl text-[#f4ecdd]">Related heritage sites</h3>
            {selectedEvent ? (
              <ul className="mt-5 space-y-3">
                {selectedEvent.monuments.map((monument) => <li key={monument} className="flex items-start gap-3 border-b border-[#d7b879]/10 pb-3 text-sm text-[#eee6d7]/75 last:border-0"><IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#d7b879]" aria-hidden="true" />{monument}</li>)}
              </ul>
            ) : relevantEvents.events.length ? (
              <ul className="mt-5 space-y-3">
                {relevantEvents.events.flatMap((event) => event.monuments.map((monument) => ({ event, monument }))).map(({ event, monument }, index) => <li key={`${event.id}-${monument}-${index}`} className="flex items-start gap-3 border-b border-[#d7b879]/10 pb-3 last:border-0"><IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#d7b879]" aria-hidden="true" /><span className="text-sm text-[#eee6d7]/75">{monument}<span className="mt-1 block text-[11px] text-[#eee6d7]/70">{event.title}</span></span></li>)}
              </ul>
            ) : (
              <p className="mt-5 text-sm text-[#eee6d7]/70">Choose a period with sample site records to explore related places.</p>
            )}
          </section>
        </div>
        <p className="mt-5 text-[11px] leading-5 text-[#eee6d7]/70">Demo content for exploration only. Dates are approximate where noted and historical interpretations may vary.</p>
      </div>
    </section>
  );
}

function EventSummary({ event, compact = false }: { event: (typeof timelineEvents)[number]; compact?: boolean }) {
  return (
    <article className={`mt-5 ${compact ? "border-t border-[#d7b879]/10 pt-4 first:mt-5 first:border-t-0 first:pt-0" : ""}`}>
      <p className="text-[11px] font-medium uppercase tracking-[.12em] text-[#d7b879]">{event.date}</p>
      <h4 className="mt-1 font-serif text-lg text-[#ead9b7]">{event.title}</h4>
      <p className="mt-2 text-xs leading-6 text-[#eee6d7]/65">{event.summary}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div><p className="text-[11px] uppercase tracking-[.16em] text-[#d8c49b]/80">Important rulers</p><p className="mt-1 text-xs leading-5 text-[#eee6d7]/65">{event.rulers.join(" · ")}</p></div>
        <div><p className="text-[11px] uppercase tracking-[.16em] text-[#d8c49b]/80">Achievements</p><p className="mt-1 text-xs leading-5 text-[#eee6d7]/65">{event.achievements.join(" · ")}</p></div>
      </div>
      <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-[#eee6d7]/70"><IconArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#d7b879]/85" aria-hidden="true" />References: {event.references.join(" · ")}</p>
    </article>
  );
}
