/**
 * Audience numbers for the growth dashboard (migration 041). Pure — covered by
 * `npm run test:growth`.
 */

export interface InteractionRow {
  tweetId: string;
  handle: string;
  displayHandle: string;
  name: string | null;
  followers: number;
  kind: string; // reply | repost | quote
}

export interface AudiencePersonSummary {
  handle: string;
  name: string | null;
  followers: number;
  replies: number;
  reposts: number; // reposts + quotes
  posts: number; // distinct posts they engaged with
}

export interface AudienceSummary {
  people: number;
  returning: number; // engaged with 2+ different posts
  returningShare: number | null; // 0–1
  topEngagers: AudiencePersonSummary[]; // most interactions
  topAmplifiers: AudiencePersonSummary[]; // most reposts + quotes
  notable: AudiencePersonSummary[]; // biggest accounts (10K+ followers)
  posts: number; // posts the audience was read from
}

export const NOTABLE_FOLLOWERS = 10_000;

export function audienceSummary(rows: InteractionRow[]): AudienceSummary {
  const byPerson = new Map<string, AudiencePersonSummary & { tweets: Set<string> }>();
  for (const r of rows) {
    const p = byPerson.get(r.handle) ?? {
      handle: r.displayHandle,
      name: r.name,
      followers: r.followers,
      replies: 0,
      reposts: 0,
      posts: 0,
      tweets: new Set<string>(),
    };
    if (r.kind === 'reply') p.replies++;
    else p.reposts++;
    p.followers = Math.max(p.followers, r.followers);
    p.tweets.add(r.tweetId);
    p.posts = p.tweets.size;
    byPerson.set(r.handle, p);
  }
  const people: AudiencePersonSummary[] = [...byPerson.values()].map((p) => ({
    handle: p.handle,
    name: p.name,
    followers: p.followers,
    replies: p.replies,
    reposts: p.reposts,
    posts: p.posts,
  }));
  const returning = people.filter((p) => p.posts >= 2).length;
  const total = (p: AudiencePersonSummary) => p.replies + p.reposts;
  return {
    people: people.length,
    returning,
    returningShare: people.length ? returning / people.length : null,
    topEngagers: [...people]
      .sort((a, b) => total(b) - total(a) || b.followers - a.followers)
      .slice(0, 5),
    topAmplifiers: people
      .filter((p) => p.reposts > 0)
      .sort((a, b) => b.reposts - a.reposts || b.followers - a.followers)
      .slice(0, 5),
    notable: people
      .filter((p) => p.followers >= NOTABLE_FOLLOWERS)
      .sort((a, b) => b.followers - a.followers)
      .slice(0, 5),
    posts: new Set(rows.map((r) => r.tweetId)).size,
  };
}
