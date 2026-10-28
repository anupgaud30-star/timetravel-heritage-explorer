import { useState } from "react";
import { Link } from "react-router";
import { IconArrowUpRight, IconClock, IconHeart, IconHistory, IconTrash } from "@tabler/icons-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { monuments, type Monument } from "@/lib/monuments";
import { formatHistoricalYear } from "@/lib/timeline-data";
import type { ProfileActivity } from "@/lib/profile-activity";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function EmptyPanel({ children }: { children: string }) {
  return <p className="rounded-lg border border-dashed border-[#d7b879]/20 px-4 py-8 text-center text-xs leading-5 text-[#eee6d7]/70">{children}</p>;
}

export function ProfileDashboardSection({
  activity,
  hasLoaded,
  onClear,
  onViewMonument,
}: {
  activity: ProfileActivity;
  hasLoaded: boolean;
  onClear: () => void;
  onViewMonument: (monumentId: string) => void;
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [selectedMonument, setSelectedMonument] = useState<Monument | null>(null);
  const favorites = activity.favoriteMonumentIds.map((id) => monuments.find((monument) => monument.id === id)).filter((item): item is Monument => Boolean(item));
  const recentlyViewed = activity.viewedMonumentIds.map((id) => monuments.find((monument) => monument.id === id)).filter((item): item is Monument => Boolean(item));
  const hasActivity = favorites.length > 0 || recentlyViewed.length > 0 || activity.timelineExplorations.length > 0 || activity.quizResults.length > 0;

  const clearHistory = () => {
    onClear();
    setConfirmClear(false);
    setSelectedMonument(null);
  };

  return (
    <section id="profile" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 pb-24 md:px-10 xl:px-16" aria-labelledby="profile-title">
      <div className="overflow-hidden rounded-2xl border border-[#d7b879]/20 bg-[radial-gradient(ellipse_at_top_left,rgba(142,103,46,.14),transparent_40%),linear-gradient(145deg,#211e19,#191714)] p-5 md:p-9">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.28em] text-[#d7b879]">Saved on this device</p>
            <h2 id="profile-title" className="mt-2 font-serif text-3xl text-[#f4ecdd] md:text-5xl">Your Heritage Dashboard</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#eee6d7]/70">A private local record of places you love, eras you explore, and quiz rounds you complete. No account or cloud sync.</p>
          </div>
          {hasLoaded && hasActivity && <button type="button" onClick={() => setConfirmClear(true)} className="inline-flex items-center gap-2 rounded-full border border-[#d7b879]/30 px-4 py-2.5 text-[11px] uppercase tracking-[.13em] text-[#e7d4ac] transition-colors hover:border-[#d99b84]/60 hover:text-[#e0a394] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]"><IconTrash className="h-4 w-4" aria-hidden="true" /> Clear saved history</button>}
        </div>

        {!hasLoaded ? (
          <div role="status" className="mt-7 rounded-xl border border-[#d7b879]/15 bg-[#171512]/55 px-5 py-10 text-center text-sm text-[#eee6d7]/70">Loading saved activity from this device…</div>
        ) : !hasActivity ? (
          <div className="mt-7 rounded-xl border border-dashed border-[#d7b879]/25 bg-[#171512]/50 px-5 py-12 text-center">
            <IconHistory className="mx-auto h-7 w-7 text-[#d7b879]/85" aria-hidden="true" />
            <h3 className="mt-4 font-serif text-2xl text-[#f4ecdd]">Your journey starts here</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#eee6d7]/70">Favourite a monument, explore a time period, or finish a quiz. Your activity will appear here and stay in this browser.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link to="/explore" className="rounded-full bg-[#d7b879] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[.13em] text-[#211b12] hover:bg-[#eed69f]">Explore monuments</Link>
              <Link to="/timeline" className="rounded-full border border-[#d7b879]/30 px-5 py-2.5 text-[11px] uppercase tracking-[.13em] text-[#e7d4ac] hover:bg-[#d7b879]/10">Explore a time</Link>
            </div>
          </div>
        ) : (
          <div className="mt-7 grid gap-4 xl:grid-cols-2">
            <section className="rounded-xl border border-[#d7b879]/15 bg-[#171512]/65 p-4 md:p-5" aria-labelledby="profile-favorites-title">
              <div className="mb-4 flex items-center gap-2"><IconHeart className="h-4 w-4 text-[#d7b879]" aria-hidden="true" /><h3 id="profile-favorites-title" className="font-serif text-xl text-[#f4ecdd]">Favourite monuments</h3><span className="ml-auto text-[11px] text-[#eee6d7]/70">{favorites.length}</span></div>
              {favorites.length ? <div className="grid gap-2 sm:grid-cols-2">{favorites.map((monument) => <MonumentActivityButton key={monument.id} monument={monument} onSelect={(item) => { setSelectedMonument(item); onViewMonument(item.id); }} />)}</div> : <EmptyPanel>Favourite a place with the heart button in Explore Heritage to keep it here.</EmptyPanel>}
            </section>

            <section className="rounded-xl border border-[#d7b879]/15 bg-[#171512]/65 p-4 md:p-5" aria-labelledby="profile-viewed-title">
              <div className="mb-4 flex items-center gap-2"><IconClock className="h-4 w-4 text-[#d7b879]" aria-hidden="true" /><h3 id="profile-viewed-title" className="font-serif text-xl text-[#f4ecdd]">Recently viewed</h3><span className="ml-auto text-[11px] text-[#eee6d7]/70">{recentlyViewed.length}</span></div>
              {recentlyViewed.length ? <div className="grid gap-2 sm:grid-cols-2">{recentlyViewed.map((monument) => <MonumentActivityButton key={monument.id} monument={monument} onSelect={(item) => { setSelectedMonument(item); onViewMonument(item.id); }} />)}</div> : <EmptyPanel>Open a monument’s details in Explore Heritage and it will be listed here.</EmptyPanel>}
            </section>

            <section className="rounded-xl border border-[#d7b879]/15 bg-[#171512]/65 p-4 md:p-5" aria-labelledby="profile-timeline-title">
              <div className="mb-4 flex items-center gap-2"><IconHistory className="h-4 w-4 text-[#d7b879]" aria-hidden="true" /><h3 id="profile-timeline-title" className="font-serif text-xl text-[#f4ecdd]">Recent time travels</h3><span className="ml-auto text-[11px] text-[#eee6d7]/70">{activity.timelineExplorations.length}</span></div>
              {activity.timelineExplorations.length ? <ul className="space-y-2">{activity.timelineExplorations.map((item) => <li key={item.id} className="rounded-lg border border-[#d7b879]/10 bg-[#211e19] p-3"><div className="flex flex-wrap items-start justify-between gap-2"><Link to="/timeline" className="font-serif text-base text-[#ead9b7] hover:text-[#f4d99b]">{item.periodName} · {formatHistoricalYear(item.year)}</Link><time className="text-[11px] text-[#eee6d7]/70">{formatDate(item.exploredAt)}</time></div><p className="mt-1 text-xs text-[#eee6d7]/70">{[item.dynasty, item.eventTitle].filter(Boolean).join(" · ") || "Period overview"}</p></li>)}</ul> : <EmptyPanel>Use the Time Machine to choose a year, era, dynasty, or event.</EmptyPanel>}
            </section>

            <section className="rounded-xl border border-[#d7b879]/15 bg-[#171512]/65 p-4 md:p-5" aria-labelledby="profile-quiz-title">
              <div className="mb-4 flex items-center gap-2"><span className="flex h-4 w-4 items-center justify-center font-serif text-sm text-[#d7b879]" aria-hidden="true">✦</span><h3 id="profile-quiz-title" className="font-serif text-xl text-[#f4ecdd]">Recent quiz scores</h3><span className="ml-auto text-[11px] text-[#eee6d7]/70">{activity.quizResults.length}</span></div>
              {activity.quizResults.length ? <ul className="space-y-2">{activity.quizResults.map((result) => <li key={result.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#d7b879]/10 bg-[#211e19] p-3"><div><Link to="/quiz" className="font-serif text-base text-[#ead9b7] hover:text-[#f4d99b]">{result.score} / {result.total} correct</Link><p className="mt-1 text-[11px] uppercase tracking-[.12em] text-[#eee6d7]/70">{result.difficulty} · {result.category === "all" ? "All categories" : result.category}</p></div><time className="text-[11px] text-[#eee6d7]/70">{formatDate(result.completedAt)}</time></li>)}</ul> : <EmptyPanel>Finish a History Quiz round to save your score here.</EmptyPanel>}
            </section>
          </div>
        )}
      </div>

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent className="border-[#d7b879]/25 bg-[#201d18] text-[#f6f0e4]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#f4ecdd]">Clear saved history?</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-[#eee6d7]/70">This removes favourites, recently viewed monuments, timeline explorations, and quiz scores from this browser. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <button type="button" onClick={() => setConfirmClear(false)} className="rounded-full border border-[#d7b879]/30 px-4 py-2.5 text-[11px] uppercase tracking-[.12em] text-[#e7d4ac] hover:bg-[#d7b879]/10">Keep history</button>
            <button type="button" onClick={clearHistory} className="rounded-full bg-[#9c5f4e] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[.12em] text-white hover:bg-[#b36c58]">Clear history</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedMonument !== null} onOpenChange={(open) => { if (!open) setSelectedMonument(null); }}>
        {selectedMonument && <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto border-[#d7b879]/25 bg-[#201d18] text-[#f6f0e4]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#f4ecdd]">{selectedMonument.name}</DialogTitle>
            <DialogDescription className="text-[#eee6d7]/70">{selectedMonument.location} · {selectedMonument.period}</DialogDescription>
          </DialogHeader>
          <img src={selectedMonument.image} alt={`${selectedMonument.name} in ${selectedMonument.state}`} className="max-h-64 w-full rounded-lg object-cover" />
          <p className="text-sm leading-6 text-[#eee6d7]/75">{selectedMonument.description}</p>
          <Link to="/explore" onClick={() => setSelectedMonument(null)} className="inline-flex items-center gap-2 text-xs uppercase tracking-[.14em] text-[#e4c47f] hover:text-[#f4d99b]">Explore Heritage <IconArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
        </DialogContent>}
      </Dialog>
    </section>
  );
}

function MonumentActivityButton({ monument, onSelect }: { monument: Monument; onSelect: (monument: Monument) => void }) {
  return (
    <button type="button" onClick={() => onSelect(monument)} className="flex min-w-0 items-center gap-3 rounded-lg border border-[#d7b879]/10 bg-[#211e19] p-2.5 text-left transition-colors hover:border-[#d7b879]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]">
      <img src={monument.image} alt="" loading="lazy" className="h-12 w-14 shrink-0 rounded-md object-cover" />
      <span className="min-w-0"><span className="block truncate font-serif text-sm text-[#ead9b7]">{monument.name}</span><span className="mt-1 block truncate text-[11px] text-[#eee6d7]/70">{monument.location}</span></span>
    </button>
  );
}
