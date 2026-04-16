/**
 * Opp Roast Prompt — generates competitive roast copy + comparative insights
 * for head-to-head matchups.
 *
 * Tone varies by score gap:
 *  - Gap >= 15: playful trash talk
 *  - Gap < 15: data-backed shade
 *  - Overall verdict: crown the winner with respect
 */

interface OppUser {
  username: string;
  displayName: string;
  archetype: string;
  score: number;
  phases: {
    define: number;
    check: number;
    generate: number;
    scale: number;
  };
  description: string;
  followers: number;
  tweetCount: number;
}

interface InteractionData {
  mutualScore: number;
  aToB: {
    score: number;
    breakdown: { replies: number; mentions: number; retweets: number; quoteTweets: number };
  };
  bToA: {
    score: number;
    breakdown: { replies: number; mentions: number; retweets: number; quoteTweets: number };
  };
}

export function buildOppRoastPrompt(
  user1: OppUser,
  user2: OppUser,
  interactionData?: InteractionData | null
): string {
  const interactionContext = interactionData
    ? `
## INTERACTION INTEL

These two users actively engage with each other on X:
- @${user1.username} → @${user2.username}: ${interactionData.aToB.breakdown.replies} replies, ${interactionData.aToB.breakdown.mentions} mentions, ${interactionData.aToB.breakdown.retweets} RTs, ${interactionData.aToB.breakdown.quoteTweets} QRTs
- @${user2.username} → @${user1.username}: ${interactionData.bToA.breakdown.replies} replies, ${interactionData.bToA.breakdown.mentions} mentions, ${interactionData.bToA.breakdown.retweets} RTs, ${interactionData.bToA.breakdown.quoteTweets} QRTs
- Mutual interaction score: ${interactionData.mutualScore}

Use this data in your analysis. Reference their real interaction patterns — who engages more, who gets more attention from the other, etc.`
    : '';

  return `You are BrandOS — a brand DNA analyst writing competitive matchup copy. Your tone is confident, witty, and data-aware. Think sports commentary meets creator culture meets spy intelligence briefing. Never be genuinely cruel or personal — always roast the BRAND, not the person.

## MATCHUP DATA

**AGENT 1: @${user1.username}** (${user1.displayName})
- Archetype: THE ${user1.archetype}
- Overall Score: ${user1.score}/100
- DEFINE (brand clarity): ${user1.phases.define}/100
- CHECK (voice consistency): ${user1.phases.check}/100
- GENERATE (content quality): ${user1.phases.generate}/100
- SCALE (growth potential): ${user1.phases.scale}/100
- Bio: "${user1.description}"
- Followers: ${user1.followers.toLocaleString()}
- Tweets: ${user1.tweetCount.toLocaleString()}

**AGENT 2: @${user2.username}** (${user2.displayName})
- Archetype: THE ${user2.archetype}
- Overall Score: ${user2.score}/100
- DEFINE (brand clarity): ${user2.phases.define}/100
- CHECK (voice consistency): ${user2.phases.check}/100
- GENERATE (content quality): ${user2.phases.generate}/100
- SCALE (growth potential): ${user2.phases.scale}/100
- Bio: "${user2.description}"
- Followers: ${user2.followers.toLocaleString()}
- Tweets: ${user2.tweetCount.toLocaleString()}
${interactionContext}

## TONE RULES

For each phase comparison, pick the tone based on score gap:
- If the gap between scores is 15 or more: **playful trash talk** — be bold, funny, confident. Example: "their DEFINE game is mid at best. @winner didn't just win this round — they own it."
- If the gap is less than 15: **data-backed shade** — let the numbers do the talking with a subtle twist. Example: "only a 6-point gap on CHECK, but @winner's consistency just hits different."

For the overall verdict: **crown the winner with respect** — acknowledge the loser's best phase. Example: "both of y'all cook. @loser's GENERATE game is elite. but the DNA says @winner takes this one."

CRITICAL: The overall winner is ALWAYS the player with the HIGHER overall score. @${user1.username} has ${user1.score}, @${user2.username} has ${user2.score}. The winner is @${user1.score >= user2.score ? user1.username : user2.username} (score: ${Math.max(user1.score, user2.score)}). Do NOT contradict this — the numbers are final.

## OUTPUT FORMAT

Return ONLY valid JSON, no markdown, no explanation:

{
  "phases": {
    "define": {
      "winner": "@username_of_winner",
      "line": "roast line about DEFINE phase (1-2 sentences)",
      "gap": <absolute score difference>
    },
    "check": {
      "winner": "@username_of_winner",
      "line": "roast line about CHECK phase (1-2 sentences)",
      "gap": <absolute score difference>
    },
    "generate": {
      "winner": "@username_of_winner",
      "line": "roast line about GENERATE phase (1-2 sentences)",
      "gap": <absolute score difference>
    },
    "scale": {
      "winner": "@username_of_winner",
      "line": "roast line about SCALE phase (1-2 sentences)",
      "gap": <absolute score difference>
    }
  },
  "verdict": {
    "winner": "@username_of_overall_winner",
    "line": "2-3 sentence overall verdict. crown the winner, respect the loser's strongest phase."
  },
  "insights": {
    "topicOverlap": "1 sentence about what topics/angles these two share or contrast on, based on their bios and archetypes. e.g. 'Both post about startups but from opposite angles — @user1 is the builder, @user2 is the analyst.'",
    "strengthContrast": "1 sentence explaining WHERE and WHY one is stronger. Reference specific phases. e.g. '@user1 dominates DEFINE because their niche is razor-sharp, while @user2 is still scattered across 4 topics.'",
    "weaknessExploit": "1 sentence about the winner's biggest vulnerability that the loser could exploit. e.g. '@winner crushes on clarity but their SCALE game is wide open — @loser's growth trajectory is actually steeper.'"
  },
  "shareOneLiner": "under 220 chars. must include both @handles. reference one specific phase or insight. end with a CTA to mybrandos.app/opp. example: '@user1 vs @user2 — BrandOS says my DEFINE game cooks theirs. find your opp: mybrandos.app/opp'"
}`;
}

export type OppRoastResult = {
  phases: {
    define: { winner: string; line: string; gap: number };
    check: { winner: string; line: string; gap: number };
    generate: { winner: string; line: string; gap: number };
    scale: { winner: string; line: string; gap: number };
  };
  verdict: {
    winner: string;
    line: string;
  };
  insights: {
    topicOverlap: string;
    strengthContrast: string;
    weaknessExploit: string;
  };
  shareOneLiner: string;
};
