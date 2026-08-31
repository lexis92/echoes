import { Fraunces, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";

/** Display voice — soft, slightly wonky serif. The emotional register. */
export const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  axes: ["SOFT", "WONK", "opsz"],
});

/** Interface voice — refined, narrow-ish grotesque. */
export const sans = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

/** Ledger voice — timestamps, share links, counts. */
export const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const fontVariables = `${display.variable} ${sans.variable} ${mono.variable}`;
