import { useCallback, useEffect, useRef, useState } from "react";

import type { QuizCategory, QuizDifficulty } from "@/lib/history-quiz-data";

const STORAGE_KEY = "timetravel-heritage-profile-v1";
const MAX_RECENT_ITEMS = 10;

export type TimelineExploration = {
  id: string;
  periodId: string;
  periodName: string;
  year: number;
  dynasty: string | null;
  eventTitle: string | null;
  exploredAt: string;
};

export type QuizResult = {
  id: string;
  score: number;
  total: number;
  difficulty: QuizDifficulty;
  category: QuizCategory | "all";
  completedAt: string;
};

export type ProfileActivity = {
  favoriteMonumentIds: string[];
  viewedMonumentIds: string[];
  timelineExplorations: TimelineExploration[];
  quizResults: QuizResult[];
};

const emptyProfileActivity: ProfileActivity = {
  favoriteMonumentIds: [],
  viewedMonumentIds: [],
  timelineExplorations: [],
  quizResults: [],
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readStringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function readProfileActivity(value: unknown): ProfileActivity {
  if (!isObject(value)) return emptyProfileActivity;

  const timelineExplorations = Array.isArray(value.timelineExplorations)
    ? value.timelineExplorations.filter((item): item is TimelineExploration =>
        isObject(item) &&
        typeof item.id === "string" &&
        typeof item.periodId === "string" &&
        typeof item.periodName === "string" &&
        typeof item.year === "number" &&
        (typeof item.dynasty === "string" || item.dynasty === null) &&
        (typeof item.eventTitle === "string" || item.eventTitle === null) &&
        typeof item.exploredAt === "string",
      ).slice(0, MAX_RECENT_ITEMS)
    : [];

  const quizResults = Array.isArray(value.quizResults)
    ? value.quizResults.filter((item): item is QuizResult =>
        isObject(item) &&
        typeof item.id === "string" &&
        typeof item.score === "number" &&
        typeof item.total === "number" &&
        (item.difficulty === "Easy" || item.difficulty === "Medium" || item.difficulty === "Hard") &&
        (item.category === "all" || item.category === "Monument" || item.category === "Dynasty" || item.category === "Ruler" || item.category === "Event") &&
        typeof item.completedAt === "string",
      ).slice(0, MAX_RECENT_ITEMS)
    : [];

  return {
    favoriteMonumentIds: readStringList(value.favoriteMonumentIds),
    viewedMonumentIds: readStringList(value.viewedMonumentIds).slice(0, MAX_RECENT_ITEMS),
    timelineExplorations,
    quizResults,
  };
}

function loadProfileActivity(): ProfileActivity {
  if (typeof window === "undefined") return emptyProfileActivity;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? readProfileActivity(JSON.parse(saved)) : emptyProfileActivity;
  } catch {
    return emptyProfileActivity;
  }
}

function saveProfileActivity(activity: ProfileActivity) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(activity));
  } catch {
    return;
  }
}

function createActivityId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useProfileActivity() {
  const [activity, setActivity] = useState(emptyProfileActivity);
  const [hasLoaded, setHasLoaded] = useState(false);
  const activityRef = useRef(activity);
  const loadedRef = useRef(false);
  const pendingUpdatesRef = useRef<((current: ProfileActivity) => ProfileActivity)[]>([]);

  useEffect(() => {
    let saved = loadProfileActivity();
    for (const update of pendingUpdatesRef.current) saved = update(saved);
    activityRef.current = saved;
    loadedRef.current = true;
    setActivity(saved);
    setHasLoaded(true);
    if (pendingUpdatesRef.current.length) saveProfileActivity(saved);
    pendingUpdatesRef.current = [];
  }, []);

  const updateActivity = useCallback((update: (current: ProfileActivity) => ProfileActivity) => {
    const next = update(activityRef.current);
    activityRef.current = next;
    setActivity(next);
    if (loadedRef.current) saveProfileActivity(next);
    else pendingUpdatesRef.current.push(update);
  }, []);

  const toggleFavorite = useCallback((monumentId: string) => {
    updateActivity((current) => ({
      ...current,
      favoriteMonumentIds: current.favoriteMonumentIds.includes(monumentId)
        ? current.favoriteMonumentIds.filter((id) => id !== monumentId)
        : [...current.favoriteMonumentIds, monumentId],
    }));
  }, [updateActivity]);

  const recordViewedMonument = useCallback((monumentId: string) => {
    updateActivity((current) => ({
      ...current,
      viewedMonumentIds: [monumentId, ...current.viewedMonumentIds.filter((id) => id !== monumentId)].slice(0, MAX_RECENT_ITEMS),
    }));
  }, [updateActivity]);

  const recordTimelineExploration = useCallback((exploration: Omit<TimelineExploration, "id" | "exploredAt">) => {
    const item: TimelineExploration = { ...exploration, id: createActivityId(), exploredAt: new Date().toISOString() };
    updateActivity((current) => ({
      ...current,
      timelineExplorations: [item, ...current.timelineExplorations].slice(0, MAX_RECENT_ITEMS),
    }));
  }, [updateActivity]);

  const recordQuizResult = useCallback((result: Omit<QuizResult, "id" | "completedAt">) => {
    const item: QuizResult = { ...result, id: createActivityId(), completedAt: new Date().toISOString() };
    updateActivity((current) => ({
      ...current,
      quizResults: [item, ...current.quizResults].slice(0, MAX_RECENT_ITEMS),
    }));
  }, [updateActivity]);

  const clearActivity = useCallback(() => {
    updateActivity(() => emptyProfileActivity);
  }, [updateActivity]);

  return { activity, hasLoaded, toggleFavorite, recordViewedMonument, recordTimelineExploration, recordQuizResult, clearActivity };
}
