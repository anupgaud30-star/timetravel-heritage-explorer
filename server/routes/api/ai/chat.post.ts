import { defineEventHandler, readBody, createError } from "h3";

const HISTORICAL_GUIDE_PROMPT = `You are the TimeTravel Voice Companion & History Guide, a distinguished and captivating historical guide inside an interactive digital museum.

Your purpose is to answer the traveler's questions about ancient, medieval, and modern world history—with special expertise in Indian heritage, monuments, and civilizations.

Guidelines:
1. Explain historical events in clear, engaging, and accessible language.
2. Provide authentic historical context: key eras, dates, dynasties, geographical regions, and notable figures.
3. Distinguish established historical facts from legends, oral folklore, or historical uncertainties.
4. Never invent sources, archaeological findings, or dates. If something is unknown, debated, or lost to antiquity, state that honestly.
5. Keep your responses concise (2 to 3 short paragraphs, roughly 100 to 180 words) so they sound natural and engaging when spoken aloud or read on screen.
6. Avoid complex formatting, markdown tables, raw URLs, asterisks, bullet marks, or strange punctuation that could cause speech synthesizers to stutter.`;

const DEMO_FALLBACKS: Record<string, string> = {
  hampi:
    "Hampi was the ceremonial and commercial heart of the Vijayanagara Empire, flourishing between the 14th and 16th centuries along the Tungabhadra River in Karnataka. Under rulers like Krishnadevaraya, it became one of the wealthiest metropolitan centers of the medieval world, renowned for the Vittala Temple's stone chariot and the sacred Virupaksha Temple. The city was sacked after the Battle of Talikota in 1565 and survives today as an acclaimed UNESCO World Heritage site.",
  daulatabad:
    "Daulatabad Fort, originally known as Devagiri in Maharashtra, was a formidable 12th-century hill citadel engineered by the Yadava dynasty. Renowned for its insurmountable defenses, it featured a 200-meter conical rock summit, deep crocodile moats, and the famous 'Andhari'—a subterranean pitch-black labyrinth built to trap invading armies. In 1327, Sultan Muhammad bin Tughlaq famously attempted to relocate his imperial capital here from Delhi.",
  indus:
    "The Indus Valley Civilization, thriving from 2600 to 1900 BCE across modern India and Pakistan, was an extraordinary Bronze Age urban society. Landmark settlements like Harappa, Mohenjo-daro, and the port at Lothal exhibited sophisticated municipal planning with baked brick structures, covered drainage networks, and granaries. Their undeciphered script and peaceful mercantile culture remain central mysteries of early civilization.",
  mughal:
    "The Mughal Empire shaped South Asia from 1526 until the mid-19th century, founded by Babur following the Battle of Panipat. It flourished culturally and architecturally under Akbar the Great, Shah Jahan, and Aurangzeb, leaving humanity architectural marvels including the Taj Mahal, the Red Fort, and Fatehpur Sikri while synthesizing Persian, Central Asian, and Indian aesthetic traditions.",
  maurya:
    "The Maurya Empire (c. 322–185 BCE) and Gupta Empire (c. 319–543 CE) mark two distinct high points in classical Indian history. The Maurya Empire, unified by Chandragupta Maurya and Chanakya, is famous for Emperor Ashoka's renunciation of conquest and propagation of peace through stone edicts. Centuries later, the Gupta Empire brought a golden age of science, mathematics with Aryabhata, and classical Sanskrit literature.",
};

function matchDemo(query: string): string {
  const q = query.toLowerCase();
  for (const [key, answer] of Object.entries(DEMO_FALLBACKS)) {
    if (q.includes(key)) return answer;
  }
  return "Hampi, Daulatabad Fort, the Indus Valley Civilization, the Mughal Empire, and the classical Maurya and Gupta dynasties are central landmarks of our shared heritage. You can inquire about any of these monuments, rulers, or historical eras.";
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ message?: string; question?: string }>(event).catch(() => ({} as { message?: string; question?: string }));
  const rawMessage = body?.message || body?.question;

  if (!rawMessage || typeof rawMessage !== "string" || !rawMessage.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Question or message field is required.",
    });
  }

  const query = rawMessage.trim();
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";

  // If no Gemini API key is configured, return curated demo response
  if (!apiKey || apiKey.startsWith("your-")) {
    return {
      answer: matchDemo(query),
      response: matchDemo(query),
      sources: [
        { title: "Archaeological Survey of India", url: "https://asi.nic.in" },
        { title: "UNESCO World Heritage Centre", url: "https://whc.unesco.org" },
      ],
      mode: "demo",
    };
  }

  // Call Google Gemini API
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const payload = {
      system_instruction: {
        parts: [{ text: HISTORICAL_GUIDE_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: query }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 450,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Gemini API Error] status=${response.status}: ${errText}`);
      // Fallback gracefully to curated historical answer
      const demoAns = matchDemo(query);
      return {
        answer: `${demoAns}\n\n[Note: Live AI service temporarily unavailable (${response.status}); showing curated historical record.]`,
        response: demoAns,
        sources: [
          { title: "Archaeological Survey of India", url: "https://asi.nic.in" },
          { title: "UNESCO World Heritage Centre", url: "https://whc.unesco.org" },
        ],
        mode: "backend",
      };
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    const generatedText = candidate?.content?.parts?.[0]?.text?.trim();

    if (!generatedText) {
      throw new Error("Empty text returned from Gemini API");
    }

    return {
      answer: generatedText,
      response: generatedText,
      sources: [
        { title: "Archaeological Survey of India", url: "https://asi.nic.in" },
        { title: "UNESCO World Heritage Centre", url: "https://whc.unesco.org" },
      ],
      mode: "backend",
    };
  } catch (error: any) {
    console.error("[Chat API Handler Exception]", error);
    const demoAns = matchDemo(query);
    return {
      answer: `${demoAns}\n\n[Note: Live AI temporarily reached fallback mode.]`,
      response: demoAns,
      sources: [
        { title: "Archaeological Survey of India", url: "https://asi.nic.in" },
        { title: "UNESCO World Heritage Centre", url: "https://whc.unesco.org" },
      ],
      mode: "backend",
    };
  }
});
