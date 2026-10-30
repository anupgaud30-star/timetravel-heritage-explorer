export type GuideSource = {
  title: string;
  url: string;
};

export type GuideAnswer = {
  answer: string;
  sources: GuideSource[];
  mode: "demo" | "backend";
  notice?: string;
  question?: string;
};

export type GuideChatRequest = {
  message?: string;
  audio?: string;
  mimeType?: string;
};

export type GuideChatResponse = {
  answer: string;
  sources?: GuideSource[];
  question?: string;
};

export class GuideServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuideServiceError";
  }
}

const apiBaseUrl = (import.meta.env.VITE_AI_API_BASE_URL?.trim().replace(/\/+$/, "")) || "";

const demoAnswers = [
  {
    matches: ["hampi", "vijayanagara"],
    answer: "Hampi was the ceremonial and commercial heart of the Vijayanagara Empire, especially from the 14th to 16th centuries. Its temples, pillared halls, market streets, water structures, and strategic setting by the Tungabhadra River record a major center of South Indian political life and trade. The city was sacked after the Battle of Talikota in 1565, though its monuments remain across a wide landscape. This is a curated demo summary, not a live AI answer.",
  },
  {
    matches: ["maurya", "gupta", "ashoka"],
    answer: "The Maurya and Gupta empires were distinct states separated by several centuries. Maurya rule (c. 322–185 BCE) is associated with a large imperial administration and Ashoka's widely distributed inscriptions. Gupta power rose from around the 4th century CE and is noted in surviving records for court culture, regional alliances, and scholarship, including Aryabhata's work dated 499 CE. Dates and the extent of central control vary across regions and sources. This is a curated demo summary, not a live AI answer.",
  },
  {
    matches: ["1526", "panipat", "babur"],
    answer: "In 1526, Babur defeated Ibrahim Lodi at the First Battle of Panipat, marking the beginning of Mughal rule in northern India. The transition was not instantaneous: Mughal authority was consolidated over subsequent decades. This is a curated demo summary, not a live AI answer.",
  },
  {
    matches: ["daulatabad", "devagiri"],
    answer: "Daulatabad Fort, earlier known as Devagiri, was a major Deccan stronghold associated first with the Yadava (Seuna) kingdom and later rulers. Its steep hill, winding approach, moats, gateways, and rock-cut defenses made the site difficult to capture. In the 14th century, Muhammad bin Tughluq attempted to shift his capital there; chronicles describe the episode, though its scope and sequence remain debated. This is a curated demo summary, not a live AI answer.",
  },
];

export function getCuratedDemoAnswer(message: string): GuideAnswer {
  const query = message.toLocaleLowerCase();
  const match = demoAnswers.find((entry) => entry.matches.some((term) => query.includes(term)));
  return {
    answer: match?.answer ?? "Demo mode is active and this question is not covered by the curated sample answers. No live AI or historical database is connected, so I won't invent an answer or citations. Try one of the suggested questions.",
    sources: [],
    mode: "demo",
  };
}

function isGuideChatResponse(value: unknown): value is GuideChatResponse {
  if (!value || typeof value !== "object" || !("answer" in value) || typeof value.answer !== "string") return false;
  if (!("sources" in value) || value.sources === undefined) return true;
  return Array.isArray(value.sources) && value.sources.every((source) =>
    source && typeof source === "object" && "title" in source && typeof source.title === "string" &&
    "url" in source && typeof source.url === "string" && isSafeSourceUrl(source.url),
  );
}

function isSafeSourceUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function askHistoryGuide(input: GuideChatRequest, signal?: AbortSignal): Promise<GuideAnswer> {
  const targetUrl = apiBaseUrl ? `${apiBaseUrl}/api/ai/chat` : "/api/ai/chat";

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal,
    });
  } catch {
    throw new GuideServiceError("The history guide backend could not be reached. Check the connection or retry.");
  }

  if (!response.ok) {
    throw new GuideServiceError(`The history guide backend returned an error (${response.status}). Retry when the service is available.`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new GuideServiceError("The history guide backend returned an unreadable response.");
  }

  if (!isGuideChatResponse(payload)) {
    throw new GuideServiceError("The history guide response did not match the expected format.");
  }

  return {
    answer: payload.answer,
    question: payload.question,
    sources: (payload.sources ?? []).filter((source) => isSafeSourceUrl(source.url)),
    mode: "backend",
  };
}
