import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  IconCheck,
  IconMicrophone,
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
  IconSend,
  IconVolume,
  IconVolumeOff,
  IconWaveSine,
} from "@tabler/icons-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { askHistoryGuide, getCuratedDemoAnswer, type GuideAnswer } from "@/lib/ai-history-guide";

type VoiceStatus = "idle" | "listening" | "processing" | "speaking";
type VoiceLanguage = "en-IN" | "hi-IN" | "mr-IN";
type VoiceTurn = { id: string; question: string; answer?: GuideAnswer; error?: string; fallbackAvailable?: boolean };
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
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
  { code: "en-IN", label: "English (India)" },
  { code: "hi-IN", label: "Hindi (हिन्दी)" },
  { code: "mr-IN", label: "Marathi (मराठी)" },
];

const statusLabels: Record<VoiceStatus, string> = {
  idle: "Ready to Listen",
  listening: "Listening… Speak now",
  processing: "Asking AI Guide…",
  speaking: "Speaking answer aloud",
};

// Helper to convert Blob to Base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function VoiceCompanionSection() {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [language, setLanguage] = useState<VoiceLanguage>("en-IN");
  const [micSupported, setMicSupported] = useState(false);
  const [synthesisSupported, setSynthesisSupported] = useState(false);
  const [featuresReady, setFeaturesReady] = useState(false);
  const [question, setQuestion] = useState("");
  const [partialTranscript, setPartialTranscript] = useState("");
  const [turns, setTurns] = useState<VoiceTurn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [autoRead, setAutoRead] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(0);

  const sequence = useRef(0);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const latestTranscriptRef = useRef("");
  const mountedRef = useRef(false);
  const askedViaVoice = useRef(false);

  // Check microphone and speech synthesis support on mount
  useEffect(() => {
    mountedRef.current = true;
    const hasMedia = typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
    const hasSyn = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

    setMicSupported(hasMedia);
    setSynthesisSupported(hasSyn);
    setFeaturesReady(true);

    if (hasSyn) {
      window.speechSynthesis.getVoices();
      if ("onvoiceschanged" in window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }

    return () => {
      mountedRef.current = false;
      cleanupAudio();
      requestRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const cleanupAudio = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        void audioContextRef.current.close();
      } catch {
        // Safe fallback
      }
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Safe fallback
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Safe fallback
      }
      mediaRecorderRef.current = null;
    }
    setVolumeLevel(0);
  };

  const primeAudioContext = () => {
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.resume();
      } catch {
        // Safe fallback
      }
    }
  };

  const askQuestion = async (
    payload: { message?: string; audio?: string; mimeType?: string },
    existingTurnId?: string
  ) => {
    const textQuery = payload.message?.trim() || "";
    if (!textQuery && !payload.audio) return;
    if (status === "processing") return;

    primeAudioContext();
    const turnId = existingTurnId ?? `voice-${Date.now()}-${++sequence.current}`;
    const request = new AbortController();
    requestRef.current?.abort();
    requestRef.current = request;

    const initialDisplayQuestion = textQuery || (payload.audio ? "🎙️ Spoken voice query…" : "Question");
    setQuestion("");
    setPartialTranscript("");
    setError(null);
    setNotice(null);

    setTurns((current) =>
      existingTurnId
        ? current.map((turn) => (turn.id === turnId ? { ...turn, error: undefined } : turn))
        : [...current, { id: turnId, question: initialDisplayQuestion }]
    );
    setStatus("processing");

    try {
      const answer = await askHistoryGuide(
        payload.audio
          ? { audio: payload.audio, mimeType: payload.mimeType || "audio/webm" }
          : { message: textQuery },
        request.signal
      );
      if (!mountedRef.current) return;

      const finalQuestion = answer.question || initialDisplayQuestion;
      setTurns((current) =>
        current.map((turn) =>
          turn.id === turnId
            ? { ...turn, question: finalQuestion, answer, error: undefined }
            : turn
        )
      );

      if (answer.mode === "demo") {
        setNotice("Demo mode · this is a curated sample response.");
      }

      // Read answer aloud if autoRead is enabled
      if ((askedViaVoice.current || autoRead) && synthesisSupported) {
        speakAnswer(answer);
      } else {
        setStatus("idle");
      }
    } catch {
      if (!mountedRef.current || request.signal.aborted) return;
      const message = "The history guide service could not be reached. You can retry or choose a sample answer.";
      setTurns((current) =>
        current.map((turn) => (turn.id === turnId ? { ...turn, error: message, fallbackAvailable: true } : turn))
      );
      setError(message);
      setStatus("idle");
    } finally {
      if (requestRef.current === request) requestRef.current = null;
    }
  };

  const startListening = async () => {
    primeAudioContext();
    setError(null);
    setNotice(null);
    setPartialTranscript("");
    latestTranscriptRef.current = "";
    audioChunksRef.current = [];
    askedViaVoice.current = true;

    // Check media devices
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone access is not supported by your browser. Please type your question in the text box below.");
      setStatus("idle");
      return;
    }

    try {
      cleanupAudio();

      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // 2. Setup AudioContext for visual volume meter
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            if (!mountedRef.current || !mediaStreamRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const norm = Math.min(1, avg / 128);
            setVolumeLevel(norm);
            animFrameRef.current = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        }
      } catch {
        // Visual volume meter is an enhancement; safe to continue if audioCtx fails
      }

      // 3. Setup MediaRecorder to capture audio
      const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
      const chosenMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || "";

      const recorder = chosenMime ? new MediaRecorder(stream, { mimeType: chosenMime }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(200);

      // 4. In parallel, attempt webkitSpeechRecognition for instant live transcript
      const speechWindow = window as SpeechWindow;
      const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

      if (Recognition) {
        try {
          const recognition = new Recognition();
          recognition.lang = language;
          recognition.interimResults = true;
          recognition.continuous = true;

          recognition.onresult = (event) => {
            let full = "";
            for (let i = 0; i < event.results.length; i += 1) {
              full += event.results[i][0].transcript;
            }
            const clean = full.trim();
            if (clean) {
              latestTranscriptRef.current = clean;
              setPartialTranscript(clean);
              setQuestion(clean);
            }
          };

          recognition.onerror = () => {
            // WebSpeech cloud error is non-fatal; MediaRecorder will send raw audio to Gemini backend
          };

          recognition.onend = () => {
            recognitionRef.current = null;
          };

          recognitionRef.current = recognition;
          recognition.start();
        } catch {
          // Non-fatal, MediaRecorder handles audio
        }
      }

      setStatus("listening");
    } catch (err: unknown) {
      cleanupAudio();
      setStatus("idle");
      const e = err as { name?: string; message?: string };
      if (e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError") {
        setError("Microphone permission was denied. Click the lock/camera icon in your address bar to allow microphone access, then click Speak again.");
      } else if (e?.name === "NotFoundError" || e?.name === "DevicesNotFoundError") {
        setError("No microphone device was detected. Please connect a microphone or use the text box below.");
      } else {
        setError("Microphone could not start. You can type your question in the text box below or test with suggested questions.");
      }
    }
  };

  const stopListening = async () => {
    if (status !== "listening") return;

    const stream = mediaStreamRef.current;
    const recorder = mediaRecorderRef.current;
    const recognizedText = (latestTranscriptRef.current || question).trim();

    cleanupAudio();

    if (recognizedText) {
      // We have clear speech recognized via SpeechRecognition
      setStatus("processing");
      void askQuestion({ message: recognizedText });
      return;
    }

    // SpeechRecognition didn't catch text, but MediaRecorder has recorded chunks
    if (recorder && audioChunksRef.current.length > 0) {
      setStatus("processing");
      try {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size > 2000) {
          const b64 = await blobToBase64(blob);
          void askQuestion({ audio: b64, mimeType });
          return;
        }
      } catch {
        // Fallback to idle if audio packaging fails
      }
    }

    // Nothing was heard or recorded
    setNotice("No speech detected. Please speak clearly into your microphone, or try one of the instant questions.");
    setStatus("idle");
  };

  // Toggle orb between listening, stopping, and speaking
  const handleOrbClick = () => {
    if (status === "speaking") {
      stopSpeaking();
    } else if (status === "listening") {
      void stopListening();
    } else if (status === "idle") {
      void startListening();
    }
  };

  const speakAnswer = (answer: GuideAnswer) => {
    if (!synthesisSupported || !("speechSynthesis" in window)) {
      setStatus("idle");
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(answer.answer);
      const voices = window.speechSynthesis.getVoices();

      const langPrefix = language.split("-")[0];
      const matchVoice =
        voices.find((v) => v.lang === language) ||
        voices.find((v) => v.lang.startsWith(langPrefix)) ||
        voices.find((v) => v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("India")) ||
        voices.find((v) => v.default) ||
        voices[0];

      if (matchVoice) {
        utterance.voice = matchVoice;
        utterance.lang = matchVoice.lang;
      } else {
        utterance.lang = language;
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        if (mountedRef.current) setStatus("speaking");
      };
      utterance.onend = () => {
        if (mountedRef.current) setStatus("idle");
      };
      utterance.onerror = (e) => {
        if (mountedRef.current && e.error !== "canceled" && e.error !== "interrupted") {
          setStatus("idle");
        }
      };

      setError(null);
      window.speechSynthesis.speak(utterance);
    } catch {
      setStatus("idle");
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setStatus("idle");
  };

  const useDemoFallback = (turn: VoiceTurn) => {
    const answer = getCuratedDemoAnswer(turn.question);
    setTurns((current) =>
      current.map((item) =>
        item.id === turn.id ? { ...item, answer, error: undefined, fallbackAvailable: false } : item
      )
    );
    setError(null);
    setNotice("Demo mode · this curated response is not a live AI answer.");
    if (autoRead) speakAnswer(answer);
    else setStatus("idle");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "listening") {
      cleanupAudio();
    }
    askedViaVoice.current = false;
    void askQuestion({ message: question });
  };

  const clearTranscript = () => {
    cleanupAudio();
    requestRef.current?.abort();
    requestRef.current = null;
    window.speechSynthesis?.cancel();
    latestTranscriptRef.current = "";
    setTurns([]);
    setQuestion("");
    setPartialTranscript("");
    setError(null);
    setNotice(null);
    setStatus("idle");
  };

  const isListening = status === "listening";
  const isSpeaking = status === "speaking";
  const isProcessing = status === "processing";
  const waveHeights = [14, 24, 38, 20, 32, 44, 22, 36, 18, 30, 42, 19, 34, 15, 26];

  return (
    <section id="voice" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 pb-24 md:px-10 xl:px-16" aria-labelledby="voice-title">
      <div className="overflow-hidden rounded-2xl border border-[#d7b879]/20 bg-[radial-gradient(ellipse_at_top_right,rgba(142,103,46,.16),transparent_38%),linear-gradient(145deg,#211e19,#191714)] shadow-[0_28px_80px_-55px_rgba(215,184,121,.42)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d7b879]/15 px-5 py-5 md:px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.24em] text-[#d7b879]">Interactive voice guide</p>
            <h2 id="voice-title" className="mt-1 font-serif text-2xl text-[#f4ecdd] md:text-3xl">TimeTravel Voice Companion</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setAutoRead(!autoRead)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[.14em] transition-colors ${
                autoRead ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-[#d7b879]/25 text-[#eee6d7]/60"
              }`}
              title="Toggle automatic speech playback for answers"
            >
              {autoRead ? <IconVolume className="h-3.5 w-3.5 text-emerald-400" /> : <IconVolumeOff className="h-3.5 w-3.5 text-[#eee6d7]/50" />}
              {autoRead ? "Audio Auto-Read: ON" : "Audio Auto-Read: OFF"}
            </button>
            <span
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.16em] ${
                isListening || isSpeaking
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300 animate-pulse"
                  : isProcessing
                  ? "border-[#d7b879]/40 bg-[#d7b879]/10 text-[#f1dcae] animate-pulse"
                  : "border-[#d7b879]/25 text-[#e2cfaa]/85"
              }`}
              role="status"
              aria-live="polite"
            >
              {statusLabels[status]}
            </span>
            <button
              type="button"
              onClick={clearTranscript}
              disabled={!turns.length && !error && !question && !partialTranscript}
              className="rounded-full border border-[#d7b879]/20 px-3 py-2 text-[11px] uppercase tracking-[.13em] text-[#eee6d7]/70 hover:border-[#d7b879]/45 hover:text-[#f4ecdd] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-h-[620px] flex-col border-b border-[#d7b879]/10 lg:border-b-0 lg:border-r">
            <div className="flex flex-1 flex-col items-center justify-center px-5 py-9 text-center">
              {/* Clickable Interactive Glowing Orb */}
              <button
                type="button"
                onClick={handleOrbClick}
                aria-label={isListening ? "Stop listening and ask AI" : isSpeaking ? "Stop speaking" : "Click to speak"}
                className={`voice-orb-shell group relative flex h-52 w-52 cursor-pointer items-center justify-center rounded-full border border-[#d7b879]/30 bg-[radial-gradient(circle_at_40%_34%,rgba(237,211,151,.26),rgba(110,79,35,.15)_43%,rgba(23,21,18,.96)_72%)] shadow-[0_0_90px_-34px_rgba(215,184,121,.62)] transition-all duration-300 hover:scale-105 sm:h-64 sm:w-64 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d7b879]/50 ${
                  isListening
                    ? "scale-105 border-emerald-400/60 shadow-[0_0_110px_-15px_rgba(52,211,153,.6)] ring-4 ring-emerald-400/30"
                    : isSpeaking
                    ? "scale-105 border-[#e4c47f]/60 shadow-[0_0_110px_-15px_rgba(228,196,127,.6)] ring-4 ring-[#e4c47f]/30"
                    : isProcessing
                    ? "animate-pulse border-[#d7b879]/50 shadow-[0_0_90px_-20px_rgba(215,184,121,.5)]"
                    : ""
                }`}
                style={{
                  transform: isListening ? `scale(${1.03 + volumeLevel * 0.1})` : undefined,
                }}
              >
                <span className="voice-orb-ring absolute inset-3 rounded-full border border-[#d7b879]/20" />
                <span className="voice-orb-ring voice-orb-ring-delayed absolute inset-8 rounded-full border border-[#d7b879]/15" />
                <span className="absolute h-24 w-24 rounded-full bg-[#d7b879]/[.08] blur-2xl sm:h-32 sm:w-32" />

                {isListening ? (
                  <div className="flex flex-col items-center">
                    <IconMicrophone className="h-16 w-16 text-emerald-400 animate-pulse transition-transform scale-110" stroke={1.5} aria-hidden="true" />
                    <span className="mt-2 text-[10px] font-semibold uppercase tracking-[.18em] text-emerald-300">Click to finish & ask</span>
                  </div>
                ) : isSpeaking ? (
                  <div className="flex flex-col items-center">
                    <IconVolume className="h-16 w-16 text-[#e4c47f] animate-bounce transition-transform" stroke={1.5} aria-hidden="true" />
                    <span className="mt-2 text-[10px] font-semibold uppercase tracking-[.18em] text-[#e4c47f]">Click to stop</span>
                  </div>
                ) : isProcessing ? (
                  <div className="flex flex-col items-center">
                    <IconWaveSine className="h-16 w-16 text-[#d7b879] animate-spin transition-transform" stroke={1.5} aria-hidden="true" />
                    <span className="mt-2 text-[10px] font-semibold uppercase tracking-[.18em] text-[#f1dcae]">Consulting AI Guide…</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <IconMicrophone className="h-16 w-16 text-[#e4c47f] transition-transform group-hover:scale-110" stroke={1.25} aria-hidden="true" />
                    <span className="mt-2 text-[10px] font-semibold uppercase tracking-[.18em] text-[#d7b879]/90">Click to Speak</span>
                  </div>
                )}

                <span className="absolute -bottom-1 rounded-full border border-[#d7b879]/25 bg-[#171512] px-3 py-1 text-[11px] uppercase tracking-[.17em] text-[#d9c394]">
                  {statusLabels[status]}
                </span>
              </button>

              {/* Status explanation */}
              <p className="mt-7 max-w-lg text-sm leading-6 text-[#eee6d7]/80">
                {isListening
                  ? "🎙️ Microphone is recording your voice… Speak your question and click 'Stop & Ask AI' when finished."
                  : isProcessing
                  ? "⚡ Consulting Google Gemini 3.5 AI guide…"
                  : isSpeaking
                  ? "🔊 Reading the answer aloud through your speakers."
                  : "Click the gold microphone orb or click 'Start Listening' to speak your question."}
              </p>

              {/* Live transcript banner while speaking */}
              {partialTranscript && (
                <div className="mt-4 w-full max-w-md rounded-xl border border-emerald-500/40 bg-emerald-950/25 p-3 text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-emerald-400">Hearing Speech:</p>
                  <p className="mt-1 text-sm font-medium text-[#f6f0e4]">"{partialTranscript}"</p>
                </div>
              )}

              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live AI Active · Google Gemini 3.5 Flash
              </div>

              {/* Main Voice Control Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {isListening ? (
                  <button
                    type="button"
                    onClick={() => void stopListening()}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-500/25 px-6 py-3.5 text-xs font-semibold uppercase tracking-[.14em] text-emerald-200 transition-colors hover:bg-emerald-500/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    <IconPlayerPause className="h-4 w-4" aria-hidden="true" />
                    Stop & Ask AI
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void startListening()}
                    disabled={!featuresReady || isProcessing || isSpeaking}
                    className="inline-flex items-center gap-2 rounded-full bg-[#d7b879] px-6 py-3.5 text-xs font-semibold uppercase tracking-[.14em] text-[#211b12] shadow-lg transition-transform hover:scale-105 hover:bg-[#ead19a] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1dcae]"
                  >
                    <IconMicrophone className="h-4 w-4" aria-hidden="true" />
                    Start Listening
                  </button>
                )}

                {isSpeaking && (
                  <button
                    type="button"
                    onClick={stopSpeaking}
                    className="inline-flex items-center gap-2 rounded-full border border-[#d7b879]/40 bg-[#d7b879]/10 px-5 py-3 text-xs font-semibold uppercase tracking-[.14em] text-[#f1dcae] hover:bg-[#d7b879]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]"
                  >
                    <IconPlayerPause className="h-4 w-4" aria-hidden="true" />
                    Stop Voice
                  </button>
                )}
              </div>

              {/* Animated Voice Sound Waves */}
              <div
                className={`mt-7 flex h-12 items-center justify-center gap-1.5 ${
                  isListening || isSpeaking ? "voice-wave-active" : "opacity-35"
                }`}
                aria-hidden="true"
              >
                {waveHeights.map((baseHeight, index) => {
                  const dynamicHeight = isListening
                    ? Math.max(6, Math.min(48, baseHeight * (0.4 + volumeLevel * 1.6)))
                    : isSpeaking
                    ? baseHeight
                    : 8;
                  return (
                    <span
                      key={index}
                      style={{
                        height: `${dynamicHeight}px`,
                        animationDelay: `${index * 60}ms`,
                      }}
                      className={`voice-wave-bar w-1 rounded-full transition-all duration-75 ${
                        isListening ? "bg-emerald-400" : "bg-[#d7b879]"
                      }`}
                    />
                  );
                })}
              </div>

              {/* Quick Inquiry Buttons (Instant Test) */}
              <div className="mt-5 w-full max-w-md">
                <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[.18em] text-[#d7b879]/80">
                  Or click a question to test immediately
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    "Tell me about Mumbai and its famous places.",
                    "Tell me the history of Ram Mandir in Ayodhya.",
                    "Why was Daulatabad Fort important?",
                    "What are the major heritage places in Delhi?",
                    "Explain the Indus Valley Civilization.",
                  ].map((promptText) => (
                    <button
                      key={promptText}
                      type="button"
                      onClick={() => {
                        askedViaVoice.current = false;
                        setQuestion(promptText);
                        void askQuestion({ message: promptText });
                      }}
                      disabled={isProcessing}
                      className="rounded-full border border-[#d7b879]/30 bg-[#211e19]/90 px-3 py-1.5 text-[11px] text-[#f4ecdd] transition-all hover:border-[#d7b879] hover:bg-[#d7b879]/20"
                    >
                      ✦ {promptText}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selector */}
              <div className="mt-5 flex w-full max-w-md items-center gap-3 rounded-xl border border-[#d7b879]/15 bg-[#171512]/55 p-3">
                <label htmlFor="voice-language" className="shrink-0 text-[11px] font-semibold uppercase tracking-[.16em] text-[#d8c49b]/70">
                  Language
                </label>
                <Select value={language} onValueChange={(value) => setLanguage(value as VoiceLanguage)}>
                  <SelectTrigger id="voice-language" aria-label="Speech recognition language" className="h-9 border-[#d7b879]/20 bg-[#211e19] text-xs text-[#f6f0e4] focus:ring-[#d7b879]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#d7b879]/20 bg-[#211e19] text-[#f6f0e4]">
                    {languages.map((item) => (
                      <SelectItem key={item.code} value={item.code}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Live Text Area for Typing / Reviewing */}
            <div className="border-t border-[#d7b879]/15 bg-[#171512]/50 p-4 md:p-5">
              <form onSubmit={handleSubmit} className="flex items-end gap-3 rounded-xl border border-[#d7b879]/25 bg-[#211e19] p-2 focus-within:border-[#d7b879]/55">
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  rows={2}
                  placeholder="Spoken words appear here, or type any history question…"
                  aria-label="Type a history question"
                  disabled={isProcessing}
                  className="max-h-32 min-h-12 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm leading-6 text-[#f6f0e4] outline-none placeholder:text-[#eee6d7]/70 focus-visible:ring-0"
                />
                <button
                  type="submit"
                  aria-label="Send question to history guide"
                  disabled={!question.trim() || isProcessing}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#d7b879] text-[#211b12] hover:bg-[#ead19a] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1dcae]"
                >
                  <IconSend className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
              <p className="mt-2 text-[11px] text-[#eee6d7]/70">
                Speak with microphone or type. Answers will be read aloud automatically through your audio speakers.
              </p>
            </div>
          </div>

          {/* Conversation Transcript Sidebar */}
          <aside className="flex min-h-[380px] flex-col p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-[#d7b879]">Your conversation</p>
                <h3 className="mt-1 font-serif text-xl text-[#ead9b7]">Spoken Transcript</h3>
              </div>
              <span className="rounded-full border border-[#d7b879]/20 px-2.5 py-1 text-[11px] text-[#d8c49b]/80">
                {turns.length} {turns.length === 1 ? "turn" : "turns"}
              </span>
            </div>

            {/* Status alerts */}
            {!featuresReady ? (
              <p className="mt-4 text-xs text-[#eee6d7]/70">Checking microphone & speech support…</p>
            ) : !micSupported ? (
              <div className="mt-4 rounded-xl border border-[#c87968]/30 bg-[#5a3028]/15 p-3.5" role="status">
                <p className="flex items-center gap-1.5 text-xs font-medium text-[#e6a895]">
                  Microphone unavailable
                </p>
                <p className="mt-1.5 text-xs leading-5 text-[#eee6d7]/70">
                  Please enable microphone access in your browser, or use the text box below.
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[.05] p-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-300">
                  <IconCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Microphone Ready
                </p>
                <p className="mt-1 text-[11px] leading-4 text-[#eee6d7]/70">
                  Click the gold orb or 'Start Listening' to speak your question.
                </p>
              </div>
            )}

            {error && (
              <div role="alert" className="mt-3 rounded-lg border border-[#c87968]/30 bg-[#5a3028]/25 p-3 text-xs leading-5 text-[#e6a895]">
                {error}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                  }}
                  className="ml-2 underline underline-offset-2 hover:text-[#ffd4c5] focus-visible:outline-none"
                >
                  Dismiss
                </button>
              </div>
            )}

            {notice && (
              <p className="mt-3 rounded-lg border border-[#d7b879]/20 bg-[#d7b879]/[.05] p-3 text-[11px] leading-5 text-[#e2cfaa]/85" role="status">
                {notice}
              </p>
            )}

            {/* Conversation list */}
            <div className="mt-4 flex-1 space-y-4 overflow-y-auto" aria-live="polite" aria-relevant="additions text">
              {!turns.length && !partialTranscript && (
                <p className="rounded-lg border border-dashed border-[#d7b879]/15 px-4 py-8 text-center text-xs leading-5 text-[#eee6d7]/70">
                  Spoken questions and audio answers will be transcribed here.
                </p>
              )}

              {partialTranscript && isListening && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-emerald-400">Hearing speech…</p>
                  <p className="mt-1 text-xs text-[#eee6d7]/90">{partialTranscript}</p>
                </div>
              )}

              {turns.map((turn) => (
                <article key={turn.id} className="space-y-2">
                  <div className="rounded-xl border border-[#d7b879]/20 bg-[#31291c]/55 p-3">
                    <p className="text-[11px] uppercase tracking-[.15em] text-[#d7b879]">You asked</p>
                    <p className="mt-1 text-xs leading-5 text-[#f6f0e4]">{turn.question}</p>
                  </div>

                  {turn.answer ? (
                    <div className="rounded-xl border border-white/[.07] bg-[#211e19] p-3">
                      <p className="text-[11px] uppercase tracking-[.15em] text-[#d7b879]">
                        {turn.answer.mode === "demo" ? "Curated demo response" : "History guide"}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[#eee6d7]/85">
                        {turn.answer.answer}
                      </p>

                      {turn.answer.sources.length > 0 && (
                        <ul className="mt-3 space-y-1 border-t border-[#d7b879]/10 pt-2">
                          {turn.answer.sources.map((source) => (
                            <li key={`${source.url}-${source.title}`}>
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-[#e4c47f] underline underline-offset-2"
                              >
                                {source.title} ↗
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2 border-t border-[#d7b879]/10 pt-2">
                        {synthesisSupported && (
                          <button
                            type="button"
                            onClick={() => speakAnswer(turn.answer!)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#d7b879]/25 bg-[#d7b879]/10 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[.12em] text-[#e4c47f] hover:bg-[#d7b879]/25"
                          >
                            <IconPlayerPlay className="h-3 w-3" aria-hidden="true" />
                            Read Aloud (Voice)
                          </button>
                        )}
                        {isSpeaking && (
                          <button
                            type="button"
                            onClick={stopSpeaking}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#d7b879]/25 px-3 py-1.5 text-[11px] uppercase tracking-[.12em] text-[#e4c47f] hover:bg-[#d7b879]/10"
                          >
                            <IconPlayerPause className="h-3 w-3" aria-hidden="true" />
                            Stop Voice
                          </button>
                        )}
                      </div>
                    </div>
                  ) : turn.error ? (
                    <div className="rounded-xl border border-[#c87968]/25 bg-[#5a3028]/10 p-3">
                      <p className="text-xs leading-5 text-[#e6a895]">{turn.error}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void askQuestion({ message: turn.question }, turn.id)}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1.5 rounded border border-[#d8a18e]/35 px-2.5 py-1.5 text-[11px] uppercase tracking-[.12em] text-[#f0c7b8] hover:bg-[#5a3028]/20 disabled:opacity-45"
                        >
                          <IconRefresh className="h-3.5 w-3.5" aria-hidden="true" /> Retry
                        </button>
                        {turn.fallbackAvailable && (
                          <button
                            type="button"
                            onClick={() => useDemoFallback(turn)}
                            className="rounded border border-[#d7b879]/25 px-2.5 py-1.5 text-[11px] uppercase tracking-[.11em] text-[#e4c47f] hover:bg-[#d7b879]/10"
                          >
                            Use curated demo answer
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#d7b879]/20 px-3 py-2 text-[11px] text-[#d8c49b]/80">
                      <span className="h-2 w-2 rounded-full bg-[#d7b879] animate-pulse" />
                      Consulting history guide…
                    </div>
                  )}
                </article>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
