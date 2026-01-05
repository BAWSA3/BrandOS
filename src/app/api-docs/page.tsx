'use client';

import { useState } from 'react';
import { useBrandStore } from '@/lib/store';

export default function ApiDocs() {
  const { theme, toggleTheme } = useBrandStore();
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const copyToClipboard = (text: string, endpoint: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const endpoints = [
    {
      id: 'check',
      method: 'POST',
      path: '/api/webhook/check',
      description: 'Check content against brand guidelines',
      body: `{
  "brandDNA": {
    "name": "Your Brand",
    "tone": {
      "minimal": 50,
      "playful": 50,
      "bold": 50,
      "experimental": 30
    },
    "keywords": ["innovative", "simple"],
    "doPatterns": ["Use active voice"],
    "dontPatterns": ["Avoid jargon"],
    "voiceSamples": ["Example copy here"]
  },
  "content": "Your content to check...",
  "callbackUrl": "https://your-webhook.com/callback"
}`,
      response: `{
  "success": true,
  "result": {
    "score": 85,
    "issues": ["Minor formality mismatch"],
    "strengths": ["Good use of brand keywords"],
    "suggestions": ["Consider more active voice"],
    "revisedVersion": "Improved version..."
  },
  "brandName": "Your Brand",
  "timestamp": "2024-01-15T12:00:00.000Z"
}`,
    },
    {
      id: 'generate',
      method: 'POST',
      path: '/api/webhook/generate',
      description: 'Generate on-brand content',
      body: `{
  "brandDNA": {
    "name": "Your Brand",
    "tone": { ... },
    "keywords": [...],
    "doPatterns": [...],
    "dontPatterns": [...],
    "voiceSamples": [...]
  },
  "prompt": "Write a tagline for our new product",
  "contentType": "tagline",
  "callbackUrl": "https://your-webhook.com/callback"
}`,
      response: `{
  "success": true,
  "content": "**OPTION 1:**\\nYour tagline here...\\n\\n**OPTION 2:**\\n...",
  "brandName": "Your Brand",
  "contentType": "tagline",
  "timestamp": "2024-01-15T12:00:00.000Z"
}`,
    },
  ];

  const contentTypes = [
    'general',
    'social-twitter',
    'social-linkedin',
    'social-instagram',
    'headline',
    'tagline',
    'email-subject',
    'email-body',
    'ad-copy',
    'product-description',
    'blog-intro',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="text-sm font-medium tracking-tight hover:text-muted transition-colors">
            ← Back to brandos
          </a>
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-full transition-colors ${theme === 'dark' ? 'text-white/70 hover:text-white bg-white/5 hover:bg-white/10' : 'text-black/60 hover:text-black bg-black/5 hover:bg-black/10'}`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="pt-14">
        <section className="py-20 px-6 text-center border-b border-border">
          <h1 className="text-5xl font-light tracking-tight mb-4">API Documentation</h1>
          <p className="text-muted text-lg max-w-md mx-auto">
            Integrate brandos into your workflow with our REST API.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16">
          {/* Authentication */}
          <div className="mb-16">
            <h2 className="text-2xl font-light tracking-tight mb-4">Authentication</h2>
            <p className="text-muted mb-4">
              All API requests require an API key passed in the <code className="px-2 py-1 bg-surface rounded text-sm font-mono">x-api-key</code> header.
            </p>
            <div className="p-4 bg-surface rounded-lg font-mono text-sm">
              <span className="text-muted">x-api-key:</span> your-api-key-here
            </div>
            <p className="text-sm text-muted mt-4">
              Set your API key in <code className="px-1 bg-surface rounded">.env.local</code> as <code className="px-1 bg-surface rounded">BRANDOS_API_KEY</code>
            </p>
          </div>

          {/* Base URL */}
          <div className="mb-16">
            <h2 className="text-2xl font-light tracking-tight mb-4">Base URL</h2>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-4 bg-surface rounded-lg font-mono text-sm">{baseUrl}</code>
              <button
                onClick={() => copyToClipboard(baseUrl, 'base')}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:border-foreground transition-colors"
              >
                {copiedEndpoint === 'base' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Content Types */}
          <div className="mb-16">
            <h2 className="text-2xl font-light tracking-tight mb-4">Content Types</h2>
            <p className="text-muted mb-4">Available content types for the generate endpoint:</p>
            <div className="flex flex-wrap gap-2">
              {contentTypes.map((type) => (
                <span key={type} className="px-3 py-1 bg-surface rounded-full text-sm font-mono">
                  {type}
                </span>
              ))}
            </div>
          </div>

          {/* Endpoints */}
          <div className="mb-16">
            <h2 className="text-2xl font-light tracking-tight mb-8">Endpoints</h2>
            
            {endpoints.map((endpoint) => (
              <div key={endpoint.id} className="mb-12 p-6 border border-border rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-mono rounded">
                    {endpoint.method}
                  </span>
                  <code className="font-mono">{endpoint.path}</code>
                </div>
                <p className="text-muted mb-6">{endpoint.description}</p>
                
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs uppercase tracking-widest text-muted">Request Body</h4>
                    <button
                      onClick={() => copyToClipboard(endpoint.body, `${endpoint.id}-body`)}
                      className="text-xs text-muted hover:text-foreground transition-colors"
                    >
                      {copiedEndpoint === `${endpoint.id}-body` ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-4 bg-surface rounded-lg text-sm font-mono overflow-x-auto">
                    {endpoint.body}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs uppercase tracking-widest text-muted">Response</h4>
                    <button
                      onClick={() => copyToClipboard(endpoint.response, `${endpoint.id}-response`)}
                      className="text-xs text-muted hover:text-foreground transition-colors"
                    >
                      {copiedEndpoint === `${endpoint.id}-response` ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-4 bg-surface rounded-lg text-sm font-mono overflow-x-auto">
                    {endpoint.response}
                  </pre>
                </div>
              </div>
            ))}
          </div>

          {/* Webhooks */}
          <div className="mb-16">
            <h2 className="text-2xl font-light tracking-tight mb-4">Webhooks (Callbacks)</h2>
            <p className="text-muted mb-4">
              Optionally provide a <code className="px-2 py-1 bg-surface rounded text-sm font-mono">callbackUrl</code> in your request to receive results via webhook.
            </p>
            <div className="p-4 bg-surface rounded-lg">
              <p className="text-sm mb-2">The callback will receive a POST request with:</p>
              <pre className="text-sm font-mono text-muted">
{`{
  "type": "check" | "generate",
  "brandName": "Your Brand",
  "input": "Original input",
  "result": { ... } | "content": "...",
  "timestamp": "ISO date string"
}`}
              </pre>
            </div>
          </div>

          {/* cURL Example */}
          <div>
            <h2 className="text-2xl font-light tracking-tight mb-4">Example (cURL)</h2>
            <pre className="p-4 bg-surface rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap">
{`curl -X POST ${baseUrl}/api/webhook/check \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: your-api-key" \\
  -d '{
    "brandDNA": {
      "name": "My Brand",
      "tone": {"minimal": 50, "playful": 50, "bold": 50, "experimental": 30},
      "keywords": ["innovative"],
      "doPatterns": [],
      "dontPatterns": [],
      "voiceSamples": []
    },
    "content": "Check this content"
  }'`}
            </pre>
          </div>
        </section>

        <footer className="border-t border-border py-8">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="text-xs text-muted">brandos — AI-powered brand consistency</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

