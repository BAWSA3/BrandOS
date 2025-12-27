'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, useSpring, useMotionValue, animate } from 'motion/react';
import { useBrandStore } from '@/lib/store';
import gsap from '@/lib/gsap';
import { ScrollTrigger } from '@/lib/gsap/ScrollTrigger';
import { ScrollSmoother } from '@/lib/gsap/ScrollSmoother';
import { SplitText } from '@/lib/gsap/SplitText';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);
}

// =============================================================================
// ADVANCED Mesh Gradient Background - SVG Morphing Blobs
// =============================================================================
const MESH_COLORS = {
  light: {
    gradientTop: "#e8f0f8",
    gradientMiddle: "#b8d4f0",
    gradientBottom: "#6a9fd4",
    blobPrimary: "#e8a598",
    blobSecondary: "#f4c4ba",
    blobAccent: "#d88a7a",
    blobHighlight: "#ffddd5",
    glowColor: "rgba(255, 245, 240, 0.6)",
  },
  dark: {
    gradientTop: "#0a0a1a",
    gradientMiddle: "#0f1025",
    gradientBottom: "#050510",
    blobPrimary: "rgba(74, 144, 217, 0.6)",
    blobSecondary: "rgba(100, 160, 255, 0.5)",
    blobAccent: "rgba(0, 100, 200, 0.7)",
    blobHighlight: "rgba(150, 200, 255, 0.3)",
    glowColor: "rgba(50, 100, 150, 0.4)",
  },
  grainOpacity: 0.3,
  morphSpeed: 12,        // Slower, smoother morphing
  floatSpeed: 18,        // Slower, gentler floating
  mouseInfluence: 15,    // Subtler mouse response
  parallaxStrength: 100, // Gentler parallax
};

// SVG Filters for grain and gooey effect
function SVGFilters() {
  return (
    <svg className="absolute w-0 h-0" aria-hidden="true">
      <defs>
        <filter id="fine-grain" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="15" stitchTiles="stitch" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="mono" />
          <feComponentTransfer in="mono" result="grain">
            <feFuncA type="linear" slope="0.4" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" in2="grain" mode="overlay" />
        </filter>
        <filter id="gooey">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" result="gooey" />
          <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}

// Static grain overlay
function StaticGrainOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        opacity: MESH_COLORS.grainOpacity,
        mixBlendMode: "overlay",
      }}
    />
  );
}

// Grid overlay for background
function GridOverlay({ theme }: { theme: string }) {
  const gridColor = theme === 'dark'
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(0, 0, 0, 0.08)';
  const gridSize = 120; // pixels between lines

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(to right, ${gridColor} 1px, transparent 1px),
          linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize}px ${gridSize}px`,
      }}
    />
  );
}

// Morphing SVG Blob
function MorphingBlob({ color, size, initialX, initialY, mouseX, mouseY, scrollY, index }: {
  color: string; size: number; initialX: string; initialY: string;
  mouseX: any; mouseY: any; scrollY: any; index: number;
}) {
  const pathRef = useRef<SVGPathElement>(null);

  const blobPaths = [
    "M44.5,-76.2C57.1,-69.5,66.5,-55.9,73.2,-41.3C79.9,-26.7,83.8,-11.1,82.9,4.1C82,19.3,76.2,34.2,66.7,46.1C57.2,58,43.9,66.9,29.4,72.9C14.9,78.9,-0.8,82,-16.7,80.1C-32.6,78.2,-48.6,71.3,-60.4,60C-72.2,48.7,-79.7,33,-82.3,16.5C-84.9,0,-82.6,-17.3,-75.6,-32.1C-68.6,-46.9,-56.9,-59.2,-43.3,-65.5C-29.7,-71.8,-14.8,-72.1,0.8,-73.4C16.5,-74.7,31.9,-82.9,44.5,-76.2Z",
    "M38.9,-67.1C50.4,-60.3,59.8,-49.5,66.8,-37C73.8,-24.5,78.4,-10.3,78.1,3.9C77.8,18.1,72.6,32.2,63.9,43.8C55.2,55.4,43,64.5,29.4,70.3C15.8,76.1,0.8,78.6,-14.4,77.1C-29.6,75.6,-45,70.1,-57.3,60.4C-69.6,50.7,-78.8,36.8,-82.6,21.5C-86.4,6.2,-84.8,-10.5,-78.5,-25.1C-72.2,-39.7,-61.2,-52.2,-48,-60.1C-34.8,-68,-17.4,-71.3,-1.3,-69.2C14.8,-67.1,27.4,-73.9,38.9,-67.1Z",
    "M41.3,-71C53.5,-64.4,63.4,-53.3,70.9,-40.6C78.4,-27.9,83.5,-13.9,83.4,-0.1C83.3,13.8,78,27.5,70.1,39.5C62.2,51.5,51.6,61.7,39.2,68.6C26.8,75.5,12.6,79.1,-1.5,81.6C-15.6,84.1,-29.6,85.5,-42.3,80.1C-55,74.7,-66.4,62.5,-74.1,48.4C-81.8,34.3,-85.8,18.4,-84.9,2.9C-84,-12.6,-78.2,-27.8,-69.3,-40.6C-60.4,-53.4,-48.4,-63.8,-35.2,-69.8C-22,-75.8,-7.6,-77.4,4,-82.2C15.6,-87,29.1,-77.6,41.3,-71Z",
    "M47.7,-79.9C61.4,-73.1,71.9,-59.5,78.5,-44.5C85.1,-29.5,87.8,-13.1,85.8,2.4C83.8,17.9,77.1,32.5,67.5,44.9C57.9,57.3,45.4,67.5,31.3,73.8C17.2,80.1,1.5,82.5,-14.2,80.6C-29.9,78.7,-45.6,72.5,-58.1,62.3C-70.6,52.1,-79.9,37.9,-83.5,22.4C-87.1,6.9,-85,-9.9,-78.6,-24.6C-72.2,-39.3,-61.5,-51.9,-48.5,-59.1C-35.5,-66.3,-20.2,-68.1,-4.4,-62.2C11.4,-56.3,34,-86.7,47.7,-79.9Z",
  ];

  useEffect(() => {
    if (!pathRef.current) return;
    let currentIndex = 0;
    const morphToNext = () => {
      currentIndex = (currentIndex + 1) % blobPaths.length;
      animate(pathRef.current, { d: blobPaths[currentIndex] }, { duration: MESH_COLORS.morphSpeed, ease: "easeInOut" });
    };
    const interval = setInterval(morphToNext, MESH_COLORS.morphSpeed * 1000);
    return () => clearInterval(interval);
  }, []);

  const mouseInfluenceX = useTransform(mouseX, [0, typeof window !== "undefined" ? window.innerWidth : 1000], [-MESH_COLORS.mouseInfluence, MESH_COLORS.mouseInfluence]);
  const springX = useSpring(mouseInfluenceX, { stiffness: 30, damping: 25 });

  // Blob follows user down the page - travels to the CTA section at bottom
  // Using larger offset values so blob accompanies user throughout the journey
  const scrollOffset = useTransform(scrollY, [0, 500, 1500, 2500], [0, 200, 600, 900 + index * 50]);
  const smoothScrollY = useSpring(scrollOffset, { stiffness: 40, damping: 25 });

  // Blob entrance: starts invisible, fades in as user begins scrolling
  const scrollOpacity = useTransform(scrollY, [0, 50, 200], [0, 0.3, 1]);
  const smoothOpacity = useSpring(scrollOpacity, { stiffness: 40, damping: 30 });

  // Scale grows as user scrolls down - starts small, grows moderately
  // Reduced final size for better visual balance near the CTA
  const scrollScale = useTransform(scrollY, [0, 100, 800, 2000], [0.2, 0.35 + index * 0.05, 0.6 + index * 0.05, 0.85 + index * 0.05]);
  const smoothScale = useSpring(scrollScale, { stiffness: 35, damping: 25 });

  return (
    <motion.div
      className="absolute"
      style={{
        left: initialX,
        top: initialY,
        width: size,
        height: size,
        x: springX,
        y: smoothScrollY,
        scale: smoothScale,
        opacity: smoothOpacity,
        filter: "blur(40px)"
      }}
    >
      <svg viewBox="-100 -100 200 200" className="w-full h-full" style={{ overflow: "visible" }}>
        <motion.path
          ref={pathRef}
          d={blobPaths[index % blobPaths.length]}
          fill={color}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: index * 0.2 }}
        />
      </svg>
    </motion.div>
  );
}

// Radial Glow Blob
function GlowBlob({ color, size, x, y, mouseX, mouseY, scrollY, index, blur = 60 }: {
  color: string; size: number; x: string; y: string;
  mouseX: any; mouseY: any; scrollY: any; index: number; blur?: number;
}) {
  const mouseInfluenceX = useTransform(mouseX, [0, typeof window !== "undefined" ? window.innerWidth : 1000], [-8 * (index + 1), 8 * (index + 1)]);
  const springX = useSpring(mouseInfluenceX, { stiffness: 25, damping: 30 });

  // Glow follows user down the page alongside the main blob
  const scrollOffset = useTransform(scrollY, [0, 500, 1500, 2500], [0, 180, 550, 850 + index * 40]);
  const smoothScrollY = useSpring(scrollOffset, { stiffness: 40, damping: 25 });

  // Glow entrance: fades in slightly after the main blob
  const scrollOpacity = useTransform(scrollY, [0, 80, 250], [0, 0.2, 0.8]);
  const smoothOpacity = useSpring(scrollOpacity, { stiffness: 35, damping: 30 });

  // Scale grows with scroll - reduced final size
  const scrollScale = useTransform(scrollY, [0, 100, 800, 2000], [0.3, 0.4, 0.7, 0.9 + index * 0.05]);
  const smoothScale = useSpring(scrollScale, { stiffness: 40, damping: 25 });

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        x: springX,
        y: smoothScrollY,
        scale: smoothScale,
        opacity: smoothOpacity,
        transform: "translate(-50%, -50%)",
      }}
    />
  );
}

// Main Advanced Mesh Gradient Background
function MeshGradientBg({ theme }: { theme: string }) {
  const { scrollY } = useScroll();
  const colors = theme === 'dark' ? MESH_COLORS.dark : MESH_COLORS.light;
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { mouseX.set(e.clientX); mouseY.set(e.clientY); };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 overflow-hidden z-[1] pointer-events-none">
      <SVGFilters />

      {/* Base gradient */}
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{ background: `linear-gradient(180deg, ${colors.gradientTop} 0%, ${colors.gradientMiddle} 40%, ${colors.gradientBottom} 100%)` }}
      />

      {/* Ambient glow */}
      <motion.div
        className="absolute"
        style={{
          left: "50%", top: "20%", width: 600, height: 400,
          background: `radial-gradient(ellipse, ${colors.glowColor} 0%, transparent 70%)`,
          transform: "translate(-50%, -50%)", filter: "blur(40px)",
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.8, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Morphing SVG Blobs */}
      <div className="absolute inset-0" style={{ filter: "url(#gooey)" }}>
        <MorphingBlob color={colors.blobPrimary} size={350} initialX="45%" initialY="22%" mouseX={mouseX} mouseY={mouseY} scrollY={scrollY} index={0} />
        <MorphingBlob color={colors.blobSecondary} size={280} initialX="55%" initialY="28%" mouseX={mouseX} mouseY={mouseY} scrollY={scrollY} index={1} />
        <MorphingBlob color={colors.blobAccent} size={200} initialX="48%" initialY="25%" mouseX={mouseX} mouseY={mouseY} scrollY={scrollY} index={2} />
      </div>

      {/* Radial glow blobs */}
      <GlowBlob color={colors.blobHighlight} size={500} x="50%" y="25%" mouseX={mouseX} mouseY={mouseY} scrollY={scrollY} index={0} blur={80} />
      <GlowBlob color={colors.blobPrimary} size={300} x="42%" y="30%" mouseX={mouseX} mouseY={mouseY} scrollY={scrollY} index={1} blur={50} />

      {/* Top highlight */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255, 255, 255, ${theme === 'dark' ? '0.1' : '0.4'}) 0%, transparent 50%)` }} />

      {/* Grain texture */}
      <StaticGrainOverlay />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, ${theme === 'dark' ? '0.3' : '0.05'}) 100%)` }} />
    </div>
  );
}

interface PhaseDetail {
  title: string;
  description: string;
}

interface Phase {
  number: number;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  details: PhaseDetail[];
  icon: React.ReactNode;
}

const phases: Phase[] = [
  {
    number: 1,
    title: 'DEFINE',
    subtitle: 'Your brand, documented',
    description: 'Your brand guidelines live in someone\'s head. Or worse, a PDF no one reads. Define it once, use it everywhere.',
    features: ['Voice & Tone', 'Safe Zones', 'Do\'s & Don\'ts', 'Examples'],
    details: [
      { title: 'Tone Spectrum', description: 'Sliders for formality, energy, and style. No more "make it pop" debates.' },
      { title: 'Voice Samples', description: 'Feed it examples of your best writing. The AI learns your actual voice.' },
      { title: 'Safe Zones', description: 'Lock what\'s sacred. Flex what\'s not. Clear rules, zero ambiguity.' },
      { title: 'Do\'s & Don\'ts', description: 'Explicit patterns to follow and avoid. New hires get it on day one.' },
    ],
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    number: 2,
    title: 'CHECK',
    subtitle: 'Catch drift before it ships',
    description: 'Stop spending hours reviewing content. Paste anything—emails, ads, social posts—and know instantly if it\'s on brand.',
    features: ['Instant Scoring', 'Tone Analysis', 'Suggestions', 'Guardrails'],
    details: [
      { title: 'Brand Score', description: '0-100 in seconds. No more subjective "I don\'t know, it just feels off."' },
      { title: 'Tone Breakdown', description: 'See exactly where content drifts—too formal? Too casual? Fix it.' },
      { title: 'Smart Rewrites', description: 'AI suggests fixes that match your voice. One click to apply.' },
      { title: 'Agency Mode', description: 'Share a link. Creators check their own work before sending to you.' },
    ],
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    number: 3,
    title: 'GENERATE',
    subtitle: 'Content that sounds like you',
    description: 'Anyone can write content. The hard part is making it sound like your brand. Generate on-brand copy for any channel, instantly.',
    features: ['Any Format', 'Any Platform', 'Visual Direction', 'Templates'],
    details: [
      { title: 'Multi-format', description: 'Tweets, emails, headlines, taglines, scripts. All in your voice.' },
      { title: 'Platform Native', description: 'Same message, adapted for LinkedIn vs Twitter vs email. Automatically.' },
      { title: 'Visual Concepts', description: 'AI-generated mood boards and design direction that match your brand.' },
      { title: 'Starter Templates', description: 'Pre-built formats for common needs. Customize once, reuse forever.' },
    ],
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 5v14M5 12h14" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
  {
    number: 4,
    title: 'SCALE',
    subtitle: 'Brand consistency, measured',
    description: 'You can\'t improve what you don\'t measure. Track brand health across your team, catch patterns, and prove ROI.',
    features: ['Dashboard', 'Trends', 'Export', 'Compete'],
    details: [
      { title: 'Health Dashboard', description: 'See brand consistency scores over time. Spot drift before it spreads.' },
      { title: 'Team Insights', description: 'Who\'s on brand? Who needs coaching? Data, not guesswork.' },
      { title: 'Export Anywhere', description: 'JSON, PDF, shareable links. Your brand goes where your team goes.' },
      { title: 'Competitor Intel', description: 'Analyze competitor voice. Find whitespace. Own your position.' },
    ],
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M23 6l-9.5 9.5-5-5L1 18" />
        <path d="M17 6h6v6" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useBrandStore();
  const [mounted, setMounted] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const [visiblePhases, setVisiblePhases] = useState<Set<number>>(new Set());
  const [sectionTitleVisible, setSectionTitleVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [signupStatus, setSignupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [signupMessage, setSignupMessage] = useState('');
  const [signupCount, setSignupCount] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const smoothWrapperRef = useRef<HTMLDivElement>(null);
  const smoothContentRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const brandTextRef = useRef<HTMLSpanElement>(null);
  const osTextRef = useRef<HTMLSpanElement>(null);
  const phaseRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionTitleRef = useRef<HTMLElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const painStatementRef = useRef<HTMLParagraphElement>(null);
  const supportingTextRef = useRef<HTMLParagraphElement>(null);
  const heroGlowRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const typingCursorRef = useRef<HTMLSpanElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number }>>([]);
  const gradientPhaseRef = useRef(0);
  const lastGradientTimeRef = useRef(0);
  const scrollYRef = useRef(0);
  const smootherRef = useRef<ScrollSmoother | null>(null);
  const typographyCanvasRef = useRef<HTMLCanvasElement>(null);
  const gaugeCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch signup count on mount
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        setSignupCount(data.signups || 0);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    }
    fetchStats();
  }, []);

  // Handle email signup
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || signupStatus === 'loading') return;

    setSignupStatus('loading');
    setSignupMessage('');

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'landing' }),
      });

      const data = await res.json();

      if (res.ok) {
        setSignupStatus('success');
        setSignupMessage('You\'re on the list!');
        setEmail('');
        setSignupCount(prev => prev + 1);
      } else {
        setSignupStatus('error');
        setSignupMessage(data.error || 'Something went wrong');
      }
    } catch (error) {
      setSignupStatus('error');
      setSignupMessage('Network error. Please try again.');
    }
  };

  // GSAP Animations
  useEffect(() => {
    if (!mounted) return;

    let ctx: gsap.Context;

    // Small delay to ensure DOM is fully ready
    const timer = setTimeout(() => {
      ctx = gsap.context(() => {
        // 1. ScrollSmoother for buttery smooth scrolling
        if (smoothWrapperRef.current && smoothContentRef.current) {
          smootherRef.current = ScrollSmoother.create({
            wrapper: smoothWrapperRef.current,
            content: smoothContentRef.current,
            smooth: 1.5,
            effects: true,
            smoothTouch: 0.1,
          });
        }

        // 2. Typing animation for BrandOS title - characters appear one by one
        if (heroTitleRef.current && typingCursorRef.current && brandTextRef.current && osTextRef.current) {
          const cursor = typingCursorRef.current;
          const brandText = brandTextRef.current;
          const osText = osTextRef.current;
          const title = heroTitleRef.current;

          // Split Brand text into characters for typing
          const typingSplit = new SplitText(brandText, {
            type: 'chars',
            charsClass: 'typing-char'
          });

          // Hide all Brand characters initially
          gsap.set(typingSplit.chars, {
            opacity: 0,
            display: 'inline-block',
          });

          // Hide OS initially
          gsap.set(osText, {
            opacity: 0,
          });

          // Position cursor at start
          gsap.set(cursor, {
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 1,
          });

          // Make hero title position relative for cursor positioning
          gsap.set(title, {
            position: 'relative',
          });

          // Create typing timeline
          const typingTl = gsap.timeline({ delay: 0.5 });

          // Type out "Brand" characters one by one using stagger
          typingTl.to(typingSplit.chars, {
            opacity: 1,
            duration: 0.01,
            stagger: 0.12,
            ease: 'none',
          });

          // Animate cursor across Brand text during typing
          typingTl.to(cursor, {
            left: () => brandText.offsetWidth + 'px',
            duration: typingSplit.chars.length * 0.12,
            ease: 'steps(' + typingSplit.chars.length + ')',
          }, 0);

          // Type out "OS" after Brand completes
          typingTl.to(osText, {
            opacity: 1,
            duration: 0.01,
          });

          // Move cursor to end after OS
          typingTl.to(cursor, {
            left: '100%',
            duration: 0.12,
            ease: 'steps(2)',
          });

          // After typing completes, cursor blinks then fades
          typingTl.to(cursor, {
            opacity: 0,
            duration: 0.1,
            delay: 0.2,
            repeat: 4,
            yoyo: true,
          });

          typingTl.to(cursor, {
            opacity: 0,
            duration: 0.15,
          });
        }

        // 3. Hero text fade-in animations (on page load, not scroll)
        // Fade in the supporting text elements
        if (supportingTextRef.current) {
          gsap.to(supportingTextRef.current, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: 0.8,
            ease: 'power2.out',
          });
        }

        // 4. Scroll-triggered animations (no duplicate SplitText - typing animation handles character splitting)
        if (heroSectionRef.current) {
          // Create master timeline with scroll trigger
          const masterTl = gsap.timeline({
            scrollTrigger: {
              trigger: heroSectionRef.current,
              start: 'top top',
              end: '+=150%',
              scrub: 1,
              pin: true,
              pinSpacing: true,
            }
          });

          // Phase 1: Title stays stable (no chaos animation)

          // Pain statement converges (letter spacing tightens, opacity increases)
          if (painStatementRef.current) {
            masterTl.to(painStatementRef.current, {
              letterSpacing: '0.15em',
              opacity: 0.5,
              ease: 'power2.out',
              duration: 0.4,
            }, 0);
          }

          // Phase 2: The Snap (40-50%) - scale pulse on entire logo
          masterTl.to(heroTitleRef.current, {
            scale: 1.03,
            ease: 'power2.in',
            duration: 0.05,
          }, 0.4);

          masterTl.to(heroTitleRef.current, {
            scale: 1,
            ease: 'back.out(3)',
            duration: 0.1,
          }, 0.45);

          // Glow pulse on snap
          if (heroGlowRef.current) {
            masterTl.to(heroGlowRef.current, {
              opacity: 0.4,
              background: 'radial-gradient(circle, rgba(0, 71, 255, 0.3) 0%, transparent 70%)',
              duration: 0.05,
            }, 0.4);

            masterTl.to(heroGlowRef.current, {
              opacity: 0,
              duration: 0.15,
            }, 0.5);
          }

          // Phase 3: Supporting text handled by page-load animations (not scroll)

          // Phase 4: Fade out as user continues scrolling (85-100%)
          const fadeElements = [
            painStatementRef.current,
            heroTitleRef.current,
            supportingTextRef.current,
          ].filter(Boolean);

          masterTl.to(fadeElements, {
            opacity: 0.2,
            y: -40,
            ease: 'power2.in',
            duration: 0.15,
          }, 0.85);

          // Scroll indicator fades out earlier
          if (scrollIndicatorRef.current) {
            masterTl.to(scrollIndicatorRef.current, {
              opacity: 0,
              y: -20,
              ease: 'power2.in',
              duration: 0.1,
            }, 0.3);
          }
        }

      }, containerRef);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (ctx) ctx.revert();
      if (smootherRef.current) {
        smootherRef.current.kill();
      }
    };
  }, [mounted]);

  // Scroll-triggered animations with Intersection Observer
  useEffect(() => {
    if (!mounted) return;

    const observerOptions = {
      root: null,
      rootMargin: '50px 0px -50px 0px', // Trigger earlier (positive top margin)
      threshold: 0.05, // Lower threshold to trigger sooner
    };

    const phaseObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const phaseIndex = phaseRefs.current.findIndex((ref) => ref === entry.target);
          if (phaseIndex !== -1) {
            const staggerDelay = phaseIndex * 60; // Faster stagger (was 100ms)
            // Add staggered delay based on phase index
            setTimeout(() => {
              setVisiblePhases((prev) => new Set([...prev, phaseIndex]));

              // After animation completes (0.5s), add the animation-complete class
              setTimeout(() => {
                const element = phaseRefs.current[phaseIndex];
                if (element) {
                  element.classList.add('animation-complete');
                }
              }, 600); // Faster completion
            }, staggerDelay);
          }
        }
      });
    }, observerOptions);

    const titleObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setSectionTitleVisible(true);
        }
      });
    }, { ...observerOptions, threshold: 0.2 }); // Lower threshold

    // Observe phase cards
    phaseRefs.current.forEach((ref) => {
      if (ref) phaseObserver.observe(ref);
    });

    // Observe section title
    if (sectionTitleRef.current) {
      titleObserver.observe(sectionTitleRef.current);
    }

    return () => {
      phaseObserver.disconnect();
      titleObserver.disconnect();
    };
  }, [mounted]);

  // Morphing Typography Wave Animation
  useEffect(() => {
    const canvas = typographyCanvasRef.current;
    if (!canvas || !mounted) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Brand-related words that will morph
    const brandWords = [
      'voice', 'tone', 'style', 'brand', 'trust',
      'clarity', 'focus', 'align', 'unity', 'flow',
      'guide', 'rule', 'check', 'scale', 'grow'
    ];

    // Chaotic fonts (start state)
    const chaoticFonts = [
      'Comic Sans MS',
      'Papyrus',
      'Impact',
      'Brush Script MT',
      'Courier New',
      'Times New Roman',
      'Georgia',
      'Trebuchet MS',
    ];

    // Target font (end state - brand consistent)
    const targetFont = 'Helvetica Neue';

    // Create floating word objects
    interface FloatingWord {
      word: string;
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      font: string;
      fontSize: number;
      targetFontSize: number;
      rotation: number;
      targetRotation: number;
      opacity: number;
      delay: number;
      vx: number;
      vy: number;
    }

    const floatingWords: FloatingWord[] = [];
    const wordCount = 15;

    for (let i = 0; i < wordCount; i++) {
      const word = brandWords[i % brandWords.length];
      const col = i % 5;
      const row = Math.floor(i / 5);

      floatingWords.push({
        word,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        targetX: 100 + col * (canvas.width - 200) / 4,
        targetY: canvas.height * 0.4 + row * 60,
        font: chaoticFonts[Math.floor(Math.random() * chaoticFonts.length)],
        fontSize: Math.random() * 20 + 12,
        targetFontSize: 18,
        rotation: (Math.random() - 0.5) * 0.6, // Random rotation in chaos
        targetRotation: 0, // Aligned in order
        opacity: 0.3,
        delay: i * 0.04,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      const smoother = smootherRef.current;
      const scrollY = smoother ? smoother.scrollTop() : window.scrollY;
      const viewportHeight = window.innerHeight;

      // Progress based on scroll
      const progress = Math.min(scrollY / (viewportHeight * 1.5), 1);

      floatingWords.forEach((wordObj, index) => {
        const adjustedProgress = Math.max(0, Math.min(1, (progress - wordObj.delay) / 0.6));
        const easeProgress = 1 - Math.pow(1 - adjustedProgress, 3);

        if (adjustedProgress < 0.1) {
          // Chaos phase - random floating
          wordObj.x += wordObj.vx;
          wordObj.y += wordObj.vy;

          // Bounce off edges
          if (wordObj.x < 50 || wordObj.x > canvas.width - 50) wordObj.vx *= -1;
          if (wordObj.y < 50 || wordObj.y > canvas.height - 50) wordObj.vy *= -1;

          // Add slight randomness
          wordObj.vx += (Math.random() - 0.5) * 0.1;
          wordObj.vy += (Math.random() - 0.5) * 0.1;
          wordObj.vx *= 0.99;
          wordObj.vy *= 0.99;
        } else {
          // Transition to order
          const targetX = wordObj.targetX;
          const targetY = wordObj.targetY;
          wordObj.x += (targetX - wordObj.x) * 0.05;
          wordObj.y += (targetY - wordObj.y) * 0.05;
        }

        // Interpolate font size and rotation
        const currentFontSize = wordObj.fontSize + (wordObj.targetFontSize - wordObj.fontSize) * easeProgress;
        const currentRotation = wordObj.rotation + (wordObj.targetRotation - wordObj.rotation) * easeProgress;

        // Calculate opacity (fade in as scroll, fade out near end)
        let opacity = Math.min(adjustedProgress * 2, 0.6);
        if (progress > 0.8) {
          opacity *= 1 - (progress - 0.8) / 0.2;
        }

        // Create an elliptical clear zone in the center where the loading bar will appear
        const centerX = canvas.width * 0.5;
        const centerY = canvas.height * 0.5;
        const clearZoneWidth = canvas.width * 0.5; // Horizontal radius
        const clearZoneHeight = 200; // Vertical radius

        // Calculate normalized distance from center (elliptical)
        const normalizedX = (wordObj.x - centerX) / clearZoneWidth;
        const normalizedY = (wordObj.y - centerY) / clearZoneHeight;
        const ellipticalDistance = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);

        if (ellipticalDistance < 1) {
          // Word is inside the elliptical clear zone - fade based on how close to center
          const zoneFade = Math.pow(ellipticalDistance, 1.5);
          opacity *= zoneFade;
        }

        if (opacity > 0.02) {
          ctx.save();
          ctx.translate(wordObj.x, wordObj.y);
          ctx.rotate(currentRotation);

          // Interpolate between chaotic font and target font
          const fontWeight = easeProgress > 0.5 ? '500' : '400';
          const currentFont = easeProgress > 0.7 ? targetFont : wordObj.font;
          ctx.font = `${fontWeight} ${currentFontSize}px "${currentFont}", sans-serif`;

          // Color transitions from varied to consistent brand blue
          const colorProgress = easeProgress;
          if (colorProgress < 0.5) {
            // Chaotic colors (various grays)
            const grayValue = isDark ? 150 + Math.random() * 50 : 80 + Math.random() * 50;
            ctx.fillStyle = isDark
              ? `rgba(${grayValue}, ${grayValue}, ${grayValue + 20}, ${opacity})`
              : `rgba(${grayValue}, ${grayValue}, ${grayValue}, ${opacity})`;
          } else {
            // Transitioning to brand blue
            const blueProgress = (colorProgress - 0.5) * 2;
            const r = isDark ? Math.floor(150 * (1 - blueProgress)) : Math.floor(80 * (1 - blueProgress));
            const g = isDark ? Math.floor(150 * (1 - blueProgress) + 71 * blueProgress) : Math.floor(80 * (1 - blueProgress) + 47 * blueProgress);
            const b = isDark ? Math.floor(170 * (1 - blueProgress) + 255 * blueProgress) : Math.floor(100 * (1 - blueProgress) + 167 * blueProgress);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
          }

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(wordObj.word, 0, 0);

          ctx.restore();
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [mounted]);

  // Brand Score Horizontal Loading Bar Animation
  useEffect(() => {
    const canvas = gaugeCanvasRef.current;
    if (!canvas || !mounted) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let animationId: number;
    let entranceStartTime: number | null = null;
    const entranceDuration = 800; // ms for entrance animation

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      const smoother = smootherRef.current;
      const scrollY = smoother ? smoother.scrollTop() : window.scrollY;
      const viewportHeight = window.innerHeight;

      // Delay the loading bar - only start after scrolling 25% of viewport
      const scrollThreshold = viewportHeight * 0.25;
      const adjustedScroll = Math.max(0, scrollY - scrollThreshold);
      const progress = Math.min(adjustedScroll / (viewportHeight * 1.2), 1);

      // Track entrance animation timing
      if (progress > 0 && entranceStartTime === null) {
        entranceStartTime = Date.now();
      } else if (progress === 0) {
        entranceStartTime = null;
      }

      // Calculate entrance animation progress (0 to 1)
      const entranceProgress = entranceStartTime
        ? Math.min((Date.now() - entranceStartTime) / entranceDuration, 1)
        : 0;

      // Smooth easing for entrance (ease-out cubic)
      const entranceEase = 1 - Math.pow(1 - entranceProgress, 3);

      // Horizontal bar dimensions - takes up most of the screen width
      const barPadding = 80;
      const barX = barPadding;
      const barY = canvas.height * 0.5; // Centered vertically
      const barWidth = canvas.width - (barPadding * 2);
      const barHeight = 24;
      const borderRadius = 12;

      // Apply entrance animation to opacity and position
      const baseOpacity = Math.min(progress * 2, 0.95);
      let opacity = baseOpacity * entranceEase;
      if (progress > 0.85) opacity *= 1 - (progress - 0.85) / 0.15;

      // Entrance slide-up offset (starts 60px below, animates to 0)
      const entranceOffsetY = (1 - entranceEase) * 60;

      if (opacity > 0.02) {
        const scoreProgress = Math.min(progress * 1.3, 1);
        const score = Math.floor(scoreProgress * 100);

        // Apply entrance offset to Y positions
        const animatedBarY = barY + entranceOffsetY;

        // Outer glow behind the bar
        const glowGradient = ctx.createLinearGradient(barX, animatedBarY, barX + barWidth * scoreProgress, animatedBarY);
        glowGradient.addColorStop(0, `rgba(0, 71, 255, ${opacity * 0.3})`);
        glowGradient.addColorStop(1, `rgba(0, 71, 255, ${opacity * 0.5})`);

        ctx.shadowColor = 'rgba(0, 71, 255, 0.6)';
        ctx.shadowBlur = 40 * entranceEase;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Background bar (track)
        ctx.beginPath();
        ctx.roundRect(barX, animatedBarY - barHeight / 2, barWidth, barHeight, borderRadius);
        ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${opacity * 0.08})` : `rgba(0, 0, 0, ${opacity * 0.08})`;
        ctx.shadowColor = 'transparent';
        ctx.fill();

        // Add subtle border to track
        ctx.strokeStyle = isDark ? `rgba(255, 255, 255, ${opacity * 0.1})` : `rgba(0, 0, 0, ${opacity * 0.1})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Progress bar fill
        const fillWidth = barWidth * scoreProgress;
        if (fillWidth > 0) {
          ctx.beginPath();
          ctx.roundRect(barX, animatedBarY - barHeight / 2, fillWidth, barHeight, borderRadius);

          // Gradient fill - Klein blue with electric highlights
          const fillGradient = ctx.createLinearGradient(barX, animatedBarY, barX + fillWidth, animatedBarY);
          if (scoreProgress < 0.3) {
            // Red to orange for low scores
            fillGradient.addColorStop(0, `rgba(255, 60, 60, ${opacity})`);
            fillGradient.addColorStop(1, `rgba(255, 120, 60, ${opacity})`);
          } else if (scoreProgress < 0.7) {
            // Orange to yellow for medium scores
            fillGradient.addColorStop(0, `rgba(255, 120, 60, ${opacity})`);
            fillGradient.addColorStop(1, `rgba(255, 200, 80, ${opacity})`);
          } else {
            // Klein blue for high scores (on brand!)
            fillGradient.addColorStop(0, `rgba(0, 47, 167, ${opacity})`);
            fillGradient.addColorStop(0.5, `rgba(0, 71, 255, ${opacity})`);
            fillGradient.addColorStop(1, `rgba(60, 120, 255, ${opacity})`);
          }

          ctx.fillStyle = fillGradient;
          ctx.shadowColor = scoreProgress > 0.7 ? 'rgba(0, 71, 255, 0.8)' : 'rgba(255, 150, 60, 0.5)';
          ctx.shadowBlur = 30 * entranceEase;
          ctx.fill();
          ctx.shadowColor = 'transparent';

          // Animated shimmer effect on the progress bar (only after entrance complete)
          if (entranceEase > 0.8) {
            const shimmerX = barX + (fillWidth * ((Date.now() % 2000) / 2000));
            const shimmerGradient = ctx.createLinearGradient(shimmerX - 100, animatedBarY, shimmerX + 100, animatedBarY);
            shimmerGradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
            shimmerGradient.addColorStop(0.5, `rgba(255, 255, 255, ${opacity * 0.3})`);
            shimmerGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

            ctx.beginPath();
            ctx.roundRect(barX, animatedBarY - barHeight / 2, fillWidth, barHeight, borderRadius);
            ctx.fillStyle = shimmerGradient;
            ctx.fill();
          }
        }

        // Score text - large and centered above bar (with separate entrance timing)
        const textEntranceDelay = 150; // ms delay for text after bar
        const textEntranceProgress = entranceStartTime
          ? Math.min(Math.max((Date.now() - entranceStartTime - textEntranceDelay) / (entranceDuration * 0.8), 0), 1)
          : 0;
        const textEntranceEase = 1 - Math.pow(1 - textEntranceProgress, 3);
        const textOpacity = opacity * textEntranceEase;
        const textOffsetY = (1 - textEntranceEase) * 30;

        ctx.font = `700 72px "Helvetica Neue", sans-serif`;
        ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${textOpacity})` : `rgba(0, 0, 0, ${textOpacity})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${score}`, canvas.width / 2, animatedBarY - 80 - textOffsetY);

        // Percentage symbol next to score
        ctx.font = `400 32px "Helvetica Neue", sans-serif`;
        ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${textOpacity * 0.6})` : `rgba(0, 0, 0, ${textOpacity * 0.6})`;
        ctx.font = `700 72px "Helvetica Neue", sans-serif`;
        const fullScoreWidth = ctx.measureText(`${score}`).width;
        ctx.font = `400 32px "Helvetica Neue", sans-serif`;
        ctx.fillText('%', canvas.width / 2 + fullScoreWidth / 2 + 8, animatedBarY - 90 - textOffsetY);

        // Label below bar
        ctx.font = `500 14px "VCR OSD Mono", monospace`;
        ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${textOpacity * 0.5})` : `rgba(0, 0, 0, ${textOpacity * 0.5})`;
        ctx.textAlign = 'center';
        ctx.fillText('BRAND SCORE', canvas.width / 2, animatedBarY + 40 + textOffsetY * 0.5);

        // Min/Max labels at bar ends
        ctx.font = `400 11px "VCR OSD Mono", monospace`;
        ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${textOpacity * 0.3})` : `rgba(0, 0, 0, ${textOpacity * 0.3})`;
        ctx.textAlign = 'left';
        ctx.fillText('0', barX, animatedBarY + 25);
        ctx.textAlign = 'right';
        ctx.fillText('100', barX + barWidth, animatedBarY + 25);
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [mounted]);

  // Interactive background effect
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      // Use document height to cover entire scrollable area
      canvas.height = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        container.scrollHeight
      );
    };
    resize();
    window.addEventListener('resize', resize);

    const handleScroll = () => {
      scrollYRef.current = window.scrollY;
      // Update canvas height on scroll in case content changed
      const newHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        container.scrollHeight
      );
      if (canvas.height !== newHeight) {
        canvas.height = newHeight;
      }
    };
    window.addEventListener('scroll', handleScroll);

    const handleMouseMove = (e: MouseEvent) => {
      // Use window.scrollY for accurate scroll position
      const scrollY = window.scrollY;
      mouseRef.current = { x: e.clientX, y: e.clientY + scrollY };

      for (let i = 0; i < 2; i++) {
        particlesRef.current.push({
          x: e.clientX + (Math.random() - 0.5) * 20,
          y: e.clientY + scrollY + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 1,
        });
      }

      if (particlesRef.current.length > 100) {
        particlesRef.current = particlesRef.current.slice(-100);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationId: number;
    const pixelSize = 8;
    let startTime: number | null = null;

    const animate = (time: number) => {
      if (startTime === null) {
        startTime = time;
        lastGradientTimeRef.current = time;
      }

      // Resize canvas if document height changed
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        container.scrollHeight
      );
      if (canvas.height !== docHeight) {
        canvas.height = docHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

      // Subtle gradient wave effect (no grid lines)
      const gradientInterval = 5500;
      if (time - lastGradientTimeRef.current > gradientInterval) {
        lastGradientTimeRef.current = time;
        gradientPhaseRef.current = 0;
      }

      if (gradientPhaseRef.current < 1) {
        gradientPhaseRef.current += 0.008;

        const waveX = gradientPhaseRef.current * (canvas.width + 400) - 200;
        const waveWidth = 300;

        for (let x = Math.max(0, waveX - waveWidth); x < Math.min(canvas.width, waveX + waveWidth); x += pixelSize) {
          for (let y = 0; y < canvas.height; y += pixelSize) {
            const dist = Math.abs(x - waveX);
            const intensity = Math.max(0, 1 - dist / waveWidth);
            const alpha = intensity * 0.12;

            if (alpha > 0.01) {
              // Klein Blue wave effect
              ctx.fillStyle = `rgba(0, 47, 167, ${alpha})`;
              ctx.fillRect(
                Math.floor(x / pixelSize) * pixelSize,
                Math.floor(y / pixelSize) * pixelSize,
                pixelSize,
                pixelSize
              );
            }
          }
        }
      }

      // Draw particles - electric blue
      particlesRef.current.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.015;

        if (particle.life > 0) {
          const size = Math.floor(particle.life * 12 / pixelSize) * pixelSize;
          if (size > 0) {
            ctx.fillStyle = `rgba(0, 71, 255, ${particle.life * 0.5})`;
            ctx.fillRect(
              Math.floor(particle.x / pixelSize) * pixelSize,
              Math.floor(particle.y / pixelSize) * pixelSize,
              size,
              size
            );
          }
        }
      });

      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      // Cursor glow - electric blue
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const glowRadius = 150;

      for (let x = mx - glowRadius; x < mx + glowRadius; x += pixelSize) {
        for (let y = my - glowRadius; y < my + glowRadius; y += pixelSize) {
          const dist = Math.sqrt((x - mx) ** 2 + (y - my) ** 2);
          if (dist < glowRadius) {
            const alpha = (1 - dist / glowRadius) * 0.1;
            ctx.fillStyle = `rgba(0, 71, 255, ${alpha})`;
            ctx.fillRect(
              Math.floor(x / pixelSize) * pixelSize,
              Math.floor(y / pixelSize) * pixelSize,
              pixelSize,
              pixelSize
            );
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, [mounted]);

  const handlePhaseClick = (phaseNumber: number) => {
    setExpandedPhase(expandedPhase === phaseNumber ? null : phaseNumber);
  };

  const handleGetStarted = () => {
    router.push('/app');
  };

  if (!mounted) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#000000' }} />
    );
  }

    return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh',
        background: theme === 'dark' ? '#000000' : '#ffffff',
        position: 'relative',
        overflowX: 'hidden',
        transition: 'background 0.3s ease',
        isolation: 'isolate',
      }}
    >
      {/* Mesh Gradient Background */}
      <MeshGradientBg theme={theme} />

      {/* Morphing Typography Wave Canvas */}
      <canvas
        ref={typographyCanvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 2,
          background: 'transparent',
        }}
      />

      {/* Brand Score Gauge Canvas */}
      <canvas
        ref={gaugeCanvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 6,
          background: 'transparent',
        }}
      />

      {/* ScrollSmoother Wrapper */}
      <div ref={smoothWrapperRef} id="smooth-wrapper">
        <div ref={smoothContentRef} id="smooth-content">

      {/* Interactive Canvas Background - Grid Pattern */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 2,
          background: 'transparent',
        }}
      />

      {/* Noise Texture Overlay */}
      <div className="noise-overlay" />

      {/* Bento Frame Corners */}
      <div style={{ position: 'fixed', inset: '24px', pointerEvents: 'none', zIndex: 10 }}>
        <div style={{ position: 'absolute', top: 0, left: 0 }}>
          <div className="corner-pulse" style={{ width: '8px', height: '8px', background: '#0000FF' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, width: '48px', height: '1px', background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, width: '1px', height: '48px', background: 'rgba(255,255,255,0.2)' }} />
                  </div>
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          <div className="corner-pulse" style={{ width: '8px', height: '8px', background: '#0000FF', marginLeft: 'auto' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: '48px', height: '1px', background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: '1px', height: '48px', background: 'rgba(255,255,255,0.2)' }} />
              </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0 }}>
          <div className="corner-pulse" style={{ width: '8px', height: '8px', background: '#0000FF' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '48px', height: '1px', background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '1px', height: '48px', background: 'rgba(255,255,255,0.2)' }} />
              </div>
        <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
          <div className="corner-pulse" style={{ width: '8px', height: '8px', background: '#0000FF', marginLeft: 'auto' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '48px', height: '1px', background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '1px', height: '48px', background: 'rgba(255,255,255,0.2)' }} />
            </div>
        </div>
        
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
        style={{
          position: 'fixed',
          top: '32px',
          right: '32px',
          zIndex: 100,
          background: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          borderRadius: '12px',
          padding: '12px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.8)" strokeWidth="1.5">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, background: 'transparent' }}>
        {/* Hero Section */}
        <section
          ref={heroSectionRef}
          className="content-entrance"
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'transparent',
            justifyContent: 'center',
            padding: '48px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Hero Glow - pulses on snap */}
          <div
            ref={heroGlowRef}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '120%',
              height: '120%',
              background: 'radial-gradient(circle, rgba(0, 71, 255, 0) 0%, transparent 70%)',
              pointerEvents: 'none',
              opacity: 0,
              zIndex: 0,
            }}
          />

          {/* Side Labels */}
          <div
            className="side-label"
            style={{
              position: 'absolute',
              left: '48px',
              top: '50%',
              transform: 'translateY(-50%) rotate(180deg)',
              writingMode: 'vertical-rl',
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '10px',
              color: theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.4)',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
            }}
          >
            BRAND CONSISTENCY
              </div>
          <div
            className="side-label"
            style={{
              position: 'absolute',
              right: '48px',
              top: '50%',
              transform: 'translateY(-50%)',
              writingMode: 'vertical-rl',
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '10px',
              color: theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.4)',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
            }}
          >
            AI-POWERED
              </div>

          {/* Logo */}
          <h1
            ref={heroTitleRef}
            style={{
              fontSize: 'clamp(90px, 18vw, 240px)',
              lineHeight: 1,
              margin: 0,
              display: 'flex',
              alignItems: 'baseline',
              letterSpacing: '-0.05em',
              marginBottom: '48px',
              perspective: '1000px',
            }}
          >
            <span
              ref={brandTextRef}
              className="brand-text-chaos"
              style={{
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontWeight: 700,
                color: theme === 'dark' ? '#FFFFFF' : '#000000',
                display: 'inline-block',
              }}
            >
              Brand
            </span>
            <span
              ref={osTextRef}
              className="os-shimmer"
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontWeight: 400,
                fontSize: '1.15em',
                fontStyle: 'italic',
                position: 'relative',
                top: '0.02em',
                display: 'inline-block',
                paddingRight: '0.15em',
              }}
            >
              OS
            </span>
            <span
              ref={typingCursorRef}
              className="typing-cursor-element"
              style={{
                display: 'inline-block',
                width: '4px',
                height: '0.9em',
                background: '#0047FF',
                marginLeft: '4px',
                verticalAlign: 'baseline',
                opacity: 0,
              }}
            />
          </h1>

          {/* Agitation + Solution */}
          <p
            ref={supportingTextRef}
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 'clamp(18px, 2.5vw, 28px)',
              fontWeight: 400,
              color: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
              maxWidth: '100%',
              lineHeight: 1.5,
              margin: 0,
              textAlign: 'center',
              marginBottom: '48px',
              opacity: 0,
              transform: 'translateY(20px)',
              whiteSpace: 'nowrap',
            }}
          >
            AI-powered brand system that understands, enforces and scales identity.
          </p>

          {/* Pain statement + See how it works CTA */}
          <div
            ref={scrollIndicatorRef}
            className="bounce"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              marginTop: '80px',
            }}
          >
            <p
              ref={painStatementRef}
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: 'clamp(16px, 2vw, 22px)',
                fontWeight: 400,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                margin: 0,
                marginBottom: '20px',
              }}
            >
              Brand drift kills companies slowly.
            </p>
            <span
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: 'clamp(16px, 2vw, 22px)',
                letterSpacing: '0.2em',
                color: theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                textTransform: 'uppercase',
              }}
            >
              See how it works
            </span>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} strokeWidth="1.5">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>
        </section>

        {/* Section Title */}
        <section
          ref={sectionTitleRef}
          className={`section-title-reveal ${sectionTitleVisible ? 'visible' : ''}`}
          style={{
            padding: '24px 48px 16px',
            textAlign: 'center',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <p
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: 'clamp(14px, 2vw, 18px)',
              letterSpacing: '0.2em',
              color: theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.5)',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            How brandOS keeps everyone on brand
              </p>
            </section>

        {/* Phases Bento Grid */}
        <section
          style={{
            padding: '16px 48px 32px',
            maxWidth: '1400px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 10,
            background: 'transparent',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '24px',
            }}
            className="phases-grid"
          >
            {phases.map((phase, index) => (
              <motion.div
                key={phase.number}
                ref={(el) => { phaseRefs.current[index] = el; }}
                onClick={() => handlePhaseClick(phase.number)}
                className={`phase-card phase-card-reveal ${visiblePhases.has(index) ? 'visible' : ''}`}
                whileHover={expandedPhase !== phase.number ? { 
                  y: -8, 
                  scale: 1.02,
                  boxShadow: '0 20px 40px rgba(0, 71, 255, 0.15)',
                } : {}}
                whileTap={expandedPhase !== phase.number ? { 
                  scale: 0.98 
                } : {}}
                transition={{ 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 25 
                }}
                style={{
                  background: expandedPhase === phase.number
                    ? 'rgba(0, 71, 255, 0.08)'
                    : theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: `1px solid ${expandedPhase === phase.number ? 'rgba(0, 71, 255, 0.4)' : theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                  borderRadius: '24px',
                  padding: '32px',
                  cursor: 'pointer',
                  gridColumn: expandedPhase === phase.number ? '1 / -1' : 'auto',
                  boxShadow: expandedPhase === phase.number ? '0 0 60px rgba(0, 71, 255, 0.15)' : 'none',
                }}
              >
                {/* Phase Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '24px',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        fontSize: '11px',
                        letterSpacing: '0.15em',
                        color: '#0047FF',
                        background: 'rgba(0, 71, 255, 0.15)',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        display: 'inline-block',
                        marginBottom: '16px',
                        border: '1px solid rgba(0, 71, 255, 0.2)',
                      }}
                    >
                      0{phase.number}
                    </span>

                    <h2
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        fontSize: expandedPhase === phase.number ? '48px' : '32px',
                        fontWeight: 400,
                        letterSpacing: '0.05em',
                        color: theme === 'dark' ? '#FFFFFF' : '#000000',
                        margin: 0,
                        marginBottom: '8px',
                        transition: 'font-size 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      {phase.title}
                    </h2>

                    <p
                      style={{
                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                        fontSize: '16px',
                        color: theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.6)',
                        margin: 0,
                      }}
                    >
                      {phase.subtitle}
                    </p>
          </div>

                  <div
                    style={{
                      color: expandedPhase === phase.number ? '#0047FF' : theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                      transition: 'color 1s ease',
                    }}
                  >
                    {phase.icon}
              </div>
          </div>

                {/* Expanded Content */}
                <div
                  style={{
                    maxHeight: expandedPhase === phase.number ? '800px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 1.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 1s ease',
                    opacity: expandedPhase === phase.number ? 1 : 0,
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                      fontSize: '18px',
                      lineHeight: 1.6,
                      color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                      marginBottom: '32px',
                      maxWidth: '600px',
                    }}
                  >
                    {phase.description}
                  </p>

                  <div
                    className="details-grid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '16px',
                      paddingTop: '24px',
                      borderTop: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    }}
                  >
                    {phase.details.map((detail) => (
                      <div
                        key={detail.title}
                        style={{
                          background: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
                          borderRadius: '12px',
                          padding: '20px',
                          border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)'}`,
                        }}
                      >
                        <h4
                          style={{
                            fontFamily: "'VCR OSD Mono', monospace",
                            fontSize: '12px',
                            letterSpacing: '0.1em',
                            color: '#0047FF',
                            margin: 0,
                            marginBottom: '8px',
                          }}
                        >
                          {detail.title}
                        </h4>
                        <p
                          style={{
                            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                            fontSize: '14px',
                            lineHeight: 1.5,
                            color: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                            margin: 0,
                          }}
                        >
                          {detail.description}
                        </p>
          </div>
                    ))}
              </div>
          </div>

                {/* Feature tags (collapsed) */}
                {expandedPhase !== phase.number && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
                    {phase.features.map((feature) => (
                      <span
                        key={feature}
                        style={{
                          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                          fontSize: '12px',
                          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.6)',
                          background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        }}
                      >
                        {feature}
                      </span>
                    ))}
          </div>
        )}

                {/* Expand indicator */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '24px',
                    color: theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      marginRight: '8px',
                    }}
                  >
                    {expandedPhase === phase.number ? 'COLLAPSE' : 'EXPAND'}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    style={{
                      transform: expandedPhase === phase.number ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
              </div>
          </motion.div>
            ))}
              </div>
            </section>

        {/* CTA Section */}
        <section
          style={{
            padding: '96px 48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <p
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 'clamp(18px, 2.5vw, 28px)',
              fontWeight: 400,
              color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
              textAlign: 'center',
              maxWidth: '500px',
              lineHeight: 1.5,
            }}
          >
            Be first to experience brandOS.
          </p>

          {/* Email Signup Form */}
          <form
            onSubmit={handleEmailSignup}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              width: '100%',
              maxWidth: '480px',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '12px',
                width: '100%',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={signupStatus === 'loading' || signupStatus === 'success'}
                style={{
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontSize: '16px',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'}`,
                  background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  color: theme === 'dark' ? '#FFFFFF' : '#000000',
                  outline: 'none',
                  flex: '1',
                  minWidth: '240px',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#0047FF';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 71, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <motion.button
                type="submit"
                disabled={signupStatus === 'loading' || signupStatus === 'success'}
                className={signupStatus !== 'success' ? 'cta-pulse' : ''}
                whileHover={signupStatus !== 'success' ? {
                  y: -2,
                  scale: 1.02,
                  boxShadow: '0 15px 40px rgba(0, 71, 255, 0.4)',
                } : {}}
                whileTap={signupStatus !== 'success' ? { scale: 0.98 } : {}}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '13px',
                  letterSpacing: '0.1em',
                  color: '#FFFFFF',
                  background: signupStatus === 'success' ? '#10B981' : '#0047FF',
                  border: 'none',
                  padding: '16px 32px',
                  cursor: signupStatus === 'loading' || signupStatus === 'success' ? 'default' : 'pointer',
                  borderRadius: '12px',
                  boxShadow: signupStatus === 'success' ? '0 0 20px rgba(16, 185, 129, 0.3)' : '0 0 20px rgba(0, 71, 255, 0.25)',
                  opacity: signupStatus === 'loading' ? 0.7 : 1,
                  transition: 'background 0.3s ease, box-shadow 0.3s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {signupStatus === 'loading' ? 'JOINING...' : signupStatus === 'success' ? 'JOINED!' : 'JOIN WAITLIST'}
              </motion.button>
            </div>

            {/* Status Message */}
            {signupMessage && (
              <p
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '12px',
                  color: signupStatus === 'success' ? '#10B981' : '#EF4444',
                  letterSpacing: '0.05em',
                  margin: 0,
                }}
              >
                {signupMessage}
              </p>
            )}
          </form>

          {/* Signup Count */}
          {signupCount > 0 && (
            <p
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '11px',
                color: theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.5)',
                letterSpacing: '0.1em',
                marginTop: '8px',
              }}
            >
              {signupCount} {signupCount === 1 ? 'person has' : 'people have'} joined
            </p>
          )}

          <p
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '10px',
              color: theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.4)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginTop: '24px',
            }}
          >
            One brand. Every channel. Always consistent.
              </p>
            </section>
              </div>

        </div>{/* End smooth-content */}
      </div>{/* End smooth-wrapper */}

      {/* Styles */}
      <style jsx global>{`
        /* ScrollSmoother wrapper styles */
        #smooth-wrapper {
          overflow: hidden;
          position: fixed;
          height: 100%;
          width: 100%;
          top: 0;
          z-index: 5;
          left: 0;
          right: 0;
          bottom: 0;
        }

        #smooth-content {
          overflow: visible;
          width: 100%;
        }

        /* SplitText character styles */
        .brand-char, .os-char {
          display: inline-block;
          will-change: transform, opacity;
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }

        .brand-char {
          transform-origin: center bottom;
        }

        .os-char {
          transform-origin: center center;
        }

        /* Typing cursor */
        .typing-cursor {
          display: inline-block;
          color: #0047FF;
          font-weight: 100;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          animation: cursorBlink 0.8s ease-in-out infinite;
        }

        @keyframes cursorBlink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cornerPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.2);
          }
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }

        @keyframes ctaGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(0, 0, 255, 0.15); }
          50% { box-shadow: 0 0 25px rgba(0, 0, 255, 0.25); }
        }

        /* Scroll-triggered phase card reveal animation - smooth and elegant */
        @keyframes phaseDropIn {
          0% {
            opacity: 0;
            transform: translateY(40px) scale(0.97);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes phaseGlowPulse {
          0% {
            box-shadow: 0 0 0 rgba(0, 71, 255, 0);
          }
          60% {
            box-shadow: 0 0 30px rgba(0, 71, 255, 0.15);
          }
          100% {
            box-shadow: 0 0 0 rgba(0, 71, 255, 0);
          }
        }

        @keyframes sectionTitleReveal {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Zero Drift - Static, stable, unmovable */
        .zero-drift-text {
          /* No animation - embodies "zero drift" by being completely stable */
        }

        /* Phase card reveal initial state */
        .phase-card-reveal {
          opacity: 0;
          transform: translateY(40px) scale(0.97);
        }

        /* Phase card visible state - smooth ease-out curve */
        .phase-card-reveal.visible {
          animation: phaseDropIn 0.5s cubic-bezier(0.33, 1, 0.68, 1) forwards,
                     phaseGlowPulse 0.8s ease-out 0.2s forwards;
          opacity: 1;
        }
        
        /* After animation completes, lock in final state */
        .phase-card-reveal.animation-complete {
          animation: none !important;
          opacity: 1 !important;
          transform: translateY(0) scale(1) !important;
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), 
                      border-color 0.2s ease, 
                      box-shadow 0.25s ease !important;
        }

        /* Section title reveal */
        .section-title-reveal {
          opacity: 0;
          transform: translateY(20px);
        }

        .section-title-reveal.visible {
          animation: sectionTitleReveal 0.6s cubic-bezier(0.33, 1, 0.68, 1) forwards;
        }

        .os-shimmer {
          background: linear-gradient(90deg, #0047FF 0%, #4477FF 25%, #0047FF 50%, #4477FF 75%, #0047FF 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }

        .content-entrance {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .corner-pulse {
          animation: cornerPulse 3s ease-in-out infinite;
        }

        .bounce {
          animation: bounce 2s infinite;
        }

        .cta-pulse {
          animation: ctaGlow 2.5s ease-in-out infinite;
        }

        .cta-pulse:hover {
          animation: none;
        }

        /* Hover state - only border and shadow animate, transform is instant */
        .phase-card:hover {
          border-color: rgba(0, 71, 255, 0.4) !important;
          box-shadow: 0 0 40px rgba(0, 71, 255, 0.15) !important;
        }

        /* After animation is complete, allow hover transform */
        .phase-card-reveal.animation-complete:hover {
          transform: translateY(-4px) scale(1) !important;
        }

        @media (max-width: 768px) {
          .phases-grid {
            grid-template-columns: 1fr !important;
          }

          .side-label {
            display: none !important;
          }
        }

        @media (max-width: 480px) {
          .details-grid {
            grid-template-columns: 1fr !important;
          }
        }

        /* Reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .phase-card-reveal {
            opacity: 1;
            transform: none;
          }
          .phase-card-reveal.visible {
            animation: none;
          }
          .section-title-reveal {
            opacity: 1;
            transform: none;
          }
          .section-title-reveal.visible {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
