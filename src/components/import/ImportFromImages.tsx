'use client';

import { useState, useRef } from 'react';
import { ExtractedBrand, ImportProgress } from '@/lib/importTypes';
import { v4 as uuidv4 } from 'uuid';

interface ImportFromImagesProps {
  onExtract: (brand: ExtractedBrand, preview?: string) => void;
}

export default function ImportFromImages({ onExtract }: ImportFromImagesProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles: File[]) => {
    const imageFiles = newFiles.filter(f => f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...imageFiles]);
    
    // Create previews
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;

    setProgress({ stage: 'uploading', progress: 10, message: 'Uploading images...' });

    try {
      const formData = new FormData();
      files.forEach((file, i) => formData.append(`image_${i}`, file));

      setProgress({ stage: 'parsing', progress: 30, message: 'Processing images...' });

      const response = await fetch('/api/import/analyze-images', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze images');
      }

      setProgress({ stage: 'analyzing', progress: 60, message: 'Extracting colors and patterns...' });

      const result = await response.json();

      setProgress({ stage: 'extracting', progress: 90, message: 'Building brand profile...' });

      const extractedBrand: ExtractedBrand = {
        id: uuidv4(),
        source: 'images',
        sourceDetails: `${files.length} image(s)`,
        overallConfidence: result.overallConfidence || 70,
        extractedAt: new Date(),
        colors: result.colors ? {
          primary: result.colors.primary ? { value: result.colors.primary, confidence: 90, source: 'Dominant color extraction' } : undefined,
          secondary: result.colors.secondary ? { value: result.colors.secondary, confidence: 85, source: 'Secondary color extraction' } : undefined,
          accent: result.colors.accent ? { value: result.colors.accent, confidence: 80, source: 'Accent color extraction' } : undefined,
          additional: result.colors.additional?.map((c: string) => ({ value: c, confidence: 75, source: 'Color palette' })),
        } : undefined,
        logoDescriptions: result.logoDescriptions?.map((d: string) => ({ value: d, confidence: 70, source: 'Image analysis' })),
        imageryStyle: result.imageryStyle ? { value: result.imageryStyle, confidence: 65, source: 'Style detection' } : undefined,
      };

      setProgress({ stage: 'complete', progress: 100, message: 'Analysis complete!' });
      
      setTimeout(() => {
        onExtract(extractedBrand, previews[0]);
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
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-light tracking-tight mb-2">Upload Brand Images</h2>
        <p className="text-muted">
          We&apos;ll extract colors and visual patterns from your logos and brand assets
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="relative border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-muted"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <svg className="w-12 h-12 mx-auto mb-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-lg mb-2">Drop images here</p>
        <p className="text-sm text-muted">or click to browse (PNG, JPG, SVG)</p>
      </div>

      {/* Image Previews */}
      {previews.length > 0 && (
        <div className="mt-6 grid grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
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
        disabled={files.length === 0 || (progress?.stage !== 'error' && progress?.stage !== 'complete' && progress !== null)}
        className="w-full mt-8 py-4 bg-foreground text-background rounded-xl text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        {progress && progress.stage !== 'error' && progress.stage !== 'complete'
          ? 'Analyzing...'
          : `Analyze ${files.length} Image${files.length !== 1 ? 's' : ''}`
        }
      </button>

      {/* Tips */}
      <div className="mt-8 p-4 bg-surface rounded-lg">
        <h4 className="text-xs uppercase tracking-widest text-muted mb-3">Tips for best results</h4>
        <ul className="space-y-2 text-sm text-muted">
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            Upload your primary logo in high resolution
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            Include logo variants (icon, wordmark, full logo)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            Add brand photography or illustrations
          </li>
        </ul>
      </div>
    </div>
  );
}
















