'use client';

import { useState } from 'react';
import { importSources, ImportSource, ExtractedBrand, ReviewMode, reviewModes } from '@/lib/importTypes';
import ImportFromPDF from './ImportFromPDF';
import ImportFromImages from './ImportFromImages';
import ImportFromURL from './ImportFromURL';
import ImportFromSocial from './ImportFromSocial';
import ImportFromJSON from './ImportFromJSON';
import BrandReviewWizard from './BrandReviewWizard';
import BrandReviewGrid from './BrandReviewGrid';
import BrandReviewComparison from './BrandReviewComparison';
import BrandOSLogo from '../BrandOSLogo';

interface BrandImportHubProps {
  onStartFresh: () => void;
  onImportComplete: (extractedBrand: ExtractedBrand) => void;
}

type ImportStage = 'choice' | 'select-source' | 'import' | 'select-review' | 'review';

export default function BrandImportHub({ onStartFresh, onImportComplete }: BrandImportHubProps) {
  const [stage, setStage] = useState<ImportStage>('choice');
  const [selectedSource, setSelectedSource] = useState<ImportSource | null>(null);
  const [extractedBrand, setExtractedBrand] = useState<ExtractedBrand | null>(null);
  const [selectedReviewMode, setSelectedReviewMode] = useState<ReviewMode>('wizard');
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);

  const handleSourceSelect = (source: ImportSource) => {
    setSelectedSource(source);
    setStage('import');
  };

  const handleExtraction = (brand: ExtractedBrand, preview?: string) => {
    setExtractedBrand(brand);
    setSourcePreview(preview || null);
    setStage('select-review');
  };

  const handleReviewComplete = (finalBrand: ExtractedBrand) => {
    onImportComplete(finalBrand);
  };

  const handleBack = () => {
    switch (stage) {
      case 'select-source':
        setStage('choice');
        break;
      case 'import':
        setStage('select-source');
        setSelectedSource(null);
        break;
      case 'select-review':
        setStage('import');
        break;
      case 'review':
        setStage('select-review');
        break;
    }
  };

  // Initial choice: Start Fresh vs Import
  if (stage === 'choice') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <BrandOSLogo size="md" />
            </div>
            <h1 className="text-4xl font-light tracking-tight mb-4">
              How would you like to start?
            </h1>
            <p className="text-muted text-lg">
              Build a new brand from scratch or import your existing brand assets
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Start Fresh */}
            <button
              onClick={onStartFresh}
              className="group p-8 bg-surface rounded-2xl border border-border hover:border-foreground transition-all text-left"
            >
              <div className="w-16 h-16 mb-6 rounded-xl bg-background flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-xl font-medium mb-2">Start Fresh</h2>
              <p className="text-muted text-sm">
                Build your brand identity from the ground up with our guided setup wizard
              </p>
            </button>

            {/* Import Brand */}
            <button
              onClick={() => setStage('select-source')}
              className="group p-8 bg-surface rounded-2xl border border-border hover:border-foreground transition-all text-left"
            >
              <div className="w-16 h-16 mb-6 rounded-xl bg-background flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <h2 className="text-xl font-medium mb-2">Import Existing Brand</h2>
              <p className="text-muted text-sm">
                Upload your brand guidelines, assets, or website to auto-populate your brand DNA
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Select import source
  if (stage === 'select-source') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-8"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-light tracking-tight mb-4">
              Choose your import source
            </h1>
            <p className="text-muted text-lg">
              We&apos;ll analyze your existing brand and extract the key elements
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {importSources.map((source) => (
              <button
                key={source.id}
                onClick={() => handleSourceSelect(source.id)}
                className="group p-6 bg-surface rounded-xl border border-border hover:border-foreground transition-all text-left"
              >
                <div className="w-12 h-12 mb-4 rounded-lg bg-background flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ImportSourceIcon icon={source.icon} />
                </div>
                <h3 className="font-medium mb-1">{source.label}</h3>
                <p className="text-sm text-muted">{source.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Import from selected source
  if (stage === 'import' && selectedSource) {
    const ImportComponent = {
      pdf: ImportFromPDF,
      images: ImportFromImages,
      url: ImportFromURL,
      social: ImportFromSocial,
      json: ImportFromJSON,
    }[selectedSource];

    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-8"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <ImportComponent onExtract={handleExtraction} />
        </div>
      </div>
    );
  }

  // Select review mode
  if (stage === 'select-review' && extractedBrand) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-8"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-full text-sm mb-6">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Analysis Complete
            </div>
            <h1 className="text-4xl font-light tracking-tight mb-4">
              Review extracted brand elements
            </h1>
            <p className="text-muted text-lg">
              We found {countExtractedElements(extractedBrand)} brand elements with {extractedBrand.overallConfidence}% confidence
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {reviewModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedReviewMode(mode.id)}
                className={`p-6 rounded-xl border transition-all text-left ${
                  selectedReviewMode === mode.id
                    ? 'border-foreground bg-surface'
                    : 'border-border hover:border-muted'
                }`}
              >
                <ReviewModeIcon icon={mode.icon} active={selectedReviewMode === mode.id} />
                <h3 className="font-medium mt-4 mb-1">{mode.label}</h3>
                <p className="text-sm text-muted">{mode.description}</p>
              </button>
            ))}
          </div>

          <button
            onClick={() => setStage('review')}
            className="w-full py-4 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Continue to Review
          </button>
        </div>
      </div>
    );
  }

  // Review extracted brand
  if (stage === 'review' && extractedBrand) {
    const ReviewComponent = {
      wizard: BrandReviewWizard,
      grid: BrandReviewGrid,
      comparison: BrandReviewComparison,
    }[selectedReviewMode];

    return (
      <div className="min-h-screen bg-background">
        <ReviewComponent
          extractedBrand={extractedBrand}
          sourcePreview={sourcePreview}
          onBack={handleBack}
          onComplete={handleReviewComplete}
        />
      </div>
    );
  }

  return null;
}

function ImportSourceIcon({ icon }: { icon: string }) {
  const className = "w-6 h-6";
  
  switch (icon) {
    case 'document':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    case 'image':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'globe':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      );
    case 'users':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case 'code':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    default:
      return null;
  }
}

function ReviewModeIcon({ icon, active }: { icon: string; active: boolean }) {
  const className = `w-8 h-8 ${active ? 'text-foreground' : 'text-muted'}`;
  
  switch (icon) {
    case 'list':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      );
    case 'grid':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case 'columns':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      );
    default:
      return null;
  }
}

function countExtractedElements(brand: ExtractedBrand): number {
  let count = 0;
  if (brand.name) count++;
  if (brand.colors?.primary) count++;
  if (brand.colors?.secondary) count++;
  if (brand.colors?.accent) count++;
  if (brand.tone?.formality) count++;
  if (brand.tone?.energy) count++;
  if (brand.tone?.confidence) count++;
  if (brand.tone?.style) count++;
  count += brand.keywords?.length || 0;
  count += brand.doPatterns?.length || 0;
  count += brand.dontPatterns?.length || 0;
  count += brand.voiceSamples?.length || 0;
  return count;
}

