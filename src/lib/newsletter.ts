import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SIGNUPS_FILE = path.join(DATA_DIR, 'signups.json');

export interface EmailSignup {
  id: string;
  email: string;
  source: string;
  createdAt: string;
}

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readSignups(): Promise<EmailSignup[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(SIGNUPS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeSignups(signups: EmailSignup[]) {
  await ensureDataDir();
  await fs.writeFile(SIGNUPS_FILE, JSON.stringify(signups, null, 2));
}

export async function addEmailSignup(email: string, source: string = 'landing'): Promise<{ success: boolean; error?: string }> {
  const signups = await readSignups();

  // Check if email already exists
  const exists = signups.some(s => s.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return { success: false, error: 'Email already registered' };
  }

  // Add new signup
  const newSignup: EmailSignup = {
    id: `signup_${crypto.randomUUID()}`,
    email: email.toLowerCase().trim(),
    source,
    createdAt: new Date().toISOString(),
  };

  signups.push(newSignup);
  await writeSignups(signups);

  return { success: true };
}

export async function getSignupCount(): Promise<number> {
  const signups = await readSignups();
  return signups.length;
}

export async function getAllSignups(): Promise<EmailSignup[]> {
  return readSignups();
}
