/**
 * Retention calculation based on Ebbinghaus forgetting curve + spaced repetition.
 *
 * State is derived from event log (event sourcing).
 * Each review click is stored as a separate event.
 * Count, stability, retention are calculated by replaying events.
 */

const STABILITY_HOURS = [24, 72, 168, 336, 720];
const STABILITY_MULTIPLIER = 2.0;
export const MIN_INTERVAL_RATIO = 0.5;

export interface AyahState {
  reviewCount: number;
  lastReviewedAt: string | null;
  lastEffectiveAt: string | null;
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

export function calculateBattery(state: AyahState): number {
  if (!state.lastReviewedAt || state.reviewCount <= 0) return 0;

  const elapsedHours = (Date.now() - new Date(state.lastReviewedAt).getTime()) / 3600000;
  const stability = getStability(state.reviewCount);
  const retention = 100 * Math.exp(-elapsedHours / stability);

  return Math.round(Math.max(0, Math.min(100, retention)));
}

export function calculateSurahBattery(states: AyahState[]): number {
  if (states.length === 0) return 0;

  const batteries = states.map((a) => calculateBattery(a));

  let weightedSum = 0;
  let totalWeight = 0;
  for (const b of batteries) {
    const weight = 101 - b;
    weightedSum += b * weight;
    totalWeight += weight;
  }

  return Math.round(weightedSum / totalWeight);
}
