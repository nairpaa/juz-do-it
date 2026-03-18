import { Lang, t } from "./i18n";
import { AyahState, getStability, MIN_INTERVAL_RATIO } from "./battery";

export function timeAgo(dateStr: string, lang: Lang): string {
  const l = t(lang);
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);

  if (lang === "id") {
    if (mins < 1) return `${l.last}: baru saja`;
    if (mins < 60) return `${l.last}: ${mins}m lalu`;
    if (hours < 24) return `${l.last}: ${hours}j lalu`;
    return `${l.last}: ${days}h lalu`;
  }

  if (mins < 1) return `${l.last}: just now`;
  if (mins < 60) return `${l.last}: ${mins}m ago`;
  if (hours < 24) return `${l.last}: ${hours}h ago`;
  return `${l.last}: ${days}d ago`;
}

export function nextReview(state: AyahState, lang: Lang): string {
  if (!state.lastEffectiveAt) return "";

  const l = t(lang);
  const stability = getStability(state.reviewCount);
  const minInterval = stability * MIN_INTERVAL_RATIO;
  const elapsedHours = (Date.now() - new Date(state.lastEffectiveAt).getTime()) / 3600000;
  const remaining = minInterval - elapsedHours;

  if (remaining <= 0) {
    return l.ready;
  }

  const hours = Math.ceil(remaining);
  const days = Math.floor(remaining / 24);

  if (lang === "id") {
    if (hours < 24) return `${l.next}: ${hours}j lagi`;
    return `${l.next}: ${days}h lagi`;
  }

  if (hours < 24) return `${l.next}: in ${hours}h`;
  return `${l.next}: in ${days}d`;
}
