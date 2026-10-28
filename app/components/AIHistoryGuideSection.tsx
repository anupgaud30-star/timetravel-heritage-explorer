import { useRef, useState, type FormEvent } from "react";
import {
  IconCheck,
  IconCompass,
  IconCopy,
  IconLoader2,
  IconMessageCircle2,
  IconPlayerPlay,
  IconRefresh,
  IconSend,
  IconTrash,
} from "@tabler/icons-react";

import { Textarea } from "@/components/ui/textarea";
import { askHistoryGuide, getCuratedDemoAnswer, GuideServiceError, type GuideAnswer } from "@/lib/ai-history-guide";

const suggestedQuestions = [
  "Why was Hampi an important city?",
  "Tell me the history of Gateway of India.",
  "Why was Daulatabad Fort important?",
  "What are Elephanta Caves famous for?",
  "Who built the Taj Mahal in Agra?",
];

type GuideMessage = {
  id: string;
  role: "visitor" | "guide";
  content: string;
  answer?: GuideAnswer;
};

export function AIHistoryGuideSection() {
  const [messages, setMessages] = useState<GuideMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryQuestion, setRetryQuestion] = useState("");
  const [fallbackQuestion, setFallbackQuestion] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const sequence = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const apiConfigured = true;

  const nextId = () => `guide-${Date.now()}-${++sequence.current}`;

  const askQuestion = async (question: string, retry = false) => {
    const message = question.trim();
    if (!message || pending) return;

    setError(null);
    setFallbackQuestion(null);
    setRetryQuestion(message);
    setDraft("");
    if (!retry) setMessages((current) => [...current, { id: nextId(), role: "visitor", content: message }]);

    const requestController = new AbortController();
    controller.current = requestController;
    setPending(true);
    try {
      if (!apiConfigured) await new Promise((resolve) => setTimeout(resolve, 450));
      const answer = await askHistoryGuide({ message }, requestController.signal);
      setMessages((current) => [...current, { id: nextId(), role: "guide", content: answer.answer, answer }]);
      setRetryQuestion("");
    } catch (cause) {
      if (requestController.signal.aborted) return;
      setError(cause instanceof GuideServiceError ? cause.message : "Something went wrong. Retry your question.");
      if (apiConfigured) setFallbackQuestion(message);
    } finally {
      if (controller.current === requestController) {
        controller.current = null;
        setPending(false);
      }
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void askQuestion(draft);
  };

  const clearConversation = () => {
    controller.current?.abort();
    controller.current = null;
    window.speechSynthesis?.cancel();
    setMessages([]);
    setDraft("");
    setPending(false);
    setError(null);
    setRetryQuestion("");
    setFallbackQuestion(null);
    setCopiedId(null);
  };

  const useDemoFallback = () => {
    if (!fallbackQuestion) return;
    const answer = getCuratedDemoAnswer(fallbackQuestion);
    setMessages((current) => [...current, { id: nextId(), role: "guide", content: answer.answer, answer }]);
    setFallbackQuestion(null);
    setRetryQuestion("");
    setError(null);
  };

  const copyAnswer = async (message: GuideMessage) => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
      window.setTimeout(() => setCopiedId((current) => current === message.id ? null : current), 1500);
    } catch {
      setError("Could not copy this answer. Your browser may block clipboard access.");
    }
  };

  const readAloud = (message: GuideMessage) => {
    if (!("speechSynthesis" in window)) {
      setError("Read aloud is not available in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(message.content));
  };

  return (
    <section id="guide" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 pb-24 md:px-10 xl:px-16" aria-labelledby="guide-title">
      <div className="overflow-hidden rounded-2xl border border-[#d7b879]/20 bg-[radial-gradient(ellipse_at_top_left,rgba(142,103,46,.14),transparent_35%),linear-gradient(145deg,#211e19,#191714)] shadow-[0_28px_80px_-55px_rgba(215,184,121,.42)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d7b879]/15 px-5 py-5 md:px-8">
          <div className="flex items-center gap-4">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[#d7b879]/45 bg-[#d7b879]/10 text-[#e4c47f]">
              <IconCompass className="h-6 w-6" stroke={1.3} aria-hidden="true" />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#211e19] bg-[#a7a778]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.24em] text-[#d7b879]">Your companion through history</p>
              <h2 id="guide-title" className="mt-1 font-serif text-2xl text-[#f4ecdd] md:text-3xl">AI History Guide</h2>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[.14em] ${apiConfigured ? "border-[#9eaa74]/35 text-[#c4d19b]" : "border-[#d7b879]/25 text-[#e2cfaa]/85"}`}>
              {apiConfigured ? "Live AI Active · Google Gemini 3.5" : "Demo mode · not live AI"}
            </span>
            <button type="button" onClick={clearConversation} disabled={!messages.length && !error && !pending} className="inline-flex items-center gap-2 rounded-full border border-[#d7b879]/20 px-3 py-2 text-[11px] uppercase tracking-[.13em] text-[#eee6d7]/65 transition-colors hover:border-[#d7b879]/50 hover:text-[#f4ecdd] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]"><IconTrash className="h-3.5 w-3.5" aria-hidden="true" /> Clear</button>
          </div>
        </div>

        <div className="grid min-h-[560px] lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex min-h-[520px] flex-col border-b border-[#d7b879]/10 lg:border-b-0 lg:border-r">
            <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6 md:px-8" aria-live="polite" aria-relevant="additions text">
              {!messages.length && !pending ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#d7b879]/30 bg-[#d7b879]/[.06] text-[#d7b879]"><IconCompass className="h-8 w-8" stroke={1.2} aria-hidden="true" /></div>
                  <h3 className="mt-5 font-serif text-2xl text-[#f4ecdd]">Ask history a question</h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-[#eee6d7]/70">Explore monuments, empires, rulers, and events. Start with a suggested question or ask your own.</p>
                  {!apiConfigured && <p className="mt-4 max-w-md text-xs leading-5 text-[#d7b879]/75">Demo mode uses four curated sample answers. Other questions receive a clear notice instead of invented history.</p>}
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <article key={message.id} className={`flex gap-3 ${message.role === "visitor" ? "justify-end" : "justify-start"}`}>
                      {message.role === "guide" && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d7b879]/35 bg-[#d7b879]/10 text-[#d7b879]"><IconCompass className="h-4 w-4" stroke={1.4} aria-hidden="true" /></div>}
                      <div className={`max-w-[min(100%,640px)] rounded-2xl px-4 py-3.5 ${message.role === "visitor" ? "rounded-br-sm border border-[#d7b879]/25 bg-[#31291c] text-[#f6f0e4]" : "rounded-bl-sm border border-white/[.07] bg-[#28241e] text-[#eee6d7]/85"}`}>
                        {message.role === "guide" && message.answer && <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.17em] text-[#d7b879]">{message.answer.mode === "demo" ? "Curated demo response" : "History guide response"}</p>}
                        <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                        {message.answer && message.answer.sources.length > 0 ? (
                          <div className="mt-4 border-t border-[#d7b879]/15 pt-3"><p className="text-[11px] font-semibold uppercase tracking-[.17em] text-[#d7b879]">Sources</p><ul className="mt-2 space-y-1.5">{message.answer.sources.map((source) => <li key={`${source.url}-${source.title}`}><a href={source.url} target="_blank" rel="noreferrer" className="text-xs text-[#e4c47f] underline decoration-[#d7b879]/30 underline-offset-2 hover:decoration-[#d7b879]">{source.title} ↗</a></li>)}</ul></div>
                        ) : message.role === "guide" && (
                          <p className="mt-3 border-t border-[#d7b879]/10 pt-2 text-[11px] text-[#eee6d7]/70">No source links were provided for this response.</p>
                        )}
                        {message.role === "guide" && <div className="mt-3 flex gap-2 border-t border-[#d7b879]/10 pt-2">
                          <button type="button" onClick={() => void copyAnswer(message)} aria-label="Copy answer" className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] text-[#eee6d7]/70 transition-colors hover:text-[#e4c47f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]">{copiedId === message.id ? <IconCheck className="h-3.5 w-3.5" aria-hidden="true" /> : <IconCopy className="h-3.5 w-3.5" aria-hidden="true" />}{copiedId === message.id ? "Copied" : "Copy"}</button>
                          <button type="button" onClick={() => readAloud(message)} aria-label="Read answer aloud" className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] text-[#eee6d7]/70 transition-colors hover:text-[#e4c47f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]"><IconPlayerPlay className="h-3.5 w-3.5" aria-hidden="true" /> Read aloud</button>
                        </div>}
                      </div>
                    </article>
                  ))}
                  {pending && <div className="flex items-center gap-3 text-sm text-[#d9c394]" role="status"><div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d7b879]/35 bg-[#d7b879]/10"><IconCompass className="h-4 w-4" aria-hidden="true" /></div><span className="inline-flex items-center gap-2">{apiConfigured ? "Checking the history guide" : "Preparing curated demo response"}<IconLoader2 className="h-4 w-4 animate-spin" aria-hidden="true" /></span><span className="flex gap-1" aria-label="Typing"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#d7b879] [animation-delay:-.2s]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#d7b879] [animation-delay:-.1s]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#d7b879]" /></span></div>}
                </>
              )}
              {error && <div role="alert" className="ml-11 max-w-[640px] rounded-xl border border-[#c87968]/35 bg-[#5a3028]/20 p-4 text-sm text-[#f0c7b8]"><p>{error}</p><div className="mt-3 flex flex-wrap gap-2">{retryQuestion && <button type="button" onClick={() => void askQuestion(retryQuestion, true)} disabled={pending} className="inline-flex items-center gap-2 rounded-full border border-[#d8a18e]/40 px-3 py-1.5 text-[11px] uppercase tracking-[.13em] text-[#f0c7b8] hover:bg-[#5a3028]/30 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8a18e]"><IconRefresh className="h-3.5 w-3.5" aria-hidden="true" /> Retry</button>}{fallbackQuestion && <button type="button" onClick={useDemoFallback} disabled={pending} className="rounded-full border border-[#d7b879]/35 px-3 py-1.5 text-[11px] uppercase tracking-[.12em] text-[#e4c47f] hover:bg-[#d7b879]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]">Use curated demo answer</button>}</div></div>}
            </div>

            <div className="border-t border-[#d7b879]/15 bg-[#171512]/55 p-4 md:px-8 md:py-5">
              {!messages.length && <div className="mb-4 flex flex-wrap gap-2">{suggestedQuestions.map((question) => <button key={question} type="button" onClick={() => void askQuestion(question)} disabled={pending} className="rounded-full border border-[#d7b879]/20 bg-[#211e19] px-3 py-2 text-left text-[11px] leading-4 text-[#e6d7bd]/80 transition-colors hover:border-[#d7b879]/55 hover:text-[#f4ecdd] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]">{question}</button>)}</div>}
              <form onSubmit={handleSubmit} className="flex items-end gap-3 rounded-xl border border-[#d7b879]/25 bg-[#211e19] p-2 focus-within:border-[#d7b879]/60">
                <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Ask about a monument, ruler, dynasty, or event…" aria-label="Ask the AI History Guide" rows={2} disabled={pending} className="max-h-36 min-h-12 resize-none border-0 bg-transparent text-sm leading-6 text-[#f6f0e4] placeholder:text-[#eee6d7]/70 focus-visible:ring-0" />
                <button type="submit" aria-label="Send question" disabled={pending || !draft.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#d7b879] text-[#211b12] transition-colors hover:bg-[#ead19a] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1dcae]"><IconSend className="h-4 w-4" aria-hidden="true" /></button>
              </form>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[#eee6d7]/70"><IconMessageCircle2 className="h-3 w-3" aria-hidden="true" /> Enter to send · Shift + Enter for a new line</p>
            </div>
          </div>

          <aside className="p-5 md:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-[#d7b879]">Start a conversation</p>
            <h3 className="mt-2 font-serif text-xl text-[#ead9b7]">Questions worth asking</h3>
            <div className="mt-4 space-y-2">{suggestedQuestions.map((question, index) => <button key={question} type="button" onClick={() => void askQuestion(question)} disabled={pending} className="group flex w-full items-start gap-3 rounded-lg border border-[#d7b879]/10 bg-[#171512]/50 p-3 text-left transition-colors hover:border-[#d7b879]/35 hover:bg-[#171512] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]"><span className="pt-0.5 font-serif text-xs italic text-[#bca77e]">0{index + 1}</span><span className="text-xs leading-5 text-[#eee6d7]/70 group-hover:text-[#f4ecdd]">{question}</span></button>)}</div>
            <div className="mt-6 border-t border-[#d7b879]/15 pt-5">
              <p className="text-[11px] uppercase tracking-[.18em] text-[#d8c49b]/80">Guide mode</p>
              <p className="mt-2 text-xs leading-5 text-[#eee6d7]/70">{apiConfigured ? "Responses are provided by the configured backend. Only its returned citations appear as sources." : "Curated sample answers only. No AI provider or live history database is connected."}</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
