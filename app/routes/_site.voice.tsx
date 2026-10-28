
import { VoiceCompanionSection } from "@/components/VoiceCompanionSection";
import { APP_TITLE } from "@/lib/app-config";

export function meta() {
  return [{ title: "Voice Assistant (demo) | " + APP_TITLE }, { name: "description", content: "Ask history questions by voice where your browser supports it." }];
}

export default function PageRoute() {
  return (
    <div className="pt-10 md:pt-14">
      <VoiceCompanionSection />
    </div>
  );
}
