import { Link } from "react-router";

import { APP_TITLE } from "@/lib/app-config";
import { historicalKnowledge } from "@/lib/knowledge-data";
import { historyQuizQuestions } from "@/lib/history-quiz-data";
import { monuments } from "@/lib/monuments";
import { historicalPeriods, timelineEvents } from "@/lib/timeline-data";

export function meta() {
  return [
    { title: APP_TITLE },
    { name: "description", content: "Explore forgotten places, travel through time, and discover our history." },
  ];
}

const stats = [
  { value: monuments.length, label: "Heritage places" },
  { value: historicalPeriods.length, label: "Historical eras" },
  { value: timelineEvents.length, label: "Timeline events" },
  { value: historicalKnowledge.length, label: "Knowledge entries" },
  { value: historyQuizQuestions.length, label: "Quiz questions" },
];

const features = [
  { to: "/explore", title: "Explore Heritage", text: "Search and filter monuments by era, state, dynasty and category. Save favourites." },
  { to: "/knowledge", title: "Knowledge Explorer", text: "Look up rulers, dynasties, battles, monuments and ideas." },
  { to: "/timeline", title: "Time Machine", text: "Pick a year or era and see what happened and which places connect to it." },
  { to: "/guide", title: "AI History Guide", text: "Chat with the guide. Demo mode answers four curated sample questions." },
  { to: "/voice", title: "Voice Assistant", text: "Ask by voice in English, Hindi or Marathi where your browser supports it." },
  { to: "/quiz", title: "History Quiz", text: "Test yourself by difficulty and category, with explanations." },
  { to: "/profile", title: "Your Dashboard", text: "Favourites, recent places, explored eras and quiz scores saved on this device." },
];

const cardLink = "rounded-lg border border-[#d7b879]/15 bg-[#211e19] p-5 transition-all hover:border-[#d7b879]/50 hover:bg-[#29241c]";

export default function HomeRoute() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#1d1812]">
        <div className="absolute inset-0 -z-20 bg-cover bg-[center_48%]" style={{ backgroundImage: "url('https://images.pexels.com/photos/37626184/pexels-photo-37626184.jpeg')" }} aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#110f0c]/80 via-[#171512]/45 to-[#171512]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#171512]/80 via-[#171512]/30 to-[#171512]/10" />
        <div className="mx-auto flex min-h-[560px] max-w-[1440px] items-center px-6 pb-20 pt-16 md:min-h-[640px] md:px-16">
          <div className="max-w-[780px]">
            <p className="mb-6 flex items-center gap-3 text-xs font-semibold tracking-[.2em] text-[#e4c47f]"><span className="h-px w-10 bg-[#d7b879]" aria-hidden="true" /> A journey across time</p>
            <h1 className="max-w-[760px] font-serif text-[clamp(2.6rem,8vw,6rem)] leading-[1] tracking-[-.04em] text-[#f8f1e5]">History is not just the past. <em className="font-normal text-[#e1c17e]">It is a world</em> waiting to be explored.</h1>
            <p className="mt-7 max-w-[590px] text-base leading-8 text-[#eee6d7]/85">Discover ancient civilizations, explore forgotten monuments, travel across historical timelines, and ask a history guide your questions.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/explore" className="rounded-full bg-[#d7b879] px-6 py-3.5 text-sm font-semibold text-[#211b12] transition-colors hover:bg-[#eed69f]">Explore heritage</Link>
              <Link to="/timeline" className="rounded-full border border-[#eee6d7]/45 bg-black/25 px-6 py-3.5 text-sm font-semibold text-[#f6f0e4] transition-colors hover:border-[#d7b879] hover:text-[#e2bf75]">Travel through time</Link>
              <Link to="/guide" className="rounded-full border border-[#eee6d7]/45 bg-black/25 px-6 py-3.5 text-sm font-semibold text-[#f6f0e4] transition-colors hover:border-[#d7b879] hover:text-[#e2bf75]">Talk to the guide</Link>
            </div>
            <p className="mt-10 text-xs tracking-[.14em] text-[#eee6d7]/70">Hampi, Karnataka · 14th century</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-14 md:px-10 xl:px-16" aria-labelledby="stats-title">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <h2 id="stats-title" className="font-serif text-2xl text-[#f4ecdd] md:text-3xl">What is inside</h2>
          <span className="rounded-full border border-[#d7b879]/30 px-3 py-1.5 text-[11px] text-[#e2cfaa]/80">Demo dataset · counts reflect included sample data</span>
        </div>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {stats.map((stat) => <li key={stat.label} className="rounded-xl border border-[#d7b879]/15 bg-gradient-to-br from-[#262119] to-[#1c1915] p-5"><p className="font-serif text-4xl text-[#e7cb8e]">{stat.value}</p><p className="mt-2 text-sm text-[#eee6d7]/75">{stat.label}</p></li>)}
        </ul>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pb-24 md:px-10 xl:px-16" aria-labelledby="features-title">
        <h2 id="features-title" className="font-serif text-3xl text-[#f4ecdd] md:text-4xl">Where will your story begin?</h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => <li key={feature.to}><Link to={feature.to} className={`${cardLink} block h-full`}><span className="font-serif text-lg text-[#e7d4ac]">{feature.title}</span><span className="mt-1 block text-sm leading-6 text-[#eee6d7]/70">{feature.text}</span></Link></li>)}
        </ul>
      </section>
    </>
  );
}
