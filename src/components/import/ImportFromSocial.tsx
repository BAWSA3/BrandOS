'use client';

import { useState } from 'react';
import { ExtractedBrand, ImportProgress } from '@/lib/importTypes';
import { v4 as uuidv4 } from 'uuid';

interface ImportFromSocialProps {
  onExtract: (brand: ExtractedBrand, preview?: string) => void;
}

type SocialPlatform = 'twitter' | 'instagram' | 'linkedin';

const platforms: { id: SocialPlatform; label: string; icon: string; placeholder: string }[] = [
  { id: 'twitter', label: 'Twitter / X', icon: 'twitter', placeholder: '@yourbrand or twitter.com/yourbrand' },
  { id: 'instagram', label: 'Instagram', icon: 'instagram', placeholder: '@yourbrand or instagram.com/yourbrand' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'linkedin', placeholder: 'linkedin.com/company/yourbrand' },
];

export default function ImportFromSocial({ onExtract }: ImportFromSocialProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>('twitter');
  const [handle, setHandle] = useState('');
  const [progress, setProgress] = useState<ImportProgress | null>(null);

  const handleAnalyze = async () => {
    if (!handle.trim()) return;

    setProgress({ stage: 'uploading', progress: 10, message: 'Connecting to profile...' });

    try {
      setProgress({ stage: 'parsing', progress: 25, message: 'Fetching profile data...' });

      const response = await fetch('/api/import/analyze-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: selectedPlatform, handle: handle.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze social profile');
      }

      setProgress({ stage: 'analyzing', progress: 60, message: 'Analyzing voice and tone...' });

      const result = await response.json();

      setProgress({ stage: 'extracting', progress: 90, message: 'Building brand profile...' });

      const extractedBrand: ExtractedBrand = {
        id: uuidv4(),
        source: 'social',
        sourceDetails: `${selectedPlatform}: ${handle}`,
        overallConfidence: result.overallConfidence || 70,
        extractedAt: new Date(),
        name: result.name ? { value: result.name, confidence: 90, source: 'Profile name' } : undefined,
        colors: result.colors ? {
          primary: result.colors.primary ? { value: result.colors.primary, confidence: 75, source: 'Profile/banner image' } : undefined,
          secondary: result.colors.secondary ? { value: result.colors.secondary, confidence: 70, source: 'Profile colors' } : undefined,
        } : undefined,
        tone: result.tone ? {
          formality: { value: result.tone.formality, confidence: 80, source: 'Post analysis' },
          energy: { value: result.tone.energy, confidence: 80, source: 'Post analysis' },
          confidence: { value: result.tone.confidence, confidence: 80, source: 'Post analysis' },
          style: { value: result.tone.style, confidence: 80, source: 'Post analysis' },
        } : undefined,
        keywords: result.keywords?.map((k: string) => ({ value: k, confidence: 85, source: 'Bio and posts' })),
        voiceSamples: result.voiceSamples?.map((s: string) => ({ value: s, confidence: 90, source: 'Recent posts' })),
      };

      setProgress({ stage: 'complete', progress: 100, message: 'Analysis complete!' });
      
      setTimeout(() => {
        onExtract(extractedBrand, result.profileImage);
      }, 500);

    } catch (error) {
      setProgress({
        stage: 'error',
        progress: 0,
        message: 'Analysis failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-pink-500/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-light tracking-tight mb-2">Import from Social Media</h2>
        <p className="text-muted">
          We&apos;ll analyze your posts and profile to understand your brand voice
        </p>
      </div>

      {/* Platform Selection */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {platforms.map((platform) => (
          <button
            key={platform.id}
            onClick={() => {
              setSelectedPlatform(platform.id);
              setProgress(null);
            }}
            className={`p-4 rounded-xl border transition-all ${
              selectedPlatform === platform.id
                ? 'border-foreground bg-surface'
                : 'border-border hover:border-muted'
            }`}
          >
            <SocialIcon platform={platform.icon} active={selectedPlatform === platform.id} />
            <p className="text-sm font-medium mt-2">{platform.label}</p>
          </button>
        ))}
      </div>

      {/* Handle Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <input
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder={platforms.find(p => p.id === selectedPlatform)?.placeholder}
          className="w-full pl-12 pr-4 py-4 bg-surface border border-border rounded-xl text-lg outline-none focus:border-foreground transition-colors"
        />
      </div>

      {/* Progress */}
      {progress && (
        <div className="mt-8 p-6 bg-surface rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">{progress.message}</span>
            <span className="text-sm text-muted">{progress.progress}%</span>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress.stage === 'error' ? 'bg-red-500' : 'bg-foreground'
              }`}
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          {progress.error && (
            <p className="mt-3 text-sm text-red-500">{progress.error}</p>
          )}
        </div>
      )}

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={!handle.trim() || (progress?.stage !== 'error' && progress?.stage !== 'complete' && progress !== null)}
        className="w-full mt-8 py-4 bg-foreground text-background rounded-xl text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        {progress && progress.stage !== 'error' && progress.stage !== 'complete'
          ? 'Analyzing...'
          : 'Analyze Profile'
        }
      </button>

      {/* What We Analyze */}
      <div className="mt-8 p-4 bg-surface rounded-lg">
        <h4 className="text-xs uppercase tracking-widest text-muted mb-3">What we&apos;ll analyze</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            Profile bio and description
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
            Recent posts for voice
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            Profile and banner colors
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            Hashtags and keywords
          </div>
        </div>
      </div>

      {/* Note */}
      <p className="mt-6 text-xs text-muted text-center">
        Note: We only analyze publicly available profile information. No login required.
      </p>
    </div>
  );
}

function SocialIcon({ platform, active }: { platform: string; active: boolean }) {
  const className = `w-6 h-6 mx-auto ${active ? 'text-foreground' : 'text-muted'}`;

  switch (platform) {
    case 'twitter':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="2" y="2" width="20" height="20" rx="5" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="4" strokeWidth="1.5" />
          <circle cx="18" cy="6" r="1" fill="currentColor" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    default:
      return null;
  }
}

