/**
 * Whether an X account looks like a company, product or project rather than a
 * person. Used where BrandOS shows people (homepage recent reads, the staging
 * Index demo): the Index is for creators, and a brand there reads as a mistake.
 *
 * The real signal wins: a handle tracked as a brand by its owner or an admin
 * (`trackedKind`). X doesn't give us an account type for most accounts, so the
 * rest is wording, strongest first:
 * - the display name names an organisation ("Uniswap Labs", "… Foundation"),
 *   reading only the part before a separator: "Julian | Surgence Labs" is a
 *   person who names their company;
 * - the bio speaks as a team ("We connect…", "our community");
 * - our read calls it an organisation ("operates as a focused product brand");
 * - weaker: the bio describes a product ("The stablecoin network…",
 *   "infrastructure for apps"), which only counts when the bio has no first
 *   person ("I", "my", "me"), since founders describe their products too.
 * Handles and @mentions are ignored: "@domaprotocol" in a bio, or
 * "satwikofficial" as a handle, says nothing about the account itself.
 * Pure (test:field).
 */

export interface AccountSignals {
  handle: string;
  name: string | null;
  bio: string | null;
  summary: string | null;
  /** 'brand' when tracked as a brand by its owner or an admin. */
  tracked?: 'creator' | 'brand' | null;
}

// Display names of organisations, protocols and media accounts.
const ORG_NAME =
  /\b(labs?|protocol|network|dao|foundation|official|finance|exchange|token|wallet|capital|ventures|app|hq|inc|studios?|news|markets?|fund|chain|technologies|solutions)\b/i;

// A bio written by a team.
const TEAM_BIO =
  /^\s*(we|our)\b|\bwe(?:'re| are| help| connect| build| make)\b|\bour (team|mission|community|users|product|platform)\b/i;

// Our read naming an organisation as the account's kind ("Acme is a payments
// platform…"), but not a person's role ("platform advocate", "project evangelist").
const ORG_SUMMARY =
  /^\s*[@\w.' -]{1,40}?\s+(?:is|are|operates as)\s+(?:a|an|the)\s+(?:[\w-]+\s+){0,4}?(company|startup|protocol|platform|exchange|dao|foundation|organi[sz]ation|product brand|brand account|company account)\b(?!\s+(advocate|evangelist|builder|founder|lead|manager|operator|creator|enthusiast|voice|strategist|expert))/i;

// A bio describing a product.
const PRODUCT_BIO =
  /\b(infrastructure|platform|protocol|api|sdk|toolkit|tooling|software|network|layer|rails)\s+(for|to|that)\b|\bofficial (account|page)\b/i;

// First person singular: a person talking about themselves.
const FIRST_PERSON = /(^|[\s(])(i|i'm|i’m|i've|my|me)\b/i;

/** The bio without links and @mentions. */
function ownWords(bio: string): string {
  return bio.replace(/https?:\/\/\S+/g, ' ').replace(/@\w+/g, ' ');
}

export function isLikelyCompany(a: AccountSignals): boolean {
  if (a.tracked === 'brand') return true;
  const bio = ownWords(a.bio ?? '');
  const ownName = (a.name ?? '').split(/\s[|•·—–-]\s|\s*\|\s*/)[0];
  if (ORG_NAME.test(ownWords(ownName))) return true;
  if (TEAM_BIO.test(bio) || ORG_SUMMARY.test(a.summary ?? '')) return true;
  return PRODUCT_BIO.test(bio) && !FIRST_PERSON.test(bio);
}
