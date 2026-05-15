import "./globals.css";
import type { Metadata, Viewport } from "next";

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
  themeColor: "#f8f6f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="preconnect"
          href="https://cdn.fontshare.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
