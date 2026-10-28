import { useOutletContext } from "react-router";

import { ProfileDashboardSection } from "@/components/ProfileDashboardSection";
import type { SiteContext } from "@/components/SiteShell";
import { APP_TITLE } from "@/lib/app-config";

export function meta() {
  return [{ title: "Your Heritage Dashboard | " + APP_TITLE }, { name: "description", content: "Favourites, recent activity and quiz results saved on this device." }];
}

export default function PageRoute() {
  const profile = useOutletContext<SiteContext>();
  return (
    <div className="pt-10 md:pt-14">
      <ProfileDashboardSection activity={profile.activity} hasLoaded={profile.hasLoaded} onClear={profile.clearActivity} onViewMonument={profile.recordViewedMonument} />
    </div>
  );
}
