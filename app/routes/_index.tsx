import { AIHistoryGuideSection } from "@/components/AIHistoryGuideSection";
import { ExploreHeritageSection } from "@/components/ExploreHeritageSection";
import { HistoryQuizSection } from "@/components/HistoryQuizSection";
import { KnowledgeExplorerSection } from "@/components/KnowledgeExplorerSection";
import { TimeMachineSection } from "@/components/TimeMachineSection";
import { VoiceCompanionSection } from "@/components/VoiceCompanionSection";
import { APP_TITLE } from "@/lib/app-config";

const navItems = [
  ["Home", "#home"],
  ["Explore Heritage", "#discover"],
  ["Knowledge Explorer", "#knowledge"],
  ["Time Machine", "#timeline"],
  ["AI History Guide", "#guide"],
  ["Voice Assistant", "#voice"],
  ["History Quiz", "#quiz"],
  ["Profile", "#profile"],
];

const stats = [
  { value: "2,400+", label: "Historical places" },
  { value: "12", label: "Ancient eras" },
  { value: "86", label: "Dynasties" },
  { value: "1,200+", label: "Discoveries" },
];

export function meta() {
  return [
    { title: APP_TITLE },
    { name: "description", content: "Explore forgotten places, travel through time, and discover our history." },
  ];
}

export default function HomeRoute() {
  return (
    <main id="home" className="min-h-screen bg-[#171512] text-[#f6f0e4]">
      <section className="heritage-hero relative isolate min-h-[760px] overflow-hidden md:min-h-[820px]">
        <div className="absolute inset-0 -z-20 bg-cover bg-[center_48%]" style={{ backgroundImage: "url('https://images.pexels.com/photos/37626184/pexels-photo-37626184.jpeg')" }} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#110f0c]/80 via-[#171512]/35 to-[#171512]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#171512]/75 via-transparent to-[#171512]/10" />

        <header className="sticky top-0 z-20 border-b border-[#d7b879]/15 bg-[#171512]/75 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 md:px-10 xl:px-16">
            <a href="#home" className="group flex items-center gap-3" aria-label="TimeTravel Heritage Explorer home">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d7b879]/50 text-[#e3c384] transition-colors group-hover:bg-[#d7b879]/10">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M12 3v18M5 8h14M7 8l5-5 5 5M6 21h12M8 8v9m4-9v9m4-9v9M4 17h16" /></svg>
              </span>
              <span className="font-serif text-[15px] leading-tight tracking-wide text-[#f6f0e4] md:text-base">TimeTravel <span className="block text-[10px] uppercase tracking-[.28em] text-[#d7b879]">Heritage Explorer</span></span>
            </a>
            <nav className="hidden items-center gap-6 lg:flex" aria-label="Main navigation">
              {navItems.map(([label, href]) => <a key={label} href={href} className="whitespace-nowrap text-[11px] font-medium tracking-wide text-[#eee6d7]/75 transition-colors hover:text-[#e2bf75]">{label}</a>)}
            </nav>
            <a href="#discover" className="rounded-full border border-[#d7b879] bg-[#d7b879] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[.12em] text-[#211b12] transition-all hover:bg-[#e9cf97] md:px-5">Start Exploring</a>
          </div>
          <nav className="flex gap-5 overflow-x-auto border-t border-white/5 px-5 py-3 lg:hidden" aria-label="Mobile navigation">
            {navItems.map(([label, href]) => <a key={label} href={href} className="shrink-0 text-[11px] text-[#eee6d7]/75 hover:text-[#e2bf75]">{label}</a>)}
          </nav>
        </header>

        <div className="mx-auto flex min-h-[610px] max-w-[1440px] items-center px-6 pb-24 pt-16 md:min-h-[690px] md:px-16 md:pb-32">
          <div className="max-w-[780px] animate-[rise-in_.9s_ease-out_both]">
            <div className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[.34em] text-[#e4c47f] md:text-xs"><span className="h-px w-10 bg-[#d7b879]" /> A journey across time <span className="h-px w-10 bg-[#d7b879]" /></div>
            <h1 className="max-w-[760px] font-serif text-[clamp(3.2rem,8vw,6.8rem)] leading-[.98] tracking-[-.045em] text-[#f8f1e5]">History Is Not Just the Past.<br /><em className="font-normal text-[#e1c17e]">It Is a World</em> Waiting to Be Explored.</h1>
            <p className="mt-7 max-w-[590px] text-sm leading-7 text-[#eee6d7]/80 md:text-base md:leading-8">Discover ancient civilizations, explore forgotten monuments, travel across historical timelines, and talk to your personal AI history guide.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#discover" className="group inline-flex items-center gap-3 rounded-full bg-[#d7b879] px-6 py-3.5 text-xs font-semibold uppercase tracking-[.12em] text-[#211b12] transition-all hover:bg-[#eed69f]">Explore Heritage <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span></a>
              <a href="#timeline" className="rounded-full border border-[#eee6d7]/35 bg-black/15 px-6 py-3.5 text-xs font-semibold uppercase tracking-[.12em] text-[#f6f0e4] transition-colors hover:border-[#d7b879] hover:text-[#e2bf75]">Travel Through Time</a>
              <a href="#guide" className="rounded-full border border-[#eee6d7]/35 bg-black/15 px-6 py-3.5 text-xs font-semibold uppercase tracking-[.12em] text-[#f6f0e4] transition-colors hover:border-[#d7b879] hover:text-[#e2bf75]">Talk to AI Guide</a>
            </div>
            <div className="mt-12 flex items-center gap-3 text-[10px] uppercase tracking-[.25em] text-[#eee6d7]/60"><span className="h-px w-8 bg-[#d7b879]/70" /> Hampi, Karnataka · 14th century</div>
          </div>
        </div>
        <a href="#discover" aria-label="Scroll to discover" className="absolute bottom-10 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-[9px] uppercase tracking-[.3em] text-[#f6f0e4]/55 md:flex">Scroll to discover<span className="h-10 w-px bg-gradient-to-b from-[#d7b879] to-transparent" /></a>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#171512] to-transparent" />
      </section>

      <section id="discover" className="relative z-10 mx-auto -mt-2 max-w-[1440px] px-5 pb-20 md:px-10 xl:px-16">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#d7b879]">The past, at a glance</p><h2 className="mt-2 font-serif text-2xl text-[#f4ecdd] md:text-3xl">A world of stories awaits</h2></div>
          <span className="rounded-full border border-[#d7b879]/25 px-3 py-1.5 text-[9px] uppercase tracking-[.17em] text-[#e2cfaa]/65">Sample statistics</span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat, index) => <article key={stat.label} className="group rounded-xl border border-[#d7b879]/15 bg-gradient-to-br from-[#262119] to-[#1c1915] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#d7b879]/50 md:p-7">
            <div className="mb-5 flex items-center justify-between"><span className="font-serif text-xs italic text-[#bca77e]">0{index + 1}</span><span className="h-px w-8 bg-[#d7b879]/40 transition-all group-hover:w-12 group-hover:bg-[#d7b879]" /></div>
            <p className="font-serif text-3xl text-[#e7cb8e] md:text-4xl">{stat.value}</p><p className="mt-2 text-xs tracking-wide text-[#eee6d7]/60">{stat.label}</p>
          </article>)}
        </div>
        <ExploreHeritageSection />
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pb-24 md:px-10 xl:px-16">
        <div className="grid gap-8 border-t border-[#d7b879]/15 pt-8 md:grid-cols-[1fr_auto] md:items-end">
          <div><p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#d7b879]">Your next great discovery</p><h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight text-[#f4ecdd] md:text-5xl">Every stone holds a story.<br /><em className="font-normal text-[#d7b879]">Where will yours begin?</em></h2></div>
          <a href="#timeline" className="inline-flex w-fit items-center gap-3 border-b border-[#d7b879]/60 pb-2 text-xs uppercase tracking-[.16em] text-[#f0dfbc] transition-colors hover:text-[#e8c577]">Enter the time machine <span aria-hidden="true">↗</span></a>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[["#timeline", "Time Machine", "Journey through the ages"], ["#guide", "AI History Guide", "Ask the stories that shaped us"], ["#quiz", "Test Your Knowledge", "A little history, a little wonder"]].map(([href, title, caption]) => <a key={title} href={href} className="rounded-lg border border-[#d7b879]/15 bg-[#211e19] p-5 transition-all hover:border-[#d7b879]/50 hover:bg-[#29241c]"><span className="font-serif text-lg text-[#e7d4ac]">{title}</span><span className="mt-1 block text-xs text-[#eee6d7]/55">{caption}</span></a>)}
          <span id="profile" className="sr-only">Profile</span>
        </div>
      </section>
      <KnowledgeExplorerSection />
      <TimeMachineSection />
      <AIHistoryGuideSection />
      <VoiceCompanionSection />
      <HistoryQuizSection />
      <footer className="border-t border-[#d7b879]/10 px-5 py-6 text-center text-[10px] uppercase tracking-[.22em] text-[#eee6d7]/35">TimeTravel Heritage Explorer <span className="mx-2 text-[#d7b879]/50">·</span> Explore Forgotten Places. Travel Through Time. Discover Our History.</footer>
    </main>
  );
}
