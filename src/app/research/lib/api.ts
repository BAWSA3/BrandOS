import { Interview, InterviewSummary } from '../types';
import { getQuestionsForProfile, TRACK_META } from './data';

export async function generateSummary(iv: Interview, apiKey: string): Promise<InterviewSummary> {
  if (!iv.profile) throw new Error('Profile not set');

  const questions = getQuestionsForProfile(iv.profile);

  const lines = questions
    .map((q) => {
      const response = iv.responses?.[q.id];
      if (!response?.trim()) return null;
      const trackLabel = TRACK_META[q.track].label;
      return `[${trackLabel}]\nQ: ${q.text}\nA: ${response}`;
    })
    .filter(Boolean)
    .join('\n\n');

  const prompt = `You analyze creator interviews for BrandOS, an AI-powered brand operating system for creators, founders, and agencies.

Creator: @${iv.username}
Follower tier: ${iv.tier}
Profile classification: ${iv.profile}

Interview responses:
${lines || 'No responses recorded.'}

Return ONLY valid JSON with no markdown fencing, no preamble:
{
  "headline": "One sharp sentence about their single biggest challenge or most revealing insight",
  "profileSummary": "2-3 sentences on where this creator is right now and what they specifically need",
  "painPoints": ["specific pain 1", "specific pain 2", "specific pain 3"],
  "brandOSSignals": ["BrandOS product opportunity 1", "opportunity 2", "opportunity 3"],
  "keyInsights": ["broader insight about this creator type 1", "insight 2", "insight 3"],
  "followUp": "One concrete, specific next action the BrandOS team should take with this person"
}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`API error ${res.status}: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  const text = (data.content ?? [])
    .map((c: { type: string; text?: string }) => c.text ?? '')
    .join('');

  return JSON.parse(text.replace(/```json|```/g, '').trim()) as InterviewSummary;
}
