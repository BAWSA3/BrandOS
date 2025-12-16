'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useBrandStore } from '@/lib/store';
import { BrandDNA } from '@/lib/types';

export default function SharedBrand() {
  const params = useParams();
  const token = params.token as string;
  const { theme, toggleTheme, createBrand, setBrandDNA, switchBrand, brands } = useBrandStore();
  
  const [sharedBrand, setSharedBrand] = useState<BrandDNA | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imported, setImported] = useState(false);

  useEffect(() => {
    const fetchSharedBrand = async () => {
      try {
        const res = await fetch(`/api/brands/share?token=${token}`);
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || 'Failed to load shared brand');
          return;
        }
        
        setSharedBrand(data.brand);
      } catch (err) {
        console.error(err);
        setError('Failed to load shared brand');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedBrand();
  }, [token]);

  const handleImport = () => {
    if (!sharedBrand) return;
    
    // Create new brand and apply the shared settings
    createBrand(sharedBrand.name + ' (Imported)');
    
    // Get the newly created brand and update it
    const newBrand = brands[brands.length - 1];
    if (newBrand) {
      switchBrand(newBrand.id);
      setBrandDNA({
        colors: sharedBrand.colors,
        tone: sharedBrand.tone,
        keywords: sharedBrand.keywords,
        doPatterns: sharedBrand.doPatterns,
        dontPatterns: sharedBrand.dontPatterns,
        voiceSamples: sharedBrand.voiceSamples,
      });
    }
    
    setImported(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-light mb-4">Oops!</h1>
          <p className="text-muted mb-8">{error}</p>
          <a href="/" className="px-6 py-3 bg-foreground text-background rounded-full text-sm font-medium">
            Go to brandos
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="text-sm font-medium tracking-tight hover:text-muted transition-colors">
            brandos
          </a>
          <button
            onClick={toggleTheme}
            className="p-2 text-muted hover:text-foreground transition-colors"
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="pt-14">
        <section className="py-20 px-6 text-center border-b border-border">
          <p className="text-xs uppercase tracking-widest text-muted mb-4">Shared Brand Guidelines</p>
          <h1 className="text-5xl font-light tracking-tight mb-4">{sharedBrand?.name}</h1>
        </section>

        <section className="max-w-2xl mx-auto px-6 py-16">
          {/* Import Button */}
          <div className="mb-16 text-center">
            {imported ? (
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/10 text-green-500 rounded-full">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Imported! Go to <a href="/" className="underline">brandos</a> to use it.
              </div>
            ) : (
              <button
                onClick={handleImport}
                className="px-8 py-3 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-80 transition-opacity"
              >
                Import to My Brands
              </button>
            )}
          </div>

          {/* Brand Preview */}
          <div className="border border-border rounded-lg p-8">
            {/* Colors */}
            {sharedBrand?.colors && (
              <div className="mb-12">
                <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Brand Colors</h4>
                <div className="flex gap-4">
                  {Object.entries(sharedBrand.colors).map(([key, value]) => (
                    <div key={key} className="flex-1">
                      <div className="h-16 rounded-lg mb-2" style={{ backgroundColor: value }} />
                      <p className="text-xs text-muted capitalize">{key}</p>
                      <p className="text-xs font-mono">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tone */}
            {sharedBrand?.tone && (
              <div className="mb-12">
                <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Tone Profile</h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(sharedBrand.tone).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-border">
                      <span className="text-sm capitalize">{key}</span>
                      <span className="text-sm text-muted">{value}/100</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords */}
            {sharedBrand?.keywords && sharedBrand.keywords.length > 0 && (
              <div className="mb-12">
                <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {sharedBrand.keywords.map((k, i) => (
                    <span key={i} className="px-3 py-1 bg-surface rounded-full text-sm">{k}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Do/Don't */}
            <div className="grid grid-cols-2 gap-8 mb-12">
              {sharedBrand?.doPatterns && sharedBrand.doPatterns.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Do</h4>
                  {sharedBrand.doPatterns.map((p, i) => (
                    <p key={i} className="text-sm flex items-start gap-2 mb-2">
                      <span className="text-green-500">✓</span>{p}
                    </p>
                  ))}
                </div>
              )}
              {sharedBrand?.dontPatterns && sharedBrand.dontPatterns.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Don&apos;t</h4>
                  {sharedBrand.dontPatterns.map((p, i) => (
                    <p key={i} className="text-sm flex items-start gap-2 mb-2">
                      <span className="text-red-500">✗</span>{p}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Voice Samples */}
            {sharedBrand?.voiceSamples && sharedBrand.voiceSamples.length > 0 && (
              <div>
                <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Voice Samples</h4>
                {sharedBrand.voiceSamples.map((s, i) => (
                  <blockquote key={i} className="p-4 bg-surface rounded-lg text-sm italic mb-3">&ldquo;{s}&rdquo;</blockquote>
                ))}
              </div>
            )}
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

