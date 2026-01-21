#!/usr/bin/env npx ts-node
/**
 * BrandOS Manual Email CLI
 *
 * Usage: npm run send-email
 *
 * Allows you to:
 * - Send from a template OR write custom copy
 * - Choose recipients (all, by source, or specific emails)
 * - Preview before sending
 * - Send immediately or save as draft
 */

import * as readline from 'readline';
import { promises as fs, readFileSync } from 'fs';
import path from 'path';
import { Resend } from 'resend';

// Load .env.local
try {
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envLocal = readFileSync(envLocalPath, 'utf-8');
  envLocal.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
} catch {
  // .env.local not found, continue with existing env
}

// Types
interface Signup {
  id: string;
  email: string;
  source: string;
  createdAt: string;
  name?: string;
  username?: string;
  score?: number;
  archetype?: string;
  archetypeEmoji?: string;
}

interface EmailDraft {
  subject: string;
  body: string;
  recipients: string[];
  createdAt: string;
  sentAt?: string;
}

// Paths
const DATA_DIR = path.join(process.cwd(), 'data');
const SIGNUPS_FILE = path.join(DATA_DIR, 'signups.json');
const DRAFTS_DIR = path.join(DATA_DIR, 'email-drafts');

// Templates (inline for simplicity)
const TEMPLATES = {
  'launch-announcement': {
    name: 'Launch Announcement',
    subject: 'BrandOS is live. Discover your Brand DNA.',
    body: `Hey {{name}}!

Big news: BrandOS is officially live.

You were one of the first to discover your Brand DNA. Now the world can too.

Here's what's new:
→ Shareable score cards (flex your archetype)
→ 5 AI agents trained on YOUR Brand DNA
→ Archetype evolution tracking

As an Inner Circle member, you have Founding Member status forever. That means free access to features we'll charge for later.

Share your score card and let's make some noise: mybrandos.app

Thanks for being early.

- Bawsa

"brick by brick"`,
  },
  'feature-update': {
    name: 'Feature Update',
    subject: 'New in BrandOS: {{feature}}',
    body: `Hey {{name}}!

Quick update on what's new in BrandOS:

{{content}}

Check it out: mybrandos.app

- Bawsa

"brick by brick"`,
  },
  'custom': {
    name: 'Custom Email (write your own)',
    subject: '',
    body: '',
  },
};

// Readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function promptMultiline(instruction: string): Promise<string> {
  console.log(instruction);
  console.log('(Enter an empty line to finish)\n');

  return new Promise((resolve) => {
    const lines: string[] = [];

    const lineHandler = (line: string) => {
      if (line === '') {
        rl.removeListener('line', lineHandler);
        resolve(lines.join('\n'));
      } else {
        lines.push(line);
      }
    };

    rl.on('line', lineHandler);
  });
}

async function loadSignups(): Promise<Signup[]> {
  try {
    const data = await fs.readFile(SIGNUPS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    console.log('No signups found in local file. Checking Supabase...');
    return [];
  }
}

async function ensureDraftsDir() {
  try {
    await fs.access(DRAFTS_DIR);
  } catch {
    await fs.mkdir(DRAFTS_DIR, { recursive: true });
  }
}

async function saveDraft(draft: EmailDraft): Promise<string> {
  await ensureDraftsDir();
  const filename = `draft-${Date.now()}.json`;
  const filepath = path.join(DRAFTS_DIR, filename);
  await fs.writeFile(filepath, JSON.stringify(draft, null, 2));
  return filepath;
}

function personalizeContent(content: string, signup: Signup): string {
  return content
    .replace(/\{\{name\}\}/g, signup.name || signup.email.split('@')[0])
    .replace(/\{\{email\}\}/g, signup.email)
    .replace(/\{\{username\}\}/g, signup.username || 'there')
    .replace(/\{\{score\}\}/g, String(signup.score || 0))
    .replace(/\{\{archetype\}\}/g, signup.archetype || 'Creator')
    .replace(/\{\{archetypeEmoji\}\}/g, signup.archetypeEmoji || '✨');
}

async function sendEmail(
  to: string,
  subject: string,
  body: string,
  resend: Resend | null
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log(`  [DRY RUN] Would send to: ${to}`);
    return { success: true };
  }

  try {
    const html = body
      .split('\n')
      .map(line => {
        if (line.startsWith('→ ') || line.startsWith('• ')) {
          return `<p style="margin-left: 20px;">${line}</p>`;
        }
        if (line.trim() === '') {
          return '<br>';
        }
        return `<p>${line}</p>`;
      })
      .join('\n');

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'BrandOS <onboarding@resend.dev>',
      to,
      subject,
      html,
      text: body,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function main() {
  console.log('\n========================================');
  console.log('  BrandOS Email CLI');
  console.log('========================================\n');

  // Check for Resend API key
  const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

  if (!resend) {
    console.log('⚠️  No RESEND_API_KEY found. Running in DRY RUN mode.\n');
  }

  // Load signups
  const signups = await loadSignups();
  console.log(`Found ${signups.length} signups.\n`);

  // Step 1: Choose template or custom
  console.log('Available templates:');
  const templateKeys = Object.keys(TEMPLATES);
  templateKeys.forEach((key, i) => {
    console.log(`  ${i + 1}. ${TEMPLATES[key as keyof typeof TEMPLATES].name}`);
  });

  const templateChoice = await prompt('\nChoose template (number): ');
  const templateIndex = parseInt(templateChoice) - 1;
  const templateKey = templateKeys[templateIndex] as keyof typeof TEMPLATES;

  if (!templateKey) {
    console.log('Invalid choice. Exiting.');
    rl.close();
    return;
  }

  let subject: string;
  let body: string;

  if (templateKey === 'custom') {
    // Custom email
    subject = await prompt('Subject line: ');
    body = await promptMultiline('Email body (use {{name}}, {{email}}, etc. for personalization):');
  } else {
    // Use template
    const template = TEMPLATES[templateKey];
    subject = template.subject;
    body = template.body;

    // Allow editing
    const editChoice = await prompt('\nEdit template before sending? (y/n): ');
    if (editChoice.toLowerCase() === 'y') {
      const newSubject = await prompt(`Subject [${subject}]: `);
      if (newSubject) subject = newSubject;

      console.log('\nCurrent body:');
      console.log('---');
      console.log(body);
      console.log('---');

      const editBody = await prompt('\nRewrite body? (y/n): ');
      if (editBody.toLowerCase() === 'y') {
        body = await promptMultiline('New body:');
      }
    }
  }

  // Step 2: Choose recipients
  console.log('\nRecipient options:');
  console.log('  1. All signups');
  console.log('  2. By source (x-brand-score, landing, etc.)');
  console.log('  3. Specific emails (comma-separated)');
  console.log('  4. Test (your email only)');

  const recipientChoice = await prompt('\nChoose recipients (number): ');

  let recipients: Signup[] = [];

  switch (recipientChoice) {
    case '1':
      recipients = signups;
      break;
    case '2':
      const sources = [...new Set(signups.map(s => s.source))];
      console.log('\nAvailable sources:', sources.join(', '));
      const source = await prompt('Enter source: ');
      recipients = signups.filter(s => s.source === source);
      break;
    case '3':
      const emailList = await prompt('Enter emails (comma-separated): ');
      const emails = emailList.split(',').map(e => e.trim().toLowerCase());
      recipients = signups.filter(s => emails.includes(s.email.toLowerCase()));
      // Add any emails not in signups
      emails.forEach(email => {
        if (!recipients.find(r => r.email.toLowerCase() === email)) {
          recipients.push({ id: 'manual', email, source: 'manual', createdAt: new Date().toISOString() });
        }
      });
      break;
    case '4':
      const testEmail = await prompt('Your test email: ');
      recipients = [{ id: 'test', email: testEmail, source: 'test', createdAt: new Date().toISOString() }];
      break;
    default:
      console.log('Invalid choice. Exiting.');
      rl.close();
      return;
  }

  console.log(`\nSelected ${recipients.length} recipient(s).`);

  // Step 3: Preview
  console.log('\n--- EMAIL PREVIEW ---');
  console.log(`Subject: ${subject}`);
  console.log('---');
  console.log(personalizeContent(body, recipients[0] || { id: '', email: 'test@example.com', source: '', createdAt: '' }));
  console.log('---');
  console.log(`Recipients: ${recipients.slice(0, 5).map(r => r.email).join(', ')}${recipients.length > 5 ? ` ... and ${recipients.length - 5} more` : ''}`);

  // Step 4: Confirm
  const action = await prompt('\nAction: (s)end, (d)raft, (c)ancel: ');

  if (action.toLowerCase() === 'c') {
    console.log('Cancelled.');
    rl.close();
    return;
  }

  if (action.toLowerCase() === 'd') {
    const draft: EmailDraft = {
      subject,
      body,
      recipients: recipients.map(r => r.email),
      createdAt: new Date().toISOString(),
    };
    const filepath = await saveDraft(draft);
    console.log(`Draft saved to: ${filepath}`);
    rl.close();
    return;
  }

  if (action.toLowerCase() === 's') {
    console.log('\nSending emails...\n');

    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const personalizedSubject = personalizeContent(subject, recipient);
      const personalizedBody = personalizeContent(body, recipient);

      const result = await sendEmail(recipient.email, personalizedSubject, personalizedBody, resend);

      if (result.success) {
        console.log(`  ✓ ${recipient.email}`);
        sent++;
      } else {
        console.log(`  ✗ ${recipient.email}: ${result.error}`);
        failed++;
      }

      // Rate limiting: 2 emails per second
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\nDone! Sent: ${sent}, Failed: ${failed}`);
  }

  rl.close();
}

main().catch(console.error);
