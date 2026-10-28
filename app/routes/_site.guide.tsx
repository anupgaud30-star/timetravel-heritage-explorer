
import { AIHistoryGuideSection } from "@/components/AIHistoryGuideSection";
import { APP_TITLE } from "@/lib/app-config";

export function meta() {
  return [{ title: "AI History Guide (demo) | " + APP_TITLE }, { name: "description", content: "Ask the history guide a question. Demo mode uses curated sample answers." }];
}

export default function PageRoute() {
  return (
    <div className="pt-10 md:pt-14">
      <AIHistoryGuideSection />
    </div>
  );
}
