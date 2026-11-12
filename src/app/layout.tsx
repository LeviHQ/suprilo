import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const headingFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const viewport: Viewport = {
  themeColor: "#FF4D6D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://suprilo.vercel.app"),
  title: "Suprilo — Make Every Moment a Surprise",
  description:
    "Turn your favorite memories, heartfelt messages, and happy moments into interactive scratch cards. Share a link and let someone discover the surprise.",
  keywords: [
    "scratch cards",
    "digital surprise cards",
    "interactive greeting cards",
    "birthday surprise",
    "celebration card",
    "Suprilo",
  ],
  authors: [{ name: "Suprilo" }],
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/brand/favicon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Suprilo — Make Every Moment a Surprise",
    description:
      "Turn your favorite memories, heartfelt messages, and happy moments into interactive scratch cards. Share a link and let someone discover the surprise.",
    url: "https://suprilo.vercel.app",
    siteName: "Suprilo",
    images: [
      {
        url: "/brand/og-image.png",
        width: 1200,
        height: 630,
        alt: "Suprilo — Make Every Moment a Surprise",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Suprilo — Make Every Moment a Surprise",
    description:
      "Turn your favorite memories, heartfelt messages, and happy moments into interactive scratch cards.",
    images: ["/brand/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable} overflow-x-clip max-w-full`}>
      <body className="bg-brand-warm text-brand-dark min-h-screen flex flex-col selection:bg-brand-pink/15 selection:text-brand-pink overflow-x-clip max-w-full">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
