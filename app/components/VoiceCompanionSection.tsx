import { useEffect, useRef, useState, type FormEvent } from "react";
import { IconAlertCircle, IconCheck, IconMicrophone, IconPlayerPause, IconPlayerPlay, IconRefresh, IconSend, IconWaveSine } from "@tabler/icons-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { askHistoryGuide, getCuratedDemoAnswer, type GuideAnswer } from "@/lib/ai-history-guide";

type VoiceStatus = "idle" | "listening" | "processing" | "speaking" | "error";
type VoiceLanguage = "en-IN" | "hi-IN" | "mr-IN";
type VoiceTurn = { id: string; question: string; answer?: GuideAnswer; error?: string; fallbackAvailable?: boolean };
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { results: ArrayLike<RecognitionResult> };
type RecognitionErrorEvent = { error: string };
type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;
type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const languages: { code: VoiceLanguage; label: string }[] = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "Hindi" },
  { code: "mr-IN", label: "Marathi" },
];

const statusLabels: Record<VoiceStatus, string> = {
  idle: "Idle",
  listening: "Listening",
  processing: "Processing",
  speaking: "Speaking",
  error: "Error",
};

function recognitionMessage(code: string) {
  if (code === "not-allowed" || code === "service-not-allowed") return "Microphone access was denied. Allow microphone access in your browser settings, then try again.";
  if (code === "audio-capture") return "No microphone was found. Connect a microphone or type your question below.";
  if (code === "no-speech") return "No speech was detected. Try again or type your question instead.";
  return "Voice recognition could not start. You can retry or type your question instead.";
}

export function VoiceCompanionSection() {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [language, setLanguage] = useState<VoiceLanguage>("en-IN");
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [synthesisSupported, setSynthesisSupported] = useState(false);
  const [featuresReady, setFeaturesReady] = useState(false);
  const [question, setQuestion] = useState("");
  const [partialTranscript, setPartialTranscript] = useState("");
  const [turns, setTurns] = useState<VoiceTurn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const sequence = useRef(0);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const finalTranscriptRef = useRef("");
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    const speechWindow = window as SpeechWindow;
    setRecognitionSupported(Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition));
    setSynthesisSupported("speechSynthesis" in window && "SpeechSynthesisUtterance" in window);
    setFeaturesReady(true);
    return () => {
      mountedRef.current = false;
      recognitionRef.current?.abort();
      requestRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const askQuestion = async (rawQuestion: string, existingTurnId?: string) => {
    const text = rawQuestion.trim();
    if (!text || status === "processing") return;
    const turnId = existingTurnId ?? `voice-${Date.now()}-${++sequence.current}`;
    const request = new AbortController();
    requestRef.current?.abort();
    requestRef.current = request;
    setQuestion("");
    setPartialTranscript("");
    setError(null);
    setNotice(null);
    setTurns((current) => existingTurnId
      ? current.map((turn) => turn.id === turnId ? { ...turn, error: undefined } : turn)
      : [...current, { id: turnId, question: text }],
    );
    setStatus("processing");
    try {
      const answer = await askHistoryGuide({ message: text }, request.signal);
      if (!mountedRef.current) return;
      setTurns((current) => current.map((turn) => turn.id === turnId ? { ...turn, answer, error: undefined } : turn));
      if (answer.mode === "demo") setNotice("Demo mode · this is a curated sample response, not a live AI answer.");
      setStatus("idle");
    } catch {
      if (!mountedRef.current || request.signal.aborted) return;
      const message = "The history guide service is unavailable. Retry the question or try again later.";
      setTurns((current) => current.map((turn) => turn.id === turnId ? { ...turn, error: message, fallbackAvailable: true } : turn));
      setError(message);
      setNotice("Backend unavailable. You can retry or choose a clearly labeled curated demo response.");
      setStatus("error");
    } finally {
      if (requestRef.current === request) requestRef.current = null;
    }
  };

  const startListening = () => {
    if (!recognitionSupported) {
      setError("Speech recognition is not supported in this browser. Type your question below instead.");
      setStatus("error");
      return;
    }
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) return;

    recognitionRef.current?.abort();
    finalTranscriptRef.current = "";
    setPartialTranscript("");
    setError(null);
    setNotice(null);

    const recognition = new Recognition();
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      finalTranscriptRef.current = finalText.trim();
      setPartialTranscript(interimText.trim());
    };
    recognition.onerror = (event) => {
      setError(recognitionMessage(event.error));
      setStatus("error");
      setIsListening(false);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      if (!mountedRef.current) return;
      setIsListening(false);
      const recognized = finalTranscriptRef.current.trim();
      if (recognized) {
        setQuestion(recognized);
        setStatus("processing");
        void askQuestion(recognized);
      } else {
        setStatus((current) => current === "listening" ? "idle" : current);
      }
    };
    recognitionRef.current = recognition;
    setIsListening(true);
    setStatus("listening");
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setStatus("error");
      setError("Could not start speech recognition. Check microphone permission or type your question instead.");
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setStatus("idle");
  };

  const useDemoFallback = (turn: VoiceTurn) => {
    const answer = getCuratedDemoAnswer(turn.question);
    setTurns((current) => current.map((item) => item.id === turn.id ? { ...item, answer, error: undefined, fallbackAvailable: false } : item));
    setError(null);
    setNotice("Demo mode · this curated response is not a live AI answer.");
    setStatus("idle");
  };

  const speakAnswer = (answer: GuideAnswer) => {
    if (!synthesisSupported) {
      setError("Speech playback is not supported in this browser. The answer is available as text.");
      setStatus("error");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(answer.answer);
    utterance.lang = language;
    utterance.onstart = () => setStatus("speaking");
    utterance.onend = () => setStatus((current) => current === "speaking" ? "idle" : current);
    utterance.onerror = () => {
      setError("Speech playback stopped unexpectedly. You can still read the answer above.");
      setStatus("error");
    };
    setError(null);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setStatus("idle");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isListening) {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      setIsListening(false);
    }
    void askQuestion(question);
  };

  const clearTranscript = () => {
    if (isListening) recognitionRef.current?.abort();
    requestRef.current?.abort();
    requestRef.current = null;
    window.speechSynthesis?.cancel();
    recognitionRef.current = null;
    finalTranscriptRef.current = "";
    setIsListening(false);
    setTurns([]);
    setQuestion("");
    setPartialTranscript("");
    setError(null);
    setNotice(null);
    setStatus("idle");
  };

  const apiConfigured = Boolean(import.meta.env.VITE_AI_API_BASE_URL?.trim());
  const active = status === "listening" || status === "processing" || status === "speaking";

  return (
    <section id="voice" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 pb-24 md:px-10 xl:px-16" aria-labelledby="voice-title">
      <div className="overflow-hidden rounded-2xl border border-[#d7b879]/20 bg-[radial-gradient(ellipse_at_top_right,rgba(142,103,46,.16),transparent_38%),linear-gradient(145deg,#211e19,#191714)] shadow-[0_28px_80px_-55px_rgba(215,184,121,.42)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d7b879]/15 px-5 py-5 md:px-8">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[.24em] text-[#d7b879]">Voice guided heritage exploration</p>
            <h2 id="voice-title" className="mt-1 font-serif text-2xl text-[#f4ecdd] md:text-3xl">TimeTravel Voice Companion</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full border px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.16em] ${status === "error" ? "border-[#c87968]/40 text-[#e6a895]" : status === "listening" || status === "speaking" ? "border-[#a7a778]/40 text-[#c4d19b]" : "border-[#d7b879]/25 text-[#e2cfaa]/70"}`} role="status" aria-live="polite">{statusLabels[status]}</span>
            <button type="button" onClick={clearTranscript} disabled={!turns.length && !error && !question && !partialTranscript} className="rounded-full border border-[#d7b879]/20 px-3 py-2 text-[9px] uppercase tracking-[.13em] text-[#eee6d7]/60 hover:border-[#d7b879]/45 hover:text-[#f4ecdd] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]">Clear</button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-h-[620px] flex-col border-b border-[#d7b879]/10 lg:border-b-0 lg:border-r">
            <div className="flex flex-1 flex-col items-center justify-center px-5 py-9 text-center">
              <div className={`voice-orb-shell relative flex h-52 w-52 items-center justify-center rounded-full border border-[#d7b879]/30 bg-[radial-gradient(circle_at_40%_34%,rgba(237,211,151,.26),rgba(110,79,35,.15)_43%,rgba(23,21,18,.96)_72%)] shadow-[0_0_90px_-34px_rgba(215,184,121,.62)] transition-transform duration-500 sm:h-64 sm:w-64 ${active ? "voice-orb-active" : ""}`}>
                <span className="voice-orb-ring absolute inset-3 rounded-full border border-[#d7b879]/20" />
                <span className="voice-orb-ring voice-orb-ring-delayed absolute inset-8 rounded-full border border-[#d7b879]/15" />
                <span className="absolute h-24 w-24 rounded-full bg-[#d7b879]/[.08] blur-2xl sm:h-32 sm:w-32" />
                <IconWaveSine className={`relative h-16 w-16 text-[#e4c47f] transition-transform ${status === "listening" ? "scale-125" : ""}`} stroke={1.15} aria-hidden="true" />
                <span className="absolute -bottom-1 rounded-full border border-[#d7b879]/25 bg-[#171512] px-3 py-1 text-[9px] uppercase tracking-[.17em] text-[#d9c394]">{statusLabels[status]}</span>
              </div>
              <p className="mt-7 max-w-lg text-sm leading-6 text-[#eee6d7]/60">{status === "listening" ? "Listening for your question. Speak naturally; your words will be sent to the history guide." : status === "processing" ? "Your question is being sent to the history guide." : status === "speaking" ? "The answer is being read aloud." : "Ask about a monument, historical figure, dynasty, or event."}</p>
              {!apiConfigured && <p className="mt-2 text-[10px] text-[#d7b879]/75">Demo mode · sample answers only, not live AI</p>}

              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                {isListening ? (
                  <button type="button" onClick={stopListening} className="inline-flex items-center gap-2 rounded-full border border-[#d7b879]/45 bg-[#d7b879]/10 px-5 py-3 text-[10px] font-semibold uppercase tracking-[.14em] text-[#f1dcae] transition-colors hover:bg-[#d7b879]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]"><IconPlayerPause className="h-4 w-4" aria-hidden="true" /> Stop Listening</button>
                ) : (
                  <button type="button" onClick={startListening} disabled={!featuresReady || !recognitionSupported || status === "processing" || status === "speaking"} title={!recognitionSupported && featuresReady ? "Speech recognition is not supported in this browser" : undefined} className="inline-flex items-center gap-2 rounded-full bg-[#d7b879] px-5 py-3 text-[10px] font-semibold uppercase tracking-[.14em] text-[#211b12] transition-colors hover:bg-[#ead19a] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1dcae]"><IconMicrophone className="h-4 w-4" aria-hidden="true" /> Start Listening</button>
                )}
                {status === "speaking" && <button type="button" onClick={stopSpeaking} className="inline-flex items-center gap-2 rounded-full border border-[#d7b879]/40 px-5 py-3 text-[10px] font-semibold uppercase tracking-[.14em] text-[#f1dcae] hover:bg-[#d7b879]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]"><IconPlayerPause className="h-4 w-4" aria-hidden="true" /> Stop Speaking</button>}
              </div>

              <div className={`mt-8 flex h-10 items-center justify-center gap-1.5 ${status === "listening" ? "voice-wave-active" : "opacity-45"}`} aria-hidden="true">
                {[12, 23, 34, 18, 29, 38, 20, 32, 15, 27, 36, 17, 30, 13, 25].map((height, index) => <span key={index} style={{ height: `${height}px`, animationDelay: `${index * 65}ms` }} className="voice-wave-bar w-1 rounded-full bg-[#d7b879]" />)}
              </div>

              <div className="mt-2 flex w-full max-w-md items-center gap-3 rounded-xl border border-[#d7b879]/15 bg-[#171512]/55 p-3">
                <label htmlFor="voice-language" className="shrink-0 text-[9px] font-semibold uppercase tracking-[.16em] text-[#d8c49b]/70">Language</label>
                <Select value={language} onValueChange={(value) => setLanguage(value as VoiceLanguage)}>
                  <SelectTrigger id="voice-language" aria-label="Speech recognition language" className="h-9 border-[#d7b879]/20 bg-[#211e19] text-xs text-[#f6f0e4] focus:ring-[#d7b879]"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-[#d7b879]/20 bg-[#211e19] text-[#f6f0e4]">{languages.map((item) => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <p className="mt-2 max-w-md text-[9px] leading-4 text-[#eee6d7]/35">Language availability depends on your browser and speech service. You can always type your question.</p>
            </div>

            <div className="border-t border-[#d7b879]/15 bg-[#171512]/50 p-4 md:p-5">
              <form onSubmit={handleSubmit} className="flex items-end gap-3 rounded-xl border border-[#d7b879]/25 bg-[#211e19] p-2 focus-within:border-[#d7b879]/55">
                <textarea value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} rows={2} placeholder={recognitionSupported ? "Or type your history question…" : "Voice input unavailable — type your question…"} aria-label="Type a history question" disabled={status === "processing"} className="max-h-32 min-h-12 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm leading-6 text-[#f6f0e4] outline-none placeholder:text-[#eee6d7]/35 focus-visible:ring-0" />
                <button type="submit" aria-label="Send question to history guide" disabled={!question.trim() || status === "processing"} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#d7b879] text-[#211b12] hover:bg-[#ead19a] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1dcae]"><IconSend className="h-4 w-4" aria-hidden="true" /></button>
              </form>
              <p className="mt-2 text-[9px] text-[#eee6d7]/35">Voice recognition converts speech to text; historical answers come from the same guide service as AI History Guide.</p>
            </div>
          </div>

          <aside className="flex min-h-[380px] flex-col p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-[9px] font-semibold uppercase tracking-[.22em] text-[#d7b879]">Your conversation</p><h3 className="mt-2 font-serif text-xl text-[#ead9b7]">Transcript</h3></div>
              <span className="rounded-full border border-[#d7b879]/20 px-2.5 py-1 text-[9px] text-[#d8c49b]/60">{turns.length} {turns.length === 1 ? "exchange" : "exchanges"}</span>
            </div>
            {!featuresReady ? (
              <p className="mt-6 text-xs text-[#eee6d7]/45">Checking browser voice support…</p>
            ) : !recognitionSupported ? (
              <div className="mt-5 rounded-xl border border-[#d7b879]/20 bg-[#171512]/60 p-4" role="status"><p className="flex items-center gap-2 text-xs font-medium text-[#e4c47f]"><IconAlertCircle className="h-4 w-4" aria-hidden="true" /> Speech recognition unavailable</p><p className="mt-2 text-xs leading-5 text-[#eee6d7]/55">This browser does not support voice input. Type a question below to use the history guide.</p></div>
            ) : (
              <div className="mt-5 rounded-xl border border-[#a7a778]/20 bg-[#a7a778]/[.04] p-4"><p className="flex items-center gap-2 text-xs font-medium text-[#c4d19b]"><IconCheck className="h-4 w-4" aria-hidden="true" /> Voice input is available</p><p className="mt-2 text-xs leading-5 text-[#eee6d7]/50">Your browser may ask for microphone permission the first time you start listening.</p></div>
            )}
            {!synthesisSupported && featuresReady && <div className="mt-3 rounded-lg border border-[#d7b879]/15 px-3 py-2 text-[10px] leading-4 text-[#eee6d7]/45">Speech playback is unavailable in this browser; answers remain readable as text.</div>}
            {error && <div role="alert" className="mt-3 rounded-lg border border-[#c87968]/30 bg-[#5a3028]/15 p-3 text-xs leading-5 text-[#e6a895]">{error}<button type="button" onClick={() => { setError(null); setStatus("idle"); }} className="ml-2 underline underline-offset-2 hover:text-[#ffd4c5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8a18e]">Dismiss</button></div>}
            {notice && <p className="mt-3 rounded-lg border border-[#d7b879]/20 bg-[#d7b879]/[.05] p-3 text-[10px] leading-5 text-[#e2cfaa]/70" role="status">{notice}</p>}

            <div className="mt-5 flex-1 space-y-4 overflow-y-auto" aria-live="polite" aria-relevant="additions text">
              {!turns.length && !partialTranscript && <p className="rounded-lg border border-dashed border-[#d7b879]/15 px-4 py-8 text-center text-xs leading-5 text-[#eee6d7]/40">Your spoken or typed questions and guide answers will appear here.</p>}
              {partialTranscript && <div className="rounded-xl border border-[#d7b879]/20 bg-[#31291c]/50 p-3"><p className="text-[9px] uppercase tracking-[.15em] text-[#d7b879]">Recognizing speech</p><p className="mt-1 text-sm text-[#eee6d7]/65">{partialTranscript}</p></div>}
              {turns.map((turn) => <article key={turn.id} className="space-y-2">
                <div className="rounded-xl border border-[#d7b879]/20 bg-[#31291c]/55 p-3"><p className="text-[9px] uppercase tracking-[.15em] text-[#d7b879]">You asked</p><p className="mt-1 text-xs leading-5 text-[#f6f0e4]">{turn.question}</p></div>
                {turn.answer ? <div className="rounded-xl border border-white/[.07] bg-[#211e19] p-3"><p className="text-[9px] uppercase tracking-[.15em] text-[#d7b879]">{turn.answer.mode === "demo" ? "Curated demo response" : "History guide"}</p><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[#eee6d7]/75">{turn.answer.answer}</p>{turn.answer.sources.length > 0 && <ul className="mt-3 space-y-1 border-t border-[#d7b879]/10 pt-2">{turn.answer.sources.map((source) => <li key={`${source.url}-${source.title}`}><a href={source.url} target="_blank" rel="noreferrer" className="text-[10px] text-[#e4c47f] underline underline-offset-2">{source.title} ↗</a></li>)}</ul>}{turn.answer.mode === "demo" && <p className="mt-2 text-[9px] text-[#d8c49b]/50">No live AI is connected; this is a sample answer.</p>}<div className="mt-3 flex flex-wrap gap-2">{synthesisSupported && <button type="button" onClick={() => speakAnswer(turn.answer!)} className="inline-flex items-center gap-1.5 rounded border border-[#d7b879]/20 px-2.5 py-1.5 text-[9px] uppercase tracking-[.12em] text-[#e4c47f] hover:bg-[#d7b879]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]"><IconPlayerPlay className="h-3.5 w-3.5" aria-hidden="true" /> Read aloud</button>}{status === "speaking" && <button type="button" onClick={stopSpeaking} className="inline-flex items-center gap-1.5 rounded border border-[#d7b879]/20 px-2.5 py-1.5 text-[9px] uppercase tracking-[.12em] text-[#e4c47f] hover:bg-[#d7b879]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]"><IconPlayerPause className="h-3.5 w-3.5" aria-hidden="true" /> Stop speech</button>}</div></div> : turn.error ? <div className="rounded-xl border border-[#c87968]/25 bg-[#5a3028]/10 p-3"><p className="text-xs leading-5 text-[#e6a895]">{turn.error}</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => void askQuestion(turn.question, turn.id)} disabled={status === "processing"} className="inline-flex items-center gap-1.5 rounded border border-[#d8a18e]/35 px-2.5 py-1.5 text-[9px] uppercase tracking-[.12em] text-[#f0c7b8] hover:bg-[#5a3028]/20 disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8a18e]"><IconRefresh className="h-3.5 w-3.5" aria-hidden="true" /> Retry</button>{turn.fallbackAvailable && <button type="button" onClick={() => useDemoFallback(turn)} className="rounded border border-[#d7b879]/25 px-2.5 py-1.5 text-[9px] uppercase tracking-[.11em] text-[#e4c47f] hover:bg-[#d7b879]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]">Use curated demo answer</button>}</div></div> : <p className="rounded-xl border border-dashed border-[#d7b879]/15 px-3 py-2 text-[10px] text-[#d8c49b]/55">Waiting for the history guide…</p>}
              </article>)}
            </div>
            <p className="mt-5 border-t border-[#d7b879]/15 pt-4 text-[9px] leading-4 text-[#eee6d7]/35">{apiConfigured ? "Connected to the configured history guide service. Sources appear only when returned by the service." : "Demo mode · only curated sample answers are available; other questions receive an honest unavailable response."}</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
