import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ToastProvider } from "@/components/ToastProvider";
import FeedbackButton from "@/components/FeedbackButton";
import BetaBadge from "@/components/BetaBadge";

export const metadata: Metadata = {
  title: "BrandOS — Discover Your Brand DNA",
  description: "AI-powered brand analysis that reveals your unique creator identity. Get your Brand Score, discover your archetype, and unlock personalized growth insights.",
  keywords: ["brand", "AI", "creator", "brand score", "brand DNA", "personal branding", "content strategy"],
  authors: [{ name: "BrandOS" }],
  creator: "BrandOS",
  metadataBase: new URL("https://mybrandos.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mybrandos.app",
    siteName: "BrandOS",
    title: "BrandOS — Discover Your Brand DNA",
    description: "AI-powered brand analysis that reveals your unique creator identity. Get your Brand Score and unlock personalized growth insights.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BrandOS - Discover Your Brand DNA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BrandOS — Discover Your Brand DNA",
    description: "AI-powered brand analysis that reveals your unique creator identity. Get your Brand Score and unlock personalized growth insights.",
    images: ["/og-image.png"],
    creator: "@mybrandos",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Google Fonts for Design #2 */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
        {/* Custom fonts loaded via @font-face in globals.css */}
      </head>
      <body>
        <ToastProvider>
          <ThemeProvider>
            <BetaBadge variant="banner" />
            {children}
            <FeedbackButton />
          </ThemeProvider>
        </ToastProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
