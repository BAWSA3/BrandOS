"use client";

import { useState, useEffect } from "react";
import PixelatedBackground from "./PixelatedBackground";
import { useBrandStore } from "@/lib/store";

interface LandingProps {
  onEnter: () => void;
}

export default function Landing({ onEnter }: LandingProps) {
  const { theme, toggleTheme } = useBrandStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Layered backgrounds */}
      <PixelatedBackground />

      {/* CRT scanline overlay */}
      <div className="crt-overlay" />

      {/* Noise texture */}
      <div className="noise-overlay" />

      {/* Vignette effect */}
      <div className="vignette" />

      {/* Floating Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            className={`flex items-center gap-3 transition-all duration-700 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            }`}
            style={{ transitionDelay: "0.3s" }}
          >
            <span className="text-xs font-pixel tracking-wider text-muted">
              v1.0
            </span>
          </div>

          <div
            className={`flex items-center gap-4 transition-all duration-700 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            }`}
            style={{ transitionDelay: "0.4s" }}
          >
            <button
              onClick={toggleTheme}
              className="p-2 text-muted hover:text-foreground transition-colors"
            >
              {theme === "dark" ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Hero Content - Centered */}
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        {/* Hero Logo */}
        <div
          className={`text-center transition-all duration-1000 ${
            isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
          style={{ transitionDelay: "0.2s" }}
        >
          {/* Main brandOS text - 80% Helvetica / 20% Bitmap ratio */}
          <h1 className="relative mb-8 inline-block">
            {/* brand - Helvetica Bold Italic with tight tracking */}
            <span
              className="font-helvetica text-[clamp(5rem,18vw,14rem)] leading-none"
              style={{
                fontWeight: 700,
                fontStyle: "italic",
                letterSpacing: "-0.06em",
              }}
            >
              brand
            </span>
            {/* OS - PP Mondwest Bitmap font, large and attached to "brand" */}
            <span
              className="font-pixel pixel-gradient-text text-[clamp(4rem,14vw,12rem)] leading-none absolute"
              style={{
                top: "-0.15em",
                right: "-0.65em",
              }}
            >
              OS
            </span>
          </h1>

          {/* Tagline */}
          <p
            className={`text-muted text-sm md:text-base font-light tracking-wide max-w-md mx-auto mb-12 transition-all duration-700 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: "0.5s" }}
          >
            Your brand, everywhere it needs to be.
            <br />
            <span className="text-xs opacity-60">Define. Check. Generate.</span>
          </p>

          {/* CTA Button */}
          <div
            className={`transition-all duration-700 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: "0.7s" }}
          >
            <button
              onClick={onEnter}
              className="retro-btn group"
            >
              <span className="relative z-10 flex items-center gap-2">
                ENTER
                <svg
                  className="w-3 h-3 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </button>
          </div>
        </div>

        {/* Decorative pixel elements */}
        <div
          className={`absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 transition-all duration-700 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDelay: "1s" }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-muted/30"
              style={{
                animation: `pixel-float ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>

        {/* Corner brackets - top left */}
        <div
          className={`absolute top-24 left-8 text-muted/20 transition-all duration-700 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDelay: "0.8s" }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M0 40V0H40" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>

        {/* Corner brackets - bottom right */}
        <div
          className={`absolute bottom-24 right-8 text-muted/20 transition-all duration-700 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDelay: "0.9s" }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M40 0V40H0" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>

        {/* Floating stats - subtle */}
        <div
          className={`absolute top-1/2 left-8 -translate-y-1/2 hidden lg:block transition-all duration-700 ${
            isLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
          }`}
          style={{ transitionDelay: "1.1s" }}
        >
          <div className="space-y-8 text-left">
            <div>
              <p className="font-pixel text-[10px] text-muted/50 mb-1">BRANDS</p>
              <p className="text-2xl font-light text-foreground/40">2.8K</p>
            </div>
            <div>
              <p className="font-pixel text-[10px] text-muted/50 mb-1">CHECKS</p>
              <p className="text-2xl font-light text-foreground/40">156K</p>
            </div>
          </div>
        </div>

        {/* Right side info */}
        <div
          className={`absolute top-1/2 right-8 -translate-y-1/2 hidden lg:block transition-all duration-700 ${
            isLoaded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
          }`}
          style={{ transitionDelay: "1.2s" }}
        >
          <div className="space-y-4 text-right">
            <p className="font-pixel text-[8px] text-muted/40 leading-relaxed max-w-[120px]">
              BUILT FOR
              <br />
              AGENCIES
              <br />
              MARKETERS
              <br />
              FOUNDERS
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className={`fixed bottom-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-700 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
        style={{ transitionDelay: "1.3s" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-muted/50">
          <span className="font-pixel text-[8px]">2024</span>
          <div className="flex gap-6">
            <a href="/api-docs" className="hover:text-foreground transition-colors font-pixel text-[8px]">
              API
            </a>
            <a href="#" className="hover:text-foreground transition-colors font-pixel text-[8px]">
              DOCS
            </a>
          </div>
        </div>
      </footer>

      {/* Custom cursor glow effect - blue palette */}
      <div
        className="fixed pointer-events-none z-[200] w-64 h-64 rounded-full opacity-8 blur-3xl transition-opacity duration-300"
        style={{
          left: cursorPos.x - 128,
          top: cursorPos.y - 128,
          background: "radial-gradient(circle, rgba(74,144,217,0.3) 0%, rgba(168,200,232,0.15) 50%, transparent 70%)",
        }}
      />
    </div>
  );
}
