'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useV2 } from './context';
import { CORAL } from './tokens';
import { Btn, DISPLAY, Label, MockNote, VCR } from './ui';

/**
 * Concept frameworks (Visualize Value-style): pick a shape, fill the labels,
 * export an image in the brand's finish. Each template opens pre-filled from
 * the Record, so the first state is already a postable idea.
 *
 * The plate is the export: canvas colour, head ink, one coral mark ("this one").
 */

type Kind = '2x2' | 'before' | 'loop' | 'ladder';

const TEMPLATES: { id: Kind; name: string; line: string; title: string; labels: string[] }[] = [
  {
    id: '2x2',
    name: '2x2',
    line: 'Two tensions, four places to stand',
    title: 'Where your posts land',
    labels: [
      'Rented',
      'Owned',
      'Decays',
      'Compounds',
      'Viral one-offs',
      'Threads that age',
      'Replies',
      'A body of work',
    ],
  },
  {
    id: 'before',
    name: 'Before / after',
    line: 'The shift, side by side',
    title: 'What brands see in 10 seconds',
    labels: [
      'Before',
      '9 posts, 9 topics',
      'No pinned proof',
      'Bio says "creator"',
      'After',
      '3 pillars, every post',
      'A pinned case',
      'Bio says who it helps',
    ],
  },
  {
    id: 'loop',
    name: 'Loop',
    line: 'A cycle that feeds itself',
    title: 'The posting loop',
    labels: ['Post', 'Read', 'Sharpen', 'Post again'],
  },
  {
    id: 'ladder',
    name: 'Ladder',
    line: 'Steps from here to there',
    title: 'From follower to client',
    labels: ['Follower', 'Reader', 'Replier', 'Client'],
  },
];

function Plate({ kind, title, l }: { kind: Kind; title: string; l: string[] }) {
  const ink = 'var(--v-head)';
  const mute = 'var(--v-head-muted)';
  const font = { fontFamily: DISPLAY } as const;
  const S = 600;
  return (
    <svg
      viewBox={`0 0 ${S} ${S}`}
      className="block h-auto w-full"
      role="img"
      aria-label={`${title}: ${l.join(', ')}`}
    >
      <rect width={S} height={S} fill="var(--v-canvas)" />
      <text
        x={40}
        y={64}
        fill={ink}
        fontSize={30}
        fontWeight={500}
        letterSpacing="-0.8"
        style={font}
      >
        {title}
      </text>
      {kind === '2x2' && (
        <g>
          <line x1={300} y1={120} x2={300} y2={540} stroke={ink} strokeWidth={1.5} />
          <line x1={60} y1={330} x2={540} y2={330} stroke={ink} strokeWidth={1.5} />
          <text x={60} y={320} fill={mute} fontSize={13} style={{ fontFamily: VCR }}>
            {l[0].toUpperCase()}
          </text>
          <text
            x={540}
            y={320}
            fill={mute}
            fontSize={13}
            textAnchor="end"
            style={{ fontFamily: VCR }}
          >
            {l[1].toUpperCase()}
          </text>
          <text x={310} y={534} fill={mute} fontSize={13} style={{ fontFamily: VCR }}>
            {l[2].toUpperCase()}
          </text>
          <text x={310} y={134} fill={mute} fontSize={13} style={{ fontFamily: VCR }}>
            {l[3].toUpperCase()}
          </text>
          {[
            [180, 450, l[4]],
            [420, 450, l[5]],
            [180, 230, l[6]],
          ].map(([x, y, t]) => (
            <text
              key={String(t)}
              x={x as number}
              y={y as number}
              fill={ink}
              fontSize={20}
              textAnchor="middle"
              style={font}
            >
              {t as string}
            </text>
          ))}
          <circle cx={420} cy={200} r={10} fill={CORAL} />
          <text
            x={420}
            y={240}
            fill={ink}
            fontSize={20}
            fontWeight={500}
            textAnchor="middle"
            style={font}
          >
            {l[7]}
          </text>
        </g>
      )}
      {kind === 'before' && (
        <g>
          {[0, 1].map((col) => {
            const x = col === 0 ? 40 : 320;
            const base = col * 4;
            return (
              <g key={col}>
                <text
                  x={x}
                  y={150}
                  fill={col ? ink : mute}
                  fontSize={13}
                  style={{ fontFamily: VCR }}
                >
                  {l[base].toUpperCase()}
                </text>
                {[1, 2, 3].map((r) => (
                  <g key={r}>
                    <line
                      x1={x}
                      x2={x + 240}
                      y1={175 + r * 90 - 55}
                      y2={175 + r * 90 - 55}
                      stroke={mute}
                      strokeOpacity={0.35}
                    />
                    <text x={x} y={175 + r * 90} fill={col ? ink : mute} fontSize={21} style={font}>
                      {l[base + r]}
                    </text>
                  </g>
                ))}
              </g>
            );
          })}
          <text x={300} y={360} fill={ink} fontSize={26} textAnchor="middle" style={font}>
            →
          </text>
          <circle cx={570} cy={538} r={9} fill={CORAL} />
        </g>
      )}
      {kind === 'loop' && (
        <g>
          <circle
            cx={300}
            cy={340}
            r={170}
            fill="none"
            stroke={ink}
            strokeWidth={1.5}
            strokeDasharray="2 7"
          />
          {[
            [300, 170],
            [470, 340],
            [300, 510],
            [130, 340],
          ].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={i === 0 ? 12 : 7} fill={i === 0 ? CORAL : ink} />
              <text
                x={x + (i === 1 ? 22 : i === 3 ? -22 : 0)}
                y={y + (i === 0 ? -26 : i === 2 ? 40 : 7)}
                textAnchor={i === 1 ? 'start' : i === 3 ? 'end' : 'middle'}
                fill={ink}
                fontSize={22}
                style={font}
              >
                {l[i]}
              </text>
            </g>
          ))}
          <text
            x={300}
            y={348}
            textAnchor="middle"
            fill={mute}
            fontSize={13}
            style={{ fontFamily: VCR }}
          >
            EVERY DAY
          </text>
        </g>
      )}
      {kind === 'ladder' && (
        <g>
          {l.map((t, i) => {
            const h = 80 + i * 100;
            const x = 50 + i * 128;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={540 - h}
                  width={112}
                  height={h}
                  fill={i === 3 ? CORAL : 'none'}
                  stroke={ink}
                  strokeWidth={1.5}
                />
                <text x={x} y={540 - h - 14} fill={ink} fontSize={19} style={font}>
                  {t}
                </text>
                <text
                  x={x + 10}
                  y={530}
                  fill={i === 3 ? '#0E0E0E' : mute}
                  fontSize={12}
                  style={{ fontFamily: VCR }}
                >
                  0{i + 1}
                </text>
              </g>
            );
          })}
        </g>
      )}
      <text x={40} y={576} fill={mute} fontSize={12} style={{ fontFamily: VCR }}>
        @JBAWSA
      </text>
    </svg>
  );
}

export default function Frameworks() {
  const { toast, finish } = useV2();
  const reduce = useReducedMotion();
  const [kind, setKind] = useState<Kind>('2x2');
  const [data, setData] = useState(() =>
    Object.fromEntries(TEMPLATES.map((t) => [t.id, { title: t.title, labels: t.labels }]))
  );
  const cur = data[kind];
  const set = (i: number, v: string) =>
    setData((d) => ({
      ...d,
      [kind]: { ...d[kind], labels: d[kind].labels.map((x, j) => (j === i ? v : x)) },
    }));

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pb-10 pt-6 md:px-10 md:pt-14">
      <Label tone="head-muted">Frameworks</Label>
      <h1
        className="mt-3 text-[34px] leading-[1.02] md:text-[56px]"
        style={{
          fontFamily: DISPLAY,
          fontWeight: 500,
          letterSpacing: '-0.04em',
          color: 'var(--v-head)',
        }}
      >
        Turn a rough thought into one clear picture.
      </h1>

      {/* Template picker: chips on phones, a column on desktop */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:mt-10 md:grid-cols-[220px_1fr_300px]">
        <div
          className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-col md:overflow-visible md:px-0"
          role="tablist"
          aria-label="Templates"
        >
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={kind === t.id}
              onClick={() => setKind(t.id)}
              className="v2-focus min-h-[44px] shrink-0 px-4 py-3 text-left md:w-full"
              style={{
                borderRadius: 14,
                background: kind === t.id ? 'var(--v-surface)' : 'transparent',
                color: kind === t.id ? 'var(--v-ink)' : 'var(--v-head)',
                boxShadow: kind === t.id ? 'inset 0 0 0 1px var(--v-rule)' : 'none',
              }}
            >
              <div className="text-[16px]" style={{ fontFamily: DISPLAY, fontWeight: 500 }}>
                {t.name}
              </div>
              <div
                className="hidden text-[13px] md:block"
                style={{ color: kind === t.id ? 'var(--v-muted)' : 'var(--v-head-muted)' }}
              >
                {t.line}
              </div>
            </button>
          ))}
        </div>

        <motion.div
          key={kind}
          initial={reduce ? false : { opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.22 }}
          className="overflow-hidden"
          style={{ borderRadius: 18, boxShadow: '0 0 0 1px var(--v-rule), var(--v-shadow)' }}
        >
          <Plate kind={kind} title={cur.title} l={cur.labels} />
        </motion.div>

        <div className="md:pt-1">
          <p className="text-[14px] leading-[1.5]" style={{ color: 'var(--v-head-muted)' }}>
            Started from your Record: your best posts sit top right. Change any word.
          </p>
          <div className="mt-4 space-y-2">
            <input
              value={cur.title}
              onChange={(e) =>
                setData((d) => ({ ...d, [kind]: { ...d[kind], title: e.target.value } }))
              }
              aria-label="Title"
              className="v2-focus h-[44px] w-full px-3 text-[15px]"
              style={{
                border: 'none',
                padding: '0 12px',
                background: 'var(--v-raised)',
                color: 'var(--v-ink)',
                borderRadius: 12,
                boxShadow: 'inset 0 0 0 1px var(--v-rule)',
                fontWeight: 500,
              }}
            />
            {cur.labels.map((v, i) => (
              <input
                key={i}
                value={v}
                onChange={(e) => set(i, e.target.value)}
                aria-label={`Label ${i + 1}`}
                className="v2-focus h-[40px] w-full px-3 text-[14px]"
                style={{
                  border: 'none',
                  padding: '0 12px',
                  background: 'var(--v-raised)',
                  color: 'var(--v-ink)',
                  borderRadius: 12,
                  boxShadow: 'inset 0 0 0 1px var(--v-rule)',
                }}
              />
            ))}
          </div>
          <div className="sticky bottom-[88px] mt-5 md:static">
            <Btn
              kind="cta"
              className="w-full"
              onClick={() => toast(`Saved jbawsa-${kind}.png in your ${finish} finish.`)}
            >
              Export image
            </Btn>
            <Btn
              kind="quiet"
              className="mt-1 w-full"
              onClick={() => toast('Added to the canvas.')}
              style={{ color: 'var(--v-head-muted)' }}
            >
              Add to canvas
            </Btn>
          </div>
        </div>
      </div>
      <MockNote
        principle="Ideas as diagrams + radical simplicity. One idea per plate, one coral mark for 'this one'; the template opens filled from the Record so it is never a blank shape."
        cut="Nothing existing; this is new. Kept deliberately small: four shapes, no free drawing (that is the canvas's job)."
      />
    </div>
  );
}
