'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import MetaStrip from '@/components/field/MetaStrip';
import { FIELD_FONTS } from '@/components/field/fieldFonts';
import {
  Button,
  DitherWipeProvider,
  FieldScreen,
  FieldText,
  Input,
  Modal,
  Panel,
  Stat,
  SystemStyles,
  SYSTEM_FONTS,
  Tag,
  ToastProvider,
  useDitherWipe,
  useToast,
} from '@/components/system';

const wrap: CSSProperties = {
  maxWidth: 1180,
  margin: '0 auto',
  paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))',
  paddingRight: 'max(16px, env(safe-area-inset-right, 0px))',
};
const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' };

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section style={{ display: 'grid', gap: 16, paddingBlock: 28 }}>
      <FieldText size="label">{label}</FieldText>
      {children}
    </section>
  );
}

function Demos() {
  const toast = useToast();
  const wipe = useDitherWipe();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'a' | 'b'>('a');

  return (
    <>
      <Section label="Toast · modal · dither wipe">
        <div style={row}>
          <Button
            tone="field"
            onClick={() =>
              toast({
                label: 'Entry confirmed',
                title: 'No. 0042 is yours',
                body: 'ENTERED 23 OCT 2026 / CLASS 03 / BUILD.EXE',
              })
            }
          >
            Show a toast
          </Button>
          <Button tone="field" variant="secondary" onClick={() => setOpen(true)}>
            Open the modal
          </Button>
          <Button
            tone="field"
            variant="secondary"
            onClick={() => wipe(() => setView((v) => (v === 'a' ? 'b' : 'a')))}
          >
            Wipe to the next screen
          </Button>
        </div>
        <Panel
          label={view === 'a' ? 'Screen A / your record' : 'Screen B / the Index'}
          meta={view === 'a' ? '01 / 02' : '02 / 02'}
        >
          <p
            style={{
              margin: 0,
              fontFamily: SYSTEM_FONTS.display,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            {view === 'a' ? 'Score 76. Up 4 this week.' : '1,004 numbers reserved.'}
          </p>
          <p
            style={{
              margin: '6px 0 0',
              fontFamily: SYSTEM_FONTS.plex,
              fontSize: 13,
              color: 'rgba(14,14,14,.65)',
            }}
          >
            The wipe draws the field over the screen dot by dot, swaps it, and draws it away.
          </p>
        </Panel>
      </Section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        label="Founding 100"
        title="Lock $29 for life"
      >
        <p style={{ margin: '0 0 18px', fontSize: 16, lineHeight: 1.55 }}>
          Nothing is charged until Dec 3. Cancel before then and you pay nothing.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          <Input placeholder="you@studio.xyz" aria-label="Email" />
          <div style={row}>
            <Button onClick={() => setOpen(false)}>Become a Founding Member</Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Not now
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default function SystemPreview() {
  const [focus, setFocus] = useState(false);
  return (
    <ToastProvider>
      <DitherWipeProvider>
        <SystemStyles />
        <div style={{ position: 'fixed', right: 16, bottom: 56, zIndex: 20 }}>
          <Button
            tone="field"
            variant={focus ? 'signal' : 'secondary'}
            onClick={() => setFocus((f) => !f)}
          >
            {focus ? 'Dashboard focus: on' : 'Dashboard focus: off'}
          </Button>
        </div>
        <FieldScreen signalCell="auto" drift={!focus} focus={focus}>
          <div className={FIELD_FONTS.plexVariable} style={{ paddingBottom: 80 }}>
            <div
              style={{
                ...wrap,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                paddingTop: 24,
              }}
            >
              <FieldText size="mono">brandos / the system</FieldText>
              <FieldText size="mono">doc — 03</FieldText>
            </div>

            <div style={{ ...wrap, paddingTop: 'clamp(64px, 14vh, 160px)', paddingBottom: 40 }}>
              <FieldText size="label">The record of creator reputation</FieldText>
              <FieldText size="display" style={{ marginTop: 14 }}>
                Reputation
                <br />
                on the record.
              </FieldText>
              <div style={{ marginTop: 22 }}>
                <FieldText size="mono">
                  the field is the background of every screen.
                  <br />
                  long reading sits on bone panels.
                </FieldText>
              </div>
            </div>

            <div style={wrap}>
              <Section label="On the field">
                <div style={row}>
                  <Button tone="field">Join the Index</Button>
                  <Button tone="field" variant="secondary">
                    See the Index
                  </Button>
                  <Button tone="field" variant="signal">
                    This one
                  </Button>
                  <Tag tone="field">Class 03 / BUILD.EXE</Tag>
                  <Tag tone="field">Entered 23 Oct 2026</Tag>
                  <Tag tone="field" active>
                    Your entry
                  </Tag>
                </div>
                <div style={{ maxWidth: 420 }}>
                  <Input placeholder="@yourhandle" aria-label="Your X handle" />
                </div>
              </Section>

              <Section label="On a bone panel">
                <Panel label="Join the Index" meta="No. 0042">
                  <div style={{ display: 'grid', gap: 14 }}>
                    <div style={row}>
                      <Button>Join the Index</Button>
                      <Button variant="secondary">Edit entry</Button>
                      <Button variant="signal">This one</Button>
                    </div>
                    <div style={row}>
                      <Tag>DeFi</Tag>
                      <Tag>Founder</Tag>
                      <Tag active>Your entry</Tag>
                    </div>
                    <Input placeholder="one line for brands" aria-label="One line for brands" />
                    <Input placeholder="invalid example" aria-label="Invalid example" invalid />
                  </div>
                </Panel>
              </Section>

              <Section label="Your record (a dashboard on panels)">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                  }}
                >
                  <Panel label="Score" meta="7d">
                    <Stat label="Brand score" value="76" unit="/100" />
                  </Panel>
                  <Panel label="Audience" meta="30d">
                    <Stat label="Real followers" value="97" unit="%" />
                  </Panel>
                  <Panel label="Standing" meta="rank">
                    <Stat label="Standing" value="II" unit="Noted" />
                  </Panel>
                </div>
                <Panel label="Recent posts" meta="5 of 60">
                  <div style={{ display: 'grid' }}>
                    {[
                      ['shipped the index today', '3.4%'],
                      ['thread: how brands pick creators', '2.9%'],
                      ['gm builders', '0.8%'],
                    ].map(([t, r]) => (
                      <div
                        key={t}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 12,
                          padding: '12px 0',
                          borderTop: '1px solid rgba(14,14,14,.12)',
                          fontSize: 15,
                        }}
                      >
                        <span style={{ minWidth: 0 }}>{t}</span>
                        <span style={{ fontFamily: SYSTEM_FONTS.plex, fontSize: 13 }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </Section>

              <Demos />
            </div>
          </div>
          <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 5 }}>
            <MetaStrip
              items={[
                'DOC — 03',
                '//',
                'THE INDEX',
                '№(0001)',
                'ENTRY No. 0042',
                'CLASS 03 / BUILD.EXE',
                'SCORE 76/100',
                'ENTERED 23 OCT 2026',
                'MYBRANDOS.APP',
              ]}
            />
          </div>
        </FieldScreen>
      </DitherWipeProvider>
    </ToastProvider>
  );
}
