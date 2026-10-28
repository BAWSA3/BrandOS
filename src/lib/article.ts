/**
 * Article mode in the writing room (dashboard v2, slice 5): an outline first
 * (title, hook, 3–5 sections), then one section at a time, then a copy-out
 * for X Articles (X has no publish API, so nothing here posts). Pure and
 * client-safe; tested in scripts/test-dashboard-v2.ts.
 */
import { mentionsHashtags } from '@/lib/no-hashtag-advice';

export type RoomFormat = 'x-post' | 'thread' | 'article';

export interface ArticleSection {
  id: string;
  heading: string;
  /** one line: what the section shows or proves */
  point: string;
  body: string;
}

export interface ArticleDraft {
  title: string;
  hook: string;
  sections: ArticleSection[];
}

export const MIN_SECTIONS = 3;
export const MAX_SECTIONS = 5;
/** /api/dashboard/draft-score takes up to 2,000 characters (draft-signals MAX_DRAFT_CHARS). */
export const SECTION_SCORE_MAX = 2000;

export const EMPTY_ARTICLE: ArticleDraft = { title: '', hook: '', sections: [] };

let seq = 0;
export const sectionId = () => `s${Date.now().toString(36)}${(seq++).toString(36)}`;

/** Strip markdown emphasis/heading marks and quotes a model may wrap things in. */
function clean(s: string, max: number): string {
  return s
    .replace(/^#+\s*/, '')
    .replace(/\*\*|__|`/g, '')
    .replace(/^["“”']+|["“”']+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Section lines only ("1. Heading | point"), e.g. a regenerated section; hashtag lines dropped. */
export function parseSections(text: string, max = MAX_SECTIONS): ArticleSection[] {
  const out: ArticleSection[] = [];
  for (const raw of String(text ?? '').split('\n')) {
    const line = raw.trim();
    if (!line || mentionsHashtags(line) || /^\**\s*(title|hook)\s*\**\s*[:：]/i.test(line))
      continue;
    const s = line.match(/^(?:#+\s*)?(?:\d+[.)]|[-*•])\s+(.+)$/);
    if (!s || out.length >= max) continue;
    const [head, ...rest] = s[1].split(/\s+[|—–]\s+|\s*\|\s*/);
    const heading = clean(head.replace(/[:：]\s*$/, ''), 90);
    if (heading)
      out.push({ id: sectionId(), heading, point: clean(rest.join(' '), 240), body: '' });
  }
  return out;
}

/** "Title:" and "Hook:" lines (a regenerated title/hook); empty strings when missing. */
export function parseTitleHook(text: string): { title: string; hook: string } {
  let title = '';
  let hook = '';
  for (const raw of String(text ?? '').split('\n')) {
    const line = raw.trim();
    if (mentionsHashtags(line)) continue;
    const t = line.match(/^\**\s*title\s*\**\s*[:：]\s*(.+)$/i);
    if (t && !title) title = clean(t[1], 120);
    const h = line.match(/^\**\s*hook\s*\**\s*[:：]\s*(.+)$/i);
    if (h && !hook) hook = clean(h[1], 400);
  }
  return { title, hook };
}

/** The outline as plain lines, for the copywriter's context. */
export function outlineText(a: ArticleDraft): string {
  return [
    `Title: ${a.title}`,
    `Hook: ${a.hook}`,
    ...a.sections.map((s, i) => `${i + 1}. ${s.heading}${s.point ? ` | ${s.point}` : ''}`),
  ].join('\n');
}

/**
 * Parse the copywriter's outline ("Title:", "Hook:", "1. Heading | point").
 * Tolerant of markdown and of "—"/":" instead of "|". Lines that mention
 * hashtags are dropped. Null when there is no usable outline (no title or
 * fewer than one section); more than 5 sections are cut to 5.
 */
export function parseOutline(text: string): ArticleDraft | null {
  const { title, hook } = parseTitleHook(text);
  const sections = parseSections(text);
  if (!title || sections.length === 0) return null;
  return { title, hook, sections };
}

/** Move a section up (-1) or down (+1); out-of-range moves return the list unchanged. */
export function moveSection(list: ArticleSection[], id: string, dir: -1 | 1): ArticleSection[] {
  const i = list.findIndex((s) => s.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const paras = (body: string) =>
  body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

/**
 * The article for X Articles' editor: rich text (title as h1, sections as h2,
 * paragraphs) plus a plain-text fallback. Escaped; empty sections are left
 * out of the body but keep their heading so the shape survives.
 */
export function articleClipboard(a: ArticleDraft): { html: string; text: string } {
  const html = [
    a.title ? `<h1>${esc(a.title)}</h1>` : '',
    ...paras(a.hook).map((p) => `<p>${esc(p)}</p>`),
    ...a.sections.flatMap((s) => [
      `<h2>${esc(s.heading)}</h2>`,
      ...paras(s.body).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`),
    ]),
  ]
    .filter(Boolean)
    .join('\n');
  const text = [
    a.title,
    a.hook,
    ...a.sections.map((s) => [s.heading, s.body.trim()].filter(Boolean).join('\n\n')),
  ]
    .filter((x) => x && x.trim())
    .join('\n\n');
  return { html, text };
}

/** Words across the hook and sections. */
export function articleWords(a: ArticleDraft): number {
  const all = [a.hook, ...a.sections.map((s) => s.body)].join(' ').trim();
  return all ? all.split(/\s+/).length : 0;
}

/** The outline as one idea for the board (/api/ideas text, capped). */
export function outlineAsIdea(a: ArticleDraft, max = 1000): string {
  const lines = [
    `Article: ${a.title}`,
    ...a.sections.map((s, i) => `${i + 1}. ${s.heading}${s.point ? ` | ${s.point}` : ''}`),
  ];
  return lines.join('\n').slice(0, max);
}

/** Validate a draft read back from this device's storage (anything malformed → null). */
export function readArticle(raw: string | null): ArticleDraft | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<ArticleDraft>;
    if (typeof v !== 'object' || v === null || !Array.isArray(v.sections)) return null;
    return {
      title: typeof v.title === 'string' ? v.title.slice(0, 120) : '',
      hook: typeof v.hook === 'string' ? v.hook.slice(0, 400) : '',
      sections: v.sections
        .filter(
          (s): s is ArticleSection => !!s && typeof s === 'object' && typeof s.heading === 'string'
        )
        .slice(0, MAX_SECTIONS)
        .map((s) => ({
          id: typeof s.id === 'string' ? s.id : sectionId(),
          heading: s.heading.slice(0, 90),
          point: typeof s.point === 'string' ? s.point.slice(0, 240) : '',
          body: typeof s.body === 'string' ? s.body.slice(0, 6000) : '',
        })),
    };
  } catch {
    return null;
  }
}

/** ?mode= → the room's format (Post by default); anything unknown is a Post. */
export function roomFormat(mode: unknown): RoomFormat {
  return mode === 'article' || mode === 'thread' ? mode : 'x-post';
}
