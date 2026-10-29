import { Link, useOutletContext } from "react-router";

import { ProfileDashboardSection } from "@/components/ProfileDashboardSection";
import type { SiteContext } from "@/components/SiteShell";
import { APP_TITLE } from "@/lib/app-config";
import { useAuth } from "@/hooks/use-auth";

export function meta() {
  return [{ title: "Your Heritage Dashboard | " + APP_TITLE }, { name: "description", content: "Favourites, recent activity and quiz results saved on this device." }];
}

export default function PageRoute() {
  const profile = useOutletContext<SiteContext>();
  const { user, loading: authLoading } = useAuth();

  return (
    <div className="pt-10 md:pt-14">
      {/* Auth banner */}
      {!authLoading && !user && (
        <div className="mx-auto mb-6 max-w-[1440px] px-5 md:px-10 xl:px-16">
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#d7b879]/20 bg-[#211e19] px-5 py-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#f4ecdd]">Want to sync across devices?</p>
              <p className="mt-0.5 text-xs leading-5 text-[#eee6d7]/65">
                Create a free account to save your favourites, quiz scores, and history to the cloud.
              </p>
            </div>
            <Link
              to="/login"
              className="shrink-0 rounded-full bg-[#d7b879] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[.13em] text-[#211b12] hover:bg-[#eed69f] transition-colors"
            >
              Sign in / Sign up
            </Link>
          </div>
        </div>
      )}

      {!authLoading && user && (
        <div className="mx-auto mb-6 max-w-[1440px] px-5 md:px-10 xl:px-16">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#d7b879]/15 bg-[#211e19]/60 px-5 py-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d7b879]/20 font-serif text-base text-[#e3c384]">
              {(user.user_metadata?.display_name ?? user.email ?? "U")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-[#f4ecdd]">
                {user.user_metadata?.display_name ?? user.email}
              </p>
              <p className="text-[11px] text-[#eee6d7]/60">Signed in · cloud sync active</p>
            </div>
          </div>
        </div>
      )}

      <ProfileDashboardSection activity={profile.activity} hasLoaded={profile.hasLoaded} onClear={profile.clearActivity} onViewMonument={profile.recordViewedMonument} />
    </div>
  );
}

