import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";

import { useProfileActivity } from "@/lib/profile-activity";

export type SiteContext = ReturnType<typeof useProfileActivity>;

export const navItems = [
  { label: "Home", to: "/" },
  { label: "Explore Heritage", to: "/explore" },
  { label: "Knowledge Explorer", to: "/knowledge" },
  { label: "Time Machine", to: "/timeline" },
  { label: "AI History Guide", to: "/guide" },
  { label: "Voice Assistant", to: "/voice" },
  { label: "History Quiz", to: "/quiz" },
  { label: "Profile", to: "/profile" },
] as const;

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap rounded px-1 py-1 text-xs font-medium tracking-wide transition-colors hover:text-[#e2bf75] ${isActive ? "text-[#e8c577] underline decoration-[#d7b879] decoration-2 underline-offset-8" : "text-[#eee6d7]/80"}`;

export function SiteShell() {
  const profile = useProfileActivity();
  const { pathname } = useLocation();

  // Each page starts at the top when navigating between routes.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#171512] text-[#f6f0e4]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-[#d7b879] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#211b12]">Skip to main content</a>
      <header className="sticky top-0 z-30 border-b border-[#d7b879]/15 bg-[#171512]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-3 md:px-10 xl:px-16">
          <Link to="/" className="group flex items-center gap-3" aria-label="TimeTravel Heritage Explorer home">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d7b879]/50 text-[#e3c384] transition-colors group-hover:bg-[#d7b879]/10">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M12 3v18M5 8h14M7 8l5-5 5 5M6 21h12M8 8v9m4-9v9m4-9v9M4 17h16" /></svg>
            </span>
            <span className="font-serif text-[15px] leading-tight tracking-wide text-[#f6f0e4] md:text-base">TimeTravel <span className="block text-[11px] uppercase tracking-[.24em] text-[#d7b879]">Heritage Explorer</span></span>
          </Link>
          <nav className="hidden items-center gap-5 lg:flex" aria-label="Main navigation">
            {navItems.map((item) => <NavLink key={item.to} to={item.to} end={item.to === "/"} className={linkClass}>{item.label}</NavLink>)}
          </nav>
        </div>
        <nav className="flex gap-5 overflow-x-auto border-t border-white/5 px-5 py-2.5 lg:hidden" aria-label="Mobile navigation">
          {navItems.map((item) => <NavLink key={item.to} to={item.to} end={item.to === "/"} className={(state) => `shrink-0 ${linkClass(state)}`}>{item.label}</NavLink>)}
        </nav>
      </header>
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <Outlet context={profile satisfies SiteContext} />
      </main>
      <footer className="border-t border-[#d7b879]/10 px-5 py-6 text-center text-[11px] uppercase tracking-[.18em] text-[#eee6d7]/70">TimeTravel Heritage Explorer <span className="mx-2 text-[#d7b879]/85">·</span> Explore forgotten places. Travel through time. Discover our history.</footer>
    </div>
  );
}
