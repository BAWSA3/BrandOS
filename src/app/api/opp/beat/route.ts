import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, rateLimiters } from '@/lib/rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import supabase from '@/lib/supabase';

/**
 * "Beat My Opp" — email capture + instant preview + async detailed report.
 *
 * POST: { email, username, oppUsername, userScore, oppScore, phases, oppPhases, archetype, oppArchetype }
 * Returns: { quickWins: string[], reportQueued: true }
 * Side effect: sends detailed email report via Resend
 */

interface BeatMyOppRequest {
  email: string;
  username: string;
  oppUsername: string;
  userScore: number;
  oppScore: number;
  phases: { define: number; check: number; generate: number; scale: number };
  oppPhases: { define: number; check: number; generate: number; scale: number };
  archetype: string;
  oppArchetype: string;
}

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const { limited } = checkRateLimit(`opp-beat:${clientId}`, rateLimiters.standard);
    if (limited) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
    }

    const body = (await request.json()) as BeatMyOppRequest;

    if (!body.email || !body.username || !body.oppUsername) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Generate quick wins (fast, returns to client)
    const quickWins = await generateQuickWins(body);

    // Record email capture
    await supabase.from('OppEmailCaptures').insert({
      email: body.email,
      username: body.username.toLowerCase(),
      opp_username: body.oppUsername.toLowerCase(),
      user_score: body.userScore,
      opp_score: body.oppScore,
    });

    // Send detailed report async (don't block response)
    sendDetailedReport(body, quickWins).catch((err) => {
      console.error('[opp/beat] email send error:', err);
    });

    return NextResponse.json({ quickWins, reportQueued: true });
  } catch (error) {
    console.error('[opp/beat] error:', error);
    return NextResponse.json({ error: 'Failed to generate coaching' }, { status: 500 });
  }
}

async function generateQuickWins(body: BeatMyOppRequest): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return getDefaultQuickWins(body);

  try {
    const anthropic = new Anthropic({ apiKey });

    const weakPhases = [];
    if (body.phases.define < body.oppPhases.define) weakPhases.push(`DEFINE (you: ${body.phases.define}, them: ${body.oppPhases.define})`);
    if (body.phases.check < body.oppPhases.check) weakPhases.push(`CHECK (you: ${body.phases.check}, them: ${body.oppPhases.check})`);
    if (body.phases.generate < body.oppPhases.generate) weakPhases.push(`GENERATE (you: ${body.phases.generate}, them: ${body.oppPhases.generate})`);
    if (body.phases.scale < body.oppPhases.scale) weakPhases.push(`SCALE (you: ${body.phases.scale}, them: ${body.oppPhases.scale})`);

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `You are BrandOS, a brand intelligence system. Give exactly 3 quick, actionable wins for @${body.username} (score: ${body.userScore}, archetype: ${body.archetype}) to beat their opp @${body.oppUsername} (score: ${body.oppScore}, archetype: ${body.oppArchetype}).

Phases where they're losing: ${weakPhases.length > 0 ? weakPhases.join(', ') : 'none — they\'re winning overall'}

Each win should be 1 sentence, specific and actionable. Not generic advice — reference their archetype and weak phases.

Return ONLY a JSON array of 3 strings. No markdown, no explanation.
Example: ["Pin your niche in your bio — your DEFINE score is 12 points behind.", "...", "..."]`
      }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length >= 3) return parsed.slice(0, 3);
    return getDefaultQuickWins(body);
  } catch {
    return getDefaultQuickWins(body);
  }
}

function getDefaultQuickWins(body: BeatMyOppRequest): string[] {
  const wins: string[] = [];
  const phases = [
    { key: 'define', label: 'DEFINE', user: body.phases.define, opp: body.oppPhases.define },
    { key: 'check', label: 'CHECK', user: body.phases.check, opp: body.oppPhases.check },
    { key: 'generate', label: 'GENERATE', user: body.phases.generate, opp: body.oppPhases.generate },
    { key: 'scale', label: 'SCALE', user: body.phases.scale, opp: body.oppPhases.scale },
  ];

  const weakest = phases.sort((a, b) => (a.user - a.opp) - (b.user - b.opp));

  for (const phase of weakest.slice(0, 3)) {
    if (phase.user < phase.opp) {
      wins.push(`Your ${phase.label} is ${phase.opp - phase.user} points behind — focus here first.`);
    } else {
      wins.push(`You're ahead on ${phase.label} by ${phase.user - phase.opp} — double down to widen the gap.`);
    }
  }

  return wins.length >= 3 ? wins : [
    'Sharpen your bio to make your niche crystal clear.',
    'Post more consistently — voice consistency is where most people lose.',
    'Study your opp\'s best content and find your angle on the same topics.',
  ];
}

async function sendDetailedReport(body: BeatMyOppRequest, quickWins: string[]) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!apiKey || !resendKey) return;

  const anthropic = new Anthropic({ apiKey });

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `You are BrandOS, a brand intelligence analyst. Write a detailed coaching report for @${body.username} on how to beat their opp @${body.oppUsername}.

DATA:
- @${body.username}: Score ${body.userScore}/100, Archetype: ${body.archetype}
  - DEFINE: ${body.phases.define}, CHECK: ${body.phases.check}, GENERATE: ${body.phases.generate}, SCALE: ${body.phases.scale}
- @${body.oppUsername}: Score ${body.oppScore}/100, Archetype: ${body.oppArchetype}
  - DEFINE: ${body.oppPhases.define}, CHECK: ${body.oppPhases.check}, GENERATE: ${body.oppPhases.generate}, SCALE: ${body.oppPhases.scale}

Write a report with these sections (use plain text with line breaks, no markdown):

1. THREAT ASSESSMENT — 2 sentences on where the opp is strongest and what makes them dangerous
2. YOUR ADVANTAGES — 2-3 bullets on where you're ahead and how to capitalize
3. VULNERABILITY MAP — 2-3 bullets on your weakest phases with specific actions to improve each
4. 7-DAY OPS PLAN — A day-by-day plan of 7 specific actions (one per day) to close the gap
5. FINAL INTEL — 1 sentence motivational closer

Keep the spy/mission briefing tone. Be specific and actionable, not generic.`
    }],
  });

  const reportText = message.content[0].type === 'text' ? message.content[0].text : '';

  // Send via Resend
  const fromEmail = process.env.FROM_EMAIL || 'BrandOS <onboarding@resend.dev>';

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [body.email],
      subject: `🎯 INTEL REPORT: How to beat @${body.oppUsername} — BrandOS`,
      html: buildEmailHtml(body, quickWins, reportText),
    }),
  });

  // Mark as sent
  await supabase
    .from('OppEmailCaptures')
    .update({ report_sent: true })
    .eq('email', body.email)
    .eq('username', body.username.toLowerCase())
    .eq('opp_username', body.oppUsername.toLowerCase());
}

function buildEmailHtml(
  body: BeatMyOppRequest,
  quickWins: string[],
  reportText: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { background: #060A0F; color: #E8E8ED; font-family: 'Courier New', monospace; padding: 40px 20px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { border-bottom: 1px solid rgba(0,255,136,0.15); padding-bottom: 16px; margin-bottom: 24px; }
    .header-brand { color: #00FF88; font-size: 12px; letter-spacing: 0.2em; }
    .header-sub { color: rgba(0,255,136,0.5); font-size: 10px; letter-spacing: 0.15em; }
    h1 { color: #fff; font-size: 20px; letter-spacing: 0.05em; margin: 0 0 8px 0; }
    .matchup { color: rgba(0,255,136,0.4); font-size: 11px; letter-spacing: 0.1em; margin-bottom: 24px; }
    .score-row { display: flex; justify-content: space-between; margin-bottom: 24px; }
    .score-box { text-align: center; }
    .score-num { font-size: 32px; font-weight: 700; }
    .score-label { font-size: 9px; letter-spacing: 0.1em; color: rgba(255,255,255,0.4); }
    .quick-wins { background: rgba(0,255,136,0.04); border: 1px solid rgba(0,255,136,0.12); border-radius: 4px; padding: 16px; margin-bottom: 24px; }
    .quick-wins-title { color: #00FF88; font-size: 10px; letter-spacing: 0.15em; margin-bottom: 12px; }
    .win-item { color: rgba(255,255,255,0.7); font-size: 12px; line-height: 1.6; margin-bottom: 8px; padding-left: 16px; position: relative; }
    .win-item::before { content: '⊕'; position: absolute; left: 0; color: #00FF88; }
    .report { color: rgba(255,255,255,0.65); font-size: 12px; line-height: 1.8; white-space: pre-wrap; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid rgba(0,255,136,0.08); }
    .footer-text { color: rgba(0,255,136,0.3); font-size: 9px; letter-spacing: 0.1em; }
    .cta-btn { display: inline-block; padding: 12px 24px; background: #00FF88; color: #060A0F; text-decoration: none; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 0.15em; font-weight: 700; border-radius: 4px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-brand">BRANDOS</div>
      <div class="header-sub">OPP INTELLIGENCE UNIT</div>
    </div>

    <h1>HOW TO BEAT @${body.oppUsername.toUpperCase()}</h1>
    <div class="matchup">@${body.username} (${body.userScore}) vs @${body.oppUsername} (${body.oppScore})</div>

    <div class="quick-wins">
      <div class="quick-wins-title">⊕ QUICK WINS</div>
      ${quickWins.map(w => `<div class="win-item">${w}</div>`).join('')}
    </div>

    <div class="report">${reportText}</div>

    <div class="footer">
      <a href="https://mybrandos.app/opp" class="cta-btn">RUN ANOTHER MATCHUP</a>
      <br><br>
      <div class="footer-text">POWERED BY BRANDOS BRAND INTELLIGENCE</div>
    </div>
  </div>
</body>
</html>`;
}
