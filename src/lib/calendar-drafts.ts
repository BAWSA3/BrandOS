// Shared shapes + validation for the /api/calendar/* routes (consolidation
// step 6). One serializer so the list, create, and update responses can't
// drift apart.

export const DRAFT_STATUSES = ['idea', 'draft', 'scheduled', 'published'] as const;
export const DRAFT_CONTENT_TYPES = [
  'tweet',
  'thread',
  'poll',
  'hot-take',
  'educational',
  'counter-argument',
  'story',
] as const;
export const DRAFT_SOURCE_TYPES = ['idea-feed', 'manual', 'repurpose'] as const;

export const MAX_DRAFT_CHARS = 10_000;

export function isDraftStatus(v: unknown): v is (typeof DRAFT_STATUSES)[number] {
  return typeof v === 'string' && (DRAFT_STATUSES as readonly string[]).includes(v);
}

export function isDraftContentType(v: unknown): v is (typeof DRAFT_CONTENT_TYPES)[number] {
  return typeof v === 'string' && (DRAFT_CONTENT_TYPES as readonly string[]).includes(v);
}

export function isDraftSourceType(v: unknown): v is (typeof DRAFT_SOURCE_TYPES)[number] {
  return typeof v === 'string' && (DRAFT_SOURCE_TYPES as readonly string[]).includes(v);
}

/** Parse an incoming date value; null clears, undefined/invalid rejects. */
export function parseScheduledFor(v: unknown): Date | null | undefined {
  if (v === null) return null;
  if (typeof v !== 'string') return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

/** Clamp an authenticity value to an int in [0, 100], or null. */
export function parseAuthenticity(v: unknown): number | null {
  if (typeof v !== 'number' || isNaN(v)) return null;
  return Math.min(100, Math.max(0, Math.round(v)));
}

interface DraftRow {
  id: string;
  content: string;
  contentType: string;
  tone: string;
  status: string;
  scheduledFor: Date | null;
  sourceType: string | null;
  sourceId: string | null;
  authenticity: number | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  parent?: { id: string; content: string; contentType: string } | null;
  children?: { id: string }[];
}

export function serializeDraft(d: DraftRow) {
  return {
    id: d.id,
    content: d.content,
    contentType: d.contentType,
    tone: d.tone,
    status: d.status,
    scheduledFor: d.scheduledFor?.toISOString() || null,
    sourceType: d.sourceType,
    sourceId: d.sourceId,
    authenticity: d.authenticity,
    parentId: d.parentId,
    parent: d.parent ?? null,
    childrenCount: d.children?.length ?? 0,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}
