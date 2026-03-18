"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Analytics02Icon, Book02Icon, Idea01Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { surahs, Surah, TOTAL_AYAHS } from "@/data/surahs";
import { RetentionBadge } from "@/components/BatteryIndicator";
import { AyahState, calculateBattery, calculateSurahBattery } from "@/lib/battery";
import {
  DerivedAyahState, getAllDerivedStates, getDerivedStatesForSurah,
  addReview, undoLastEvent, deleteEvent,
} from "@/lib/store";
import { Lang, t } from "@/lib/i18n";
import { timeAgo, nextReview } from "@/lib/time";

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

  const reload = useCallback(() => setAllStates(getAllDerivedStates()), []);

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
            memorizedSurahs={memorizedSurahs} active={active} onSelectSurah={loadSurah} />
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

function StatsPage({ l, memorizedCount, lowCount, pct, memorizedSurahs, active, onSelectSurah }: {
  l: ReturnType<typeof t>; memorizedCount: number; lowCount: number; pct: number;
  memorizedSurahs: Surah[]; active: DerivedAyahState[]; onSelectSurah: (s: Surah) => void;
}) {
  const weakest = useMemo(() =>
    [...active]
      .map((s) => ({ ...s, battery: calculateBattery(s) }))
      .filter((s) => s.battery < 60)
      .sort((a, b) => a.battery - b.battery)
      .slice(0, 10),
    [active]
  );

  return (
    <div className={`flex-1 overflow-y-auto px-8 py-8 ${SCROLL_CLS}`}>
      <h2 className="font-['Amiri'] text-3xl font-bold gold-text mb-8">{l.progress}</h2>

      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { val: memorizedCount, label: l.ayahsMemorized, sub: l.outOf, color: "text-gold" },
          { val: lowCount, label: l.needsReview, sub: l.below40, color: "text-red" },
          { val: `${pct}%`, label: l.progressLabel, sub: `${memorizedSurahs.length} ${l.surahs}`, color: "text-green" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6 text-center">
            <div className={`font-['Amiri'] text-4xl font-bold leading-none ${s.color}`}>{s.val}</div>
            <div className="text-sm text-muted mt-3">{s.label}</div>
            <div className="text-[13px] text-faint mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {weakest.length > 0 ? (
        <>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-faint mb-4">{l.weakestAyahs}</h3>
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
        </>
      ) : memorizedCount === 0 ? (
        <div className="text-center py-10 text-base text-faint">{l.selectSurahToStart}</div>
      ) : (
        <div className="text-center py-10 text-base text-green">{l.allGood}</div>
      )}
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
