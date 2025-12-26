'use client';

import { useState, useRef } from 'react';
import { ExtractedBrand, ImportProgress } from '@/lib/importTypes';
import { v4 as uuidv4 } from 'uuid';

interface ImportFromPDFProps {
  onExtract: (brand: ExtractedBrand, preview?: string) => void;
}

export default function ImportFromPDF({ onExtract }: ImportFromPDFProps) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [previewText, setPreviewText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setProgress(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setProgress(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setProgress({ stage: 'uploading', progress: 10, message: 'Uploading PDF...' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      setProgress({ stage: 'parsing', progress: 30, message: 'Parsing PDF content...' });

      const response = await fetch('/api/import/analyze-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze PDF');
      }

      setProgress({ stage: 'analyzing', progress: 60, message: 'Analyzing brand elements...' });

      const result = await response.json();
      setPreviewText(result.extractedText?.substring(0, 500) || '');

      setProgress({ stage: 'extracting', progress: 90, message: 'Extracting brand DNA...' });

      // Transform API result to ExtractedBrand format
      const extractedBrand: ExtractedBrand = {
        id: uuidv4(),
        source: 'pdf',
        sourceDetails: file.name,
        overallConfidence: result.overallConfidence || 75,
        extractedAt: new Date(),
        name: result.name ? { value: result.name, confidence: result.nameConfidence || 80, source: 'PDF title/header' } : undefined,
        colors: result.colors ? {
          primary: result.colors.primary ? { value: result.colors.primary, confidence: 85, source: 'PDF color analysis' } : undefined,
          secondary: result.colors.secondary ? { value: result.colors.secondary, confidence: 80, source: 'PDF color analysis' } : undefined,
          accent: result.colors.accent ? { value: result.colors.accent, confidence: 75, source: 'PDF color analysis' } : undefined,
        } : undefined,
        tone: result.tone ? {
          formality: { value: result.tone.formality, confidence: 70, source: 'Text analysis' },
          energy: { value: result.tone.energy, confidence: 70, source: 'Text analysis' },
          confidence: { value: result.tone.confidence, confidence: 70, source: 'Text analysis' },
          style: { value: result.tone.style, confidence: 70, source: 'Text analysis' },
        } : undefined,
        keywords: result.keywords?.map((k: string) => ({ value: k, confidence: 75, source: 'Text extraction' })),
        doPatterns: result.doPatterns?.map((p: string) => ({ value: p, confidence: 80, source: 'Guidelines parsing' })),
        dontPatterns: result.dontPatterns?.map((p: string) => ({ value: p, confidence: 80, source: 'Guidelines parsing' })),
        voiceSamples: result.voiceSamples?.map((s: string) => ({ value: s, confidence: 85, source: 'Text samples' })),
      };

      setProgress({ stage: 'complete', progress: 100, message: 'Analysis complete!' });
      
      setTimeout(() => {
        onExtract(extractedBrand, previewText);
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
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-light tracking-tight mb-2">Upload Brand Guidelines PDF</h2>
        <p className="text-muted">
          We&apos;ll extract colors, tone, keywords, and guidelines from your document
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
          ${file ? 'border-foreground bg-surface' : 'border-border hover:border-muted'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {file ? (
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setProgress(null);
              }}
              className="ml-4 p-2 hover:bg-border rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            <svg className="w-12 h-12 mx-auto mb-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg mb-2">Drop your PDF here</p>
            <p className="text-sm text-muted">or click to browse</p>
          </>
        )}
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
        disabled={!file || progress?.stage === 'uploading' || progress?.stage === 'parsing' || progress?.stage === 'analyzing'}
        className="w-full mt-8 py-4 bg-foreground text-background rounded-xl text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        {progress && progress.stage !== 'error' && progress.stage !== 'complete'
          ? 'Analyzing...'
          : 'Analyze PDF'
        }
      </button>

      {/* Tips */}
      <div className="mt-8 p-4 bg-surface rounded-lg">
        <h4 className="text-xs uppercase tracking-widest text-muted mb-3">Tips for best results</h4>
        <ul className="space-y-2 text-sm text-muted">
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            Include color specifications with hex values
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            Add sections for tone of voice and messaging guidelines
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            Include do&apos;s and don&apos;ts for brand usage
          </li>
        </ul>
      </div>
    </div>
  );
}







