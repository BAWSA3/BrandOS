#!/usr/bin/env npx tsx
/**
 * BrandOS Newsletter CLI
 *
 * Usage: npx tsx scripts/send-newsletter.ts [newsletter-file.json] [--dry-run]
 *
 * Newsletter JSON format:
 * {
 *   "subject": "Your subject line",
 *   "preheader": "Preview text (optional)",
 *   "sections": [
 *     { "type": "heading", "content": "Section Title" },
 *     { "type": "text", "content": "Paragraph text here." },
 *     { "type": "stat", "label": "5,400+", "content": "brands scanned" },
 *     { "type": "cta", "content": "Scan Your Brand", "url": "https://mybrandos.app" },
 *     { "type": "divider" }
 *   ]
 * }
 *
 * If no file is provided, sends a test newsletter.
 */

import { readFileSync } from 'fs';
import path from 'path';

// Load env
try {
  const envPath = path.join(process.cwd(), '.env.local');
  readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, ...val] = line.split('=');
      if (key && val.length) process.env[key.trim()] = val.join('=').trim();
    }
  });
} catch { /* fallback to .env */ }
try {
  const envPath = path.join(process.cwd(), '.env');
  readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    if (line && !line.startsWith('#') && !process.env[line.split('=')[0]?.trim()]) {
      const [key, ...val] = line.split('=');
      if (key && val.length) process.env[key.trim()] = val.join('=').trim();
    }
  });
} catch { /* ok */ }

const DRY_RUN = process.argv.includes('--dry-run');
const fileArg = process.argv.find(a => a.endsWith('.json'));

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app';
const CRON_SECRET = process.env.CRON_SECRET;

async function main() {
  if (!CRON_SECRET) {
    console.error('Missing CRON_SECRET env var');
    process.exit(1);
  }

  let newsletter;

  if (fileArg) {
    const filePath = path.resolve(fileArg);
    newsletter = JSON.parse(readFileSync(filePath, 'utf-8'));
    console.log(`Loaded newsletter from: ${filePath}`);
  } else {
    // Default test newsletter
    newsletter = {
      subject: '🧬 BrandOS Weekly — What Your Brand Score Says About You',
      preheader: 'New archetype insights + tips to level up your brand',
      sections: [
        { type: 'heading', content: 'This week on BrandOS' },
        { type: 'text', content: 'Your brand is more than your bio. It\'s the signal you send with every post, reply, and thread. This week we\'re breaking down what the data says about the strongest creator brands.' },
        { type: 'divider' },
        { type: 'heading', content: 'By the numbers' },
        { type: 'stat', label: '5,800+', content: 'brands scanned to date' },
        { type: 'text', content: 'The average brand score is 62.7 — most creators are leaving signal on the table. The top 8% score above 80.' },
        { type: 'divider' },
        { type: 'heading', content: 'Quick tip' },
        { type: 'text', content: 'Creators who rescan after updating their bio and pinned tweet see an average 12-point score increase. Small changes, big signal.' },
        { type: 'cta', content: 'Rescan Your Brand →', url: APP_URL },
        { type: 'divider' },
        { type: 'text', content: 'See you next week. Keep building.' },
        { type: 'text', content: '— The BrandOS team' },
      ],
    };
    console.log('Using default test newsletter');
  }

  console.log(`\nSubject: ${newsletter.subject}`);
  console.log(`Sections: ${newsletter.sections.length}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE SEND'}\n`);

  const res = await fetch(`${APP_URL}/api/newsletter/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CRON_SECRET}`,
    },
    body: JSON.stringify({ ...newsletter, dryRun: DRY_RUN }),
  });

  const result = await res.json();

  if (DRY_RUN) {
    console.log(`Recipients: ${result.recipientCount}`);
    console.log(`\n--- Plain text preview ---\n`);
    console.log(result.previewText);
    console.log(`\n--- HTML preview saved ---`);
    // Save HTML preview
    const { writeFileSync } = require('fs');
    const previewPath = path.join(process.cwd(), 'data', 'newsletter-preview.html');
    writeFileSync(previewPath, result.previewHtml);
    console.log(`Open: ${previewPath}`);
  } else {
    console.log(`Sent: ${result.sent}`);
    console.log(`Failed: ${result.failed}`);
    console.log(`Total: ${result.total}`);
    if (result.errors?.length) {
      console.log(`\nErrors:`);
      result.errors.forEach((e: string) => console.log(`  ${e}`));
    }
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
