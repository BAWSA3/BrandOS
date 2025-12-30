'use client';

import { useState } from 'react';
import { useCurrentBrand } from '@/lib/store';
import { Platform, PlatformAdaptation } from '@/lib/types';

const PLATFORMS: { id: Platform; name: string; icon: string; color: string }[] = [
  { id: 'twitter', name: 'X / Twitter', icon: '𝕏', color: 'bg-zinc-800' },
  { id: 'instagram', name: 'Instagram', icon: '📷', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'in', color: 'bg-blue-600' },
  { id: 'website', name: 'Website', icon: '🌐', color: 'bg-zinc-700' },
  { id: 'email', name: 'Email', icon: '✉️', color: 'bg-zinc-600' },
  { id: 'tiktok', name: 'TikTok', icon: '♪', color: 'bg-black' },
];

export default function PlatformAdapter() {
  const brandDNA = useCurrentBrand();
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(new Set(['twitter', 'instagram', 'linkedin']));
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptation, setAdaptation] = useState<PlatformAdaptation | null>(null);
  const [error, setError] = useState('');

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  };

  const adaptContent = async () => {
    if (!content.trim() || !brandDNA || selectedPlatforms.size === 0) return;
    
    setIsAdapting(true);
    setError('');
    setAdaptation(null);

    try {
      const response = await fetch('/api/platform-adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandDNA,
          content,
          platforms: Array.from(selectedPlatforms),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setAdaptation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adapt content');
    }

    setIsAdapting(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-8">
      {/* Content Input */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-muted mb-4">
          Original Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your content here. We'll adapt it for each selected platform while maintaining your brand voice."
          className="w-full h-40 bg-transparent text-base border border-border rounded-lg px-4 py-3 outline-none placeholder:text-muted focus:border-foreground transition-colors resize-none"
        />
      </div>

      {/* Platform Selection */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-muted mb-4">
          Select Platforms
        </label>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {PLATFORMS.map((platform) => (
            <button
              key={platform.id}
              onClick={() => togglePlatform(platform.id)}
              className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                selectedPlatforms.has(platform.id)
                  ? 'border-foreground bg-surface'
                  : 'border-border hover:border-muted'
              }`}
            >
              <span className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center text-white text-lg`}>
                {platform.icon}
              </span>
              <span className="text-xs">{platform.name}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={adaptContent}
        disabled={!content.trim() || selectedPlatforms.size === 0 || isAdapting}
        className="w-full py-3 bg-foreground text-background rounded-full text-sm font-medium disabled:opacity-30 transition-opacity hover:opacity-80"
      >
        {isAdapting ? 'Adapting...' : `Adapt for ${selectedPlatforms.size} Platform${selectedPlatforms.size !== 1 ? 's' : ''}`}
      </button>

      {error && (
        <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-lg">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Adaptations */}
      {adaptation && (
        <div className="space-y-4 animate-fade-in">
          {Object.entries(adaptation.adaptations).map(([platform, data]) => {
            const platformInfo = PLATFORMS.find(p => p.id === platform);
            return (
              <div key={platform} className="border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 ${platformInfo?.color} rounded-lg flex items-center justify-center text-white text-sm`}>
                      {platformInfo?.icon}
                    </span>
                    <span className="font-medium">{platformInfo?.name}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(data.content)}
                    className="text-xs text-muted hover:text-foreground transition-colors"
                  >
                    Copy
                  </button>
                </div>
                
                <div className="p-4 bg-surface rounded-lg mb-4">
                  <p className="text-sm whitespace-pre-wrap">{data.content}</p>
                </div>

                {data.adjustments.length > 0 && (
                  <div>
                    <p className="text-xs text-muted mb-2">Adjustments made:</p>
                    <div className="flex flex-wrap gap-2">
                      {data.adjustments.map((adj, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-background rounded-full">
                          {adj}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

