#!/usr/bin/env node

/**
 * Reddit Marketing Digest Agent
 *
 * Fetches top posts from r/marketing (hot + top/day + top/week),
 * deduplicates, ranks by engagement, fetches top comments from
 * the highest-traffic threads, analyzes with Claude AI, and saves
 * a dated markdown digest. Fully autonomous — zero human intervention.
 *
 * Usage:
 *   node scripts/reddit-digest.mjs
 *   node scripts/reddit-digest.mjs --subreddit=marketing,socialmedia
 *   node scripts/reddit-digest.mjs --top=10
 *   node scripts/reddit-digest.mjs --no-ai          # skip AI analysis
 *   node scripts/reddit-digest.mjs --prompt="..."    # custom analysis prompt
 *
 * Output: reddit-digests/YYYY-MM-DD.md
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Load .env.local for standalone script execution
const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const ROOT = path.resolve(__dirname, '..');
const DIGEST_DIR = path.join(ROOT, 'reddit-digests');

// --- Config ---
const DEFAULT_SUBREDDITS = ['marketing'];
const DEFAULT_TOP_N = 15;
const TOP_COMMENTS_FOR = 5; // fetch comments for top N posts
const MAX_COMMENT_DEPTH = 10; // top-level comments to grab per post
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BrandOS-RedditDigest/1.0';

// --- CLI args ---
function parseArgs() {
  const args = process.argv.slice(2);
  let subreddits = DEFAULT_SUBREDDITS;
  let topN = DEFAULT_TOP_N;
  let noAi = false;
  let customPrompt = null;

  for (const arg of args) {
    if (arg.startsWith('--subreddit=')) {
      subreddits = arg.split('=')[1].split(',').map(s => s.trim());
    }
    if (arg.startsWith('--top=')) {
      topN = parseInt(arg.split('=')[1], 10);
    }
    if (arg === '--no-ai') {
      noAi = true;
    }
    if (arg.startsWith('--prompt=')) {
      customPrompt = arg.split('=').slice(1).join('=');
    }
  }

  return { subreddits, topN, noAi, customPrompt };
}

// --- HTTP fetch ---
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
      if (res.statusCode === 429) {
        reject(new Error(`Rate limited (429). Try again in a few minutes.`));
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Fetch posts from a subreddit endpoint ---
async function fetchPosts(subreddit, sort, timeFilter) {
  const base = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=25`;
  const url = timeFilter ? `${base}&t=${timeFilter}` : base;

  try {
    const data = await fetchJSON(url);
    return data.data.children
      .filter(p => !p.data.stickied)
      .map(p => {
        const d = p.data;
        return {
          id: d.id,
          title: d.title,
          score: d.score,
          comments: d.num_comments,
          engagement: d.score + d.num_comments,
          upvoteRatio: d.upvote_ratio,
          flair: d.link_flair_text || 'None',
          author: d.author,
          selftext: (d.selftext || '').substring(0, 1000),
          permalink: d.permalink,
          url: `https://reddit.com${d.permalink}`,
          created: new Date(d.created_utc * 1000),
          subreddit: d.subreddit,
        };
      });
  } catch (err) {
    console.error(`  [WARN] Failed to fetch ${sort} from r/${subreddit}: ${err.message}`);
    return [];
  }
}

// --- Fetch top comments for a post ---
async function fetchTopComments(permalink, limit) {
  const url = `https://www.reddit.com${permalink}.json?limit=${limit}&depth=1&sort=top`;

  try {
    const data = await fetchJSON(url);
    if (!data[1]) return [];

    return data[1].data.children
      .filter(c => c.kind === 't1')
      .slice(0, limit)
      .map(c => ({
        author: c.data.author,
        score: c.data.score,
        body: (c.data.body || '').substring(0, 500),
      }));
  } catch (err) {
    console.error(`  [WARN] Failed to fetch comments for ${permalink}: ${err.message}`);
    return [];
  }
}

// --- Deduplicate posts by ID ---
function deduplicatePosts(posts) {
  const seen = new Map();
  for (const post of posts) {
    if (!seen.has(post.id) || post.engagement > seen.get(post.id).engagement) {
      seen.set(post.id, post);
    }
  }
  return Array.from(seen.values());
}

// --- AI Analysis ---
const DEFAULT_PROMPT = `You are a marketing strategist analyzing today's top Reddit r/marketing posts for BrandOS — a personal brand building platform.

Given the digest below, provide:

### Key Themes
Identify 5 key themes or pain points the community is discussing. For each, give a one-line summary of the sentiment.

### Content Angles for BrandOS
For each theme above, propose a concrete content angle:
- **Title idea** (for a tweet, LinkedIn post, or blog)
- **Hook** (first line that grabs attention)
- **Format** (thread, carousel, short-form video, long post, etc.)
- **Why it works** (one sentence connecting it to the community pain point)

### Hot Take / Contrarian Angle
Identify one contrarian or non-obvious insight from the data — something most marketers are getting wrong based on the community discussion. Frame it as a bold, shareable take.

Be specific, actionable, and opinionated. No generic advice.`;

async function analyzeWithClaude(markdown, customPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('   [WARN] ANTHROPIC_API_KEY not found — skipping AI analysis');
    return null;
  }

  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  const prompt = customPrompt || DEFAULT_PROMPT;

  console.log('   🤖 Analyzing with Claude Haiku...');

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `${prompt}\n\n---\n\n${markdown}`,
      },
    ],
  });

  const text = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n');

  console.log('   ✅ AI analysis complete');
  return text;
}

// --- Generate markdown ---
function generateMarkdown(date, posts, commentsMap, aiAnalysis) {
  const lines = [];

  lines.push(`# r/marketing Daily Digest — ${date}`);
  lines.push(`_Auto-generated by BrandOS Reddit Digest Agent_`);
  lines.push(`_${posts.length} top posts analyzed | Generated at ${new Date().toLocaleTimeString()}_`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Quick stats
  const totalEngagement = posts.reduce((sum, p) => sum + p.engagement, 0);
  const flairCounts = {};
  posts.forEach(p => { flairCounts[p.flair] = (flairCounts[p.flair] || 0) + 1; });
  const topFlairs = Object.entries(flairCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  lines.push('## Quick Stats');
  lines.push(`- **Total engagement across top posts:** ${totalEngagement}`);
  lines.push(`- **Top flairs:** ${topFlairs.map(([f, c]) => `${f} (${c})`).join(', ')}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Posts
  lines.push('## Top Posts by Engagement');
  lines.push('');

  posts.forEach((post, i) => {
    lines.push(`### ${i + 1}. ${post.title}`);
    lines.push(`**Score:** ${post.score} | **Comments:** ${post.comments} | **Flair:** ${post.flair} | **Ratio:** ${(post.upvoteRatio * 100).toFixed(0)}%`);
    lines.push(`**Author:** u/${post.author} | **Posted:** ${post.created.toLocaleDateString()}`);
    lines.push(`**Link:** ${post.url}`);
    lines.push('');

    if (post.selftext) {
      const preview = post.selftext.replace(/\n/g, ' ').substring(0, 600);
      lines.push(`> ${preview}${post.selftext.length > 600 ? '...' : ''}`);
      lines.push('');
    }

    // Add top comments if available
    const comments = commentsMap.get(post.id);
    if (comments && comments.length > 0) {
      lines.push(`**Top Community Responses:**`);
      comments.forEach((c, j) => {
        const body = c.body.replace(/\n/g, ' ').substring(0, 300);
        lines.push(`${j + 1}. **(${c.score} pts)** u/${c.author}: "${body}${c.body.length > 300 ? '...' : ''}"`);
      });
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  });

  // AI Analysis section
  if (aiAnalysis) {
    lines.push('## AI Analysis');
    lines.push('_Generated by Claude Haiku — BrandOS Reddit Digest Agent_');
    lines.push('');
    lines.push(aiAnalysis);
    lines.push('');
  } else {
    lines.push('## Themes to Analyze');
    lines.push('_AI analysis skipped. Run without --no-ai to generate content angles._');
    lines.push('');
  }

  return lines.join('\n');
}

// --- Main ---
async function main() {
  const { subreddits, topN, noAi, customPrompt } = parseArgs();
  const today = new Date().toISOString().split('T')[0];

  console.log(`\n📡 BrandOS Reddit Digest Agent`);
  console.log(`   Date: ${today}`);
  console.log(`   Subreddits: ${subreddits.join(', ')}`);
  console.log(`   Top posts: ${topN}`);
  console.log(`   AI analysis: ${noAi ? 'disabled' : 'enabled'}\n`);

  // Ensure output directory
  if (!fs.existsSync(DIGEST_DIR)) {
    fs.mkdirSync(DIGEST_DIR, { recursive: true });
  }

  let allPosts = [];

  for (const subreddit of subreddits) {
    console.log(`   Fetching r/${subreddit}...`);

    // Fetch from multiple sorts for comprehensive coverage
    const [hot, topDay, topWeek] = await Promise.all([
      fetchPosts(subreddit, 'hot', null),
      fetchPosts(subreddit, 'top', 'day'),
      fetchPosts(subreddit, 'top', 'week'),
    ]);

    console.log(`     hot: ${hot.length} | top/day: ${topDay.length} | top/week: ${topWeek.length}`);
    allPosts.push(...hot, ...topDay, ...topWeek);

    // Respect rate limits between subreddits
    if (subreddits.length > 1) await sleep(2000);
  }

  // Deduplicate and rank
  let posts = deduplicatePosts(allPosts);
  posts.sort((a, b) => b.engagement - a.engagement);
  posts = posts.slice(0, topN);

  console.log(`\n   ${posts.length} unique posts after dedup & ranking`);

  // Fetch top comments for highest-engagement posts
  console.log(`   Fetching comments for top ${Math.min(TOP_COMMENTS_FOR, posts.length)} posts...`);
  const commentsMap = new Map();

  for (let i = 0; i < Math.min(TOP_COMMENTS_FOR, posts.length); i++) {
    const post = posts[i];
    console.log(`     [${i + 1}/${TOP_COMMENTS_FOR}] "${post.title.substring(0, 50)}..."`);
    const comments = await fetchTopComments(post.permalink, MAX_COMMENT_DEPTH);
    commentsMap.set(post.id, comments);
    await sleep(1500); // respect rate limits
  }

  // AI analysis
  let aiAnalysis = null;
  if (!noAi) {
    const rawDigest = generateMarkdown(today, posts, commentsMap, null);
    try {
      aiAnalysis = await analyzeWithClaude(rawDigest, customPrompt);
    } catch (err) {
      console.error(`   [WARN] AI analysis failed: ${err.message}`);
      console.error(`   Continuing without AI analysis...`);
    }
  }

  // Generate final markdown and save
  const markdown = generateMarkdown(today, posts, commentsMap, aiAnalysis);
  const outputPath = path.join(DIGEST_DIR, `${today}.md`);
  fs.writeFileSync(outputPath, markdown, 'utf8');

  console.log(`\n   ✅ Digest saved to: ${outputPath}`);
  console.log(`   📄 ${posts.length} posts | ${commentsMap.size} with comments | AI: ${aiAnalysis ? 'yes' : 'no'}`);
}

main().catch(err => {
  console.error(`\n❌ Fatal error: ${err.message}`);
  process.exit(1);
});
