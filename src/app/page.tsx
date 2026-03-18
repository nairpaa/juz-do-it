"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Analytics02Icon, Book02Icon, Idea01Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { surahs, Surah, TOTAL_AYAHS } from "@/data/surahs";
import { RetentionBadge } from "@/components/BatteryIndicator";
import { calculateBattery, calculateSurahBattery } from "@/lib/battery";
import {
  DerivedAyahState, ReviewEvent, getAllDerivedStates, getDerivedStatesForSurah,
  addReview, undoLastEvent, deleteEvent, getLog,
} from "@/lib/store";
import { Lang, t } from "@/lib/i18n";
import { timeAgo, nextReview } from "@/lib/time";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fmtDate = (d: Date) => `${d.getDate()} ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;

type Page = "surahs" | "stats" | "history" | "about";

const NAV_ITEMS: { id: Page; icon: typeof Analytics02Icon }[] = [
  { id: "surahs", icon: Book02Icon },
  { id: "stats", icon: Analytics02Icon },
  { id: "history", icon: Clock01Icon },
  { id: "about", icon: Idea01Icon },
];

const SCROLL_CLS = "[&::-webkit-scrollbar]:w-[2px] [&::-webkit-scrollbar-thumb]:bg-gold/[0.08] [&::-webkit-scrollbar-thumb]:rounded-full";

export default function Home() {
  const [allStates, setAllStates] = useState<DerivedAyahState[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Surah | null>(null);
  const [surahStates, setSurahStates] = useState<Map<number, DerivedAyahState>>(new Map());
  const [page, setPage] = useState<Page>("surahs");
  const [lang, setLang] = useState<Lang>("en");
  const l = useMemo(() => t(lang), [lang]);

  const [log, setLog] = useState<ReviewEvent[]>([]);

  const reload = useCallback(() => { setAllStates(getAllDerivedStates()); setLog(getLog()); }, []);

  const loadSurah = useCallback((surah: Surah) => {
    setPage("surahs");
    setSelected(surah);
    const m = new Map<number, DerivedAyahState>();
    getDerivedStatesForSurah(surah.number).forEach((s) => m.set(s.ayahNumber, s));
    setSurahStates(m);
  }, []);

  useEffect(() => { reload(); loadSurah(surahs[0]); }, [reload, loadSurah]);

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

  const navLabels: Record<Page, string> = { surahs: l.quran, stats: l.progress, history: l.history, about: l.guide };

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
              onClick={() => { setPage(item.id); if (item.id !== "surahs") setSelected(null); }}
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
          <StatsPage l={l} memorizedCount={memorizedCount} lowCount={lowCount} pct={pct}
            memorizedSurahs={memorizedSurahs} active={active} log={log} onSelectSurah={loadSurah} />
        ) : page === "history" ? (
          <HistoryPage l={l} lang={lang} allStates={allStates}
            onDeleteEvent={(s, a, ts) => { deleteEvent(s, a, ts); reload(); if (selected) loadSurah(selected); }}
            onSelectSurah={loadSurah} />
        ) : page === "about" ? (
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
  const DEBOUNCE_MS = 1500;

  const handleReview = (n: number) => {
    const now = Date.now();
    if (now - lastClickTime < DEBOUNCE_MS) return;
    setLastClickTime(now);
    onReview(n);
  };
  const surahBattery = surahActive.length > 0 ? calculateSurahBattery(surahActive) : -1;

  return (
    <>
      <div className="shrink-0 flex items-start justify-between gap-5 px-8 py-6 border-b border-white/[0.04]">
        <div>
          <h1 className="font-['Amiri'] text-3xl font-bold m-0 gold-text">{surah.latin}</h1>
          <div className="text-sm text-muted mt-1">{l.meaning(surah)} · {surah.ayahCount} {l.ayat} · {surah.type === "makkiyah" ? "Makkiyah" : "Madaniyah"}</div>
          {surahActive.length > 0 && <div className="text-[13px] text-faint mt-2">{l.ofAyahsTracked(surahActive.length, surah.ayahCount)}</div>}
        </div>
        <div className="text-right shrink-0">
          <div className="font-['Noto_Naskh_Arabic'] text-4xl font-semibold text-gold leading-snug" dir="rtl">{surah.name}</div>
          {surahBattery >= 0 && <div className="mt-2 flex justify-end"><RetentionBadge level={surahBattery} /></div>}
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto px-6 py-3 ${SCROLL_CLS}`}>
        {Array.from({ length: surah.ayahCount }, (_, i) => i + 1).map((n) => {
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

function StatsPage({ l, memorizedCount, lowCount, pct, memorizedSurahs, active, log, onSelectSurah }: {
  l: ReturnType<typeof t>; memorizedCount: number; lowCount: number; pct: number;
  memorizedSurahs: Surah[]; active: DerivedAyahState[]; log: ReviewEvent[]; onSelectSurah: (s: Surah) => void;
}) {
  const [tab, setTab] = useState<StatsTab>("overview");

  const weakest = useMemo(() =>
    [...active]
      .map((s) => ({ ...s, battery: calculateBattery(s) }))
      .filter((s) => s.battery < 60)
      .sort((a, b) => a.battery - b.battery)
      .slice(0, 10),
    [active]
  );

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
        fullDate: `${d.getDate()} ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`,
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
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-[13px] font-medium border-b-2 -mb-px cursor-pointer transition-colors bg-transparent ${tab === t.id ? "border-gold text-gold" : "border-transparent text-faint hover:text-cream"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto px-8 py-6 ${SCROLL_CLS}`}>
        {tab === "overview" && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { val: memorizedCount, label: l.ayahsMemorized, sub: l.outOf, color: "text-gold" },
              { val: lowCount, label: l.needsReview, sub: l.below40, color: "text-red" },
              { val: `${pct}%`, label: l.progressLabel, sub: `${memorizedSurahs.length} ${l.surahs}`, color: "text-green" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-5 text-center">
                <div className={`font-['Amiri'] text-4xl font-bold leading-none ${s.color}`}>{s.val}</div>
                <div className="text-sm text-muted mt-3">{s.label}</div>
                <div className="text-[13px] text-faint mt-1">{s.sub}</div>
              </div>
            ))}
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
          weakest.length > 0 ? (
            <div className="flex flex-col gap-2">
              {weakest.map((w) => {
                const s = surahs.find((s) => s.number === w.surahNumber);
                return (
                  <div key={`${w.surahNumber}-${w.ayahNumber}`} onClick={() => s && onSelectSurah(s)}
                    className="flex items-center justify-between py-3 px-5 rounded-xl bg-red/[0.03] border border-red/[0.06] cursor-pointer hover:bg-red/[0.06] transition-colors">
                    <span className="text-sm text-cream-dim">{s?.latin} — {l.ayah} {w.ayahNumber}</span>
                    <RetentionBadge level={w.battery} />
                  </div>
                );
              })}
            </div>
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

  const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
      monthLabels.push({ label: MONTHS_SHORT[lastMonth], col: w });
    }
  }

  const today = new Date();
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div ref={containerRef} className="relative rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
      <div className="text-[12px] font-medium text-muted mb-3">{l.activityLabel}</div>

      {/* Month labels row */}
      <div className="flex gap-[3px] mb-1 ml-[30px]">
        {weekCols.map((week, wi) => {
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
            const tipDate = fmtDate(day.date);
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

  const allEvents = useMemo(() => {
    const events: { surahNumber: number; ayahNumber: number; timestamp: string }[] = [];
    for (const state of allStates) {
      for (const event of state.events) {
        events.push(event);
      }
    }
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [allStates]);

  return (
    <div className={`flex-1 overflow-y-auto px-8 py-8 ${SCROLL_CLS}`}>
      <h2 className="font-['Amiri'] text-3xl font-bold gold-text mb-6">{l.history}</h2>

      {allEvents.length === 0 ? (
        <div className="text-center py-10 text-base text-faint">{l.noHistory}</div>
      ) : (
        <div className="flex flex-col gap-1">
          {allEvents.map((e) => {
            const s = surahs.find((s) => s.number === e.surahNumber);
            return (
              <div key={`${e.surahNumber}-${e.ayahNumber}-${e.timestamp}`}
                className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-white/[0.012] transition-colors">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => s && onSelectSurah(s)}>
                  <div className="text-sm font-medium text-cream">{s?.latin} — {l.ayah} {e.ayahNumber}</div>
                  <div className="text-[12px] text-ghost mt-0.5">{timeAgo(e.timestamp, lang)}</div>
                </div>
                <button onClick={() => setConfirm({ ...e, surahName: s?.latin || "" })}
                  className="px-2 h-7 text-xs font-medium rounded-lg bg-red/[0.06] border border-red/[0.1] text-red cursor-pointer hover:bg-red/[0.13] transition-colors">
                  {l.deleteEntry}
                </button>
              </div>
            );
          })}
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
