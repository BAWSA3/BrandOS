'use client';

import { motion } from 'framer-motion';
import WalkthroughSection from '../WalkthroughSection';
import { StaggerContainer, StaggerItem } from '../motion';

interface ToneWalkthroughProps {
  tone: {
    minimal: number;
    playful: number;
    bold: number;
    experimental: number;
  };
  voiceProfile: string;
  theme: string;
}

function getToneDescription(tone: ToneWalkthroughProps['tone']): string {
  const traits: string[] = [];
  if (tone.minimal > 60) traits.push('concise and direct');
  else if (tone.minimal < 40) traits.push('detailed and expressive');
  if (tone.playful > 60) traits.push('energetic and fun');
  else if (tone.playful < 40) traits.push('professional and measured');
  if (tone.bold > 60) traits.push('confident and assertive');
  else if (tone.bold < 40) traits.push('humble and approachable');

  if (traits.length === 0) return 'balanced and versatile';
  return traits.join(', ');
}

function getVoiceStyle(formality: number, energy: number, confidence: number): { style: string; description: string; tip: string } {
  if (confidence > 70 && energy > 70) {
    return { style: 'Authority', description: 'Bold thought leader who commands attention', tip: 'Leverage your strong voice for manifesto-style content' };
  }
  if (formality > 70 && confidence > 60) {
    return { style: 'Expert', description: 'Professional voice that builds trust', tip: 'Add more personal stories to humanize your expertise' };
  }
  if (energy > 70 && formality < 50) {
    return { style: 'Entertainer', description: 'High-energy communicator who engages easily', tip: 'Balance entertainment with value-driven insights' };
  }
  if (formality < 40 && confidence < 50) {
    return { style: 'Relatable', description: 'Approachable voice that connects personally', tip: 'Build more authority through stronger opinions' };
  }
  return { style: 'Versatile', description: 'Balanced communicator who adapts well', tip: 'Consider leaning into one direction for stronger brand identity' };
}

// Average creator tone values for comparison
const AVERAGE_TONE = {
  formality: 55,
  energy: 50,
  confidence: 48,
};

export default function ToneWalkthrough({ tone, voiceProfile, theme }: ToneWalkthroughProps) {
  const isDark = theme === 'dark';
  const toneDesc = getToneDescription(tone);

  // Convert to formality/energy/confidence for simpler display
  const formality = 100 - tone.playful;
  const energy = Math.min(100, tone.playful + tone.bold / 2);
  const confidence = tone.bold;

  const voiceStyle = getVoiceStyle(formality, energy, confidence);

  const bars = [
    { label: 'FRM', fullLabel: 'Formality', value: formality, avg: AVERAGE_TONE.formality, color: '#6B7280', description: 'How professional vs casual' },
    { label: 'NRG', fullLabel: 'Energy', value: energy, avg: AVERAGE_TONE.energy, color: '#00FF41', description: 'How dynamic vs measured' },
    { label: 'CNF', fullLabel: 'Confidence', value: confidence, avg: AVERAGE_TONE.confidence, color: '#2E6AFF', description: 'How assertive vs humble' },
  ];

  // Calculate radar chart points
  const radarSize = 120;
  const center = radarSize / 2;
  const maxRadius = center - 10;

  const getRadarPoint = (value: number, index: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const radius = (value / 100) * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  const radarValues = [formality, energy, confidence, tone.experimental, tone.minimal];
  const radarLabels = ['Formal', 'Energy', 'Bold', 'Experimental', 'Minimal'];
  const radarPoints = radarValues.map((v, i) => getRadarPoint(v, i, radarValues.length));
  const radarPath = radarPoints.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ') + ' Z';

  const howWeCalculated = `Linguistic analysis across five dimensions: Formality (${Math.round(formality)}%), Energy (${Math.round(energy)}%), Confidence (${Math.round(confidence)}%), Experimental (${Math.round(tone.experimental)}%), Minimal (${Math.round(tone.minimal)}%).`;

  const whyItMatters = `Your tone creates expectations. Consistent voice builds trust and recognition. Your voice style: ${voiceStyle.style}.`;

  const whatYouCanDo: string[] = [voiceStyle.tip];

  if (Math.abs(formality - 50) > 30) {
    whatYouCanDo.push(
      formality > 50
        ? 'Consider adding more casual elements like personal stories to balance your professional tone.'
        : 'Add more professional insights to balance your casual approach and build authority.'
    );
  }
  if (energy < 40) {
    whatYouCanDo.push(
      'Inject more energy into your posts with stronger hooks, varied sentence lengths, and occasional enthusiasm markers.'
    );
  }
  if (confidence < 40) {
    whatYouCanDo.push(
      'Build confidence by making stronger claims, sharing wins, and using more assertive language.'
    );
  }

  return (
    <WalkthroughSection
      label="Tone Mixer"
      howWeCalculated={howWeCalculated}
      whyItMatters={whyItMatters}
      whatYouCanDo={whatYouCanDo}
      theme={theme}
      accentColor="#00FF41"
    >
      <div className="space-y-4">
        {/* Top Row: Voice Style + Radar + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* Voice Style Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-[4px] p-5"
            style={{ background: '#FFFFFF' }}
          >
            <div
              className="text-[10px] tracking-wider mb-3"
              style={{ fontFamily: "'VCR OSD Mono', monospace", color: 'rgba(0,0,0,0.4)' }}
            >
              VOICE STYLE
            </div>
            <div className="flex items-center gap-3 mb-3">
              <span
                className="text-3xl font-bold"
                style={{ color: '#00AA33' }}
              >
                {voiceStyle.style}
              </span>
            </div>
            <p className="text-sm mb-3" style={{ color: 'rgba(0,0,0,0.7)' }}>
              {voiceStyle.description}
            </p>
            <div
              className="text-[10px] tracking-wider mb-2"
              style={{ fontFamily: "'VCR OSD Mono', monospace", color: 'rgba(0,0,0,0.4)' }}
            >
              VOICE SIGNATURE
            </div>
            <p className="text-sm" style={{ color: '#000000' }}>
              Your voice is <span style={{ color: '#00AA33', fontWeight: 600 }}>{toneDesc}</span>
            </p>
          </motion.div>

          {/* Radar Chart Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-[4px] p-4 flex flex-col items-center justify-center"
            style={{
              background: isDark ? '#1A1A1A' : '#F5F5F5',
              border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <div
              className="text-[10px] tracking-wider mb-2 text-center"
              style={{ fontFamily: "'VCR OSD Mono', monospace", color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}
            >
              VOICE RADAR
            </div>
            <svg width={radarSize} height={radarSize} className="overflow-visible">
              {/* Background rings */}
              {[0.25, 0.5, 0.75, 1].map((scale) => (
                <polygon
                  key={scale}
                  points={radarValues
                    .map((_, i) => {
                      const p = getRadarPoint(100 * scale, i, radarValues.length);
                      return `${p.x},${p.y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                  strokeWidth="1"
                />
              ))}
              {/* Axis lines */}
              {radarValues.map((_, i) => {
                const p = getRadarPoint(100, i, radarValues.length);
                return (
                  <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={p.x}
                    y2={p.y}
                    stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                    strokeWidth="1"
                  />
                );
              })}
              {/* Value polygon */}
              <motion.polygon
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                points={radarPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="rgba(0, 255, 65, 0.2)"
                stroke="#00FF41"
                strokeWidth="2"
              />
              {/* Labels */}
              {radarLabels.map((label, i) => {
                const p = getRadarPoint(115, i, radarValues.length);
                return (
                  <text
                    key={label}
                    x={p.x}
                    y={p.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: '8px',
                      fontFamily: "'VCR OSD Mono', monospace",
                      fill: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                    }}
                  >
                    {label}
                  </text>
                );
              })}
            </svg>
          </motion.div>

          {/* Comparison Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="rounded-[4px] p-4"
            style={{
              background: isDark ? '#1A1A1A' : '#F5F5F5',
              border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <div
              className="text-[10px] tracking-wider mb-4"
              style={{ fontFamily: "'VCR OSD Mono', monospace", color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}
            >
              VS AVERAGE CREATOR
            </div>
            <div className="space-y-3">
              {bars.map((bar) => {
                const diff = bar.value - bar.avg;
                return (
                  <div key={bar.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                        {bar.fullLabel}
                      </span>
                      <span
                        className="text-xs font-medium"
                        style={{ color: diff >= 0 ? '#10B981' : '#EF4444' }}
                      >
                        {diff >= 0 ? '+' : ''}{Math.round(diff)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div
                        className="h-1.5 rounded"
                        style={{
                          width: `${bar.avg}%`,
                          background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                        }}
                      />
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.abs(diff)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="h-1.5 rounded"
                        style={{ background: diff >= 0 ? '#10B981' : '#EF4444' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Bar Cards Row */}
        <StaggerContainer className="grid grid-cols-3 gap-3 md:gap-4" staggerDelay={0.1} initialDelay={0.2}>
          {bars.map((bar, index) => (
            <StaggerItem
              key={bar.label}
              direction="up"
              className="rounded-[4px] p-4"
              style={{
                background: isDark ? '#1A1A1A' : '#F5F5F5',
                border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <span
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '12px',
                    fontWeight: 600,
                    color: bar.color,
                  }}
                >
                  {bar.label}
                </span>
                <span
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: '16px',
                    fontWeight: 600,
                    color: isDark ? '#FFFFFF' : '#000000',
                  }}
                >
                  {Math.round(bar.value)}%
                </span>
              </div>

              {/* Horizontal Bar */}
              <div
                className="h-3 rounded-full overflow-hidden mb-2"
                style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${bar.value}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                  className="h-full rounded-full"
                  style={{
                    background: bar.color,
                    boxShadow: `0 0 10px ${bar.color}40`,
                  }}
                />
              </div>

              {/* Description */}
              <p
                className="text-[10px]"
                style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
              >
                {bar.description}
              </p>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Tone Insights Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="rounded-[4px] p-4"
            style={{
              background: isDark ? 'rgba(0, 255, 65, 0.1)' : 'rgba(0, 170, 51, 0.1)',
              border: '1px solid rgba(0, 255, 65, 0.2)',
            }}
          >
            <div className="text-[10px] tracking-wider mb-2" style={{ fontFamily: "'VCR OSD Mono', monospace", color: '#00FF41' }}>
              STRENGTH
            </div>
            <p className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}>
              {confidence > 60
                ? 'Your confident voice commands attention and builds trust with your audience.'
                : energy > 60
                ? 'Your energetic communication style keeps followers engaged and entertained.'
                : formality > 60
                ? 'Your professional tone establishes credibility and expertise.'
                : 'Your balanced approach allows you to connect with diverse audiences.'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.55 }}
            className="rounded-[4px] p-4"
            style={{
              background: isDark ? 'rgba(46, 106, 255, 0.1)' : 'rgba(46, 106, 255, 0.1)',
              border: '1px solid rgba(46, 106, 255, 0.2)',
            }}
          >
            <div className="text-[10px] tracking-wider mb-2" style={{ fontFamily: "'VCR OSD Mono', monospace", color: '#2E6AFF' }}>
              BEST CONTENT TYPES
            </div>
            <p className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}>
              {confidence > 60 && energy > 60
                ? 'Hot takes, bold predictions, manifesto threads'
                : confidence > 60
                ? 'Thought leadership posts, industry analysis, opinion pieces'
                : energy > 60
                ? 'Engaging stories, memes, interactive content'
                : formality > 60
                ? 'Educational threads, tutorials, professional insights'
                : 'Personal stories, behind-the-scenes, conversational posts'}
            </p>
          </motion.div>
        </div>
      </div>
    </WalkthroughSection>
  );
}
