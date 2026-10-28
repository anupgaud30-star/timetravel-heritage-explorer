import { useOutletContext } from "react-router";

import { HistoryQuizSection } from "@/components/HistoryQuizSection";
import type { SiteContext } from "@/components/SiteShell";
import { APP_TITLE } from "@/lib/app-config";

export function meta() {
  return [{ title: "History Quiz | " + APP_TITLE }, { name: "description", content: "Test your knowledge of monuments, dynasties, rulers and events." }];
}

export default function PageRoute() {
  const profile = useOutletContext<SiteContext>();
  return (
    <div className="pt-10 md:pt-14">
      <HistoryQuizSection onComplete={profile.recordQuizResult} />
    </div>
  );
}
