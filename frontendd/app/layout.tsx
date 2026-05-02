import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sea Credit — Kredit İdarəetmə Sistemi",
  description: "Sea Credit Bank — Professional kredit portfeli idarəetmə platforması",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
