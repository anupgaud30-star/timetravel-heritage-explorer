import { useOutletContext } from "react-router";

import { TimeMachineSection } from "@/components/TimeMachineSection";
import type { SiteContext } from "@/components/SiteShell";
import { APP_TITLE } from "@/lib/app-config";

export function meta() {
  return [{ title: "Time Machine | " + APP_TITLE }, { name: "description", content: "Travel through historical periods with an interactive timeline." }];
}

export default function PageRoute() {
  const profile = useOutletContext<SiteContext>();
  return (
    <div className="pt-10 md:pt-14">
      <TimeMachineSection onExplore={profile.recordTimelineExploration} />
    </div>
  );
}
