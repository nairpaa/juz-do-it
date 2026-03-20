import { TOTAL_AYAHS } from "@/data/surahs";

export type Lang = "en" | "id";

const TOTAL_FORMATTED = { en: "6,236", id: "6.236" };

export const t = (lang: Lang) => ({
  quran: lang === "en" ? "Quran" : "Al-Quran",
  progress: lang === "en" ? "Progress" : "Progres",
  guide: lang === "en" ? "Guide" : "Panduan",
  history: lang === "en" ? "History" : "Riwayat",
  deleteEntry: lang === "en" ? "Delete" : "Hapus",
  noHistory: lang === "en" ? "No memorization history yet" : "Belum ada riwayat hafalan",
  filterAll: lang === "en" ? "All" : "Semua",
  filterFrom: lang === "en" ? "From" : "Dari",
  filterTo: lang === "en" ? "To" : "Sampai",
  clearFilter: lang === "en" ? "Clear" : "Hapus filter",
  reviewed: "muraja'ah",
  undo: lang === "en" ? "Undo" : "Batal",
  cancel: lang === "en" ? "Cancel" : "Batal",
  confirmDeleteTitle: lang === "en" ? "Delete this entry?" : "Hapus entri ini?",
  confirmDeleteBody: (surahName: string, ayahNumber: number) =>
    lang === "en"
      ? `This will remove the muraja'ah record for ${surahName} Ayah ${ayahNumber}. Your retention data will be recalculated.`
      : `Ini akan menghapus catatan muraja'ah untuk ${surahName} Ayat ${ayahNumber}. Data hafalan akan dihitung ulang.`,
  searchSurah: lang === "en" ? "Search surah..." : "Cari surah...",
  ayahsMemorized: lang === "en" ? "Ayahs Memorized" : "Ayat Dihafal",
  outOf: lang === "en" ? `out of ${TOTAL_FORMATTED.en}` : `dari ${TOTAL_FORMATTED.id}`,
  needsReview: lang === "en" ? "Needs Review" : "Perlu Diulang",
  below40: lang === "en" ? "below 40%" : "di bawah 40%",
  makkiyah: "Makkiyah",
  madaniyah: "Madaniyah",
  overview: lang === "en" ? "Overview" : "Ringkasan",
  charts: lang === "en" ? "Statistics" : "Statistik",
  dailyReviews: lang === "en" ? "Daily Muraja'ah (30 days)" : "Muraja'ah Harian (30 hari)",
  totalAyahsTracked: lang === "en" ? "Total Ayahs Memorized (30 days)" : "Total Ayat Dihafal (30 hari)",
  activityLabel: lang === "en" ? "Muraja'ah Activity" : "Aktivitas Muraja'ah",
  lessLabel: lang === "en" ? "Less" : "Sedikit",
  moreLabel: lang === "en" ? "More" : "Banyak",
  todayReviews: lang === "en" ? "Today's Muraja'ah" : "Muraja'ah Hari Ini",
  avgRetention: lang === "en" ? "Average Retention" : "Rata-rata Retensi",
  surahCompletion: lang === "en" ? "Surah Completion" : "Kelengkapan Surah",
  keepGoing: lang === "en" ? "keep going!" : "terus semangat!",
  startToday: lang === "en" ? "start your day!" : "mulai hari ini!",
  surahsTracked: lang === "en" ? "Surahs Tracked" : "Surah Dilacak",
  outOfSurahs: lang === "en" ? "out of 114" : "dari 114",
  weakestAyahs: lang === "en" ? "Weakest Ayahs" : "Ayat Terlemah",
  selectSurahToStart: lang === "en" ? "Select a surah to start memorizing" : "Pilih surah untuk mulai menghafal",
  allGood: lang === "en" ? "All ayahs in good retention" : "Semua ayat dalam kondisi baik",
  ayat: lang === "en" ? "ayahs" : "ayat",
  ofAyahsTracked: (n: number, total: number) =>
    lang === "en" ? `${n} of ${total} ayahs tracked` : `${n} dari ${total} ayat dilacak`,
  all: lang === "en" ? "All" : "Semua",
  memorizedOnly: lang === "en" ? "Memorized" : "Dihafal",
  notMemorized: lang === "en" ? "Not memorized" : "Belum dihafal",
  start: lang === "en" ? "Start" : "Mulai",
  reviewBtn: "Muraja'ah",
  ready: lang === "en" ? "Ready" : "Siap",
  last: lang === "en" ? "Last" : "Terakhir",
  next: lang === "en" ? "Next" : "Berikutnya",
  ayah: lang === "en" ? "Ayah" : "Ayat",
  justNow: lang === "en" ? "just now" : "baru saja",
  timeAgo: (value: number, unit: string) =>
    lang === "en" ? `${value}${unit} ago` : `${value}${unit === "m" ? "m" : unit === "h" ? "j" : "h"} lalu`,
  timeIn: (value: number, unit: string) =>
    lang === "en" ? `in ${value}${unit}` : `${value}${unit === "h" ? "j" : "h"} lagi`,
  months: lang === "en"
    ? ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    : ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"],
  monthsShort: lang === "en"
    ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    : ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
  dayLabels: lang === "en"
    ? ["", "Mon", "", "Wed", "", "Fri", ""]
    : ["", "Sen", "", "Rab", "", "Jum", ""],
  dayHeaders: lang === "en"
    ? ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
    : ["Mi", "Se", "Se", "Ra", "Ka", "Ju", "Sa"],
  exportData: lang === "en" ? "Export" : "Ekspor",
  importData: lang === "en" ? "Import" : "Impor",
  importFailed: lang === "en" ? "Invalid file format" : "Format file tidak valid",
  selectSurah: lang === "en" ? "Select a surah" : "Pilih surah",
  totalAyahs: TOTAL_AYAHS,
  meaning: (s: { meaningId: string; meaningEn: string }) =>
    lang === "en" ? s.meaningEn : s.meaningId,

  // Guide page
  guideSubtitle: lang === "en" ? "Your Quran memorization companion" : "Teman hafalan Al-Quran kamu",
  guideWarningTitle: lang === "en" ? "Before you start" : "Sebelum mulai",
  guideWarningBody: lang === "en"
    ? "Make sure you have learned proper tajweed (Quran recitation rules) before memorizing. Memorizing with incorrect pronunciation means you'll have to relearn everything later — that's double the work. Always have a teacher or a study partner who can check your recitation. JuzDoIt is a tracking tool, not a replacement for a teacher."
    : "Pastikan kamu sudah belajar tajwid (aturan membaca Al-Quran) dengan benar sebelum menghafal. Menghafal dengan bacaan yang salah berarti harus belajar ulang semuanya nanti — itu kerja dua kali. Selalu punya guru atau rekan yang bisa memeriksa bacaan kamu. JuzDoIt adalah alat bantu pelacakan, bukan pengganti guru.",
  guideWhatTitle: lang === "en" ? "What is JuzDoIt?" : "Apa itu JuzDoIt?",
  guideWhatBody: lang === "en"
    ? "When we memorize the Quran, the hardest part isn't memorizing — it's keeping what we've memorized. Without regular review, our memory fades. JuzDoIt helps you know exactly which ayahs are getting weak and need to be reviewed, so nothing is forgotten."
    : "Saat menghafal Al-Quran, yang paling sulit bukan menghafalnya — tapi menjaga hafalan yang sudah ada. Tanpa diulang secara rutin, ingatan akan memudar. JuzDoIt membantu kamu tahu persis ayat mana yang mulai lemah dan perlu diulang, supaya tidak ada yang terlupakan.",
  guideHowTitle: lang === "en" ? "How it works" : "Cara kerja",
  guideHowBody: lang === "en"
    ? "Every ayah you memorize gets tracked in this app. Think of each ayah like a plant — if you water it regularly (review), it stays alive and grows stronger. If you leave it too long without watering, it starts to wilt. JuzDoIt shows you which \"plants\" need watering today."
    : "Setiap ayat yang kamu hafal akan dilacak di aplikasi ini. Bayangkan setiap ayat seperti tanaman — kalau rajin disiram (diulang), dia tetap hidup dan makin kuat. Kalau terlalu lama tidak disiram, mulai layu. JuzDoIt menunjukkan \"tanaman\" mana yang perlu disiram hari ini.",
  guideFormulaEn: "The app sets your review schedule automatically. At first you review an ayah the next day, then after 3 days, then a week, two weeks, a month — and the gap keeps getting longer. The more you review, the less often you need to. And as the gaps grow longer, you free up more time to memorize new ayahs. That's how JuzDoIt helps you not just maintain your memorization, but steadily grow it.",
  guideFormulaId: "Aplikasi mengatur jadwal pengulangan secara otomatis. Awalnya kamu mengulang ayat besok, lalu setelah 3 hari, lalu seminggu, dua minggu, sebulan — dan jaraknya terus bertambah. Makin sering diulang, makin jarang perlu diulang. Dan saat jaraknya makin panjang, waktu luang kamu makin banyak untuk menghafal ayat baru. Begitulah JuzDoIt membantu bukan hanya menjaga hafalan, tapi juga terus menambahnya.",
  guideScienceTitle: lang === "en" ? "Why does this work?" : "Kenapa cara ini efektif?",
  guideScienceP1: lang === "en"
    ? "Our brains are built to forget. If we learn something new and never look at it again, most of it disappears within a day. This is normal — it happens to everyone."
    : "Otak kita memang dirancang untuk lupa. Kalau kita belajar sesuatu yang baru lalu tidak pernah dilihat lagi, sebagian besar hilang dalam sehari. Ini normal — terjadi pada semua orang.",
  guideScienceP2: lang === "en"
    ? "But there's a trick: if you review at just the right moment — right before you're about to forget — the memory becomes much stronger. And the next time, it takes even longer before you forget. This method is called spaced repetition, and it's used all over the world for learning languages, medicine, and more."
    : "Tapi ada caranya: kalau kamu mengulang di waktu yang tepat — tepat sebelum lupa — ingatan jadi jauh lebih kuat. Dan berikutnya, butuh waktu lebih lama lagi sebelum lupa. Metode ini disebut spaced repetition, dan dipakai di seluruh dunia untuk belajar bahasa, kedokteran, dan lainnya.",
  guideScienceP3: lang === "en"
    ? "This same approach has been studied for Quran memorization. The result: those who review on a regular schedule remember far more than those who review whenever they feel like it."
    : "Pendekatan yang sama sudah diteliti untuk hafalan Al-Quran. Hasilnya: mereka yang mengulang secara terjadwal mengingat jauh lebih banyak dibanding yang mengulang sesuka hati.",
  guideReferences: lang === "en" ? "References:" : "Referensi:",
  guideWhyTitle: lang === "en" ? "The virtue of memorizing the Quran" : "Keutamaan menghafal Al-Quran",
  guideWhyIntro: lang === "en" ? "The Prophet Muhammad (peace be upon him) said:" : "Rasulullah shallallahu 'alaihi wa sallam bersabda:",
  guideHadith1: lang === "en"
    ? "It will be said to the companion of the Quran: Read, ascend, and recite as you used to recite in the world, for your rank will be at the last verse you recite."
    : "Akan dikatakan kepada shahibul Quran: Bacalah, naiklah, dan bacalah dengan tartil sebagaimana engkau membacanya di dunia, karena kedudukanmu ada pada ayat terakhir yang engkau baca.",
  guideHadith1Source: "— Sunan Abu Dawud 1464, Jami at-Tirmidhi 2914",
  guideAlsoSaid: lang === "en" ? "And he also said:" : "Dan beliau juga bersabda:",
  guideHadith2: lang === "en"
    ? "Whoever reads the Quran, learns it, and acts upon it, on the Day of Resurrection his parents will be crowned with a light whose brightness is like the brightness of the sun."
    : "Siapa yang membaca Al-Quran, mempelajarinya, dan mengamalkannya, maka pada hari kiamat kedua orang tuanya akan dimahkotai dengan cahaya yang terangnya seperti terangnya matahari.",
  guideHadith2Source: "— Musnad Ahmad 15645",
  guideClosing: lang === "en"
    ? "The more you memorize, the higher your rank in the hereafter. And it's not just for you — your parents will be honored with a crown of light on the Day of Judgment. Every ayah you memorize and every review you do is an investment for you and your family."
    : "Semakin banyak yang dihafal, semakin tinggi derajat kamu di akhirat. Dan bukan hanya untuk kamu — orang tua kamu pun akan dimuliakan dengan mahkota cahaya di hari kiamat. Setiap ayat yang dihafal dan setiap muraja'ah adalah investasi untuk kamu dan keluarga.",
});
