# JuzDoIt

Track and strengthen your Quran memorization with science-based review scheduling.

JuzDoIt helps you know exactly which ayahs are getting weak and need to be reviewed, so nothing is forgotten. It uses spaced repetition based on the Ebbinghaus forgetting curve to schedule your muraja'ah at the right time.

## Features

- **Per-ayah retention tracking** — every ayah you memorize gets a retention score that decays over time
- **Spaced repetition algorithm** — review intervals grow as your memory strengthens (1 day, 3 days, 7 days, 14 days, 30 days, and beyond)
- **Smart scheduling** — shows which ayahs are ready for review and which ones are still strong
- **Graduated lapse detection** — if you forget an ayah, the penalty is proportional to how much you forgot
- **Event sourcing** — every muraja'ah click is stored as a separate event, giving you full control to delete any accidental entry without losing other progress
- **History page** — view and manage every recorded muraja'ah event
- **Statistics dashboard** — contribution heatmap, daily review chart, total memorized chart, and weakest ayahs list
- **Export/Import** — backup and restore your data as JSON
- **Bilingual** — English and Bahasa Indonesia, switchable from the header
- **Offline-first** — all data stored in localStorage, no account needed

## How the algorithm works

Each ayah's retention is calculated using the forgetting curve:

```
retention = 100% x e^(-elapsed / stability)
```

- **stability** grows with each effective review: 1 day, 3 days, 7 days, 14 days, 30 days, and keeps growing
- **effective review** requires enough time since the last one (minimum 50% of current stability)
- **lapse detection** checks retention at the time of review — if below 20%, you've forgotten and stability drops proportionally
- cramming (multiple reviews in a short time) does not inflate your progress

## Usage

**Online:** https://hifz.nairpaa.me

**Run locally:**

```bash
git clone https://github.com/nairpaa/juz-do-it.git
cd juz-do-it
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## License

This project is open source and available under the [MIT License](LICENSE).

Feel free to use, modify, and distribute. Contributions are welcome!
