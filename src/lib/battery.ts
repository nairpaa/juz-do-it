/**
 * Retention calculation based on Ebbinghaus forgetting curve.
 *
 * Formula: retention = 100 * e^(-t / stability)
 *
 * - t = elapsed hours since last review
 * - stability = how long until retention drops to ~37%, grows with each review
 *
 * Stability schedule (based on spaced repetition research):
 *   Review 1 → 24h (1 day)
 *   Review 2 → 72h (3 days)
 *   Review 3 → 168h (7 days)
 *   Review 4 → 336h (14 days)
 *   Review 5 → 720h (30 days)
 *   Review 6+ → keeps growing with multiplier 2.0
 */

const STABILITY_HOURS = [24, 72, 168, 336, 720];
const STABILITY_MULTIPLIER = 2.0;
const MEMORIZED_THRESHOLD = 5;

export type AyahStatus = "not_started" | "memorizing" | "memorized";

export interface AyahProgress {
  surahNumber: number;
  ayahNumber: number;
  status: AyahStatus;
  reviewCount: number;
  lastReviewedAt: string | null;
  startedAt: string | null;
}

export function isActive(p: AyahProgress): boolean {
  return p.status !== "not_started";
}

export function getStability(reviewCount: number): number {
  if (reviewCount <= 0) return STABILITY_HOURS[0];
  if (reviewCount <= STABILITY_HOURS.length) {
    return STABILITY_HOURS[reviewCount - 1];
  }
  const lastStability = STABILITY_HOURS[STABILITY_HOURS.length - 1];
  const extraReviews = reviewCount - STABILITY_HOURS.length;
  return lastStability * Math.pow(STABILITY_MULTIPLIER, extraReviews);
}

export function calculateBattery(progress: AyahProgress): number {
  if (!isActive(progress) || !progress.lastReviewedAt) {
    return 0;
  }

  const now = Date.now();
  const lastReview = new Date(progress.lastReviewedAt).getTime();
  const elapsedHours = (now - lastReview) / (1000 * 60 * 60);

  const stability = getStability(progress.reviewCount);
  const retention = 100 * Math.exp(-elapsedHours / stability);

  return Math.round(Math.max(0, Math.min(100, retention)));
}

export function calculateSurahBattery(ayahProgresses: AyahProgress[]): number {
  if (ayahProgresses.length === 0) return 0;

  const batteries = ayahProgresses.map((a) => calculateBattery(a));

  let weightedSum = 0;
  let totalWeight = 0;
  for (const b of batteries) {
    const weight = 101 - b;
    weightedSum += b * weight;
    totalWeight += weight;
  }

  return Math.round(weightedSum / totalWeight);
}

export { MEMORIZED_THRESHOLD };
