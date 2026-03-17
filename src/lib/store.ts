import { AyahProgress, isActive, MEMORIZED_THRESHOLD } from "./battery";

const STORAGE_KEY = "juz-do-it-progress";

export function getAllProgress(): AyahProgress[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getProgressForSurah(surahNumber: number): AyahProgress[] {
  return getAllProgress().filter((p) => p.surahNumber === surahNumber);
}

function saveProgress(progress: AyahProgress): void {
  const all = getAllProgress();
  const index = all.findIndex(
    (p) => p.surahNumber === progress.surahNumber && p.ayahNumber === progress.ayahNumber
  );
  if (index >= 0) {
    if (isActive(progress)) {
      all[index] = progress;
    } else {
      all.splice(index, 1);
    }
  } else if (isActive(progress)) {
    all.push(progress);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function markAsMemorizing(surahNumber: number, ayahNumber: number): void {
  const now = new Date().toISOString();
  saveProgress({
    surahNumber,
    ayahNumber,
    status: "memorizing",
    reviewCount: 1,
    lastReviewedAt: now,
    startedAt: now,
  });
}

export function reviewAyah(surahNumber: number, ayahNumber: number): void {
  const all = getAllProgress();
  const p = all.find((x) => x.surahNumber === surahNumber && x.ayahNumber === ayahNumber);
  if (!p || !isActive(p)) return;

  p.reviewCount += 1;
  p.lastReviewedAt = new Date().toISOString();
  if (p.reviewCount >= MEMORIZED_THRESHOLD) {
    p.status = "memorized";
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function resetAyah(surahNumber: number, ayahNumber: number): void {
  const all = getAllProgress();
  const filtered = all.filter(
    (p) => !(p.surahNumber === surahNumber && p.ayahNumber === ayahNumber)
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
