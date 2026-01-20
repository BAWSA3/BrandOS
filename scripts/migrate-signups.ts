/**
 * Migration script to import email signups from JSON file to database
 * 
 * Run with: npx tsx scripts/migrate-signups.ts
 */

import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface JsonSignup {
  id: string;
  email: string;
  source: string;
  createdAt: string;
}

async function migrateSignups() {
  console.log('🚀 Starting email signup migration...\n');

  // Read JSON file
  const jsonPath = path.join(process.cwd(), 'data', 'signups.json');
  
  let jsonSignups: JsonSignup[] = [];
  try {
    const data = await fs.readFile(jsonPath, 'utf-8');
    jsonSignups = JSON.parse(data);
    console.log(`📄 Found ${jsonSignups.length} signups in JSON file`);
  } catch (error) {
    console.log('⚠️  No existing signups.json file found or file is empty');
    return;
  }

  if (jsonSignups.length === 0) {
    console.log('ℹ️  No signups to migrate');
    return;
  }

  // Check existing database records
  const existingEmails = await prisma.emailSignup.findMany({
    select: { email: true },
  });
  const existingEmailSet = new Set(existingEmails.map(e => e.email.toLowerCase()));
  console.log(`📊 Found ${existingEmailSet.size} existing signups in database\n`);

  // Filter out already migrated signups
  const newSignups = jsonSignups.filter(
    signup => !existingEmailSet.has(signup.email.toLowerCase())
  );

  if (newSignups.length === 0) {
    console.log('✅ All signups already migrated!');
    return;
  }

  console.log(`📝 Migrating ${newSignups.length} new signups...\n`);

  // Migrate each signup
  let successCount = 0;
  let errorCount = 0;

  for (const signup of newSignups) {
    try {
      await prisma.emailSignup.create({
        data: {
          email: signup.email.toLowerCase().trim(),
          source: signup.source,
          createdAt: new Date(signup.createdAt),
        },
      });
      console.log(`  ✓ ${signup.email} (${signup.source})`);
      successCount++;
    } catch (error) {
      console.log(`  ✗ ${signup.email} - Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      errorCount++;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Migration complete!`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed: ${errorCount}`);
  console.log(`   Skipped (already exists): ${jsonSignups.length - newSignups.length}`);
  
  // Final count
  const totalCount = await prisma.emailSignup.count();
  console.log(`\n📊 Total signups in database: ${totalCount}`);
}

migrateSignups()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
