import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Named "--font-sans" (not "--font-geist-sans", next/font's usual default)
// to match what globals.css's Tailwind theme actually reads — the previous
// Geist setup used the mismatched default name, so it was silently never
// applied and the site was rendering in the browser's fallback sans font.
const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RideMeet — group rides & runs",
  description: "Post and join group bike rides, motorcycle rides, and runs. Pick a meetup, see where to start, RSVP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
