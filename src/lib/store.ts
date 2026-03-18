import { getStability, MIN_INTERVAL_RATIO } from "./battery";

const LOG_KEY = "juz-do-it-log";

export interface ReviewEvent {
  surahNumber: number;
  ayahNumber: number;
  timestamp: string;
}

// ── Raw log operations ──

export function getLog(): ReviewEvent[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LOG_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLog(log: ReviewEvent[]): void {
  localStorage.setItem(LOG_KEY, JSON.stringify(log));
}

export function addReview(surahNumber: number, ayahNumber: number): void {
  const log = getLog();
  log.push({ surahNumber, ayahNumber, timestamp: new Date().toISOString() });
  saveLog(log);
}

export function deleteEvent(surahNumber: number, ayahNumber: number, timestamp: string): void {
  const log = getLog().filter(
    (e) => !(e.surahNumber === surahNumber && e.ayahNumber === ayahNumber && e.timestamp === timestamp)
  );
  saveLog(log);
}

export function undoLastEvent(surahNumber: number, ayahNumber: number): void {
  const log = getLog();
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i].surahNumber === surahNumber && log[i].ayahNumber === ayahNumber) {
      log.splice(i, 1);
      break;
    }
  }
  saveLog(log);
}

// ── Derive state from log ──

export interface DerivedAyahState {
  surahNumber: number;
  ayahNumber: number;
  reviewCount: number;
  lastReviewedAt: string | null;
  lastEffectiveAt: string | null;
  startedAt: string | null;
  events: ReviewEvent[];
}

export function deriveState(events: ReviewEvent[]): DerivedAyahState | null {
  if (events.length === 0) return null;

  const sorted = [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  let reviewCount = 0;
  let lastEffectiveAt: string | null = null;

  for (let i = 0; i < sorted.length; i++) {
    const event = sorted[i];
    if (reviewCount === 0) {
      // First review — always effective
      reviewCount = 1;
      lastEffectiveAt = event.timestamp;
    } else {
      // Check if this review is effective based on spacing
      const stability = getStability(reviewCount);
      const minInterval = stability * MIN_INTERVAL_RATIO;
      const elapsed = (new Date(event.timestamp).getTime() - new Date(lastEffectiveAt!).getTime()) / 3600000;

      // Check for lapse: calculate retention at this point
      const lastReviewTime = new Date(sorted[i - 1].timestamp).getTime();
      const elapsedSinceLastReview = (new Date(event.timestamp).getTime() - lastReviewTime) / 3600000;
      const retention = 100 * Math.exp(-elapsedSinceLastReview / stability);

      if (retention < 20) {
        // Lapse
        const drop = retention < 5 ? 3 : retention < 15 ? 2 : 1;
        reviewCount = Math.max(1, reviewCount - drop);
        lastEffectiveAt = event.timestamp;
      } else if (elapsed >= minInterval) {
        // Effective
        reviewCount += 1;
        lastEffectiveAt = event.timestamp;
      }
      // else: too_early, skip
    }
  }

  return {
    surahNumber: sorted[0].surahNumber,
    ayahNumber: sorted[0].ayahNumber,
    reviewCount,
    lastReviewedAt: sorted[sorted.length - 1].timestamp,
    lastEffectiveAt,
    startedAt: sorted[0].timestamp,
    events: sorted,
  };
}

export function getAllDerivedStates(): DerivedAyahState[] {
  const log = getLog();
  const grouped = new Map<string, ReviewEvent[]>();

  for (const e of log) {
    const key = `${e.surahNumber}-${e.ayahNumber}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(e);
  }

  const states: DerivedAyahState[] = [];
  for (const events of grouped.values()) {
    const state = deriveState(events);
    if (state) states.push(state);
  }

  return states;
}

export function getDerivedStatesForSurah(surahNumber: number): DerivedAyahState[] {
  const log = getLog().filter((e) => e.surahNumber === surahNumber);
  const grouped = new Map<number, ReviewEvent[]>();

  for (const e of log) {
    if (!grouped.has(e.ayahNumber)) grouped.set(e.ayahNumber, []);
    grouped.get(e.ayahNumber)!.push(e);
  }

  const states: DerivedAyahState[] = [];
  for (const events of grouped.values()) {
    const state = deriveState(events);
    if (state) states.push(state);
  }

  return states;
}
