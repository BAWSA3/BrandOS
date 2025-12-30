'use client';

import { useState } from 'react';
import { ExtractedBrand, ImportProgress } from '@/lib/importTypes';
import { v4 as uuidv4 } from 'uuid';

interface ImportFromURLProps {
  onExtract: (brand: ExtractedBrand, preview?: string) => void;
}

export default function ImportFromURL({ onExtract }: ImportFromURLProps) {
  const [url, setUrl] = useState('');
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);

  const isValidUrl = (str: string) => {
    try {
      const url = new URL(str.startsWith('http') ? str : `https://${str}`);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleAnalyze = async () => {
    if (!isValidUrl(url)) return;

    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    setProgress({ stage: 'uploading', progress: 10, message: 'Connecting to website...' });

    try {
      setProgress({ stage: 'parsing', progress: 25, message: 'Fetching page content...' });

      const response = await fetch('/api/import/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fullUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze website');
      }

      setProgress({ stage: 'analyzing', progress: 60, message: 'Extracting brand elements...' });

      const result = await response.json();
      
      if (result.screenshot) {
        setScreenshot(result.screenshot);
      }

      setProgress({ stage: 'extracting', progress: 90, message: 'Building brand profile...' });

      const extractedBrand: ExtractedBrand = {
        id: uuidv4(),
        source: 'url',
        sourceDetails: fullUrl,
        overallConfidence: result.overallConfidence || 75,
        extractedAt: new Date(),
        name: result.name ? { value: result.name, confidence: 85, source: 'Page title/meta' } : undefined,
        colors: result.colors ? {
          primary: result.colors.primary ? { value: result.colors.primary, confidence: 90, source: 'CSS variables' } : undefined,
          secondary: result.colors.secondary ? { value: result.colors.secondary, confidence: 85, source: 'CSS analysis' } : undefined,
          accent: result.colors.accent ? { value: result.colors.accent, confidence: 80, source: 'CSS analysis' } : undefined,
          additional: result.colors.additional?.map((c: string) => ({ value: c, confidence: 70, source: 'Page colors' })),
        } : undefined,
        tone: result.tone ? {
          formality: { value: result.tone.formality, confidence: 75, source: 'Copy analysis' },
          energy: { value: result.tone.energy, confidence: 75, source: 'Copy analysis' },
          confidence: { value: result.tone.confidence, confidence: 75, source: 'Copy analysis' },
          style: { value: result.tone.style, confidence: 75, source: 'Copy analysis' },
        } : undefined,
        keywords: result.keywords?.map((k: string) => ({ value: k, confidence: 80, source: 'Meta tags/content' })),
        voiceSamples: result.voiceSamples?.map((s: string) => ({ value: s, confidence: 85, source: 'Page copy' })),
        detectedFonts: result.fonts?.map((f: string) => ({ value: f, confidence: 90, source: 'CSS fonts' })),
      };

      setProgress({ stage: 'complete', progress: 100, message: 'Analysis complete!' });
      
      setTimeout(() => {
        onExtract(extractedBrand, screenshot || undefined);
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
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        </div>
        <h2 className="text-2xl font-light tracking-tight mb-2">Analyze Your Website</h2>
        <p className="text-muted">
          We&apos;ll extract colors, fonts, and copy from your website to build your brand profile
        </p>
      </div>

      {/* URL Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="yourcompany.com"
          className="w-full pl-12 pr-4 py-4 bg-surface border border-border rounded-xl text-lg outline-none focus:border-foreground transition-colors"
        />
        {url && !isValidUrl(url) && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
      </div>

      {/* Screenshot Preview */}
      {screenshot && (
        <div className="mt-6 rounded-xl overflow-hidden border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={screenshot} alt="Website preview" className="w-full" />
        </div>
      )}

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
        disabled={!isValidUrl(url) || (progress?.stage !== 'error' && progress?.stage !== 'complete' && progress !== null)}
        className="w-full mt-8 py-4 bg-foreground text-background rounded-xl text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        {progress && progress.stage !== 'error' && progress.stage !== 'complete'
          ? 'Analyzing...'
          : 'Analyze Website'
        }
      </button>

      {/* What We Extract */}
      <div className="mt-8 p-4 bg-surface rounded-lg">
        <h4 className="text-xs uppercase tracking-widest text-muted mb-3">What we&apos;ll extract</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            CSS colors and variables
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
            Font families
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            Headlines and copy
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            Meta descriptions
          </div>
        </div>
      </div>
    </div>
  );
}















