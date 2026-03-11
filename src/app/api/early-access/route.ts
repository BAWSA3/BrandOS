import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface EarlyAccessEntry {
  email: string;
  ref?: string;
  signedUpAt: string;
}

const DATA_PATH = path.join(process.cwd(), 'data', 'early-access.json');

function readEntries(): EarlyAccessEntry[] {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    // Migrate old format (plain string array) to new format
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      return parsed.map((email: string) => ({ email, signedUpAt: new Date().toISOString() }));
    }
    return parsed;
  } catch {
    return [];
  }
}

function writeEntries(entries: EarlyAccessEntry[]) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(entries, null, 2));
}

export async function POST(request: Request) {
  try {
    const { email, ref } = await request.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const entries = readEntries();

    if (entries.some(e => e.email === email.toLowerCase())) {
      return NextResponse.json({ message: 'Already signed up' });
    }

    entries.push({
      email: email.toLowerCase(),
      ref: ref && typeof ref === 'string' ? ref.toUpperCase() : undefined,
      signedUpAt: new Date().toISOString(),
    });
    writeEntries(entries);

    return NextResponse.json({ message: 'Signed up successfully' });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// GET /api/early-access?ref=CODE — check if anyone signed up with this referral code
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ref = searchParams.get('ref');

    if (!ref) {
      return NextResponse.json({ error: 'ref parameter is required' }, { status: 400 });
    }

    const entries = readEntries();
    const referrals = entries.filter(e => e.ref === ref.toUpperCase());

    return NextResponse.json({
      code: ref.toUpperCase(),
      referralCount: referrals.length,
      unlocked: referrals.length >= 1,
    });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
