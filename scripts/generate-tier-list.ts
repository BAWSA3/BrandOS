/**
 * BrandOS Tier List Generator
 *
 * Pulls all unique scanned users from the DB, grabs their PFPs,
 * and generates an HTML tier list page grouped by score ranges.
 *
 * Usage: npx tsx scripts/generate-tier-list.ts
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface TierUser {
  username: string;
  score: number;
  archetype: string | null;
  profileImageUrl: string | null;
}

async function main() {
  console.log('Fetching all brand scans...');

  // Get the latest scan per unique username (highest score if multiple)
  const scans = await prisma.brandScans.findMany({
    orderBy: { score: 'desc' },
  });

  // Dedupe by username — keep highest score per user
  const userMap = new Map<string, typeof scans[0]>();
  for (const scan of scans) {
    const key = scan.username.toLowerCase();
    if (!userMap.has(key)) {
      userMap.set(key, scan);
    }
  }

  console.log(`Found ${userMap.size} unique users from ${scans.length} total scans`);

  // Get cached profile data for PFPs
  const cachedProfiles = await prisma.xProfileCache.findMany();
  const profileMap = new Map<string, string>();

  for (const profile of cachedProfiles) {
    try {
      const data = JSON.parse(profile.profileData);
      const pfp = data.profileImageUrl || data.profile_image_url || data.avatar || null;
      if (pfp) {
        profileMap.set(profile.username.toLowerCase(), pfp.replace('_normal', '_400x400'));
      }
    } catch {
      // skip malformed JSON
    }
  }

  console.log(`Found ${profileMap.size} cached profile pictures`);

  // Build tier list, filtering out likely bots
  const botPatterns = [
    /^bot_/i, /bot$/i, /_bot_/i,
    /^test/i, /^fake/i, /^spam/i,
    /\d{8,}/, // 8+ consecutive digits (likely bot handles)
  ];

  const tierUsers: TierUser[] = [];

  for (const [username, scan] of userMap) {
    // Skip likely bots
    const isBot = botPatterns.some(p => p.test(username));
    if (isBot) {
      console.log(`  Skipping likely bot: ${username}`);
      continue;
    }

    // Skip scores below 40 (not interesting for the tier list)
    if (scan.score < 40) continue;

    tierUsers.push({
      username,
      score: scan.score,
      archetype: scan.archetype,
      profileImageUrl: profileMap.get(username) || null,
    });
  }

  console.log(`${tierUsers.length} users after filtering bots and low scores`);

  // Group into tiers
  const tiers = {
    elite: tierUsers.filter(u => u.score >= 80).sort((a, b) => b.score - a.score),
    strong: tierUsers.filter(u => u.score >= 60 && u.score < 80).sort((a, b) => b.score - a.score),
    rising: tierUsers.filter(u => u.score >= 40 && u.score < 60).sort((a, b) => b.score - a.score),
  };

  console.log(`\nTier breakdown:`);
  console.log(`  80-100 (Elite):  ${tiers.elite.length} users`);
  console.log(`  60-79  (Strong): ${tiers.strong.length} users`);
  console.log(`  40-59  (Rising): ${tiers.rising.length} users`);

  // Generate HTML
  const html = generateHTML(tiers);
  const outputPath = path.join(process.cwd(), 'tier-list.html');
  fs.writeFileSync(outputPath, html);
  console.log(`\nTier list saved to: ${outputPath}`);
  console.log('Open it in your browser and screenshot it!');
}

function renderUserCard(user: TierUser): string {
  const pfp = user.profileImageUrl
    ? `<img src="${user.profileImageUrl}" alt="@${user.username}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23888%22 font-size=%2240%22>?</text></svg>'" />`
    : `<div class="no-pfp">?</div>`;

  return `
    <div class="user-card">
      <div class="pfp">${pfp}</div>
      <div class="username">@${user.username}</div>
      <div class="score">${user.score}</div>
      ${user.archetype ? `<div class="archetype">${user.archetype}</div>` : ''}
    </div>
  `;
}

function generateHTML(tiers: { elite: TierUser[]; strong: TierUser[]; rising: TierUser[] }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BrandOS Tier List</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: #0a0a0a;
      color: #fff;
      font-family: 'JetBrains Mono', monospace;
      padding: 40px;
    }

    .header {
      text-align: center;
      margin-bottom: 48px;
    }

    .header .logo {
      height: 60px;
      margin-bottom: 12px;
    }

    .header p {
      color: #666;
      font-size: 14px;
    }

    .tier {
      margin-bottom: 32px;
      border: 1px solid #222;
      border-radius: 12px;
      overflow: hidden;
    }

    .tier-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 24px;
      font-weight: 700;
      font-size: 18px;
      letter-spacing: 1px;
    }

    .tier-header .count {
      font-size: 13px;
      font-weight: 400;
      color: #888;
    }

    .tier-elite .tier-header { background: #0047FF22; color: #0047FF; border-bottom: 1px solid #0047FF44; }
    .tier-strong .tier-header { background: #00ff8822; color: #00ff88; border-bottom: 1px solid #00ff8844; }
    .tier-rising .tier-header { background: #ffaa0022; color: #ffaa00; border-bottom: 1px solid #ffaa0044; }

    .tier-body {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      padding: 20px 24px;
      background: #111;
    }

    .user-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 80px;
      gap: 4px;
    }

    .pfp {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid #333;
    }

    .tier-elite .pfp { border-color: #0047FF; }
    .tier-strong .pfp { border-color: #00ff88; }
    .tier-rising .pfp { border-color: #ffaa00; }

    .pfp img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .no-pfp {
      width: 100%;
      height: 100%;
      background: #333;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #888;
      font-size: 20px;
    }

    .username {
      font-size: 9px;
      color: #888;
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: 100%;
    }

    .score {
      font-size: 11px;
      font-weight: 700;
      color: #fff;
    }

    .archetype {
      font-size: 8px;
      color: #555;
      text-transform: uppercase;
    }

    .footer {
      text-align: center;
      margin-top: 40px;
      color: #333;
      font-size: 12px;
    }

    .footer span { color: #0047FF; }
  </style>
</head>
<body>
  <div class="header">
    <img src="./public/brandos-keycap.png" alt="BrandOS" class="logo" />
    <p>Every creator ranked by their Brand DNA Score // mybrandos.app</p>
  </div>

  <div class="tier tier-elite">
    <div class="tier-header">
      80–100 // ELITE <span class="count">${tiers.elite.length} creators</span>
    </div>
    <div class="tier-body">
      ${tiers.elite.length > 0 ? tiers.elite.map(renderUserCard).join('') : '<div style="color:#555">No creators yet</div>'}
    </div>
  </div>

  <div class="tier tier-strong">
    <div class="tier-header">
      60–79 // STRONG <span class="count">${tiers.strong.length} creators</span>
    </div>
    <div class="tier-body">
      ${tiers.strong.length > 0 ? tiers.strong.map(renderUserCard).join('') : '<div style="color:#555">No creators yet</div>'}
    </div>
  </div>

  <div class="tier tier-rising">
    <div class="tier-header">
      40–59 // RISING <span class="count">${tiers.rising.length} creators</span>
    </div>
    <div class="tier-body">
      ${tiers.rising.length > 0 ? tiers.rising.map(renderUserCard).join('') : '<div style="color:#555">No creators yet</div>'}
    </div>
  </div>

  <div class="footer">
    <span>mybrandos.app</span> — Discover your Brand DNA
  </div>
</body>
</html>`;
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
