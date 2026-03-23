'use client';

import { useState } from 'react';

type Tab = 'overview' | 'endpoints' | 'pricing' | 'quickstart';

interface Endpoint {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  description: string;
  tier: string;
  body?: string;
  params?: string;
  response: string;
  curl: string;
}

export default function ApiDocs() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://mybrandos.app';

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const endpoints: Endpoint[] = [
    {
      id: 'score-post',
      method: 'POST',
      path: '/api/v1/score',
      description:
        'Score any X/Twitter handle. Returns overall brand score (0-100), archetype classification, 4-phase breakdown, AI insights, strengths, and improvements.',
      tier: 'All tiers',
      body: `{
  "username": "naval"
}`,
      response: `{
  "success": true,
  "data": {
    "username": "naval",
    "displayName": "Naval",
    "profileImageUrl": "https://pbs.twimg.com/...",
    "verified": true,
    "followers": 2900000,
    "score": {
      "overall": 91,
      "identity": 95,
      "consistency": 88,
      "content": 85,
      "growth": 97
    },
    "archetype": {
      "name": "FORESIGHT",
      "emoji": "🔮",
      "tagline": "Visionary",
      "description": "Peak archetype. The thought leader who called it early..."
    },
    "insights": {
      "identity": ["Clear philosophical brand identity", "..."],
      "consistency": ["Consistent minimalist voice", "..."],
      "content": ["High-quality thread content", "..."],
      "growth": ["Elite tier influence", "..."]
    },
    "strengths": ["Iconic personal brand", "Massive organic reach"],
    "improvements": ["Could leverage threads more", "More CTA usage"],
    "influenceTier": "elite",
    "summary": "A visionary thought leader with elite influence...",
    "analyzedAt": "2026-03-20T12:00:00.000Z",
    "cached": false
  },
  "meta": {
    "apiVersion": "v1"
  }
}`,
      curl: `curl -X POST ${baseUrl}/api/v1/score \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"username": "naval"}'`,
    },
    {
      id: 'score-get',
      method: 'GET',
      path: '/api/v1/score/:username',
      description:
        'Same as POST /score but via GET with the username in the URL path. Simpler for quick integrations.',
      tier: 'All tiers',
      params: 'username — X/Twitter handle (without @)',
      response: '// Same response shape as POST /api/v1/score',
      curl: `curl ${baseUrl}/api/v1/score/naval \\
  -H "x-api-key: YOUR_API_KEY"`,
    },
    {
      id: 'batch',
      method: 'POST',
      path: '/api/v1/batch',
      description:
        'Score multiple usernames in a single request. Max 10 per call. Results are processed concurrently for speed.',
      tier: 'STARTER+',
      body: `{
  "usernames": ["naval", "balaboradatsky", "pmarca"]
}`,
      response: `{
  "success": true,
  "data": {
    "results": [
      { "username": "naval", "score": { "overall": 91, ... }, "archetype": { ... }, ... },
      { "username": "balaboradatsky", "score": { "overall": 78, ... }, ... },
      { "username": "pmarca", "score": { "overall": 89, ... }, ... }
    ]
  },
  "meta": {
    "apiVersion": "v1",
    "total": 3,
    "succeeded": 3,
    "failed": 0
  }
}`,
      curl: `curl -X POST ${baseUrl}/api/v1/batch \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"usernames": ["naval", "pmarca", "balajis"]}'`,
    },
    {
      id: 'profile',
      method: 'GET',
      path: '/api/v1/profile/:username',
      description:
        'Get X profile data WITHOUT running the AI scoring engine. Fast and free of AI cost — use for profile lookups, follower counts, and influence tier.',
      tier: 'All tiers',
      params: 'username — X/Twitter handle (without @)',
      response: `{
  "success": true,
  "data": {
    "username": "naval",
    "displayName": "Naval",
    "description": "Angel investor, philosopher...",
    "profileImageUrl": "https://pbs.twimg.com/...",
    "verified": true,
    "location": "Earth",
    "url": "https://nav.al",
    "createdAt": "2009-04-01T...",
    "metrics": {
      "followers": 2900000,
      "following": 1200,
      "tweets": 15000,
      "listed": 51000
    },
    "influenceTier": "elite"
  }
}`,
      curl: `curl ${baseUrl}/api/v1/profile/naval \\
  -H "x-api-key: YOUR_API_KEY"`,
    },
    {
      id: 'leaderboard',
      method: 'GET',
      path: '/api/v1/leaderboard',
      description:
        'Get top scored creators. Supports filtering by time range and custom result limits.',
      tier: 'All tiers',
      params: 'range — "week" | "month" | "all" (default: week), limit — 1-100 (default: 25)',
      response: `{
  "success": true,
  "data": {
    "entries": [
      { "rank": 1, "username": "naval", "displayName": "Naval", "score": 91, "profileImageUrl": "..." },
      { "rank": 2, "username": "pmarca", "displayName": "Marc Andreessen", "score": 89, "profileImageUrl": "..." }
    ]
  },
  "meta": { "range": "week", "total": 150, "returned": 25 }
}`,
      curl: `curl "${baseUrl}/api/v1/leaderboard?range=week&limit=10" \\
  -H "x-api-key: YOUR_API_KEY"`,
    },
    {
      id: 'history',
      method: 'GET',
      path: '/api/v1/history/:username',
      description:
        'Get scan history for a username — up to 50 most recent scans with score trends and aggregate stats.',
      tier: 'All tiers',
      params: 'username — X/Twitter handle (without @)',
      response: `{
  "success": true,
  "data": {
    "username": "naval",
    "scans": [
      { "score": 91, "archetype": "FORESIGHT", "scannedAt": "2026-03-20T..." },
      { "score": 89, "archetype": "FORESIGHT", "scannedAt": "2026-03-15T..." }
    ],
    "stats": {
      "totalScans": 12,
      "highScore": 93,
      "lowScore": 85,
      "currentScore": 91,
      "averageScore": 89,
      "firstScan": "2026-01-10T...",
      "lastScan": "2026-03-20T..."
    }
  }
}`,
      curl: `curl ${baseUrl}/api/v1/history/naval \\
  -H "x-api-key: YOUR_API_KEY"`,
    },
    {
      id: 'archetypes',
      method: 'GET',
      path: '/api/v1/archetypes',
      description:
        'Returns all 8 BrandOS archetypes with descriptions, tier levels, and evolution paths.',
      tier: 'All tiers',
      response: `{
  "success": true,
  "data": [
    {
      "id": "FORESIGHT",
      "emoji": "🔮",
      "tier": 5,
      "tagline": "Visionary",
      "description": "Peak archetype. The thought leader who called it early...",
      "strengths": ["Predictive insight", "Contrarian conviction"],
      "evolvesTo": []
    },
    ...
  ],
  "meta": {
    "total": 8,
    "tiers": { "1": "Emerging", "2": "Established", "3": "Advanced", "4": "Authority", "5": "Peak" }
  }
}`,
      curl: `curl ${baseUrl}/api/v1/archetypes \\
  -H "x-api-key: YOUR_API_KEY"`,
    },
    {
      id: 'usage',
      method: 'GET',
      path: '/api/v1/usage',
      description:
        'Check your API key usage, rate limits, remaining quota, and 7-day usage breakdown.',
      tier: 'All tiers',
      response: `{
  "success": true,
  "data": {
    "key": { "name": "Production", "prefix": "bos_a1b2c3d4", "tier": "GROWTH" },
    "limits": { "daily": 10000, "perMinute": 60 },
    "usage": { "today": 142, "total": 3847, "remaining": 9858 },
    "last7Days": [
      { "date": "2026-03-20", "requests": 142 },
      { "date": "2026-03-19", "requests": 580 }
    ]
  }
}`,
      curl: `curl ${baseUrl}/api/v1/usage \\
  -H "x-api-key: YOUR_API_KEY"`,
    },
  ];

  const tiers = [
    {
      name: 'FREE',
      price: '$0',
      daily: '100',
      perMinute: '10',
      batch: false,
      features: ['Single score endpoint', 'Scan history', 'Archetype data', 'Usage dashboard'],
    },
    {
      name: 'STARTER',
      price: '$49/mo',
      daily: '1,000',
      perMinute: '30',
      batch: true,
      features: [
        'Everything in Free',
        'Batch scoring (10/call)',
        'Priority support',
        'Webhook callbacks',
      ],
    },
    {
      name: 'GROWTH',
      price: '$199/mo',
      daily: '10,000',
      perMinute: '60',
      batch: true,
      features: [
        'Everything in Starter',
        'Higher rate limits',
        'Dedicated support channel',
        'Custom integrations',
      ],
      popular: true,
    },
    {
      name: 'ENTERPRISE',
      price: 'Custom',
      daily: '100,000+',
      perMinute: '120+',
      batch: true,
      features: [
        'Everything in Growth',
        'Custom rate limits',
        'SLA guarantee',
        'White-label options',
        'Dedicated account manager',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-black/10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="font-mono text-sm tracking-tight hover:opacity-60 transition-opacity">
            ← brandos
          </a>
          <div className="flex items-center gap-1">
            {(['overview', 'endpoints', 'pricing', 'quickstart'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors ${
                  activeTab === tab
                    ? 'bg-black text-white'
                    : 'text-black/50 hover:text-black hover:bg-black/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <a
            href="mailto:team@mybrandos.app?subject=BrandOS API Key Request"
            className="px-4 py-1.5 bg-[#0047FF] text-white text-xs font-mono rounded hover:bg-[#0037CC] transition-colors"
          >
            Get API Key
          </a>
        </div>
      </header>

      <main className="pt-14 max-w-5xl mx-auto px-6">
        {/* Hero */}
        <section className="py-20 border-b border-black/10">
          <div className="font-mono text-xs text-black/40 mb-4">// BrandOS API v1</div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
            Brand Intelligence API
          </h1>
          <p className="text-black/50 text-lg max-w-xl mb-8">
            Score any X/Twitter creator in seconds. Get brand scores, archetype classification,
            AI-powered insights, and historical trends — all via REST API.
          </p>
          <div className="flex flex-wrap gap-6 text-sm font-mono text-black/40">
            <span>5,400+ creators scored</span>
            <span>·</span>
            <span>8 archetypes</span>
            <span>·</span>
            <span>4-phase scoring</span>
            <span>·</span>
            <span>Sub-second cached responses</span>
          </div>
        </section>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <section className="py-16">
            <h2 className="text-2xl font-light mb-8">What the API returns</h2>

            <div className="grid md:grid-cols-2 gap-6 mb-16">
              {[
                {
                  title: 'Brand Score (0-100)',
                  desc: 'Overall brand strength plus 4 sub-scores: Identity, Consistency, Content, Growth. Powered by Gemini AI analyzing public profile data and content patterns.',
                },
                {
                  title: 'Archetype Classification',
                  desc: '1 of 8 archetypes (FORESIGHT, SOURCE, BUILD.EXE, RELAY, FREQ, ENTROPY, NULL, ARC) with tier level, description, and evolution paths.',
                },
                {
                  title: 'AI Insights',
                  desc: 'Phase-by-phase insights on identity clarity, voice consistency, content quality, and growth trajectory. Plus top strengths and actionable improvements.',
                },
                {
                  title: 'Influence Tier',
                  desc: 'Classified as elite (2M+), creator (100K-2M), micro (10K-100K), or audience (<10K) based on follower count and authority signals.',
                },
                {
                  title: 'Scan History',
                  desc: 'Track score trends over time. See high/low/average scores, total scans, and archetype evolution for any creator.',
                },
                {
                  title: 'Batch Scoring',
                  desc: 'Score up to 10 creators in a single API call. Results processed concurrently. Available on STARTER tier and above.',
                },
              ].map((item) => (
                <div key={item.title} className="p-5 border border-black/10 rounded-lg">
                  <h3 className="font-mono text-sm font-medium mb-2">{item.title}</h3>
                  <p className="text-sm text-black/50">{item.desc}</p>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-light mb-6">Data we analyze</h2>
            <div className="p-6 bg-black/[0.02] rounded-lg font-mono text-sm mb-6">
              <div className="text-black/40 mb-3">{'// What goes into a brand score'}</div>
              <div className="space-y-1 text-black/70">
                <div>
                  <span className="text-[#0047FF]">input</span>: X/Twitter username (public profile)
                </div>
                <div>
                  <span className="text-[#0047FF]">analyzed</span>: Content patterns, posting
                  frequency, engagement metrics
                </div>
                <div>
                  <span className="text-[#0047FF]">analyzed</span>: Follower/following ratio, listed
                  count, verification status
                </div>
                <div>
                  <span className="text-[#0047FF]">analyzed</span>: Voice consistency, niche clarity,
                  content pillars
                </div>
                <div>
                  <span className="text-[#0047FF]">analyzed</span>: Growth trajectory, authority
                  signals
                </div>
                <div className="pt-2 text-black/40">
                  {'// We do NOT use: bio text, username, display name, profile picture in scoring'}
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-light mb-6">Scoring Framework</h2>
            <div className="space-y-3 mb-16">
              {[
                { phase: 'DEFINE (30%)', desc: 'What are they known for? Content pillars, niche clarity, audience identification' },
                { phase: 'CHECK (25%)', desc: 'Consistency & voice. Tone, staying on-topic, recognizable style, cadence' },
                { phase: 'GENERATE (25%)', desc: 'Output quality. Volume, formats, expertise, originality' },
                { phase: 'SCALE (20%)', desc: 'Reputation signals. Follower ratio, listed count, verified status, growth' },
              ].map((item) => (
                <div key={item.phase} className="flex gap-4 p-4 border border-black/10 rounded-lg">
                  <div className="font-mono text-xs text-[#0047FF] w-32 shrink-0 pt-0.5">
                    {item.phase}
                  </div>
                  <div className="text-sm text-black/60">{item.desc}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Endpoints Tab */}
        {activeTab === 'endpoints' && (
          <section className="py-16">
            <h2 className="text-2xl font-light mb-4">Endpoints</h2>
            <p className="text-black/50 mb-8">
              All endpoints require the <code className="px-1.5 py-0.5 bg-black/5 rounded font-mono text-xs">x-api-key</code> header.
              Base URL: <code className="px-1.5 py-0.5 bg-black/5 rounded font-mono text-xs">{baseUrl}</code>
            </p>

            <div className="space-y-4">
              {endpoints.map((ep) => (
                <div key={ep.id} className="border border-black/10 rounded-lg overflow-hidden">
                  {/* Header — always visible */}
                  <button
                    onClick={() => setExpandedEndpoint(expandedEndpoint === ep.id ? null : ep.id)}
                    className="w-full p-5 flex items-start gap-4 text-left hover:bg-black/[0.01] transition-colors"
                  >
                    <span
                      className={`px-2 py-0.5 text-xs font-mono rounded ${
                        ep.method === 'GET'
                          ? 'bg-blue-500/10 text-blue-600'
                          : 'bg-green-500/10 text-green-600'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <div className="flex-1 min-w-0">
                      <code className="font-mono text-sm">{ep.path}</code>
                      <p className="text-sm text-black/50 mt-1">{ep.description}</p>
                    </div>
                    <span className="text-xs font-mono text-black/30 shrink-0">{ep.tier}</span>
                    <span className="text-black/30 shrink-0">
                      {expandedEndpoint === ep.id ? '−' : '+'}
                    </span>
                  </button>

                  {/* Expanded content */}
                  {expandedEndpoint === ep.id && (
                    <div className="border-t border-black/10 p-5 space-y-6">
                      {ep.params && (
                        <div>
                          <h4 className="text-xs font-mono uppercase tracking-wider text-black/40 mb-2">
                            Parameters
                          </h4>
                          <code className="text-sm text-black/70">{ep.params}</code>
                        </div>
                      )}

                      {ep.body && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-mono uppercase tracking-wider text-black/40">
                              Request Body
                            </h4>
                            <button
                              onClick={() => copy(ep.body!, `${ep.id}-body`)}
                              className="text-xs text-black/30 hover:text-black transition-colors"
                            >
                              {copiedId === `${ep.id}-body` ? '✓ Copied' : 'Copy'}
                            </button>
                          </div>
                          <pre className="p-4 bg-black/[0.03] rounded-lg text-sm font-mono overflow-x-auto">
                            {ep.body}
                          </pre>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-mono uppercase tracking-wider text-black/40">
                            Response
                          </h4>
                          <button
                            onClick={() => copy(ep.response, `${ep.id}-resp`)}
                            className="text-xs text-black/30 hover:text-black transition-colors"
                          >
                            {copiedId === `${ep.id}-resp` ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                        <pre className="p-4 bg-black/[0.03] rounded-lg text-sm font-mono overflow-x-auto max-h-96 overflow-y-auto">
                          {ep.response}
                        </pre>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-mono uppercase tracking-wider text-black/40">
                            cURL
                          </h4>
                          <button
                            onClick={() => copy(ep.curl, `${ep.id}-curl`)}
                            className="text-xs text-black/30 hover:text-black transition-colors"
                          >
                            {copiedId === `${ep.id}-curl` ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                        <pre className="p-4 bg-black text-green-400 rounded-lg text-sm font-mono overflow-x-auto">
                          {ep.curl}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Error Codes */}
            <h2 className="text-2xl font-light mt-16 mb-6">Error Codes</h2>
            <div className="border border-black/10 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 bg-black/[0.02]">
                    <th className="text-left p-3 font-mono text-xs text-black/40">Code</th>
                    <th className="text-left p-3 font-mono text-xs text-black/40">Meaning</th>
                    <th className="text-left p-3 font-mono text-xs text-black/40">Fix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {[
                    ['400', 'Bad Request', 'Check your request body/params'],
                    ['401', 'Unauthorized', 'Check your x-api-key header'],
                    ['403', 'Forbidden', 'Key deactivated, expired, or tier too low'],
                    ['404', 'Not Found', 'Username doesn\'t exist on X'],
                    ['429', 'Rate Limited', 'Wait and retry, or upgrade your tier'],
                    ['503', 'Service Unavailable', 'AI quota exceeded — retry in a few minutes'],
                  ].map(([code, meaning, fix]) => (
                    <tr key={code}>
                      <td className="p-3 font-mono text-red-500">{code}</td>
                      <td className="p-3 text-black/70">{meaning}</td>
                      <td className="p-3 text-black/50">{fix}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <section className="py-16">
            <h2 className="text-2xl font-light mb-3">API Pricing</h2>
            <p className="text-black/50 mb-10">
              Start free, scale as you grow. All tiers include the full scoring engine.
            </p>

            <div className="grid md:grid-cols-4 gap-4 mb-16">
              {tiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`p-6 rounded-lg border ${
                    tier.popular
                      ? 'border-[#0047FF] ring-1 ring-[#0047FF]/20'
                      : 'border-black/10'
                  } relative`}
                >
                  {tier.popular && (
                    <span className="absolute -top-3 left-4 px-2 py-0.5 bg-[#0047FF] text-white text-[10px] font-mono uppercase rounded">
                      Popular
                    </span>
                  )}
                  <div className="font-mono text-xs text-black/40 mb-1">{tier.name}</div>
                  <div className="text-2xl font-light mb-4">{tier.price}</div>
                  <div className="space-y-2 text-sm text-black/50 mb-6">
                    <div>
                      <span className="font-mono text-black/70">{tier.daily}</span> requests/day
                    </div>
                    <div>
                      <span className="font-mono text-black/70">{tier.perMinute}</span> requests/min
                    </div>
                    <div>
                      Batch scoring:{' '}
                      <span className="font-mono text-black/70">{tier.batch ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {tier.features.map((f) => (
                      <li key={f} className="text-xs text-black/50 flex items-start gap-2">
                        <span className="text-[#0047FF] mt-0.5">→</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="p-6 bg-black/[0.02] rounded-lg text-center">
              <p className="text-black/70 mb-4">
                Need custom limits, white-label, or SLA? Let&apos;s talk.
              </p>
              <a
                href="mailto:team@mybrandos.app?subject=BrandOS Enterprise API"
                className="inline-block px-6 py-2.5 bg-black text-white font-mono text-sm rounded hover:bg-black/80 transition-colors"
              >
                Contact Sales
              </a>
            </div>
          </section>
        )}

        {/* Quickstart Tab */}
        {activeTab === 'quickstart' && (
          <section className="py-16">
            <h2 className="text-2xl font-light mb-8">Quickstart</h2>

            <div className="space-y-10">
              {/* Step 1 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-7 h-7 rounded-full bg-black text-white text-xs font-mono flex items-center justify-center">
                    1
                  </span>
                  <h3 className="font-medium">Get your API key</h3>
                </div>
                <p className="text-sm text-black/50 ml-10 mb-4">
                  Email{' '}
                  <a href="mailto:team@mybrandos.app" className="text-[#0047FF] underline">
                    team@mybrandos.app
                  </a>{' '}
                  with your company name and use case. We&apos;ll provision a key within 24 hours.
                </p>
              </div>

              {/* Step 2 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-7 h-7 rounded-full bg-black text-white text-xs font-mono flex items-center justify-center">
                    2
                  </span>
                  <h3 className="font-medium">Make your first request</h3>
                </div>
                <div className="ml-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-black/40">cURL</span>
                    <button
                      onClick={() =>
                        copy(
                          `curl -X POST ${baseUrl}/api/v1/score \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -d '{"username": "naval"}'`,
                          'qs-curl'
                        )
                      }
                      className="text-xs text-black/30 hover:text-black"
                    >
                      {copiedId === 'qs-curl' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-4 bg-black text-green-400 rounded-lg text-sm font-mono overflow-x-auto">
                    {`curl -X POST ${baseUrl}/api/v1/score \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"username": "naval"}'`}
                  </pre>
                </div>
              </div>

              {/* Step 3 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-7 h-7 rounded-full bg-black text-white text-xs font-mono flex items-center justify-center">
                    3
                  </span>
                  <h3 className="font-medium">JavaScript / TypeScript</h3>
                </div>
                <div className="ml-10">
                  <pre className="p-4 bg-black/[0.03] rounded-lg text-sm font-mono overflow-x-auto">
                    {`const response = await fetch('${baseUrl}/api/v1/score', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.BRANDOS_API_KEY,
  },
  body: JSON.stringify({ username: 'naval' }),
});

const { data } = await response.json();
console.log(data.score.overall);  // 91
console.log(data.archetype.name); // "FORESIGHT"`}
                  </pre>
                </div>
              </div>

              {/* Step 4 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-7 h-7 rounded-full bg-black text-white text-xs font-mono flex items-center justify-center">
                    4
                  </span>
                  <h3 className="font-medium">Python</h3>
                </div>
                <div className="ml-10">
                  <pre className="p-4 bg-black/[0.03] rounded-lg text-sm font-mono overflow-x-auto">
                    {`import requests

resp = requests.post(
    "${baseUrl}/api/v1/score",
    headers={"x-api-key": "YOUR_API_KEY"},
    json={"username": "naval"}
)

data = resp.json()["data"]
print(f"Score: {data['score']['overall']}")
print(f"Archetype: {data['archetype']['name']}")`}
                  </pre>
                </div>
              </div>

              {/* Step 5 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-7 h-7 rounded-full bg-black text-white text-xs font-mono flex items-center justify-center">
                    5
                  </span>
                  <h3 className="font-medium">Check your usage</h3>
                </div>
                <div className="ml-10">
                  <pre className="p-4 bg-black text-green-400 rounded-lg text-sm font-mono overflow-x-auto">
                    {`curl ${baseUrl}/api/v1/usage \\
  -H "x-api-key: YOUR_API_KEY"`}
                  </pre>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-black/10 py-8 mt-8">
          <div className="flex items-center justify-between text-xs text-black/30 font-mono">
            <span>BrandOS API v1</span>
            <div className="flex gap-4">
              <a href="mailto:team@mybrandos.app" className="hover:text-black transition-colors">
                team@mybrandos.app
              </a>
              <a href="/" className="hover:text-black transition-colors">
                mybrandos.app
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
