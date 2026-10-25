import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
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
  metadataBase: new URL("https://suprilo.com"),
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
  icons: {
    icon: [
      { url: "/brand/favicon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/brand/favicon.png" }],
  },
  openGraph: {
    title: "Suprilo — Make Every Moment a Surprise",
    description:
      "Turn your favorite memories, heartfelt messages, and happy moments into interactive scratch cards. Share a link and let someone discover the surprise.",
    url: "https://suprilo.com",
    siteName: "Suprilo",
    images: [
      {
        url: "/brand/logo.png",
        width: 1200,
        height: 630,
        alt: "Suprilo Logo and Tagline",
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
    images: ["/brand/logo.png"],
  },
};

import { AuthProvider } from "@/context/AuthContext";

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
