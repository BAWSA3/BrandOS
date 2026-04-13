import { getAppEnv } from '@/lib/app-env';

const ENV_STYLE: Record<string, { label: string; bg: string; border: string; fg: string } | null> = {
  production: null,
  staging: {
    label: 'STAGING — not production. Data here is isolated from real users.',
    bg: '#FFB000',
    border: '#7A5400',
    fg: '#1a1a00',
  },
  preview: {
    label: 'PREVIEW — branch deploy. Do not use real credentials.',
    bg: '#7C3AED',
    border: '#4C1D95',
    fg: '#ffffff',
  },
  development: {
    label: 'DEV — local environment.',
    bg: '#10B981',
    border: '#065F46',
    fg: '#ffffff',
  },
};

export default function EnvBanner() {
  const env = getAppEnv();
  const style = ENV_STYLE[env];
  if (!style) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: style.bg,
        color: style.fg,
        borderBottom: `2px solid ${style.border}`,
        fontFamily: 'JetBrains Mono, ui-monospace, monospace',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '6px 12px',
        textAlign: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
      }}
    >
      [{env}] {style.label}
    </div>
  );
}
