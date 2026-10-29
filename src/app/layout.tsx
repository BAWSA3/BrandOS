import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Press_Start_2P } from 'next/font/google';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ToastProvider } from '@/components/ToastProvider';
import BetaBadge from '@/components/BetaBadge';
import EnvBanner from '@/components/EnvBanner';
import PostHogProvider from '@/components/PostHogProvider';

// Self-hosted at build time by next/font (no request to Google from the
// visitor's browser). Exposed as CSS variables; components use
// var(--font-inter) / var(--font-jetbrains) / var(--font-press-start).
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
  variable: '--font-inter',
  display: 'swap',
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
});
const pressStart = Press_Start_2P({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-press-start',
  display: 'swap',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'BrandOS — Your brand, scored.',
  description:
    "See what your posts say you're known for, what's landing, and the one move to make next. Scan your X free.",
  keywords: [
    'brand',
    'AI',
    'creator',
    'brand score',
    'brand DNA',
    'personal branding',
    'content strategy',
  ],
  authors: [{ name: 'BrandOS' }],
  creator: 'BrandOS',
  metadataBase: new URL('https://mybrandos.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://mybrandos.app',
    siteName: 'BrandOS',
    title: 'BrandOS — Your brand, scored.',
    description:
      "See what your posts say you're known for, what's landing, and the one move to make next. Scan your X free.",
    images: [
      {
        url: '/api/og/home',
        width: 1200,
        height: 630,
        alt: 'BrandOS: Your brand, scored.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BrandOS — Your brand, scored.',
    description:
      "See what your posts say you're known for, what's landing, and the one move to make next. Scan your X free.",
    images: ['/api/og/home'],
    creator: '@mybrandos',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${inter.variable} ${jetbrains.variable} ${pressStart.variable}`}
      suppressHydrationWarning
    >
      {/* Custom fonts loaded via @font-face in globals.css (all from /public/fonts) */}
      <body>
        <EnvBanner />
        <PostHogProvider>
          <ToastProvider>
            <ThemeProvider>
              <BetaBadge variant="banner" />
              {children}
            </ThemeProvider>
          </ToastProvider>
        </PostHogProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
