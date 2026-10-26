/**
 * Demo entries for the STAGING Creator Index: ~40 real accounts from prod's
 * brand reads, so the Index can be seen with real profiles before Nov 2.
 * Staging only. Every demo account is a User whose supabaseId starts with
 * "staging-index-demo:"; removing those Users removes their IndexEntry rows
 * (ON DELETE CASCADE), so nothing else is touched.
 *
 *   # 1. pick: read prod (read-only transaction) → JSON outside the repo
 *   npx tsx scripts/staging-index-demo.ts pick --out /tmp/demo.json   (with prod env loaded)
 *   # 2. apply / remove on staging
 *   node --env-file=<staging env> node_modules/.bin/tsx scripts/staging-index-demo.ts apply --in /tmp/demo.json
 *   node --env-file=<staging env> node_modules/.bin/tsx scripts/staging-index-demo.ts remove
 *
 * apply/remove refuse unless the database is the staging project; pick refuses
 * unless it is the prod project, and never writes. Real handles are not
 * committed: the picked list lives in the --out file.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import pg from 'pg';
import { normalizeArchetypeName } from '../src/lib/archetype-names';
import { CLASSES } from '../src/lib/classifications';
import { NICHES, BLURB_MAX, MAX_NICHES } from '../src/lib/index-rules';

const STAGING_REF = 'mfptimxnmerkqwnkypfm';
const PROD_REF = 'gdxvijmezkwlqdnxfxpe';
const MARK = 'staging-index-demo:';
const PER_CLASS = 5; // then topped up from the fuller classes
const TARGET = 40;
const MIN_FOLLOWERS = 1000; // sparse classes dip below 5K; fuller ones never need to
const FEATURED = 3; // shown as Pro members, so the featured row has real cards

interface Pick {
  handle: string; // lowercase
  display: string;
  name: string | null;
  avatar: string | null;
  score: number;
  archetype: string;
  niches: string[];
  blurb: string;
  followers: number;
  scannedAt: string;
}

function connect(): { client: pg.Client; ref: string } {
  const raw =
    process.env.POSTGRES_URL_NON_POOLING || process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!raw) throw new Error('No database URL in env');
  const u = new URL(raw);
  u.searchParams.delete('sslmode');
  u.searchParams.delete('pgbouncer');
  u.searchParams.delete('connection_limit');
  // Supabase pooler user is "postgres.<ref>"; the direct host is "db.<ref>.supabase.co".
  const ref = u.username.split('.')[1] || u.hostname.split('.')[1] || '';
  return {
    client: new pg.Client({ connectionString: u.toString(), ssl: { rejectUnauthorized: false } }),
    ref,
  };
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
}

// Brands, protocols and media accounts aren't creators; the Index is for people.
const NOT_A_PERSON =
  /(\b(the|we|our)\b.*\b(network|platform|protocol|layer|stablecoin)|labs?\b|protocol|network|\bdao\b|foundation|official|finance|exchange|token|wallet|capital|ventures|\bapp\b|\bhq\b|\binc\b|studios?|\bnews\b|markets?\b|\bfund\b|\bchain\b)/i;

// Company bios speak as "we" / "the <product>": "We connect…", "The stablecoin network…".
const ORG_BIO = /^\s*(we|the|our)\b|\b(we (help|connect|build|are))\b|web apps|\bplatform for\b/i;

const NICHE_WORDS: Record<string, RegExp> = {
  DeFi: /\b(defi|yield|lending|liquidity|dex|stablecoin|amm|restaking)\b/i,
  Trading: /\b(trad(er|ing)|charts?|perps?|futures|ta\b|swing|scalp|alpha calls?)\b/i,
  Memecoins: /\b(memecoins?|meme coins?|degens?|pump\.?fun|shitcoins?)\b/i,
  'NFTs & art': /\b(nfts?|artists?|art\b|collect(or|ing)|pfp|generative)\b/i,
  'Infra & dev':
    /\b(dev(eloper)?s?|engineer(ing)?|solidity|rust|sdk|infra(structure)?|rollups?|zk|smart contracts?|open source)\b/i,
  AI: /\b(ai|agents?|llms?|machine learning|ml)\b/i,
  Gaming: /\b(gam(e|es|ing|er)|esports?|play-?to-?earn)\b/i,
  Founder: /\b(founder|co-?founder|ceo|building @|startup)\b/i,
  Research: /\b(research(er)?|analys(is|t)|thesis|deep dives?|data)\b/i,
  Education: /\b(educat\w*|teach\w*|learn\w*|explain\w*|guides?|threads?|tutorials?)\b/i,
  Community: /\b(community|ambassador|moderator|spaces? host|host of|kol)\b/i,
  'Culture & memes': /\b(memes?|culture|humou?r|shitpost\w*|vibes)\b/i,
};

const CLASS_NICHE: Record<string, string> = {
  SOURCE: 'Research',
  FORESIGHT: 'Trading',
  'BUILD.EXE': 'Infra & dev',
  ARC: 'Founder',
  RELAY: 'Community',
  FREQ: 'Culture & memes',
  ENTROPY: 'Memecoins',
  NULL: 'Research',
};

function nichesFor(text: string, cls: string): string[] {
  const hits = NICHES.map((n) => ({
    n,
    c: (text.match(new RegExp(NICHE_WORDS[n], 'gi')) ?? []).length,
  }))
    .filter((x) => x.c > 0)
    .sort((a, b) => b.c - a.c)
    .map((x) => x.n as string);
  const out = hits.slice(0, MAX_NICHES);
  return out.length ? out : [CLASS_NICHE[cls] ?? 'Community'];
}

/** The member's one line: their X bio (what they'd write themselves), else the read's first sentence. */
function blurbFor(bio: string | null, summary: string | null): string {
  const clean = (s: string) =>
    s
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  const fit = (s: string) => {
    if (s.length <= BLURB_MAX) return s;
    const cut = s.slice(0, BLURB_MAX - 1);
    return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:\-–—]$/, '') + '…';
  };
  const b = bio ? clean(bio) : '';
  if (b.length >= 12) return fit(b);
  const first = summary ? clean(summary).split(/(?<=[.!?])\s/)[0] : '';
  return fit(first);
}

async function pick(out: string) {
  const { client, ref } = connect();
  if (ref !== PROD_REF) throw new Error(`pick reads prod; this env points at "${ref}"`);
  await client.connect();
  try {
    await client.query('BEGIN READ ONLY');
    const { rows } = await client.query(
      `
      with latest as (
        select distinct on (lower(username)) lower(username) h, username, score, archetype,
               phase_scores, summary, content_pillars, created_at
        from "BrandScans" where score between 40 and 99
        order by lower(username), created_at desc)
      select l.*, x."profileData" pd, x."followersCount" f
      from latest l join "XProfileCache" x on lower(x.username) = l.h
      where x."followersCount" between $1 and 3000000
      order by l.score desc, x."followersCount" desc`,
      [MIN_FOLLOWERS]
    );
    await client.query('COMMIT');

    const byClass = new Map<string, Pick[]>();
    for (const r of rows) {
      let pd: Record<string, unknown> = {};
      try {
        pd = JSON.parse(r.pd);
      } catch {
        continue;
      }
      if (pd.protected) continue;
      const cls = normalizeArchetypeName(String(r.archetype ?? '')).toUpperCase();
      if (!CLASSES.some((c) => c.code === cls)) continue;
      if (!r.phase_scores) continue;
      const name = typeof pd.name === 'string' ? pd.name.trim() : null;
      const bio = typeof pd.description === 'string' ? pd.description : null;
      if (NOT_A_PERSON.test(`${r.h} ${name ?? ''}`) || ORG_BIO.test(bio ?? '')) continue;
      if (!/^[a-z0-9_]{1,15}$/.test(r.h)) continue;
      const avatar =
        typeof pd.profile_image_url === 'string' &&
        pd.profile_image_url.startsWith('https://pbs.twimg.com/')
          ? pd.profile_image_url.replace('_normal', '_400x400')
          : null;
      const list = byClass.get(cls) ?? [];
      list.push({
        handle: r.h,
        display: String(pd.username ?? r.username).slice(0, 15),
        name: name ? name.slice(0, 50) : null,
        avatar,
        score: r.score,
        archetype: cls,
        niches: nichesFor(`${bio ?? ''} ${r.content_pillars ?? ''} ${r.summary ?? ''}`, cls),
        blurb: blurbFor(bio, r.summary),
        followers: r.f,
        scannedAt: new Date(r.created_at).toISOString(),
      });
      byClass.set(cls, list);
    }
    // Within a class: 5K+ accounts first, then score. Up to PER_CLASS each, then
    // round-robin the leftovers until TARGET so every class stays represented.
    const ranked = CLASSES.map((c) =>
      (byClass.get(c.code) ?? []).sort(
        (a, b) => Number(b.followers >= 5000) - Number(a.followers >= 5000) || b.score - a.score
      )
    );
    const picks = ranked.flatMap((l) => l.splice(0, PER_CLASS));
    while (picks.length < TARGET && ranked.some((l) => l.length))
      for (const l of ranked) if (l.length && picks.length < TARGET) picks.push(l.shift()!);
    byClass.clear();
    for (const p of picks) byClass.set(p.archetype, [...(byClass.get(p.archetype) ?? []), p]);
    writeFileSync(out, JSON.stringify(picks, null, 1));
    for (const c of CLASSES)
      console.log(`${c.code.padEnd(10)} ${byClass.get(c.code)?.length ?? 0}`);
    console.log(`${picks.length} picked → ${out}`);
  } finally {
    await client.end();
  }
}

async function onStaging<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const { client, ref } = connect();
  if (ref !== STAGING_REF) throw new Error(`refusing: this env points at "${ref}", not staging`);
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function apply(input: string) {
  const picks: Pick[] = JSON.parse(readFileSync(input, 'utf8'));
  const top = new Set(
    [...picks]
      .sort((a, b) => b.score - a.score)
      .slice(0, FEATURED)
      .map((p) => p.handle)
  );
  await onStaging(async (c) => {
    await c.query('BEGIN');
    let added = 0;
    for (const p of picks) {
      const taken = await c.query(`select 1 from "IndexEntry" where handle = $1`, [p.handle]);
      if (taken.rowCount) continue; // a real member already holds this handle
      const userId = `demo_${p.handle}`;
      await c.query(
        `insert into "User" (id, "supabaseId", "xUsername", name, avatar, "updatedAt", "subscriptionTier", "subscriptionStatus")
         values ($1, $2, $3, $4, $5, now(), $6, 'ACTIVE')
         on conflict ("supabaseId") do nothing`,
        [userId, MARK + p.handle, p.display, p.name, p.avatar, top.has(p.handle) ? 'PRO' : 'FREE']
      );
      // Same numbering as a real join: their reservation if they hold one, else
      // the next sequence value that nobody holds or uses.
      const res = await c.query(
        `select number from "IndexReservation" where handle = $1 and "claimedByUserId" is null`,
        [p.handle]
      );
      let number: number | null = res.rows[0]?.number ?? null;
      for (let i = 0; number == null && i < 50; i++) {
        const n = Number((await c.query(`select nextval('"IndexEntry_number_seq"') n`)).rows[0].n);
        const held = await c.query(
          `select 1 from "IndexReservation" where number = $1 union all select 1 from "IndexEntry" where number = $1`,
          [n]
        );
        if (!held.rowCount) number = n;
      }
      if (number == null) throw new Error('no free Index number');
      await c.query(
        `insert into "IndexEntry" ("userId", number, handle, "displayHandle", niches, blurb, score, archetype, "joinedAt")
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [userId, number, p.handle, p.display, p.niches, p.blurb, p.score, p.archetype, p.scannedAt]
      );
      added++;
    }
    await c.query('COMMIT');
    console.log(
      `added ${added} demo entries (${picks.length - added} skipped: handle already in the Index)`
    );
  });
}

async function remove() {
  await onStaging(async (c) => {
    const r = await c.query(`delete from "User" where "supabaseId" like $1`, [MARK + '%']);
    console.log(`removed ${r.rowCount} demo accounts and their Index entries`);
  });
}

const cmd = process.argv[2];
const run =
  cmd === 'pick'
    ? pick(arg('--out') ?? 'staging-index-demo.json')
    : cmd === 'apply'
      ? apply(arg('--in') ?? 'staging-index-demo.json')
      : cmd === 'remove'
        ? remove()
        : Promise.reject(
            new Error('usage: staging-index-demo.ts pick --out <file> | apply --in <file> | remove')
          );
run.catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
