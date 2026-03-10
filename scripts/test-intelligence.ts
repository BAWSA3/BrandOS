import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';

const prisma = new PrismaClient();
const BRAND_ID = 'cmmkc5bov0001jdi0io475jle';
const TWITTER_API_BASE = 'https://api.twitter.com/2';

// ============ MARKET SCANNER (inline) ============

function computeViralScore(metrics: { like_count?: number; retweet_count?: number; reply_count?: number; impression_count?: number; quote_count?: number }): number {
  const likes = metrics.like_count || 0;
  const retweets = metrics.retweet_count || 0;
  const replies = metrics.reply_count || 0;
  const impressions = metrics.impression_count || 1;
  const quotes = metrics.quote_count || 0;

  const engagementRate = (likes + replies) / impressions;
  const engagementScore = Math.min(25, engagementRate * 500);
  const reachScore = Math.min(25, (Math.log10(Math.max(impressions, 1)) / 6) * 25);
  const shareRate = (retweets + quotes) / Math.max(impressions, 1);
  const sharesScore = Math.min(25, shareRate * 1000);
  const conversationRate = replies / Math.max(impressions, 1);
  const conversationScore = Math.min(25, conversationRate * 1000);

  return Math.round(engagementScore + reachScore + sharesScore + conversationScore);
}

async function runMarketScanner() {
  console.log('\n=== STAGE 1: MARKET SCANNER ===');
  const token = process.env.X_BEARER_TOKEN;
  if (!token) { console.log('No X_BEARER_TOKEN, skipping market scan'); return; }

  const niches = await prisma.contentNiche.findMany({ where: { brandId: BRAND_ID, isActive: true } });
  console.log(`Found ${niches.length} niches`);

  let totalBenchmarks = 0;

  for (const niche of niches) {
    const keywords: string[] = JSON.parse(niche.keywords);
    const hashtags: string[] = JSON.parse(niche.hashtags);

    const parts: string[] = [];
    if (keywords.length > 0) parts.push(`(${keywords.slice(0, 3).join(' OR ')})`);
    if (hashtags.length > 0) parts.push(`(${hashtags.slice(0, 2).map(h => `#${h}`).join(' OR ')})`);

    let query = parts.join(' OR ') + ' -is:retweet lang:en min_faves:50';

    const params = new URLSearchParams({
      query,
      max_results: '15',
      'tweet.fields': 'created_at,public_metrics,author_id',
      'user.fields': 'username',
      expansions: 'author_id',
    });

    try {
      const response = await fetch(`${TWITTER_API_BASE}/tweets/search/recent?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.log(`  [${niche.name}] API error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const tweets = data.data || [];
      const userMap = new Map<string, string>();
      if (data.includes?.users) {
        for (const u of data.includes.users) userMap.set(u.id, u.username);
      }

      console.log(`  [${niche.name}] Found ${tweets.length} tweets`);

      // Score and filter
      const scored = tweets
        .map((t: any) => ({
          id: t.id,
          text: t.text,
          author: userMap.get(t.author_id) || 'unknown',
          metrics: t.public_metrics,
          viralScore: computeViralScore(t.public_metrics || {}),
        }))
        .filter((t: any) => t.viralScore >= 20)
        .sort((a: any, b: any) => b.viralScore - a.viralScore)
        .slice(0, 8);

      console.log(`  [${niche.name}] ${scored.length} tweets above threshold`);

      // Extract patterns via Claude
      if (scored.length > 0) {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (apiKey) {
          const anthropic = new Anthropic({ apiKey });
          const tweetList = scored.map((t: any, i: number) => `[${i+1}] (score: ${t.viralScore}) ${t.text}`).join('\n\n');

          const resp = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            messages: [{ role: 'user', content: `Analyze these viral tweets and extract patterns.

TWEETS:
${tweetList}

For each tweet return: hookType, format, tone, cta, length, topic.
hookType: "question" | "bold-claim" | "contrarian" | "story" | "data" | "list" | "how-to" | "observation"
format: "single-tweet" | "thread-opener" | "list" | "story" | "hot-take" | "educational"
tone: "raw-honest" | "data-backed" | "humorous" | "inspirational" | "provocative" | "casual" | "authoritative"
cta: "question" | "follow" | "retweet" | "reply" | "link" | "none" | "save-this"
length: "short" | "medium" | "long"
topic: brief descriptor

Return ONLY valid JSON array: [{ "hookType": "...", ... }]` }],
          });

          const text = resp.content[0].type === 'text' ? resp.content[0].text : '';
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          const patterns = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

          for (let i = 0; i < scored.length; i++) {
            const t = scored[i];
            const p = patterns[i] || { hookType: 'observation', format: 'single-tweet', tone: 'casual', cta: 'none', length: 'medium', topic: 'unknown' };

            await prisma.viralBenchmark.upsert({
              where: { platform_externalId: { platform: 'x', externalId: t.id } },
              update: { metrics: JSON.stringify(t.metrics), viralScore: t.viralScore, patterns: JSON.stringify(p), scannedAt: new Date() },
              create: { platform: 'x', externalId: t.id, authorUsername: t.author, content: t.text, metrics: JSON.stringify(t.metrics), viralScore: t.viralScore, patterns: JSON.stringify(p), niche: niche.name, brandId: BRAND_ID },
            });
            totalBenchmarks++;
          }
        }
      }

      await new Promise(r => setTimeout(r, 500));
    } catch (e: any) {
      console.log(`  [${niche.name}] Error:`, e.message);
    }
  }
  console.log(`Market scan complete: ${totalBenchmarks} benchmarks stored`);
}

// ============ PERFORMANCE TRACKER (inline) ============

async function runPerformanceTracker() {
  console.log('\n=== STAGE 2: PERFORMANCE TRACKER ===');
  const token = process.env.X_BEARER_TOKEN;
  if (!token) { console.log('No X_BEARER_TOKEN, skipping'); return; }

  const brand = await prisma.brand.findUnique({ where: { id: BRAND_ID }, include: { user: { select: { xId: true } } } });
  if (!brand?.user?.xId) { console.log('No xId found'); return; }

  // Sync tweets
  const url = `https://api.x.com/2/users/${brand.user.xId}/tweets?max_results=20&exclude=replies,retweets&tweet.fields=id,text,created_at,public_metrics,entities`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

  if (!resp.ok) { console.log(`X API error: ${resp.status}`); return; }

  const data = await resp.json();
  const tweets = data.data || [];
  console.log(`Syncing ${tweets.length} tweets...`);

  const syncedAt = new Date();
  for (const tweet of tweets) {
    const m = tweet.public_metrics || { like_count: 0, retweet_count: 0, reply_count: 0, impression_count: 0 };
    const likes = m.like_count || 0, retweets = m.retweet_count || 0, replies = m.reply_count || 0, impressions = m.impression_count || 1;
    const engagementRate = ((likes + retweets + replies) / impressions) * 100;

    await prisma.brandTweet.upsert({
      where: { tweetId: tweet.id },
      update: { metrics: JSON.stringify({ likes, retweets, replies, impressions: m.impression_count || 0, quotes: m.quote_count || 0 }), engagementRate, syncedAt },
      create: { tweetId: tweet.id, text: tweet.text, postedAt: new Date(tweet.created_at), metrics: JSON.stringify({ likes, retweets, replies, impressions: m.impression_count || 0, quotes: m.quote_count || 0 }), engagementRate, brandId: BRAND_ID, syncedAt },
    });
  }

  // Compute snapshots for 3, 7, 30 days
  for (const windowDays of [3, 7, 30]) {
    const windowStart = new Date(); windowStart.setDate(windowStart.getDate() - windowDays);
    const windowTweets = await prisma.brandTweet.findMany({ where: { brandId: BRAND_ID, postedAt: { gte: windowStart } }, orderBy: { postedAt: 'desc' } });

    if (windowTweets.length === 0) {
      await prisma.performanceSnapshot.create({ data: { brandId: BRAND_ID, windowDays, totalPosts: 0, totalImpressions: 0, totalLikes: 0, totalRetweets: 0, totalReplies: 0, avgEngagementRate: 0, avgImpressions: 0 } });
      continue;
    }

    const parsed = windowTweets.map(t => { const m = JSON.parse(t.metrics); return { ...m, engagementRate: t.engagementRate || 0, length: t.text.length, postedAt: t.postedAt, tweetId: t.tweetId }; });
    const totalImp = parsed.reduce((s: number, t: any) => s + (t.impressions || 0), 0);
    const totalL = parsed.reduce((s: number, t: any) => s + (t.likes || 0), 0);
    const totalRT = parsed.reduce((s: number, t: any) => s + (t.retweets || 0), 0);
    const totalR = parsed.reduce((s: number, t: any) => s + (t.replies || 0), 0);
    const avgEng = parsed.reduce((s: number, t: any) => s + t.engagementRate, 0) / parsed.length;

    const sorted = [...parsed].sort((a: any, b: any) => b.engagementRate - a.engagementRate);

    await prisma.performanceSnapshot.create({
      data: { brandId: BRAND_ID, windowDays, totalPosts: parsed.length, totalImpressions: totalImp, totalLikes: totalL, totalRetweets: totalRT, totalReplies: totalR, avgEngagementRate: Math.round(avgEng * 100) / 100, avgImpressions: Math.round(totalImp / parsed.length), topTweetId: sorted[0]?.tweetId, bottomTweetId: sorted[sorted.length-1]?.tweetId },
    });
    console.log(`  ${windowDays}d snapshot: ${parsed.length} posts, ${avgEng.toFixed(2)}% eng rate`);
  }
}

// ============ GAP ANALYSIS (inline) ============

async function runGapAnalysis() {
  console.log('\n=== STAGE 3: GAP ANALYSIS ===');
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { console.log('No ANTHROPIC_API_KEY'); return; }

  const snapshot = await prisma.performanceSnapshot.findFirst({ where: { brandId: BRAND_ID, windowDays: 7 }, orderBy: { computedAt: 'desc' } });
  const recentTweets = await prisma.brandTweet.findMany({ where: { brandId: BRAND_ID }, orderBy: { postedAt: 'desc' }, take: 20 });
  const benchmarks = await prisma.viralBenchmark.findMany({ where: { brandId: BRAND_ID }, orderBy: { viralScore: 'desc' }, take: 20 });
  const brand = await prisma.brand.findUnique({ where: { id: BRAND_ID }, select: { name: true, voiceFingerprint: true, tone: true, keywords: true } });

  if (!brand) return;

  const tweetsText = recentTweets.map((t, i) => { const m = JSON.parse(t.metrics); return `[${i+1}] ${t.text}\n    ${m.likes}L / ${m.retweets}RT / ${m.replies}R / ${m.impressions} imp`; }).join('\n\n');
  const benchText = benchmarks.map((b, i) => { const p = JSON.parse(b.patterns); return `[${i+1}] (score: ${b.viralScore}) ${b.content.substring(0, 150)}\n    hook=${p.hookType}, format=${p.format}, tone=${p.tone}`; }).join('\n\n');

  const anthropic = new Anthropic({ apiKey });
  const resp = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: `You are a brand growth analyst. Compare this creator's content against viral benchmarks.

CREATOR: ${brand.name}
TONE: ${brand.tone}
KEYWORDS: ${brand.keywords}

7-DAY SNAPSHOT: ${snapshot ? `${snapshot.totalPosts} posts, ${snapshot.avgEngagementRate}% avg engagement, ${snapshot.totalImpressions} total impressions` : 'No data yet'}

USER'S RECENT TWEETS:
${tweetsText || 'No tweets synced yet'}

VIRAL BENCHMARKS:
${benchText || 'No benchmarks yet'}

Score 6 dimensions (0-100): hookStrength, formatMatch, toneAlignment, ctaEffectiveness, engagementVelocity, postingConsistency.

Return ONLY valid JSON:
{
  "hookStrength": 0-100, "formatMatch": 0-100, "toneAlignment": 0-100,
  "ctaEffectiveness": 0-100, "engagementVelocity": 0-100, "postingConsistency": 0-100,
  "strengths": ["...", "...", "..."],
  "gaps": ["...", "...", "..."],
  "actionItems": ["1...", "2...", "3...", "4...", "5..."],
  "analysis": "2-3 sentence assessment"
}` }],
  });

  const text = resp.content[0].type === 'text' ? resp.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) { console.log('Failed to parse gap analysis'); return; }

  const parsed = JSON.parse(jsonMatch[0]);
  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
  const overall = Math.round((clamp(parsed.hookStrength) + clamp(parsed.formatMatch) + clamp(parsed.toneAlignment) + clamp(parsed.ctaEffectiveness) + clamp(parsed.engagementVelocity) + clamp(parsed.postingConsistency)) / 6);

  await prisma.gapAnalysis.create({
    data: {
      brandId: BRAND_ID, overallGapScore: overall,
      hookStrength: clamp(parsed.hookStrength), formatMatch: clamp(parsed.formatMatch),
      toneAlignment: clamp(parsed.toneAlignment), ctaEffectiveness: clamp(parsed.ctaEffectiveness),
      engagementVelocity: clamp(parsed.engagementVelocity), postingConsistency: clamp(parsed.postingConsistency),
      strengths: JSON.stringify(parsed.strengths || []), gaps: JSON.stringify(parsed.gaps || []),
      actionItems: JSON.stringify(parsed.actionItems || []), rawAnalysis: parsed.analysis || '',
    },
  });

  console.log(`Gap analysis complete:
  Overall: ${overall}
  Hook: ${parsed.hookStrength} | Format: ${parsed.formatMatch} | Tone: ${parsed.toneAlignment}
  CTA: ${parsed.ctaEffectiveness} | Velocity: ${parsed.engagementVelocity} | Consistency: ${parsed.postingConsistency}
  Strengths: ${(parsed.strengths || []).join('; ')}
  Gaps: ${(parsed.gaps || []).join('; ')}
  Actions: ${(parsed.actionItems || []).join('; ')}`);
}

// ============ CONTENT GENERATOR (inline) ============

async function runContentGenerator() {
  console.log('\n=== STAGE 4: CONTENT GENERATOR ===');
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { console.log('No ANTHROPIC_API_KEY'); return; }

  const gap = await prisma.gapAnalysis.findFirst({ where: { brandId: BRAND_ID }, orderBy: { computedAt: 'desc' } });
  const benchmarks = await prisma.viralBenchmark.findMany({ where: { brandId: BRAND_ID }, orderBy: { viralScore: 'desc' }, take: 10 });
  const brand = await prisma.brand.findUnique({ where: { id: BRAND_ID }, select: { name: true, tone: true, keywords: true, doPatterns: true, dontPatterns: true, voiceSamples: true, voiceFingerprint: true } });
  if (!brand) return;

  const gapInstructions: string[] = [];
  if (gap) {
    if (gap.hookStrength < 50) gapInstructions.push('PRIORITY: Your hooks need work. Every idea must open with a scroll-stopper.');
    if (gap.formatMatch < 50) gapInstructions.push('PRIORITY: Vary your format — threads, lists, stories, hot takes.');
    if (gap.ctaEffectiveness < 50) gapInstructions.push('PRIORITY: Include clear CTAs that drive replies or saves.');
    const gaps: string[] = JSON.parse(gap.gaps);
    const actions: string[] = JSON.parse(gap.actionItems);
    if (gaps.length) gapInstructions.push('GAPS: ' + gaps.join('; '));
    if (actions.length) gapInstructions.push('ACTIONS: ' + actions.slice(0, 3).join('; '));
  }

  const viralContext = benchmarks.map(b => { const p = JSON.parse(b.patterns); return `- "${b.content.substring(0, 80)}..." (${b.viralScore}) hook=${p.hookType}, tone=${p.tone}`; }).join('\n');

  const anthropic = new Anthropic({ apiKey });
  const resp = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [{ role: 'user', content: `Generate 7 viral-pattern-matched content ideas for @BawsaXBT on X/Twitter.

BRAND: ${brand.name}
TONE: ${brand.tone}
KEYWORDS: ${brand.keywords}
DO: ${brand.doPatterns}
DON'T: ${brand.dontPatterns}
VOICE SAMPLES:
${brand.voiceSamples}

VIRAL PATTERNS FROM NICHE:
${viralContext || 'No benchmarks yet - generate based on best practices for creator economy / solo builders'}

${gapInstructions.length ? 'GAP-SPECIFIC INSTRUCTIONS:\n' + gapInstructions.join('\n') : ''}

CONTEXT: BawsaXBT is a solo builder (33K followers) who built BrandOS — a personal branding operating system. He speaks in lowercase, CT-native, direct, code-aesthetic style. Topics: personal branding frameworks, vibe coding, brand DNA, building in public, content intelligence.

RULES:
- Sound like Bawsa, NOT like AI. Reference his voice samples.
- Apply viral patterns (hook types, formats) from the benchmarks
- Each idea ready to copy-paste and post
- No generic motivation, no corporate speak
- Lowercase preferred

Return ONLY valid JSON:
{
  "ideas": [
    {
      "hook": "first line that stops the scroll",
      "fullContent": "complete tweet ready to post",
      "tone": "hot-take" | "educational" | "casual" | "behind-the-scenes" | "thread-starter",
      "viralPatternApplied": "which pattern was used",
      "gapAddressed": "which gap this fixes",
      "confidenceScore": 70-95
    }
  ]
}` }],
  });

  const text = resp.content[0].type === 'text' ? resp.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) { console.log('Failed to parse content'); return; }

  const parsed = JSON.parse(jsonMatch[0]);
  const ideas = parsed.ideas || [];

  console.log(`\nGenerated ${ideas.length} content ideas:\n`);

  for (let i = 0; i < ideas.length; i++) {
    const idea = ideas[i];
    console.log(`--- IDEA ${i + 1} [${idea.tone}] (confidence: ${idea.confidenceScore}) ---`);
    console.log(`Pattern: ${idea.viralPatternApplied}`);
    console.log(`Gap: ${idea.gapAddressed}`);
    console.log(`\n${idea.fullContent}\n`);

    // Save to DB
    await prisma.contentDraft.create({
      data: {
        content: idea.fullContent,
        contentType: idea.tone === 'thread-starter' ? 'thread' : 'tweet',
        tone: idea.tone,
        status: 'idea',
        sourceType: 'intelligence-feed',
        authenticity: idea.confidenceScore,
        brandId: BRAND_ID,
      },
    });
  }

  console.log(`\n${ideas.length} ideas saved to ContentDraft table.`);
}

// ============ RUN PIPELINE ============

async function main() {
  console.log('🧠 BrandOS Content Intelligence Pipeline');
  console.log('=========================================\n');
  console.log('Brand: BawsaXBT');
  console.log('Niches: creator economy, solo builders, crypto creators\n');

  await runMarketScanner();
  await runPerformanceTracker();
  await runGapAnalysis();
  await runContentGenerator();

  console.log('\n=========================================');
  console.log('Pipeline complete.');
}

main().catch(e => console.error('Pipeline error:', e)).finally(() => prisma.$disconnect());
