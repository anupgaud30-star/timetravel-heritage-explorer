import { runAuthGuard } from "@agent-native/core/server";
import { defineEventHandler, getRequestURL } from "h3";

export default defineEventHandler(async (event) => {
  // Skip auth for our custom API routes so they always work
  const url = getRequestURL(event);
  if (url.pathname.startsWith("/api/ai/") || url.pathname === "/api/health") {
    return;
  }
  return runAuthGuard(event);
});
