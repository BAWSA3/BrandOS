/**
 * Long-form on X is threads AND X Articles. Pure helpers shared by the scan
 * (tweet-analysis), the growth dashboard (growth-metrics) and the archetype
 * signals. Covered by `npm run test:scan` and `npm run test:growth`.
 *
 * SocialData has no article field: an Article post is a normal tweet whose
 * link expands to x.com/i/article/<id> (the text is usually just the t.co
 * link). mapTweet swaps that t.co link for the expanded one, so the text
 * alone is enough to spot an Article everywhere the text goes (stored posts,
 * the scan prompt).
 */

const ARTICLE_URL = /\b(?:x|twitter)\.com\/i\/article\/\d+/i;

/** A post that publishes (or links) an X Article. */
export function isArticlePost(text: string, urls?: { expanded_url: string }[]): boolean {
  return ARTICLE_URL.test(text) || !!urls?.some((u) => ARTICLE_URL.test(u.expanded_url));
}

/** Replace t.co links that point at an X Article with the article URL. */
export function expandArticleLinks(
  text: string,
  urls: { url?: string; expanded_url?: string }[] | undefined
): string {
  let out = text;
  for (const u of urls ?? []) {
    if (u.url && u.expanded_url && ARTICLE_URL.test(u.expanded_url))
      out = out.split(u.url).join(u.expanded_url);
  }
  return out;
}
