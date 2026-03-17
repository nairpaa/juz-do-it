import { TOTAL_AYAHS } from "@/data/surahs";

export type Lang = "en" | "id";

const TOTAL_FORMATTED = { en: "6,236", id: "6.236" };

export const t = (lang: Lang) => ({
  quran: lang === "en" ? "Quran" : "Al-Quran",
  progress: lang === "en" ? "Progress" : "Progres",
  guide: lang === "en" ? "Guide" : "Panduan",
  searchSurah: lang === "en" ? "Search surah..." : "Cari surah...",
  ayahsMemorized: lang === "en" ? "Ayahs Memorized" : "Ayat Dihafal",
  outOf: lang === "en" ? `out of ${TOTAL_FORMATTED.en}` : `dari ${TOTAL_FORMATTED.id}`,
  needsReview: lang === "en" ? "Needs Review" : "Perlu Diulang",
  below40: lang === "en" ? "below 40%" : "di bawah 40%",
  progressLabel: lang === "en" ? "Progress" : "Progres",
  surahs: lang === "en" ? "surahs" : "surah",
  weakestAyahs: lang === "en" ? "Weakest Ayahs" : "Ayat Terlemah",
  selectSurahToStart: lang === "en" ? "Select a surah to start memorizing" : "Pilih surah untuk mulai menghafal",
  allGood: lang === "en" ? "All ayahs in good retention" : "Semua ayat dalam kondisi baik",
  ayat: "ayat",
  ofAyahsTracked: (n: number, total: number) =>
    lang === "en" ? `${n} of ${total} ayahs tracked` : `${n} dari ${total} ayat dilacak`,
  notMemorized: lang === "en" ? "Not memorized" : "Belum dihafal",
  review: lang === "en" ? "Review" : "Ulang",
  memorized: lang === "en" ? "Memorized" : "Hafal",
  undo: "undo",
  ayah: lang === "en" ? "Ayah" : "Ayat",
  selectSurah: lang === "en" ? "Select a surah" : "Pilih surah",
  totalAyahs: TOTAL_AYAHS,
  meaning: (s: { meaningId: string; meaningEn: string }) =>
    lang === "en" ? s.meaningEn : s.meaningId,

  // Guide page
  guideSubtitle: lang === "en" ? "Your Quran memorization companion" : "Teman hafalan Al-Quran Anda",
  guideWhatTitle: lang === "en" ? "What is JuzDoIt?" : "Apa itu JuzDoIt?",
  guideWhatBody: lang === "en"
    ? "JuzDoIt is a simple tool to help you track your Quran memorization. It uses a spaced repetition system based on the Ebbinghaus forgetting curve — the same science behind how our brains retain information over time."
    : "JuzDoIt adalah alat sederhana untuk membantu melacak hafalan Al-Quran Anda. Menggunakan sistem pengulangan berjarak (spaced repetition) berdasarkan kurva lupa Ebbinghaus — sains yang sama di balik cara otak kita menyimpan informasi dalam jangka panjang.",
  guideHowTitle: lang === "en" ? "How it works" : "Cara kerja",
  guideHowBody: lang === "en"
    ? "Each ayah you memorize has a retention level. After you mark it as memorized, the retention starts at 100% and gradually decreases over time. Every time you review it, the retention resets and the decay slows down — meaning each review makes the memory stronger and longer-lasting."
    : "Setiap ayat yang Anda hafal memiliki tingkat retensi. Setelah ditandai sebagai hafal, retensi dimulai dari 100% dan menurun seiring waktu. Setiap kali Anda muraja'ah, retensi direset dan penurunannya melambat — artinya setiap pengulangan membuat hafalan semakin kuat dan tahan lama.",
  guideFormulaEn: "The retention formula follows an exponential decay: retention = 100% × e^(-t / stability), where t is time since last review and stability grows with each review (1 day → 3 days → 7 days → 14 days → 30 days → keeps doubling).",
  guideFormulaId: "Formula retensi mengikuti peluruhan eksponensial: retensi = 100% × e^(-t / stabilitas), di mana t adalah waktu sejak review terakhir dan stabilitas bertambah setiap review (1 hari → 3 hari → 7 hari → 14 hari → 30 hari → terus berlipat).",
  guideScienceTitle: lang === "en" ? "The science behind it" : "Dasar ilmiah",
  guideScienceP1: lang === "en"
    ? "This system is based on Hermann Ebbinghaus' forgetting curve (1885), which demonstrated that memory retention decays exponentially over time — with 50-70% of new information lost within 24 hours if not reinforced."
    : "Sistem ini berdasarkan kurva lupa Hermann Ebbinghaus (1885), yang menunjukkan bahwa retensi memori menurun secara eksponensial — dengan 50-70% informasi baru hilang dalam 24 jam jika tidak diulang.",
  guideScienceP2: lang === "en"
    ? "The solution is spaced repetition: reviewing material at strategically increasing intervals. Each review triggers protein synthesis in the brain, converting short-term memory into permanent neural connections. This is the same principle used by modern tools like Anki and SuperMemo."
    : "Solusinya adalah spaced repetition (pengulangan berjarak): mengulang materi pada interval yang meningkat secara strategis. Setiap pengulangan memicu sintesis protein di otak, mengubah memori jangka pendek menjadi koneksi neural permanen. Prinsip yang sama digunakan oleh Anki dan SuperMemo.",
  guideScienceP3: lang === "en"
    ? "Research on Quran memorization specifically (muraja'ah) confirms that structured repetition schedules significantly improve long-term retention among huffaz."
    : "Riset tentang hafalan Al-Quran (muraja'ah) secara khusus mengkonfirmasi bahwa jadwal pengulangan terstruktur secara signifikan meningkatkan retensi jangka panjang di kalangan huffaz.",
  guideReferences: lang === "en" ? "References:" : "Referensi:",
  guideWhyTitle: lang === "en" ? "Why memorize the Quran?" : "Mengapa menghafal Al-Quran?",
  guideWhyIntro: lang === "en" ? "The Prophet Muhammad (peace be upon him) said:" : "Rasulullah shallallahu 'alaihi wa sallam bersabda:",
  guideHadith1: lang === "en"
    ? "The best among you are those who learn the Quran and teach it."
    : "Sebaik-baik kalian adalah orang yang mempelajari Al-Quran dan mengajarkannya.",
  guideAlsoSaid: lang === "en" ? "And he also said:" : "Dan beliau juga bersabda:",
  guideHadith2: lang === "en"
    ? "It will be said to the companion of the Quran: Read, ascend, and recite as you used to recite in the world, for your rank will be at the last verse you recite."
    : "Akan dikatakan kepada shahibul Quran: Bacalah, naiklah, dan bacalah dengan tartil sebagaimana engkau membacanya di dunia, karena kedudukanmu ada pada ayat terakhir yang engkau baca.",
  guideClosing: lang === "en"
    ? "Every ayah you memorize is a step closer to Allah. Every review is an act of worship. Be consistent, even if it is little."
    : "Setiap ayat yang Anda hafal adalah langkah mendekat kepada Allah. Setiap muraja'ah adalah ibadah. Istiqomah, walau sedikit.",
});
