'use client';

import { useState } from 'react';
import { useCurrentBrand } from '@/lib/store';

interface SearchResult {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  source: string;
}

interface PinterestSearchProps {
  onSelectImage: (imageUrl: string) => void;
}

export default function PinterestSearch({ onSelectImage }: PinterestSearchProps) {
  const brandDNA = useCurrentBrand();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');

  // Suggested searches based on brand DNA
  const suggestedSearches = brandDNA?.keywords?.length
    ? [
        `${brandDNA.keywords[0]} aesthetic`,
        `${brandDNA.keywords.slice(0, 2).join(' ')} design`,
        `${brandDNA.name} style inspiration`,
        brandDNA.tone.minimal > 70 ? 'minimal design aesthetic' : null,
        brandDNA.tone.bold > 70 ? 'bold graphic design' : null,
        brandDNA.tone.playful > 70 ? 'playful colorful design' : null,
      ].filter(Boolean)
    : [
        'minimal brand aesthetic',
        'bold typography design',
        'luxury brand inspiration',
        'modern visual identity',
        'editorial design layout',
      ];

  const search = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setIsSearching(true);
    setQuery(q);
    setMessage('');

    try {
      const response = await fetch('/api/search-pinterest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, num: 20 }),
      });

      const data = await response.json();
      
      if (data.message) {
        setMessage(data.message);
      }
      
      setResults(data.images || []);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
      setMessage('Search failed. Please try again.');
    }

    setIsSearching(false);
  };

  const smartSearch = async () => {
    if (!query.trim()) return;
    
    setIsExpanding(true);
    
    try {
      const response = await fetch('/api/expand-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query, brandDNA }),
      });
      
      const data = await response.json();
      
      if (data.queries && data.queries.length > 0) {
        // Search with the first expanded query
        await search(data.queries[0]);
      } else {
        await search();
      }
    } catch (error) {
      console.error('Smart search failed:', error);
      await search();
    }
    
    setIsExpanding(false);
  };

  const toggleSelect = (url: string) => {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  };

  const addSelectedToBoard = () => {
    selectedImages.forEach((url) => {
      onSelectImage(url);
    });
    setSelectedImages(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="bg-surface rounded-xl p-6">
        <label className="block text-xs uppercase tracking-widest text-muted mb-4">
          Search Pinterest for Inspiration
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="e.g. minimal luxury branding, bold typography, earthy color palette..."
            className="flex-1 bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-foreground transition-colors"
          />
          <button
            onClick={() => search()}
            disabled={!query.trim() || isSearching}
            className="px-6 py-3 bg-foreground text-background rounded-lg font-medium hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          <button
            onClick={smartSearch}
            disabled={!query.trim() || isSearching || isExpanding}
            className="px-4 py-3 border border-border rounded-lg font-medium hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="AI-powered search expansion"
          >
            {isExpanding ? '✨' : '🪄'}
          </button>
        </div>

        {/* Suggested Searches */}
        <div className="mt-4">
          <p className="text-xs text-muted mb-2">Suggested searches:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedSearches.slice(0, 5).map((suggestion, i) => (
              <button
                key={i}
                onClick={() => search(suggestion as string)}
                className="px-3 py-1.5 bg-background hover:bg-border/50 border border-border rounded-full text-sm text-muted hover:text-foreground transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="p-4 border border-border bg-surface rounded-lg">
          <p className="text-sm text-muted">{message}</p>
        </div>
      )}

      {/* Results Grid */}
      {results.length > 0 && (
        <div className="bg-surface rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">
              Results for &ldquo;{query}&rdquo;
            </h3>
            {selectedImages.size > 0 && (
              <button
                onClick={addSelectedToBoard}
                className="px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
              >
                Add {selectedImages.size} to Board
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {results.map((result) => (
              <div
                key={result.id}
                onClick={() => toggleSelect(result.url)}
                className={`relative group rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                  selectedImages.has(result.url)
                    ? 'border-foreground'
                    : 'border-transparent hover:border-border'
                }`}
              >
                <img
                  src={result.thumbnail}
                  alt={result.title}
                  className="w-full h-32 object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />

                {/* Selection indicator */}
                {selectedImages.has(result.url) && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-foreground text-background rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-xs font-medium px-2 text-center line-clamp-2">
                    {selectedImages.has(result.url) ? 'Selected' : 'Click to select'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted mt-4 text-center">
            Click images to select, then add to your inspiration board
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isSearching && results.length === 0 && query && !message && (
        <div className="bg-surface rounded-xl p-8 text-center">
          <p className="text-muted">No results found. Try different keywords.</p>
        </div>
      )}
    </div>
  );
}

