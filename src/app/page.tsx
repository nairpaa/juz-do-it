"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Analytics02Icon, Book02Icon, Idea01Icon, Clock01Icon, BookCheckIcon, AlertCircleIcon, Calendar01Icon, Layers01Icon, ArrowDown01Icon, ArrowRight01Icon, ArrowLeft01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { surahs, Surah, TOTAL_AYAHS } from "@/data/surahs";
import { RetentionBadge } from "@/components/BatteryIndicator";
import { calculateBattery, calculateSurahBattery } from "@/lib/battery";
import { JUZ_BOUNDARIES } from "@/lib/quran-metadata";
import {
  DerivedAyahState, ReviewEvent, getAllDerivedStates, getDerivedStatesForSurah,
  addReview, undoLastEvent, deleteEvent, getLog,
} from "@/lib/store";
import { Lang, t } from "@/lib/i18n";
import { timeAgo, nextReview } from "@/lib/time";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const fmtDate = (d: Date, months: string[]) => `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;

type Page = "surahs" | "stats" | "history" | "guide";

const NAV_ITEMS: { id: Page; icon: typeof Analytics02Icon }[] = [
  { id: "surahs", icon: Book02Icon },
  { id: "stats", icon: Analytics02Icon },
  { id: "history", icon: Clock01Icon },
  { id: "guide", icon: Idea01Icon },
];

const SCROLL_CLS = "[&::-webkit-scrollbar]:w-[2px] [&::-webkit-scrollbar-thumb]:bg-gold/[0.08] [&::-webkit-scrollbar-thumb]:rounded-full";

function parseHash(): { page: Page; surahNumber?: number; statsTab?: string } {
  if (typeof window === "undefined") return { page: "surahs" };
  const hash = window.location.hash.replace("#", "");
  if (!hash) return { page: "surahs" };
  const parts = hash.split("/");
  const page = (["surahs", "stats", "history", "guide"].includes(parts[0]) ? parts[0] : "surahs") as Page;
  if (page === "surahs" && parts[1]) return { page, surahNumber: parseInt(parts[1]) };
  if (page === "stats" && parts[1]) return { page, statsTab: parts[1] };
  return { page };
}

function setHash(page: Page, surahNumber?: number, statsTab?: string) {
  let hash: string = page;
  if (page === "surahs" && surahNumber) hash = `surahs/${surahNumber}`;
  else if (page === "stats" && statsTab) hash = `stats/${statsTab}`;
  if (window.location.hash !== `#${hash}`) window.history.replaceState(null, "", `#${hash}`);
}

export default function Home() {
  const [allStates, setAllStates] = useState<DerivedAyahState[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Surah | null>(null);
  const [surahStates, setSurahStates] = useState<Map<number, DerivedAyahState>>(new Map());
  const [page, setPage] = useState<Page>("surahs");
  const [statsTabInit, setStatsTabInit] = useState<string | undefined>(undefined);
  const [lang, setLang] = useState<Lang>("en");
  const l = useMemo(() => t(lang), [lang]);

  const [log, setLog] = useState<ReviewEvent[]>([]);

  const reload = useCallback(() => { setAllStates(getAllDerivedStates()); setLog(getLog()); }, []);

  const loadSurah = useCallback((surah: Surah, updateHash = true) => {
    setPage("surahs");
    setSelected(surah);
    const m = new Map<number, DerivedAyahState>();
    getDerivedStatesForSurah(surah.number).forEach((s) => m.set(s.ayahNumber, s));
    setSurahStates(m);
    if (updateHash) setHash("surahs", surah.number);
  }, []);

  const navigateTo = useCallback((p: Page, statsTab?: string) => {
    setPage(p);
    if (p !== "surahs") setSelected(null);
    setHash(p, undefined, statsTab);
  }, []);

  // Initial load: restore from hash or auto-select
  useEffect(() => {
    const states = getAllDerivedStates();
    setAllStates(states);
    setLog(getLog());

    const { page: hashPage, surahNumber, statsTab } = parseHash();

    if (hashPage === "surahs" && surahNumber) {
      const surah = surahs.find((s) => s.number === surahNumber);
      if (surah) { loadSurah(surah, false); return; }
    }

    if (hashPage !== "surahs") {
      setPage(hashPage);
      if (statsTab) setStatsTabInit(statsTab);
      setHash(hashPage, undefined, statsTab);
      return;
    }

    // No hash or invalid: auto-select surah with lowest retention
    const activeStates = states.filter((s) => s.reviewCount > 0);
    if (activeStates.length > 0) {
      let worstSurah = activeStates[0].surahNumber;
      let worstBattery = calculateBattery(activeStates[0]);
      for (const s of activeStates) {
        const b = calculateBattery(s);
        if (b < worstBattery) { worstBattery = b; worstSurah = s.surahNumber; }
      }
      const surah = surahs.find((s) => s.number === worstSurah);
      if (surah) loadSurah(surah);
      else loadSurah(surahs[0]);
    } else {
      loadSurah(surahs[0]);
    }
  }, [loadSurah]);

  // Listen for browser back/forward
  useEffect(() => {
    const onHashChange = () => {
      const { page: hashPage, surahNumber } = parseHash();
      if (hashPage === "surahs" && surahNumber) {
        const surah = surahs.find((s) => s.number === surahNumber);
        if (surah) loadSurah(surah, false);
      } else {
        setPage(hashPage);
        if (hashPage !== "surahs") setSelected(null);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [loadSurah]);

  const active = useMemo(() => allStates.filter((s) => s.reviewCount > 0), [allStates]);
  const memorizedCount = active.length;
  const lowCount = useMemo(() => active.filter((s) => calculateBattery(s) < 40).length, [active]);
  const pct = memorizedCount > 0 ? Math.round((memorizedCount / TOTAL_AYAHS) * 100) : 0;

  const memorizedSurahs = useMemo(() =>
    surahs.filter((s) => active.some((a) => a.surahNumber === s.number)),
    [active]
  );

  const filtered = useMemo(() =>
    surahs.filter((s) => !search || s.latin.toLowerCase().includes(search.toLowerCase()) || s.name.includes(search) || s.number.toString() === search),
    [search]
  );

  const surahActive = useMemo(() =>
    Array.from(surahStates.values()).filter((s) => s.reviewCount > 0),
    [surahStates]
  );

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ surahNumber: number; ayahNumber: number; message: string } | null>(null);
  const snackbarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSnackbar = useCallback((surahNumber: number, ayahNumber: number, surahName: string) => {
    if (snackbarTimer.current) clearTimeout(snackbarTimer.current);
    setSnackbar({ surahNumber, ayahNumber, message: `${surahName} ${l.ayah} ${ayahNumber}` });
    snackbarTimer.current = setTimeout(() => setSnackbar(null), 5000);
  }, [l]);

  const handleUndo = useCallback(() => {
    if (!snackbar) return;
    undoLastEvent(snackbar.surahNumber, snackbar.ayahNumber);
    if (selected) loadSurah(selected);
    reload();
    setSnackbar(null);
    if (snackbarTimer.current) clearTimeout(snackbarTimer.current);
  }, [snackbar, selected, loadSurah, reload]);

  const navLabels: Record<Page, string> = { surahs: l.quran, stats: l.progress, history: l.history, guide: l.guide };

  return (
    <div className="relative z-10 w-[92vw] max-w-[920px] flex flex-col items-center">
    <div className="w-full h-[84vh] max-h-[700px] flex rounded-3xl overflow-hidden border border-gold/[0.15] bg-night-2/[0.92] backdrop-blur-[40px] shadow-[0_4px_60px_rgba(0,0,0,0.5),0_0_120px_rgba(212,168,83,0.05),inset_0_1px_0_rgba(255,255,255,0.04)]">

      {/* ═══ SIDEBAR ═══ */}
      <div className="w-[240px] shrink-0 flex flex-col min-h-0 border-r border-white/[0.04]">
        <div className="shrink-0 px-5 pt-5 pb-4 flex items-center justify-between">
          <div className="font-['Amiri'] text-2xl font-bold">
            <span className="gold-text">Juz</span><span>DoIt</span>
          </div>
          <div className="flex items-center gap-0.5">
            {(["en", "id"] as Lang[]).map((code) => (
              <button key={code} onClick={() => setLang(code)}
                className={`px-2 py-0.5 text-xs font-medium rounded-md cursor-pointer border-none transition-all ${lang === code ? "bg-gold/[0.1] text-gold" : "bg-transparent text-faint hover:text-cream"}`}>
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <nav className="shrink-0 px-3 mb-3 flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <div key={item.id}
              onClick={() => navigateTo(item.id)}
              className={`flex items-center gap-2.5 py-2 px-3 rounded-lg cursor-pointer transition-all text-[13px] font-medium ${page === item.id ? "text-gold bg-gold/[0.06] border-l-2 border-gold" : "text-faint hover:text-cream hover:bg-white/[0.02] border-l-2 border-transparent"}`}>
              <HugeiconsIcon icon={item.icon} size={16} color="currentColor" strokeWidth={1.5} />
              {navLabels[item.id]}
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-b border-white/[0.04] mx-4 mb-2" />

        <div className="shrink-0 px-4 pb-2">
          <input type="text" placeholder={l.searchSurah} value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2 px-3 text-sm text-cream bg-white/[0.03] border border-white/[0.04] rounded-lg outline-none font-['Outfit'] placeholder:text-faint focus:border-gold/20 transition-colors" />
        </div>

        <div className={`flex-1 overflow-y-auto px-3 pb-3 ${SCROLL_CLS}`}>
          {filtered.map((s) => {
            const sp = active.filter((a) => a.surahNumber === s.number);
            const has = sp.length > 0;
            const isSel = selected?.number === s.number;
            return (
              <div key={s.number} onClick={() => loadSurah(s)}
                className={`flex items-center gap-3 py-2 px-3 rounded-xl cursor-pointer transition-all mb-0.5 ${isSel ? "bg-gold/[0.06]" : "hover:bg-white/[0.02]"}`}>
                <div className={`w-7 h-7 flex items-center justify-center text-xs font-semibold rounded-lg shrink-0 ${has ? "bg-gold/[0.07] text-gold" : "bg-white/[0.02] text-faint"}`}>{s.number}</div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium text-cream leading-tight">{s.latin}</div>
                  {has && <div className="mt-0.5"><RetentionBadge level={calculateSurahBattery(sp)} /></div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ MAIN ═══ */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {page === "surahs" && selected ? (
          <SurahDetail surah={selected} surahActive={surahActive} surahStates={surahStates} l={l} lang={lang}
            onReview={(n) => { addReview(selected.number, n); loadSurah(selected); reload(); showSnackbar(selected.number, n, selected.latin); }}
          />
        ) : page === "stats" ? (
          <StatsPage l={l} lang={lang} memorizedCount={memorizedCount} lowCount={lowCount} pct={pct}
            memorizedSurahs={memorizedSurahs} active={active} log={log} onSelectSurah={loadSurah} initialTab={statsTabInit} />
        ) : page === "history" ? (
          <HistoryPage l={l} lang={lang} allStates={allStates}
            onDeleteEvent={(s, a, ts) => { deleteEvent(s, a, ts); reload(); if (selected) loadSurah(selected); }}
            onSelectSurah={loadSurah} />
        ) : page === "guide" ? (
          <GuidePage l={l} lang={lang} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-faint">{l.selectSurah}</div>
        )}

        {/* ═══ SNACKBAR ═══ */}
        {snackbar && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 py-2.5 px-5 rounded-xl bg-night-3 border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.4)] animate-[slideUp_0.2s_ease-out]">
            <span className="text-sm text-cream">{snackbar.message} — {l.reviewed}</span>
            <button onClick={handleUndo}
              className="px-3 py-1 text-sm font-semibold text-gold bg-gold/[0.08] rounded-lg cursor-pointer border-none hover:bg-gold/[0.15] transition-colors">
              {l.undo}
            </button>
          </div>
        )}
      </div>
    </div>
    <div className="mt-3 text-xs text-cream-dim">
      JuzDoIt by <a href="https://nairpaa.me" target="_blank" rel="noopener noreferrer" className="text-gold-dim hover:text-gold transition-colors">Nairpaa</a>
    </div>
    </div>
  );
}

function SurahDetail({ surah, surahActive, surahStates, l, lang, onReview }: {
  surah: Surah; surahActive: DerivedAyahState[]; surahStates: Map<number, DerivedAyahState>;
  l: ReturnType<typeof t>; lang: Lang;
  onReview: (n: number) => void;
}) {
  const [lastClickTime, setLastClickTime] = useState(0);
  const [filter, setFilter] = useState<"all" | "memorized">("all");
  const DEBOUNCE_MS = 1500;

  const handleReview = (n: number) => {
    const now = Date.now();
    if (now - lastClickTime < DEBOUNCE_MS) return;
    setLastClickTime(now);
    onReview(n);
  };
  const surahBattery = surahActive.length > 0 ? calculateSurahBattery(surahActive) : -1;

  const ayahNumbers = useMemo(() => {
    const all = Array.from({ length: surah.ayahCount }, (_, i) => i + 1);
    if (filter === "memorized") return all.filter((n) => surahStates.has(n) && surahStates.get(n)!.reviewCount > 0);
    return all;
  }, [surah.ayahCount, filter, surahStates]);

  return (
    <>
      <div className="shrink-0 flex items-start justify-between gap-5 px-8 py-6 border-b border-white/[0.04]">
        <div>
          <h1 className="font-['Amiri'] text-3xl font-bold m-0 gold-text">{surah.latin}</h1>
          <div className="text-sm text-muted mt-1">{l.meaning(surah)} · {surah.ayahCount} {l.ayat} · {surah.type === "makkiyah" ? l.makkiyah : l.madaniyah}</div>
          {surahActive.length > 0 && <div className="text-[13px] text-faint mt-2">{l.ofAyahsTracked(surahActive.length, surah.ayahCount)}</div>}
        </div>
        <div className="text-right shrink-0">
          <div className="font-['Noto_Naskh_Arabic'] text-4xl font-semibold text-gold leading-snug" dir="rtl">{surah.name}</div>
          {surahBattery >= 0 && <div className="mt-2 flex justify-end"><RetentionBadge level={surahBattery} /></div>}
        </div>
      </div>

      {/* Filter toggle */}
      {surahActive.length > 0 && (
        <div className="shrink-0 flex gap-1 px-6 pt-3 pb-1">
          {(["all", "memorized"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-lg border cursor-pointer transition-colors ${
                filter === f
                  ? "bg-gold/[0.1] border-gold/[0.2] text-gold"
                  : "bg-transparent border-white/[0.04] text-faint hover:text-cream-dim hover:bg-white/[0.02]"
              }`}>
              {f === "all" ? l.all : l.memorizedOnly} {f === "memorized" && `(${surahActive.length})`}
            </button>
          ))}
        </div>
      )}

      <div className={`flex-1 overflow-y-auto px-6 py-3 ${SCROLL_CLS}`}>
        {ayahNumbers.map((n) => {
          const state = surahStates.get(n);
          const tracked = state && state.reviewCount > 0;
          const batt = state ? calculateBattery(state) : 0;
          const next = state ? nextReview(state, lang) : "";
          const isReady = next === l.ready;
          return (
            <div key={n} className={`flex items-center gap-4 py-3 px-4 rounded-xl transition-colors hover:bg-white/[0.012] ${!tracked ? "opacity-35" : ""}`}>
              <div className={`w-9 h-9 flex items-center justify-center text-sm font-semibold rounded-lg shrink-0 ${tracked ? "bg-gold/[0.05] text-gold-dim" : "bg-white/[0.025] text-faint"}`}>{n}</div>
              <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
                {tracked ? (
                  <>
                    <RetentionBadge level={batt} />
                    <span className="text-[12px] text-ghost">{timeAgo(state!.lastReviewedAt!, lang)}</span>
                    <span className={`text-[12px] font-medium ${isReady ? "text-gold" : "text-ghost"}`}>{next}</span>
                  </>
                ) : (
                  <span className="text-sm text-ghost">{l.notMemorized}</span>
                )}
              </div>
              <button onClick={() => handleReview(n)}
                className="shrink-0 h-8 px-3 flex items-center justify-center text-sm font-medium rounded-lg bg-green/[0.06] border border-green/[0.1] text-green cursor-pointer hover:bg-green/[0.13] transition-colors">{tracked ? l.reviewBtn : l.start}</button>
            </div>
          );
        })}
      </div>
    </>
  );
}

type StatsTab = "overview" | "charts" | "weakest";

function StatsPage({ l, lang, memorizedCount, lowCount, pct, memorizedSurahs, active, log, onSelectSurah, initialTab }: {
  l: ReturnType<typeof t>; lang: Lang; memorizedCount: number; lowCount: number; pct: number;
  memorizedSurahs: Surah[]; active: DerivedAyahState[]; log: ReviewEvent[]; onSelectSurah: (s: Surah) => void;
  initialTab?: string;
}) {
  const [tab, setTab] = useState<StatsTab>((["overview", "charts", "weakest"].includes(initialTab || "") ? initialTab : "overview") as StatsTab);

  const changeTab = (t: StatsTab) => {
    setTab(t);
    setHash("stats", undefined, t);
  };

  const weakestByJuz = useMemo(() => {
    const weak = active
      .map((s) => ({ ...s, battery: calculateBattery(s) }))
      .filter((s) => s.battery < 60);

    type WeakItem = typeof weak[number];
    type SurahGroup = { surah: Surah; items: WeakItem[] };
    type JuzGroup = { juz: number; surahGroups: SurahGroup[] };

    const result: JuzGroup[] = [];

    for (const jb of JUZ_BOUNDARIES) {
      const juzItems = weak.filter((w) => {
        if (w.surahNumber < jb.start.surah || w.surahNumber > jb.end.surah) return false;
        if (w.surahNumber === jb.start.surah && w.ayahNumber < jb.start.ayah) return false;
        if (w.surahNumber === jb.end.surah && w.ayahNumber > jb.end.ayah) return false;
        return true;
      });

      if (juzItems.length === 0) continue;

      const surahMap = new Map<number, WeakItem[]>();
      for (const item of juzItems) {
        if (!surahMap.has(item.surahNumber)) surahMap.set(item.surahNumber, []);
        surahMap.get(item.surahNumber)!.push(item);
      }

      const surahGroups: SurahGroup[] = [];
      for (const [surahNum, items] of surahMap) {
        const surah = surahs.find((s) => s.number === surahNum);
        if (surah) surahGroups.push({ surah, items: items.sort((a, b) => a.battery - b.battery) });
      }
      surahGroups.sort((a, b) => a.surah.number - b.surah.number);

      result.push({ juz: jb.juz, surahGroups });
    }

    return result;
  }, [active]);

  const todayReviews = useMemo(() => {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return log.filter((e) => new Date(e.timestamp).getTime() >= dayStart).length;
  }, [log]);

  const avgRetention = useMemo(() => {
    if (active.length === 0) return 0;
    const sum = active.reduce((acc, s) => acc + calculateBattery(s), 0);
    return Math.round(sum / active.length);
  }, [active]);

  const surahProgressByJuz = useMemo(() => {
    type JuzItem = { surah: Surah; tracked: number; total: number; pct: number; ayahRange: string };
    const grouped: { juz: number; items: JuzItem[] }[] = [];

    for (const jb of JUZ_BOUNDARIES) {
      const items: JuzItem[] = [];

      // Find all surahs that overlap with this juz
      for (const s of memorizedSurahs) {
        if (s.number < jb.start.surah || s.number > jb.end.surah) continue;

        // Calculate ayah range for this surah within this juz
        const ayahStart = s.number === jb.start.surah ? jb.start.ayah : 1;
        const ayahEnd = s.number === jb.end.surah ? jb.end.ayah : s.ayahCount;
        const totalInJuz = ayahEnd - ayahStart + 1;

        // Count tracked ayahs in this range
        const trackedInJuz = active.filter(
          (a) => a.surahNumber === s.number && a.ayahNumber >= ayahStart && a.ayahNumber <= ayahEnd
        ).length;

        if (trackedInJuz > 0) {
          const range = (ayahStart === 1 && ayahEnd === s.ayahCount) ? "" : `${ayahStart}-${ayahEnd}`;
          items.push({
            surah: s,
            tracked: trackedInJuz,
            total: totalInJuz,
            pct: Math.round((trackedInJuz / totalInJuz) * 100),
            ayahRange: range,
          });
        }
      }

      if (items.length > 0) {
        grouped.push({ juz: jb.juz, items: items.sort((a, b) => a.surah.number - b.surah.number) });
      }
    }

    return grouped;
  }, [memorizedSurahs, active]);

  const chartData = useMemo(() => {
    const now = new Date();
    const days: { date: string; fullDate: string; reviews: number; totalAyahs: number }[] = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 86400000;

      const reviews = log.filter((e) => {
        const t = new Date(e.timestamp).getTime();
        return t >= dayStart && t < dayEnd;
      }).length;

      const ayahSet = new Set<string>();
      for (const e of log) {
        if (new Date(e.timestamp).getTime() < dayEnd) {
          ayahSet.add(`${e.surahNumber}-${e.ayahNumber}`);
        }
      }

      days.push({
        date: `${d.getDate()}/${d.getMonth() + 1}`,
        fullDate: fmtDate(d, l.months),
        reviews,
        totalAyahs: ayahSet.size,
      });
    }

    return days;
  }, [log]);

  const tabs: { id: StatsTab; label: string }[] = [
    { id: "overview", label: l.overview },
    { id: "charts", label: l.charts },
    { id: "weakest", label: l.weakestAyahs },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="shrink-0 px-8 pt-6 pb-0">
        <h2 className="font-['Amiri'] text-3xl font-bold gold-text mb-5">{l.progress}</h2>
        <div className="flex gap-1 border-b border-white/[0.04] pb-0">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => changeTab(t.id)}
              className={`px-4 py-2 text-[13px] font-medium border-b-2 -mb-px cursor-pointer transition-colors bg-transparent ${tab === t.id ? "border-gold text-gold" : "border-transparent text-faint hover:text-cream"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto px-8 py-6 ${SCROLL_CLS}`}>
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {[
                { val: memorizedCount, sub: `(${pct}%)`, label: l.ayahsMemorized, extra: l.outOf, color: "text-gold", subColor: "text-gold-dim", icon: BookCheckIcon },
                { val: lowCount, sub: `(${avgRetention}%)`, label: l.needsReview, extra: l.avgRetention, color: "text-red", subColor: avgRetention >= 60 ? "text-green" : avgRetention >= 30 ? "text-gold-dim" : "text-red", icon: AlertCircleIcon },
                { val: todayReviews, sub: null, label: l.todayReviews, extra: todayReviews > 0 ? l.keepGoing : l.startToday, color: todayReviews > 0 ? "text-green" : "text-red", subColor: "", icon: Calendar01Icon },
                { val: `${memorizedSurahs.length}`, sub: null, label: l.surahsTracked, extra: `${l.outOfSurahs}`, color: "text-cream", subColor: "", icon: Layers01Icon },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-5 flex items-center gap-4">
                  <HugeiconsIcon icon={s.icon} size={24} className="text-faint shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <div className={`font-['Amiri'] text-3xl font-bold leading-none ${s.color}`}>{s.val}</div>
                      {s.sub && <div className={`text-base font-medium ${s.subColor}`}>{s.sub}</div>}
                    </div>
                    <div className="text-sm text-muted mt-1.5">{s.label}</div>
                    {s.extra && <div className="text-[13px] text-faint mt-0.5">{s.extra}</div>}
                  </div>
                </div>
              ))}
            </div>

            {surahProgressByJuz.length > 0 && (
              <div>
                <h3 className="text-[13px] font-semibold uppercase tracking-widest text-faint mb-3">{l.surahCompletion}</h3>
                <div className="flex flex-col gap-4">
                  {surahProgressByJuz.map((group) => (
                    <div key={group.juz}>
                      <div className="text-[12px] font-medium text-gold-dim mb-2">Juz {group.juz}</div>
                      <div className="flex flex-col gap-2">
                        {group.items.map((sp) => (
                          <div key={sp.surah.number} onClick={() => onSelectSurah(sp.surah)}
                            className="flex items-center gap-4 py-3 px-4 rounded-xl bg-white/[0.02] border border-white/[0.04] cursor-pointer hover:bg-white/[0.04] transition-colors">
                            <span className="text-sm text-cream flex-1">
                              <span className="text-faint">{sp.surah.number}.</span> {sp.surah.latin}
                              {sp.ayahRange && <span className="text-faint text-[12px] ml-1">({sp.ayahRange})</span>}
                            </span>
                            <span className="text-[13px] text-faint">{sp.tracked}/{sp.total}</span>
                            <div className="w-24 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                              <div className={`h-full rounded-full ${sp.pct === 100 ? "bg-green/70" : "bg-gold/60"}`} style={{ width: `${sp.pct}%` }} />
                            </div>
                            <span className={`text-[13px] w-10 text-right ${sp.pct === 100 ? "text-green" : "text-gold"}`}>{sp.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "charts" && (
          chartData.some((d) => d.reviews > 0) ? (
            <div className="space-y-6">
              <ActivityHeatmap log={log} l={l} />
              <DailyChart data={chartData} dataKey="reviews" label={l.dailyReviews} tooltipLabel="Muraja'ah" color="#6abf7b" />
              <DailyChart data={chartData} dataKey="totalAyahs" label={l.totalAyahsTracked} tooltipLabel={l.ayahsMemorized} color="#d4a853" />
            </div>
          ) : (
            <div className="text-center py-10 text-base text-faint">{l.selectSurahToStart}</div>
          )
        )}

        {tab === "weakest" && (
          weakestByJuz.length > 0 ? (
            <WeakestList weakestByJuz={weakestByJuz} l={l} lang={lang} onSelectSurah={onSelectSurah} />
          ) : memorizedCount === 0 ? (
            <div className="text-center py-10 text-base text-faint">{l.selectSurahToStart}</div>
          ) : (
            <div className="text-center py-10 text-base text-green">{l.allGood}</div>
          )
        )}
      </div>
    </div>
  );
}

function WeakestList({ weakestByJuz, l, lang, onSelectSurah }: {
  weakestByJuz: { juz: number; surahGroups: { surah: Surah; items: { surahNumber: number; ayahNumber: number; battery: number; lastReviewedAt: string | null }[] }[] }[];
  l: ReturnType<typeof t>; lang: Lang; onSelectSurah: (s: Surah) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {weakestByJuz.map((juzGroup) => (
        <div key={juzGroup.juz}>
          <div className="text-[12px] font-medium text-gold-dim mb-2">Juz {juzGroup.juz}</div>
          <div className="flex flex-col gap-1">
            {juzGroup.surahGroups.map((sg) => {
              const key = `${juzGroup.juz}-${sg.surah.number}`;
              const isOpen = expanded.has(key);
              return (
                <div key={key}>
                  <button onClick={() => toggle(key)}
                    className="w-full flex items-center gap-4 py-3 px-4 rounded-xl cursor-pointer transition-all duration-200 text-left hover:bg-white/[0.012] bg-transparent border-none">
                    <div className={`w-9 h-9 flex items-center justify-center text-sm font-semibold rounded-lg shrink-0 ${isOpen ? "bg-gold/[0.1] text-gold" : "bg-red/[0.08] text-red"}`}>
                      {sg.surah.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-semibold ${isOpen ? "text-gold-soft" : "text-cream"}`}>{sg.surah.latin}</span>
                      <span className="text-[12px] text-red ml-2">{sg.items.length} {l.ayat}</span>
                    </div>
                    <HugeiconsIcon icon={isOpen ? ArrowDown01Icon : ArrowRight01Icon} size={16} className={`shrink-0 transition-colors ${isOpen ? "text-gold" : "text-faint"}`} />
                  </button>
                  {isOpen && (
                    <div className="mt-1 ml-5 mb-3">
                      {sg.items.map((w) => (
                        <div key={`${w.surahNumber}-${w.ayahNumber}`} onClick={() => onSelectSurah(sg.surah)}
                          className="flex items-center gap-4 py-3 px-4 rounded-xl transition-colors hover:bg-white/[0.012] cursor-pointer">
                          <div className="w-9 h-9 flex items-center justify-center text-sm font-semibold rounded-lg shrink-0 bg-gold/[0.05] text-gold-dim">{w.ayahNumber}</div>
                          <div className="flex-1 min-w-0 flex items-center gap-3">
                            <RetentionBadge level={w.battery} />
                            {w.lastReviewedAt && <span className="text-[12px] text-ghost">{timeAgo(w.lastReviewedAt, lang)}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityHeatmap({ log, l }: { log: ReviewEvent[]; l: ReturnType<typeof t> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [weeks, setWeeks] = useState(0);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; count: string } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const calc = () => {
      const style = getComputedStyle(el);
      const pad = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const w = el.clientWidth - pad - 33; // 30px day labels + 3px gap
      setWeeks(Math.max(8, Math.floor(w / 15)));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const heatmap = useMemo(() => {
    if (weeks === 0) return null;
    const now = new Date();
    const totalDays = weeks * 7;
    const days: { date: Date; count: number }[] = [];

    // Start from the most recent Sunday going back
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endSunday = new Date(today);
    endSunday.setDate(endSunday.getDate() + (6 - endSunday.getDay())); // end of this week (Saturday)
    const startDate = new Date(endSunday);
    startDate.setDate(startDate.getDate() - totalDays + 1);

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dayStart = d.getTime();
      const dayEnd = dayStart + 86400000;
      const count = log.filter((e) => {
        const t = new Date(e.timestamp).getTime();
        return t >= dayStart && t < dayEnd;
      }).length;
      days.push({ date: d, count });
    }

    const maxCount = Math.max(...days.map((d) => d.count), 1);
    return { days, maxCount, weeks };
  }, [log, weeks]);

  if (!heatmap) return <div ref={containerRef} className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 h-32" />;

  const getColor = (count: number, max: number) => {
    if (count === 0) return "rgba(255,255,255,0.03)";
    const ratio = count / max;
    if (ratio <= 0.25) return "rgba(212,168,83,0.2)";
    if (ratio <= 0.5) return "rgba(212,168,83,0.4)";
    if (ratio <= 0.75) return "rgba(212,168,83,0.65)";
    return "rgba(212,168,83,0.9)";
  };


  // Build week columns
  const weekCols: { date: Date; count: number }[][] = [];
  for (let w = 0; w < heatmap.weeks; w++) {
    weekCols.push(heatmap.days.slice(w * 7, (w + 1) * 7));
  }

  // Month labels — skip if too close to previous
  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  let lastCol = -3;
  for (let w = 0; w < weekCols.length; w++) {
    const firstDay = weekCols[w][0];
    if (firstDay && firstDay.date.getMonth() !== lastMonth && (w - lastCol) >= 3) {
      lastMonth = firstDay.date.getMonth();
      lastCol = w;
      monthLabels.push({ label: l.monthsShort[lastMonth], col: w });
    }
  }

  const today = new Date();
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const DAY_LABELS = l.dayLabels;

  return (
    <div ref={containerRef} className="relative rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
      <div className="text-[12px] font-medium text-muted mb-3">{l.activityLabel}</div>

      {/* Month labels row */}
      <div className="flex gap-[3px] mb-1 ml-[30px]">
        {weekCols.map((_, wi) => {
          const ml = monthLabels.find((m) => m.col === wi);
          return <div key={wi} className="w-[12px] text-[10px] text-faint leading-none whitespace-nowrap">{ml ? ml.label : ""}</div>;
        })}
      </div>

      {/* Grid: 7 rows (days), N columns (weeks) with day labels */}
      {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => (
        <div key={dayIdx} className="flex gap-[3px] mb-[3px] items-center">
          <div className="w-[27px] shrink-0 text-[10px] text-faint text-right pr-1">{DAY_LABELS[dayIdx]}</div>
          {weekCols.map((week, wi) => {
            const day = week[dayIdx];
            if (!day) return <div key={wi} className="w-[12px] h-[12px]" />;
            const dayTime = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate()).getTime();
            const isFuture = dayTime > todayTime;
            if (isFuture) return <div key={wi} className="w-[12px] h-[12px]" />;
            const ds = `${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`;
            const isToday = ds === todayStr;
            const tipDate = fmtDate(day.date, l.months);
            const tipCount = `Muraja'ah : ${day.count}`;
            return (
              <div key={wi}
                className={`w-[12px] h-[12px] rounded-[2px] shrink-0 cursor-default ${isToday ? "ring-1 ring-gold/50" : ""}`}
                style={{ backgroundColor: getColor(day.count, heatmap.maxCount) }}
                onMouseEnter={(ev) => {
                  const rect = ev.currentTarget.getBoundingClientRect();
                  const parent = containerRef.current?.getBoundingClientRect();
                  if (parent) setTooltip({ x: rect.left - parent.left + 6, y: rect.top - parent.top - 48, date: tipDate, count: tipCount });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}
        </div>
      ))}

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute pointer-events-none z-10 py-2 px-4 rounded-lg bg-night-3 border border-gold/[0.15] shadow-[0_4px_16px_rgba(0,0,0,0.4)] whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y, transform: "translateX(-50%)" }}>
          <div className="text-[12px] text-cream">{tooltip.date}</div>
          <div className="text-[12px] text-gold font-medium">{tooltip.count}</div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] text-faint">{l.lessLabel}</span>
        {[0, 0.25, 0.5, 0.75, 1].map((r) => (
          <div key={r} className="w-[10px] h-[10px] rounded-[2px]"
            style={{ backgroundColor: getColor(r === 0 ? 0 : r * 4, 4) }} />
        ))}
        <span className="text-[10px] text-faint">{l.moreLabel}</span>
      </div>
    </div>
  );
}

function DailyChart({ data, dataKey, label, tooltipLabel, color }: {
  data: { date: string; fullDate: string; reviews: number; totalAyahs: number }[];
  dataKey: "reviews" | "totalAyahs"; label: string; tooltipLabel: string; color: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
      <div className="text-[12px] font-medium text-muted mb-2">{label}</div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#7e7694" }} tickLine={false} axisLine={false}
            interval={Math.floor(data.length / 6)} />
          <YAxis tick={{ fontSize: 10, fill: "#7e7694" }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "#151230", border: "1px solid rgba(212,168,83,0.15)", borderRadius: 8, fontSize: 12, whiteSpace: "nowrap", padding: "8px 16px" }}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ""}
            labelStyle={{ color: "#e8e0d0" }} itemStyle={{ color: "#d4a853" }}
          />
          <Line type="monotone" dataKey={dataKey} name={tooltipLabel} stroke={color} strokeWidth={2} dot={false}
            activeDot={{ r: 4, fill: color, stroke: "#151230", strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function HistoryPage({ l, lang, allStates, onDeleteEvent, onSelectSurah }: {
  l: ReturnType<typeof t>; lang: Lang; allStates: DerivedAyahState[];
  onDeleteEvent: (surahNumber: number, ayahNumber: number, timestamp: string) => void;
  onSelectSurah: (s: Surah) => void;
}) {
  const [confirm, setConfirm] = useState<{ surahNumber: number; ayahNumber: number; timestamp: string; surahName: string } | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState<"from" | "to" | null>(null);
  const calRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setShowCalendar(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  type HistEvent = { surahNumber: number; ayahNumber: number; timestamp: string };
  type SurahGroup = { surah: Surah; events: HistEvent[] };
  type DateGroup = { dateLabel: string; surahGroups: SurahGroup[] };

  const grouped = useMemo(() => {
    let events: HistEvent[] = [];
    for (const state of allStates) {
      for (const event of state.events) events.push(event);
    }

    // Apply date filters
    if (dateFrom) {
      const fromTime = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate()).getTime();
      events = events.filter((e) => new Date(e.timestamp).getTime() >= fromTime);
    }
    if (dateTo) {
      const toTime = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate()).getTime() + 86400000;
      events = events.filter((e) => new Date(e.timestamp).getTime() < toTime);
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const dateMap = new Map<string, HistEvent[]>();
    for (const e of events) {
      const d = new Date(e.timestamp);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!dateMap.has(key)) dateMap.set(key, []);
      dateMap.get(key)!.push(e);
    }

    const result: DateGroup[] = [];
    for (const [, dayEvents] of dateMap) {
      const d = new Date(dayEvents[0].timestamp);
      const dateLabel = fmtDate(d, l.months);

      const surahMap = new Map<number, HistEvent[]>();
      for (const e of dayEvents) {
        if (!surahMap.has(e.surahNumber)) surahMap.set(e.surahNumber, []);
        surahMap.get(e.surahNumber)!.push(e);
      }

      const surahGroups: SurahGroup[] = [];
      for (const [num, evts] of surahMap) {
        const surah = surahs.find((s) => s.number === num);
        if (surah) surahGroups.push({ surah, events: evts });
      }
      surahGroups.sort((a, b) => a.surah.number - b.surah.number);

      result.push({ dateLabel, surahGroups });
    }

    return result;
  }, [allStates, dateFrom, dateTo]);

  const fmtTime = (ts: string) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const totalEvents = grouped.reduce((sum, dg) => sum + dg.surahGroups.reduce((s, sg) => s + sg.events.length, 0), 0);

  return (
    <div className={`flex-1 overflow-y-auto px-8 py-8 ${SCROLL_CLS}`}>
      <h2 className="font-['Amiri'] text-3xl font-bold gold-text mb-4">{l.history}</h2>

      {/* Date Range Filter */}
      <div className="relative flex items-center gap-2 mb-5" ref={calRef}>
        <DateFilterBtn label={l.filterFrom} value={dateFrom} onClick={() => setShowCalendar(showCalendar === "from" ? null : "from")} active={showCalendar === "from"} monthsShort={l.monthsShort} />
        <DateFilterBtn label={l.filterTo} value={dateTo} onClick={() => setShowCalendar(showCalendar === "to" ? null : "to")} active={showCalendar === "to"} monthsShort={l.monthsShort} />
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(null); setDateTo(null); setShowCalendar(null); }}
            className="flex items-center gap-1 px-2 h-8 text-xs font-medium text-red bg-red/[0.06] border border-red/[0.1] rounded-lg cursor-pointer hover:bg-red/[0.13] transition-colors">
            <HugeiconsIcon icon={Cancel01Icon} size={12} />
            {l.clearFilter}
          </button>
        )}

        {showCalendar && (
          <CalendarPicker
            value={showCalendar === "from" ? dateFrom : dateTo}
            onChange={(d) => {
              if (showCalendar === "from") setDateFrom(d);
              else setDateTo(d);
              setShowCalendar(null);
            }}
            months={l.months}
            dayHeaders={l.dayHeaders}
          />
        )}
      </div>

      {totalEvents === 0 ? (
        <div className="text-center py-10 text-base text-faint">{l.noHistory}</div>
      ) : (
        <div className="flex flex-col gap-5">
          {grouped.map((dg) => (
            <div key={dg.dateLabel}>
              <div className="text-[12px] font-medium text-gold-dim mb-2">{dg.dateLabel}</div>
              <div className="flex flex-col gap-1">
                {dg.surahGroups.map((sg) => {
                  const key = `${dg.dateLabel}-${sg.surah.number}`;
                  const isOpen = expanded.has(key);
                  return (
                    <div key={key}>
                      <button onClick={() => toggle(key)}
                        className="w-full flex items-center gap-4 py-3 px-4 rounded-xl cursor-pointer transition-all duration-200 text-left hover:bg-white/[0.012] bg-transparent border-none">
                        <div className={`w-9 h-9 flex items-center justify-center text-sm font-semibold rounded-lg shrink-0 ${isOpen ? "bg-gold/[0.1] text-gold" : "bg-gold/[0.05] text-gold-dim"}`}>
                          {sg.surah.number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-semibold ${isOpen ? "text-gold-soft" : "text-cream"}`}>{sg.surah.latin}</span>
                          <span className="text-[12px] text-faint ml-2">{sg.events.length} muraja'ah</span>
                        </div>
                        <HugeiconsIcon icon={isOpen ? ArrowDown01Icon : ArrowRight01Icon} size={16} className={`shrink-0 transition-colors ${isOpen ? "text-gold" : "text-faint"}`} />
                      </button>
                      {isOpen && (
                        <div className="mt-1 ml-5 mb-3">
                          {sg.events.map((e) => (
                            <div key={`${e.surahNumber}-${e.ayahNumber}-${e.timestamp}`}
                              className="flex items-center gap-4 py-3 px-4 rounded-xl transition-colors hover:bg-white/[0.012]">
                              <div className="w-9 h-9 flex items-center justify-center text-sm font-semibold rounded-lg shrink-0 bg-gold/[0.05] text-gold-dim">{e.ayahNumber}</div>
                              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                                <HugeiconsIcon icon={Clock01Icon} size={12} className="text-ghost" />
                                <span className="text-[12px] text-ghost">{fmtTime(e.timestamp)}</span>
                              </div>
                              <button onClick={(ev) => { ev.stopPropagation(); setConfirm({ ...e, surahName: sg.surah.latin }); }}
                                className="px-2 h-7 text-xs font-medium rounded-lg bg-red/[0.06] border border-red/[0.1] text-red cursor-pointer hover:bg-red/[0.13] transition-colors">
                                {l.deleteEntry}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setConfirm(null)}>
          <div className="bg-night-2 border border-gold/[0.15] rounded-2xl p-6 max-w-sm mx-4 shadow-[0_8px_40px_rgba(0,0,0,0.6)]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-cream mb-2">{l.confirmDeleteTitle}</h3>
            <p className="text-sm text-muted mb-5">
              {l.confirmDeleteBody(confirm.surahName, confirm.ayahNumber)}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirm(null)}
                className="px-3 h-8 text-sm font-medium text-cream-dim bg-white/[0.04] border border-white/[0.06] rounded-lg cursor-pointer hover:bg-white/[0.08] transition-colors">
                {l.cancel}
              </button>
              <button onClick={() => { onDeleteEvent(confirm.surahNumber, confirm.ayahNumber, confirm.timestamp); setConfirm(null); }}
                className="px-3 h-8 text-sm font-medium text-red bg-red/[0.06] border border-red/[0.1] rounded-lg cursor-pointer hover:bg-red/[0.13] transition-colors">
                {l.deleteEntry}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DateFilterBtn({ label, value, onClick, active, monthsShort }: { label: string; value: Date | null; onClick: () => void; active: boolean; monthsShort: string[] }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-3 h-8 text-xs font-medium rounded-lg border cursor-pointer transition-colors ${
        active ? "bg-gold/[0.1] border-gold/[0.2] text-gold" : "bg-white/[0.02] border-white/[0.06] text-cream-dim hover:bg-white/[0.04]"
      }`}>
      <HugeiconsIcon icon={Calendar01Icon} size={13} />
      {value ? `${label}: ${value.getDate()} ${monthsShort[value.getMonth()]} ${value.getFullYear()}` : label}
    </button>
  );
}

function CalendarPicker({ value, onChange, months, dayHeaders }: { value: Date | null; onChange: (d: Date) => void; months: string[]; dayHeaders: string[] }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(value?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(value?.getMonth() ?? today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedKey = value ? `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}` : "";
  const DAY_HEADERS = dayHeaders;

  return (
    <div className="absolute top-full left-0 mt-2 z-50 bg-night-2 border border-gold/[0.15] rounded-xl p-4 shadow-[0_8px_40px_rgba(0,0,0,0.6)] w-[280px]">
      {/* Header: month/year nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer hover:bg-white/[0.04] text-cream-dim transition-colors">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
        </button>
        <span className="text-sm font-semibold text-cream">{months[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer hover:bg-white/[0.04] text-cream-dim transition-colors">
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-[10px] text-faint font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const d = new Date(viewYear, viewMonth, day);
          const isFuture = d.getTime() > todayDate.getTime();
          const key = `${viewYear}-${viewMonth}-${day}`;
          const isSelected = key === selectedKey;
          const isToday = d.getTime() === todayDate.getTime();

          return (
            <button key={day} disabled={isFuture}
              onClick={() => onChange(new Date(viewYear, viewMonth, day))}
              className={`w-full aspect-square flex items-center justify-center text-xs rounded-lg border-none cursor-pointer transition-colors ${
                isSelected
                  ? "bg-gold/[0.2] text-gold font-semibold"
                  : isToday
                    ? "bg-white/[0.04] text-cream ring-1 ring-gold/30"
                    : isFuture
                      ? "text-ghost/30 cursor-not-allowed bg-transparent"
                      : "text-cream-dim bg-transparent hover:bg-white/[0.04]"
              }`}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GuidePage({ l, lang }: { l: ReturnType<typeof t>; lang: Lang }) {
  return (
    <div className={`flex-1 overflow-y-auto px-8 py-8 ${SCROLL_CLS}`}>
      <div className="text-center mb-8">
        <div className="font-['Noto_Naskh_Arabic'] text-2xl font-semibold text-gold opacity-50 mb-3" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
        <h2 className="font-['Amiri'] text-3xl font-bold gold-text mb-2">JuzDoIt</h2>
        <p className="text-sm text-muted">{l.guideSubtitle}</p>
      </div>

      <div className="space-y-6 text-[15px] leading-relaxed text-cream-dim">
        <div>
          <h3 className="font-['Amiri'] text-lg font-bold text-cream mb-2">{l.guideWhatTitle}</h3>
          <p>{l.guideWhatBody}</p>
        </div>

        <div>
          <h3 className="font-['Amiri'] text-lg font-bold text-cream mb-2">{l.guideHowTitle}</h3>
          <p className="mb-3">{l.guideHowBody}</p>
          <p><span className="text-gold font-mono text-[13px]">{lang === "en" ? l.guideFormulaEn : l.guideFormulaId}</span></p>
        </div>

        <div>
          <h3 className="font-['Amiri'] text-lg font-bold text-cream mb-2">{l.guideScienceTitle}</h3>
          <p className="mb-3">{l.guideScienceP1}</p>
          <p className="mb-3">{l.guideScienceP2}</p>
          <p className="mb-3">{l.guideScienceP3}</p>
          <div className="text-[13px] text-faint mt-4 space-y-1">
            <p>{l.guideReferences}</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Ebbinghaus, H. (1885). Memory: A Contribution to Experimental Psychology</li>
              <li>Murre, J.M.J. &amp; Dros, J. (2015). Replication and Analysis of Ebbinghaus&apos; Forgetting Curve. PLOS ONE</li>
              <li>Murajaah in Quran Memorization Among Islamic Students: A Systematic Literature Review (2024). IJMOE</li>
              <li>Wollstein, Y. &amp; Jabbour, N. (2022). Spaced Effect Learning and Blunting the Forgetfulness Curve. Ear, Nose &amp; Throat Journal</li>
            </ul>
          </div>
        </div>

        <div>
          <h3 className="font-['Amiri'] text-lg font-bold text-cream mb-2">{l.guideWhyTitle}</h3>
          <p className="mb-3">{l.guideWhyIntro}</p>
          <blockquote className="border-l-2 border-gold/30 pl-4 italic text-cream/80 mb-3">
            &ldquo;{l.guideHadith1}&rdquo;
            <span className="block text-xs text-muted mt-1 not-italic">{l.guideHadith1Source}</span>
          </blockquote>
          <p className="mb-3">{l.guideAlsoSaid}</p>
          <blockquote className="border-l-2 border-gold/30 pl-4 italic text-cream/80 mb-3">
            &ldquo;{l.guideHadith2}&rdquo;
            <span className="block text-xs text-muted mt-1 not-italic">{l.guideHadith2Source}</span>
          </blockquote>
          <p>{l.guideClosing}</p>
        </div>

      </div>
    </div>
  );
}
