import { defineEventHandler } from "h3";

export default defineEventHandler(() => {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY?.trim());
  return {
    status: "healthy",
    service: "TimeTravel Heritage Explorer",
    ai_configured: hasGemini,
    mode: hasGemini ? "live" : "demo",
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
  };
});
