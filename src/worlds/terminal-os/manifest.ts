import type { WorldManifest } from '../types';

const manifest: WorldManifest = {
  id: 'terminal-os',
  name: 'Terminal OS',
  tier: 'free',
  description: 'The BrandOS native aesthetic. CRT scanlines, JetBrains Mono, klein-blue accents.',
  tagline: 'system.online',
  preview: {
    thumb: '/worlds/terminal-os/thumb.webp',
    hero: '/worlds/terminal-os/hero.webp',
  },
  palette: {
    background: '#060A0F',
    foreground: '#E6F1FF',
    surface: '#0A1118',
    surfaceHover: '#0F1722',
    surfaceTertiary: '#080D13',
    border: 'rgba(0, 255, 136, 0.14)',
    borderHover: 'rgba(0, 255, 136, 0.28)',
    separator: 'rgba(0, 255, 136, 0.08)',
    textPrimary: '#E6F1FF',
    textSecondary: '#A8B8CC',
    textTertiary: '#6A7D94',
    textQuaternary: '#3D4D61',
    accent: '#00FF88',
    accentHover: '#33FFA0',
    success: '#00FF88',
    warning: '#FFD60A',
    danger: '#FF3B30',
  },
  typography: {
    fontSans: `"JetBrains Mono", "VCR OSD Mono", monospace`,
    fontMono: `"JetBrains Mono", "VCR OSD Mono", monospace`,
    fontDisplay: `"VCR OSD Mono", "JetBrains Mono", monospace`,
    baseSize: '15px',
    letterSpacing: '0.01em',
  },
  background: {
    staticFallback: `#060A0F repeating-linear-gradient(0deg, rgba(0,255,136,0.04) 0px, rgba(0,255,136,0.04) 1px, transparent 1px, transparent 3px)`,
  },
  motion: {
    fadeIn: { duration: 0.32, ease: 'easeOut' },
    slideIn: { duration: 0.4, ease: 'easeOut', distance: 12 },
    hover: { scale: 1.01, duration: 0.18 },
    reducedMotion: 'disable',
  },
  microcopy: {
    dashboardTitle: 'BrandOS Terminal',
    scanCta: 'Run Scan',
    scanningLabel: 'scanning...',
    scanCompleteToast: 'scan complete. score updated.',
    emptyConnections: 'no accounts connected. authenticate via X OAuth to begin.',
    connectCta: 'Connect X Account',
    upgradeCta: 'Upgrade Plan',
    shareableCardTitle: 'Shareable Card',
    shareableCardSubtitle: 'your public brand profile — portable identity.',
    phaseLabels: {
      define: 'DEFINE',
      check: 'CHECK',
      generate: 'GENERATE',
      scale: 'SCALE',
    },
  },
  modules: {
    modules: ['connections', 'scan', 'shareable', 'upgrade'],
    layout: 'stacked',
  },
  og: {
    background: '#060A0F',
    accent: '#00FF88',
    textColor: '#E6F1FF',
    mutedColor: '#6A7D94',
    fontFamily: 'monospace',
    frameGlyphs: { corner: '+', divider: '─' },
  },
};

export default manifest;
