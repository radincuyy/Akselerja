import "./globals.css";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Providers from "@/components/Providers";

const generalSans = localFont({
  src: [
    {
      path: "../public/fonts/GeneralSans-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/GeneralSans-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/GeneralSans-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-general-sans",
  display: "swap",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Akselerja, cari kerja yang cocok dengan kemampuanmu",
  description:
    "Akselerja menunjukkan posisimu sekarang, kenapa kamu cocok atau belum, dan apa yang harus kamu pelajari berikutnya.",
  metadataBase: new URL("https://akselerja.id"),
  openGraph: {
    title: "Akselerja, cari kerja yang cocok dengan kemampuanmu",
    description:
      "Match score, skill gap, dan rencana belajar yang jelas. Untuk pencari kerja Indonesia.",
    locale: "id_ID",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf8f3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={generalSans.variable}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <a href="#main" className="skip-link">
          Lewat ke konten utama
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
