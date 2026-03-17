import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JuzDoIt — Quran Memorization",
  description: "Track your Quran memorization with spaced repetition",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Outfit:wght@300;400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="m-0 p-0 bg-night text-cream font-['Outfit'] h-screen overflow-hidden antialiased flex items-center justify-center">
        {children}
      </body>
    </html>
  );
}
