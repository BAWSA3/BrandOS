// Shared shapes + validation for the /api/calendar/* routes (consolidation
// step 6). One serializer so the list, create, and update responses can't
// drift apart. The vocabulary itself lives in content.schema.ts — the server
// actions and these routes must accept the same values.

import { CONTENT_TYPES, DRAFT_STATUSES, DRAFT_SOURCE_TYPES } from '@/lib/schemas/content.schema';
import { clampScore } from '@/lib/score-schemas';

export const MAX_DRAFT_CHARS = 10_000;

export function isDraftStatus(v: unknown): v is (typeof DRAFT_STATUSES)[number] {
  return typeof v === 'string' && (DRAFT_STATUSES as readonly string[]).includes(v);
}

export function isDraftContentType(v: unknown): v is (typeof CONTENT_TYPES)[number] {
  return typeof v === 'string' && (CONTENT_TYPES as readonly string[]).includes(v);
}

export function isDraftSourceType(v: unknown): v is (typeof DRAFT_SOURCE_TYPES)[number] {
  return typeof v === 'string' && (DRAFT_SOURCE_TYPES as readonly string[]).includes(v);
}

/** Parse an incoming date value; null clears, undefined means invalid. */
export function parseScheduledFor(v: unknown): Date | null | undefined {
  if (v === null) return null;
  if (typeof v !== 'string') return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

/** Clamp authenticity to an int in [0, 100]; null clears, undefined means invalid. */
export function parseAuthenticity(v: unknown): number | null | undefined {
  if (v === null) return null;
  if (typeof v !== 'number' || isNaN(v)) return undefined;
  return clampScore(v);
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
