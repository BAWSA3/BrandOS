'use client';

import { motion } from 'motion/react';

const PHASE_LABELS = ['DEFINE', 'CHECK', 'GENERATE', 'SCALE'];
const PHASE_COMMANDS = [
  '> RUNNING: identity.extract()',
  '> RUNNING: coherence.check()',
  '> RUNNING: dna.generate()',
  '> RUNNING: growth.scale()',
];

interface TerminalProgressBarProps {
  currentPhase: number;
  phaseProgress: number;
  theme?: string;
}

function AsciiProgressBar({ progress, width = 20 }: { progress: number; width?: number }) {
  const filled = Math.round((progress / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}]`;
}

export default function TerminalProgressBar({
  currentPhase,
  phaseProgress,
}: TerminalProgressBarProps) {
  const overallProgress = (currentPhase - 1 + phaseProgress) / 4;
  const overallPercent = Math.round(overallProgress * 100);
  const currentCommand = PHASE_COMMANDS[currentPhase - 1] || PHASE_COMMANDS[0];

  return (
    <>
      <style jsx>{`
        .terminal-progress-container {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 100;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 24px;
        }
        @media (max-width: 768px) {
          .terminal-progress-container {
            display: none;
          }
        }
        .terminal-progress-window {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(0, 0, 0, 0.15);
          border-radius: 4px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          backdrop-filter: blur(8px);
        }
        .terminal-phase-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .terminal-phase-item {
          padding: 4px 10px;
          border-radius: 2px;
        }
        .terminal-ascii-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .terminal-command-line {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
      `}</style>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.5 }}
        className="terminal-progress-container"
      >
        <div className="terminal-progress-window">
          {/* Phase indicators */}
          <div className="terminal-phase-list">
            {PHASE_LABELS.map((label, index) => {
              const phaseNum = index + 1;
              const isActive = currentPhase === phaseNum;
              const isCompleted = currentPhase > phaseNum;

              return (
                <motion.div
                  key={label}
                  animate={{
                    opacity: isActive || isCompleted ? 1 : 0.4,
                  }}
                  className="terminal-phase-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: isActive
                      ? 'rgba(0, 71, 255, 0.08)'
                      : isCompleted
                        ? 'rgba(16, 185, 129, 0.08)'
                        : 'transparent',
                    border: isActive
                      ? '1px solid rgba(0, 71, 255, 0.3)'
                      : isCompleted
                        ? '1px solid rgba(16, 185, 129, 0.3)'
                        : '1px solid transparent',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'VCR OSD Mono', 'JetBrains Mono', monospace",
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      color: isCompleted ? '#10B981' : isActive ? '#0047FF' : 'rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    {isCompleted ? '✓' : `${phaseNum}.`} {label}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* ASCII Progress bar and command */}
          <div className="terminal-ascii-bar">
            <span
              style={{
                fontFamily: "'VCR OSD Mono', 'JetBrains Mono', monospace",
                fontSize: '11px',
                color: 'rgba(0, 0, 0, 0.6)',
                whiteSpace: 'pre',
              }}
            >
              {AsciiProgressBar({ progress: overallPercent, width: 16 })}
            </span>
            <span
              style={{
                fontFamily: "'VCR OSD Mono', 'JetBrains Mono', monospace",
                fontSize: '11px',
                color: '#0047FF',
                minWidth: '36px',
              }}
            >
              {overallPercent}%
            </span>
          </div>

          {/* Current command with blinking cursor */}
          <div className="terminal-command-line">
            <span
              style={{
                fontFamily: "'VCR OSD Mono', 'JetBrains Mono', monospace",
                fontSize: '10px',
                color: 'rgba(0, 0, 0, 0.5)',
              }}
            >
              {currentCommand}
            </span>
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                color: '#0047FF',
              }}
            >
              █
            </motion.span>
          </div>
        </div>
      </motion.div>
    </>
  );
}
