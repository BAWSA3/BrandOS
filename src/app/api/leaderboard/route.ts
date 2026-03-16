import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { checkRateLimit, getClientIdentifier, rateLimiters } from '@/lib/rate-limit';

// Simple file-based storage for leaderboard (bootstrap phase)
// In production, use a proper database like Supabase, PlanetScale, or Redis

// Strip HTML/script tags to prevent XSS
function sanitize(str: string): string {
  return str.replace(/[<>"'&]/g, '').slice(0, 100);
}

interface LeaderboardEntry {
  username: string;
  displayName: string;
  score: number;
  profileImage: string;
  timestamp: number;
  isCrypto?: boolean;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Directory exists
  }
}

// Read leaderboard data
async function readLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(LEADERBOARD_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Write leaderboard data
async function writeLeaderboard(entries: LeaderboardEntry[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(entries, null, 2));
}

// GET - Fetch leaderboard
export async function GET(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  const { limited } = checkRateLimit(`leaderboard-read:${clientId}`, rateLimiters.relaxed);
  if (limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'week';
    const cryptoOnly = searchParams.get('crypto') === 'true';

    let entries = await readLeaderboard();

    // Filter by time range
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const monthMs = 30 * 24 * 60 * 60 * 1000;

    if (range === 'week') {
      entries = entries.filter((e) => now - e.timestamp < weekMs);
    } else if (range === 'month') {
      entries = entries.filter((e) => now - e.timestamp < monthMs);
    }

    // Filter crypto only
    if (cryptoOnly) {
      entries = entries.filter((e) => e.isCrypto);
    }

    // Sort by score descending, then by timestamp (most recent first for ties)
    entries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.timestamp - a.timestamp;
    });

    // Return top 50
    return NextResponse.json({
      entries: entries.slice(0, 50),
      total: entries.length,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}

// POST - Add/update score on leaderboard
export async function POST(request: NextRequest) {
  // Rate limit: 10 requests per minute per IP
  const clientId = getClientIdentifier(request);
  const { limited } = checkRateLimit(`leaderboard:${clientId}`, rateLimiters.ai);
  if (limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { username, displayName, score, profileImage, isCrypto } = body;

    if (!username || typeof score !== 'number') {
      return NextResponse.json({ error: 'Username and score are required' }, { status: 400 });
    }

    // Validate score range
    const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

    const entries = await readLeaderboard();
    const now = Date.now();

    // Find existing entry for this user
    const existingIndex = entries.findIndex(
      (e) => e.username.toLowerCase() === username.toLowerCase()
    );

    const newEntry: LeaderboardEntry = {
      username: sanitize(username),
      displayName: sanitize(displayName || username),
      score: clampedScore,
      profileImage: profileImage || '',
      timestamp: now,
      isCrypto: isCrypto || false,
    };

    if (existingIndex >= 0) {
      // Update if new score is higher OR if it's been more than 24 hours
      const existing = entries[existingIndex];
      const hoursSinceLastScore = (now - existing.timestamp) / (1000 * 60 * 60);

      if (score > existing.score || hoursSinceLastScore > 24) {
        entries[existingIndex] = newEntry;
      }
    } else {
      // Add new entry
      entries.push(newEntry);
    }

    // Keep only entries from last 90 days to prevent unbounded growth
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    const filteredEntries = entries.filter((e) => now - e.timestamp < ninetyDaysMs);

    await writeLeaderboard(filteredEntries);

    // Calculate rank
    const sortedEntries = [...filteredEntries].sort((a, b) => b.score - a.score);
    const rank =
      sortedEntries.findIndex((e) => e.username.toLowerCase() === username.toLowerCase()) + 1;

    return NextResponse.json({
      success: true,
      rank,
      totalEntries: filteredEntries.length,
    });
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    return NextResponse.json({ error: 'Failed to update leaderboard' }, { status: 500 });
  }
}
