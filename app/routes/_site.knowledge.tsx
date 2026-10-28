
import { KnowledgeExplorerSection } from "@/components/KnowledgeExplorerSection";
import { APP_TITLE } from "@/lib/app-config";

export function meta() {
  return [{ title: "Knowledge Explorer | " + APP_TITLE }, { name: "description", content: "Search people, dynasties, battles, monuments and ideas from history." }];
}

export default function PageRoute() {
  return (
    <div className="pt-10 md:pt-14">
      <KnowledgeExplorerSection />
    </div>
  );
}
