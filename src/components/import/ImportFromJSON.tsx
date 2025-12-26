'use client';

import { useState, useRef } from 'react';
import { ExtractedBrand, ImportProgress } from '@/lib/importTypes';
import { v4 as uuidv4 } from 'uuid';

interface ImportFromJSONProps {
  onExtract: (brand: ExtractedBrand, preview?: string) => void;
}

export default function ImportFromJSON({ onExtract }: ImportFromJSONProps) {
  const [file, setFile] = useState<File | null>(null);
  const [jsonContent, setJsonContent] = useState<string>('');
  const [inputMode, setInputMode] = useState<'file' | 'paste'>('file');
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/json') {
      setFile(selectedFile);
      setProgress(null);
      setValidationError(null);
      
      // Read file content for preview
      const text = await selectedFile.text();
      setJsonContent(text);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/json') {
      setFile(droppedFile);
      setProgress(null);
      setValidationError(null);
      
      const text = await droppedFile.text();
      setJsonContent(text);
    }
  };

  const validateAndExtract = () => {
    try {
      const data = JSON.parse(jsonContent);
      
      // Check for BrandOS format
      if (data.id && data.name && data.colors) {
        return { type: 'brandos', data };
      }
      
      // Check for generic brand format
      if (data.brand || data.brandName || data.name) {
        return { type: 'generic', data };
      }
      
      throw new Error('Unrecognized format. Please use BrandOS export or a standard brand format.');
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error('Invalid JSON format. Please check your file.');
      }
      throw e;
    }
  };

  const handleImport = async () => {
    if (!jsonContent.trim()) return;

    setProgress({ stage: 'parsing', progress: 30, message: 'Validating JSON...' });
    setValidationError(null);

    try {
      const { type, data } = validateAndExtract();

      setProgress({ stage: 'extracting', progress: 60, message: 'Extracting brand data...' });

      let extractedBrand: ExtractedBrand;

      if (type === 'brandos') {
        // Direct BrandOS format
        extractedBrand = {
          id: uuidv4(),
          source: 'json',
          sourceDetails: file?.name || 'Pasted JSON',
          overallConfidence: 100, // Direct import has full confidence
          extractedAt: new Date(),
          name: data.name ? { value: data.name, confidence: 100, source: 'BrandOS export' } : undefined,
          colors: data.colors ? {
            primary: data.colors.primary ? { value: data.colors.primary, confidence: 100, source: 'BrandOS export' } : undefined,
            secondary: data.colors.secondary ? { value: data.colors.secondary, confidence: 100, source: 'BrandOS export' } : undefined,
            accent: data.colors.accent ? { value: data.colors.accent, confidence: 100, source: 'BrandOS export' } : undefined,
          } : undefined,
          tone: data.tone ? {
            formality: data.tone.minimal !== undefined ? { value: data.tone.minimal, confidence: 100, source: 'BrandOS export' } : undefined,
            energy: data.tone.playful !== undefined ? { value: data.tone.playful, confidence: 100, source: 'BrandOS export' } : undefined,
            confidence: data.tone.bold !== undefined ? { value: data.tone.bold, confidence: 100, source: 'BrandOS export' } : undefined,
            style: data.tone.experimental !== undefined ? { value: data.tone.experimental, confidence: 100, source: 'BrandOS export' } : undefined,
          } : undefined,
          keywords: data.keywords?.map((k: string) => ({ value: k, confidence: 100, source: 'BrandOS export' })),
          doPatterns: data.doPatterns?.map((p: string) => ({ value: p, confidence: 100, source: 'BrandOS export' })),
          dontPatterns: data.dontPatterns?.map((p: string) => ({ value: p, confidence: 100, source: 'BrandOS export' })),
          voiceSamples: data.voiceSamples?.map((s: string) => ({ value: s, confidence: 100, source: 'BrandOS export' })),
        };
      } else {
        // Generic format - best effort extraction
        const brandData = data.brand || data;
        extractedBrand = {
          id: uuidv4(),
          source: 'json',
          sourceDetails: file?.name || 'Pasted JSON',
          overallConfidence: 85,
          extractedAt: new Date(),
          name: brandData.name || brandData.brandName ? { value: brandData.name || brandData.brandName, confidence: 100, source: 'JSON import' } : undefined,
          colors: brandData.colors ? {
            primary: brandData.colors.primary ? { value: brandData.colors.primary, confidence: 95, source: 'JSON import' } : undefined,
            secondary: brandData.colors.secondary ? { value: brandData.colors.secondary, confidence: 95, source: 'JSON import' } : undefined,
            accent: brandData.colors.accent || brandData.colors.highlight ? { value: brandData.colors.accent || brandData.colors.highlight, confidence: 95, source: 'JSON import' } : undefined,
          } : undefined,
          keywords: brandData.keywords || brandData.tags ? (brandData.keywords || brandData.tags).map((k: string) => ({ value: k, confidence: 90, source: 'JSON import' })) : undefined,
        };
      }

      setProgress({ stage: 'complete', progress: 100, message: 'Import complete!' });

      setTimeout(() => {
        onExtract(extractedBrand);
      }, 500);

    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Unknown error');
      setProgress({
        stage: 'error',
        progress: 0,
        message: 'Import failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        <h2 className="text-2xl font-light tracking-tight mb-2">Import JSON Data</h2>
        <p className="text-muted">
          Import a BrandOS export or any structured brand data
        </p>
      </div>

      {/* Input Mode Toggle */}
      <div className="flex gap-2 p-1 bg-surface rounded-lg mb-6">
        <button
          onClick={() => setInputMode('file')}
          className={`flex-1 py-2 px-4 rounded-md text-sm transition-colors ${
            inputMode === 'file' ? 'bg-background shadow' : 'hover:bg-border'
          }`}
        >
          Upload File
        </button>
        <button
          onClick={() => setInputMode('paste')}
          className={`flex-1 py-2 px-4 rounded-md text-sm transition-colors ${
            inputMode === 'paste' ? 'bg-background shadow' : 'hover:bg-border'
          }`}
        >
          Paste JSON
        </button>
      </div>

      {inputMode === 'file' ? (
        /* File Upload */
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
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {file ? (
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setJsonContent('');
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
              <p className="text-lg mb-2">Drop your JSON file here</p>
              <p className="text-sm text-muted">or click to browse</p>
            </>
          )}
        </div>
      ) : (
        /* Paste JSON */
        <textarea
          value={jsonContent}
          onChange={(e) => {
            setJsonContent(e.target.value);
            setValidationError(null);
            setProgress(null);
          }}
          placeholder='{"name": "Your Brand", "colors": {...}, "tone": {...}}'
          className="w-full h-64 p-4 bg-surface border border-border rounded-xl font-mono text-sm outline-none focus:border-foreground transition-colors resize-none"
        />
      )}

      {/* Validation Error */}
      {validationError && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-500">{validationError}</p>
        </div>
      )}

      {/* Progress */}
      {progress && progress.stage !== 'error' && (
        <div className="mt-8 p-6 bg-surface rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">{progress.message}</span>
            <span className="text-sm text-muted">{progress.progress}%</span>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-foreground"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Import Button */}
      <button
        onClick={handleImport}
        disabled={!jsonContent.trim() || (progress?.stage !== 'error' && progress?.stage !== 'complete' && progress !== null)}
        className="w-full mt-8 py-4 bg-foreground text-background rounded-xl text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        {progress && progress.stage !== 'error' && progress.stage !== 'complete'
          ? 'Importing...'
          : 'Import JSON'
        }
      </button>

      {/* Format Info */}
      <div className="mt-8 p-4 bg-surface rounded-lg">
        <h4 className="text-xs uppercase tracking-widest text-muted mb-3">Supported Formats</h4>
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-medium mb-1">BrandOS Export</p>
            <p className="text-muted text-xs">Direct import from BrandOS JSON export</p>
          </div>
          <div>
            <p className="font-medium mb-1">Standard Brand JSON</p>
            <p className="text-muted text-xs">Any JSON with name, colors, keywords, etc.</p>
          </div>
        </div>
      </div>
    </div>
  );
}







