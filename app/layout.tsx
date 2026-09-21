import type { Metadata, Viewport } from "next";
import { Caveat, Fraunces, EB_Garamond } from "next/font/google";
import "./globals.css";

/** Marker-pen script - headings, service names, every hand-written accent. */
const caveat = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/** Characterful display serif for the big statements. */
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK"],
});

/** Quiet old-style serif for the small print. */
const garamond = EB_Garamond({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pi TV",
  description: "A hand-drawn media center for the living room",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#17130F",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${caveat.variable} ${fraunces.variable} ${garamond.variable} h-full antialiased`}
    >
      <body className="h-full">{children}</body>
    </html>
  );
}
