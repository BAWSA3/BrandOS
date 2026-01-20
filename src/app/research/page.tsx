'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import ResearchDashboard from '@/components/agents/ResearchDashboard';
import { useCurrentBrand } from '@/lib/store';
import { ResearchTopic } from '@/lib/agents/research.types';
import { ContentBatch } from '@/lib/agents/types';

export default function ResearchPage() {
  const brand = useCurrentBrand();
  const [generatingContent, setGeneratingContent] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<ContentBatch | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);

  // Check if brand is loaded
  const hasBrand = brand && brand.name;

  if (!hasBrand) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-neutral-900 flex items-center justify-center text-4xl">
            🔍
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Set Up Your Brand First</h1>
          <p className="text-neutral-400 mb-6">
            The Research Agent needs your brand DNA to find relevant content opportunities.
            Set up your brand to get started.
          </p>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Brand
          </Link>
        </div>
      </div>
    );
  }

  const handleGenerateContent = async (topics: ResearchTopic[]) => {
    if (topics.length === 0) return;

    setGeneratingContent(true);
    setContentError(null);

    try {
      const response = await fetch('/api/agents/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandDNA: brand,
          workflow: 'research-to-content',
          params: {
            selectedTopics: topics,
            platforms: ['twitter', 'instagram'],
            contentPerTopic: 2,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content');
      }

      if (data.content) {
        setGeneratedContent(data.content);
      } else if (data.contentError) {
        throw new Error(data.contentError);
      }
    } catch (err) {
      setContentError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setGeneratingContent(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-neutral-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/app" className="text-neutral-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                <span>🔍</span>
                Research Agent
              </h1>
              <p className="text-sm text-neutral-400">
                TCG & Collectibles trends for {brand.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/agents"
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-sm transition-colors"
            >
              All Agents
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <ResearchDashboard
          brandDNA={brand}
          onGenerateContent={handleGenerateContent}
        />

        {/* Content Generation Progress */}
        {generatingContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 p-4 rounded-xl bg-neutral-900 border border-neutral-700 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-white">Generating content from trends...</span>
            </div>
          </motion.div>
        )}

        {/* Content Error */}
        {contentError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <span className="text-red-400">❌</span>
              <span className="text-red-400">{contentError}</span>
              <button
                onClick={() => setContentError(null)}
                className="text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}

        {/* Generated Content Modal */}
        {generatedContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50"
            onClick={() => setGeneratedContent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-4xl w-full max-h-[80vh] overflow-y-auto bg-neutral-900 rounded-2xl border border-neutral-700 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Generated Content</h2>
                  <p className="text-neutral-400">
                    {generatedContent.pieces.length} piece{generatedContent.pieces.length !== 1 ? 's' : ''} generated
                  </p>
                </div>
                <button
                  onClick={() => setGeneratedContent(null)}
                  className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {generatedContent.pieces.map((piece, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-neutral-800 border border-neutral-700"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm px-2 py-1 rounded bg-neutral-700 text-white capitalize">
                        {piece.platform}
                      </span>
                      <span className="text-sm px-2 py-1 rounded bg-neutral-700 text-neutral-400">
                        {piece.contentType}
                      </span>
                      <span
                        className={`text-sm px-2 py-1 rounded ${
                          piece.brandAlignmentScore >= 80
                            ? 'bg-green-500/20 text-green-400'
                            : piece.brandAlignmentScore >= 60
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {piece.brandAlignmentScore}% aligned
                      </span>
                    </div>
                    <p className="text-white whitespace-pre-wrap">{piece.content}</p>
                    {piece.hashtags && piece.hashtags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {piece.hashtags.map((tag, i) => (
                          <span key={i} className="text-sm text-blue-400">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(piece.content)}
                        className="text-sm text-neutral-400 hover:text-white flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
