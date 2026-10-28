import { useOutletContext } from "react-router";

import { ExploreHeritageSection } from "@/components/ExploreHeritageSection";
import type { SiteContext } from "@/components/SiteShell";
import { APP_TITLE } from "@/lib/app-config";

export function meta() {
  return [{ title: "Explore Heritage | " + APP_TITLE }, { name: "description", content: "Search and filter historical monuments by era, state, dynasty and category." }];
}

export default function PageRoute() {
  const profile = useOutletContext<SiteContext>();
  return (
    <div className="pt-10 md:pt-14">
      <div className="mx-auto max-w-[1440px] px-5 pb-20 md:px-10 xl:px-16"><ExploreHeritageSection favoriteMonumentIds={profile.activity.favoriteMonumentIds} onToggleFavorite={profile.toggleFavorite} onViewMonument={profile.recordViewedMonument} /></div>
    </div>
  );
}
