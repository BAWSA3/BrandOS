import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "brandos — Brand Guardian",
  description: "AI-powered brand consistency and content generation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
