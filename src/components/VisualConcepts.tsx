'use client';

import { useState, useRef } from 'react';
import { useCurrentBrand } from '@/lib/store';
import { ImageAnalysis, VisualConcept } from '@/lib/types';
import PinterestSearch from './PinterestSearch';

interface Inspiration {
  id: string;
  url: string;
  isDataUrl?: boolean;
  analysis?: ImageAnalysis;
}

export default function VisualConcepts() {
  const brandDNA = useCurrentBrand();
  const [inputMode, setInputMode] = useState<'search' | 'url'>('search');
  const [imageUrl, setImageUrl] = useState('');
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [concept, setConcept] = useState<VisualConcept | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addInspiration = async (url: string, isDataUrl = false) => {
    if (!url.trim()) return;

    const newInspiration: Inspiration = {
      id: Date.now().toString(),
      url,
      isDataUrl,
    };

    setInspirations((prev) => [...prev, newInspiration]);
    setIsAnalyzing(true);
    setError('');

    try {
      const body = isDataUrl 
        ? { imageBase64: url, brandDNA, action: 'analyze' }
        : { imageUrl: url, brandDNA, action: 'analyze' };

      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setInspirations((prev) =>
        prev.map((i) =>
          i.id === newInspiration.id ? { ...i, analysis: data } : i
        )
      );
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
      // Remove the failed inspiration
      setInspirations((prev) => prev.filter((i) => i.id !== newInspiration.id));
    }

    setIsAnalyzing(false);
    setImageUrl('');
  };

  const handleUrlSubmit = () => {
    addInspiration(imageUrl, false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      addInspiration(dataUrl, true);
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateConcept = async (inspiration: Inspiration) => {
    if (!brandDNA?.name) return;

    setSelectedImage(inspiration.id);
    setIsGenerating(true);
    setConcept(null);
    setError('');

    try {
      const body = inspiration.isDataUrl
        ? { imageBase64: inspiration.url, brandDNA, action: 'generate-concept' }
        : { imageUrl: inspiration.url, brandDNA, action: 'generate-concept' };

      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Generation failed');
      }

      setConcept(result);
    } catch (err) {
      console.error('Concept generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate concept');
    }

    setIsGenerating(false);
  };

  const removeInspiration = (id: string) => {
    setInspirations((prev) => prev.filter((i) => i.id !== id));
    if (selectedImage === id) {
      setConcept(null);
      setSelectedImage(null);
    }
  };

  const copyBrief = () => {
    if (!concept) return;
    
    const text = `# ${concept.title}

${concept.description}

## Color Palette
${concept.colorPalette.join(', ')}

## Mood
${concept.moodKeywords.join(', ')}

## Design Direction
${concept.designDirection}

## Typography
${concept.typography}

## Imagery
${concept.imagery}

## Avoid
${concept.doNotUse?.map((d) => `- ${d}`).join('\n')}`.trim();

    navigator.clipboard.writeText(text);
  };

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="py-20 px-6 text-center border-b border-border">
        <h2 className="text-5xl font-light tracking-tight mb-4">Visual Concepts.</h2>
        <p className="text-muted text-lg max-w-md mx-auto">
          Add Pinterest inspiration. Get brand-aligned visual direction.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-16">
        {!brandDNA?.name ? (
          <div className="text-center py-16">
            <p className="text-muted">Set up your Brand DNA first to generate visual concepts.</p>
          </div>
        ) : (
          <>
            {/* Input Mode Toggle */}
            <div className="flex gap-1 bg-surface rounded-lg p-1 w-fit mb-8">
              <button
                onClick={() => setInputMode('search')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  inputMode === 'search'
                    ? 'bg-foreground text-background'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                Search Pinterest
              </button>
              <button
                onClick={() => setInputMode('url')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  inputMode === 'url'
                    ? 'bg-foreground text-background'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                Paste URL / Upload
              </button>
            </div>

            {/* Search Mode */}
            {inputMode === 'search' && (
              <div className="mb-12">
                <PinterestSearch onSelectImage={(url) => addInspiration(url, false)} />
              </div>
            )}

            {/* URL / Upload Mode */}
            {inputMode === 'url' && (
              <div className="mb-12">
                <label className="block text-xs uppercase tracking-widest text-muted mb-4">
                  Add Inspiration Image
                </label>
                <p className="text-sm text-muted mb-4">
                  Paste a Pinterest image URL or upload an image file.
                </p>
                
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                    placeholder="Paste image URL (i.pinimg.com works best)..."
                    className="flex-1 bg-transparent text-base border border-border rounded-lg px-4 py-3 outline-none placeholder:text-muted focus:border-foreground transition-colors"
                  />
                  <button
                    onClick={handleUrlSubmit}
                    disabled={!imageUrl.trim() || isAnalyzing}
                    className="px-6 py-3 bg-foreground text-background rounded-lg font-medium hover:opacity-80 disabled:opacity-30 transition-opacity"
                  >
                    Add
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="mt-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="block w-full py-4 border border-dashed border-border rounded-lg text-center cursor-pointer hover:border-foreground transition-colors"
                  >
                    <span className="text-sm text-muted">
                      {isAnalyzing ? 'Analyzing...' : 'Upload Image File'}
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-8 p-4 border border-red-500/20 bg-red-500/5 rounded-lg">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {/* Inspiration Grid */}
            {inspirations.length > 0 && (
              <div className="mb-12">
                <h3 className="text-xs uppercase tracking-widest text-muted mb-4">
                  Your Inspiration Board
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {inspirations.map((insp) => (
                    <div
                      key={insp.id}
                      className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedImage === insp.id
                          ? 'border-foreground'
                          : 'border-transparent hover:border-muted'
                      }`}
                      onClick={() => generateConcept(insp)}
                    >
                      <img
                        src={insp.url}
                        alt="Inspiration"
                        className="w-full h-40 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%231d1d1f" width="100" height="100"/><text fill="%2386868b" x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="10">Failed to load</text></svg>';
                        }}
                      />

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {isGenerating && selectedImage === insp.id
                            ? 'Generating...'
                            : 'Generate Concept'}
                        </span>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeInspiration(insp.id);
                        }}
                        className="absolute top-2 right-2 w-6 h-6 bg-background/50 rounded-full text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background flex items-center justify-center"
                      >
                        ×
                      </button>

                      {/* Analysis tags */}
                      {insp.analysis && (
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background/90 to-transparent">
                          <div className="flex flex-wrap gap-1">
                            {insp.analysis.mood.slice(0, 2).map((m, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-0.5 bg-foreground/20 rounded-full"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generated Concept */}
            {concept && (
              <div className="border border-border rounded-lg p-8 animate-fade-in">
                <div className="mb-8">
                  <h2 className="text-3xl font-light tracking-tight mb-3">{concept.title}</h2>
                  <p className="text-muted leading-relaxed">{concept.description}</p>
                </div>

                {/* Color Palette */}
                <div className="mb-8">
                  <h3 className="text-xs uppercase tracking-widest text-muted mb-4">
                    Color Palette
                  </h3>
                  <div className="flex gap-3">
                    {concept.colorPalette.map((color, i) => (
                      <div key={i} className="text-center">
                        <div
                          className="w-16 h-16 rounded-lg border border-border"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-muted mt-2 block font-mono">
                          {color}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mood Keywords */}
                <div className="mb-8">
                  <h3 className="text-xs uppercase tracking-widest text-muted mb-4">Mood</h3>
                  <div className="flex flex-wrap gap-2">
                    {concept.moodKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-surface rounded-full text-sm"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Design Direction */}
                <div className="mb-8">
                  <h3 className="text-xs uppercase tracking-widest text-muted mb-4">
                    Design Direction
                  </h3>
                  <p className="text-sm leading-relaxed">{concept.designDirection}</p>
                </div>

                {/* Typography & Imagery */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-muted mb-4">
                      Typography
                    </h3>
                    <p className="text-sm">{concept.typography}</p>
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-muted mb-4">
                      Imagery
                    </h3>
                    <p className="text-sm">{concept.imagery}</p>
                  </div>
                </div>

                {/* Do Not Use */}
                {concept.doNotUse && concept.doNotUse.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xs uppercase tracking-widest text-red-500 mb-4">
                      Avoid
                    </h3>
                    <div className="space-y-2">
                      {concept.doNotUse.map((item, i) => (
                        <p key={i} className="text-sm flex items-start gap-2">
                          <span className="text-red-500">✗</span> {item}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Export Button */}
                <button
                  onClick={copyBrief}
                  className="w-full py-3 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  Copy Brief to Clipboard
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

