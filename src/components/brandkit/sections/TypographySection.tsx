'use client';

import { useState } from 'react';
import { useBrandKitStore, FontConfig, TypeScale } from '@/lib/brandKitStore';

interface TypographySectionProps {
  brandId: string;
}

const fontCategories = [
  { id: 'heading', label: 'Heading' },
  { id: 'body', label: 'Body' },
  { id: 'accent', label: 'Accent' },
  { id: 'monospace', label: 'Monospace' },
] as const;

const defaultWebFonts = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Playfair Display',
  'Merriweather',
  'Source Sans Pro',
  'Raleway',
  'Work Sans',
  'DM Sans',
  'Space Grotesk',
  'IBM Plex Sans',
  'IBM Plex Mono',
  'JetBrains Mono',
  'Fira Code',
];

export default function TypographySection({ brandId }: TypographySectionProps) {
  const { getCurrentBrandKit, addFont, deleteFont, updateTypography } = useBrandKitStore();
  const brandKit = getCurrentBrandKit(brandId);
  const [isAddingFont, setIsAddingFont] = useState(false);
  const [newFont, setNewFont] = useState({
    name: '',
    family: '',
    category: 'heading' as FontConfig['category'],
    weights: [400, 700],
    styles: ['normal'] as ('normal' | 'italic')[],
  });

  const handleAddFont = () => {
    if (!newFont.name.trim() || !newFont.family.trim()) return;
    
    addFont(brandId, {
      name: newFont.name,
      family: newFont.family,
      category: newFont.category,
      weights: newFont.weights,
      styles: newFont.styles,
    });
    
    setNewFont({
      name: '',
      family: '',
      category: 'heading',
      weights: [400, 700],
      styles: ['normal'],
    });
    setIsAddingFont(false);
  };

  const handleDeleteFont = (fontId: string) => {
    deleteFont(brandId, fontId);
  };

  const handleUpdateScale = (index: number, updates: Partial<TypeScale>) => {
    const newScale = [...brandKit.typography.scale];
    newScale[index] = { ...newScale[index], ...updates };
    updateTypography(brandId, { scale: newScale });
  };

  const handleUpdatePairing = (key: 'heading' | 'body' | 'accent', value: string) => {
    updateTypography(brandId, {
      pairing: { ...brandKit.typography.pairing, [key]: value },
    });
  };

  return (
    <div className="space-y-8">
      {/* Font Library */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs uppercase tracking-widest text-muted">Font Library</h4>
          {!isAddingFont && (
            <button
              onClick={() => setIsAddingFont(true)}
              className="text-xs text-muted hover:text-foreground transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Font
            </button>
          )}
        </div>

        {/* Add Font Form */}
        {isAddingFont && (
          <div className="p-4 bg-surface rounded-lg space-y-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted mb-1">Font Name</label>
                <input
                  type="text"
                  value={newFont.name}
                  onChange={(e) => setNewFont({ ...newFont, name: e.target.value })}
                  placeholder="e.g., Primary Heading"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-foreground"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Font Family</label>
                <select
                  value={newFont.family}
                  onChange={(e) => setNewFont({ ...newFont, family: e.target.value, name: newFont.name || e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-foreground"
                >
                  <option value="">Select a font...</option>
                  {defaultWebFonts.map((font) => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                  <option value="custom">Custom Font...</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted mb-1">Category</label>
                <select
                  value={newFont.category}
                  onChange={(e) => setNewFont({ ...newFont, category: e.target.value as FontConfig['category'] })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-foreground"
                >
                  {fontCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Weights</label>
                <div className="flex flex-wrap gap-2">
                  {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((weight) => (
                    <label key={weight} className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={newFont.weights.includes(weight)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewFont({ ...newFont, weights: [...newFont.weights, weight].sort() });
                          } else {
                            setNewFont({ ...newFont, weights: newFont.weights.filter((w) => w !== weight) });
                          }
                        }}
                        className="w-3 h-3"
                      />
                      {weight}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAddingFont(false)}
                className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFont}
                disabled={!newFont.name.trim() || !newFont.family.trim()}
                className="px-4 py-2 text-sm bg-foreground text-background rounded-lg hover:opacity-90 disabled:opacity-30 transition-all"
              >
                Add Font
              </button>
            </div>
          </div>
        )}

        {/* Font List */}
        {brandKit.typography.fonts.length === 0 && !isAddingFont ? (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
            <svg className="w-12 h-12 mx-auto mb-3 text-muted opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
            <p className="text-muted text-sm">No fonts added yet</p>
            <p className="text-xs text-muted mt-1">Add fonts to define your typography system</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {brandKit.typography.fonts.map((font) => (
              <FontCard
                key={font.id}
                font={font}
                onDelete={() => handleDeleteFont(font.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Font Pairing */}
      <div>
        <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Font Pairing</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-muted mb-2">Headings</label>
            <select
              value={brandKit.typography.pairing.heading}
              onChange={(e) => handleUpdatePairing('heading', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm outline-none focus:border-foreground"
            >
              <option value="system-ui">System UI</option>
              {brandKit.typography.fonts.map((font) => (
                <option key={font.id} value={font.family}>{font.name}</option>
              ))}
              {defaultWebFonts.map((font) => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-2">Body</label>
            <select
              value={brandKit.typography.pairing.body}
              onChange={(e) => handleUpdatePairing('body', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm outline-none focus:border-foreground"
            >
              <option value="system-ui">System UI</option>
              {brandKit.typography.fonts.map((font) => (
                <option key={font.id} value={font.family}>{font.name}</option>
              ))}
              {defaultWebFonts.map((font) => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-2">Accent (Optional)</label>
            <select
              value={brandKit.typography.pairing.accent || ''}
              onChange={(e) => handleUpdatePairing('accent', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm outline-none focus:border-foreground"
            >
              <option value="">None</option>
              {brandKit.typography.fonts.map((font) => (
                <option key={font.id} value={font.family}>{font.name}</option>
              ))}
              {defaultWebFonts.map((font) => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Type Scale */}
      <div>
        <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Type Scale</h4>
        <div className="space-y-4">
          {brandKit.typography.scale.map((style, index) => (
            <TypeScaleRow
              key={style.name}
              scale={style}
              headingFont={brandKit.typography.pairing.heading}
              bodyFont={brandKit.typography.pairing.body}
              onChange={(updates) => handleUpdateScale(index, updates)}
            />
          ))}
        </div>
      </div>

      {/* Typography Preview */}
      <div className="p-6 bg-surface rounded-xl">
        <h4 className="text-xs uppercase tracking-widest text-muted mb-6">Preview</h4>
        <div className="space-y-4" style={{ fontFamily: brandKit.typography.pairing.body }}>
          <h1 
            className="text-4xl font-bold" 
            style={{ fontFamily: brandKit.typography.pairing.heading }}
          >
            The quick brown fox
          </h1>
          <h2 
            className="text-2xl font-semibold" 
            style={{ fontFamily: brandKit.typography.pairing.heading }}
          >
            Jumps over the lazy dog
          </h2>
          <p className="text-base leading-relaxed">
            Typography is the art and technique of arranging type to make written language legible, 
            readable and appealing when displayed. The arrangement of type involves selecting typefaces, 
            point sizes, line lengths, line-spacing, and letter-spacing.
          </p>
          <p className="text-sm text-muted">
            Caption text with smaller size and muted color for supplementary information.
          </p>
        </div>
      </div>
    </div>
  );
}

interface FontCardProps {
  font: FontConfig;
  onDelete: () => void;
}

function FontCard({ font, onDelete }: FontCardProps) {
  return (
    <div className="p-4 bg-surface rounded-lg group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium">{font.name}</p>
          <p className="text-xs text-muted">{font.family}</p>
        </div>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-500 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      <p 
        className="text-2xl mb-2 truncate" 
        style={{ fontFamily: font.family }}
      >
        Aa Bb Cc 123
      </p>
      <div className="flex flex-wrap gap-1">
        {font.weights.map((weight) => (
          <span key={weight} className="px-2 py-0.5 text-xs bg-background rounded">
            {weight}
          </span>
        ))}
      </div>
      <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-background rounded capitalize">
        {font.category}
      </span>
    </div>
  );
}

interface TypeScaleRowProps {
  scale: TypeScale;
  headingFont: string;
  bodyFont: string;
  onChange: (updates: Partial<TypeScale>) => void;
}

function TypeScaleRow({ scale, headingFont, bodyFont, onChange }: TypeScaleRowProps) {
  const isHeading = scale.name.startsWith('H');
  const font = isHeading ? headingFont : bodyFont;

  return (
    <div className="flex items-center gap-4 p-3 bg-surface rounded-lg">
      <div className="w-20">
        <span className="text-xs font-medium text-muted">{scale.name}</span>
      </div>
      <div className="flex-1">
        <span 
          style={{ 
            fontFamily: font,
            fontSize: scale.fontSize,
            fontWeight: scale.fontWeight,
            lineHeight: scale.lineHeight,
            letterSpacing: scale.letterSpacing,
          }}
        >
          Sample Text
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <input
          type="text"
          value={scale.fontSize}
          onChange={(e) => onChange({ fontSize: e.target.value })}
          className="w-16 px-2 py-1 bg-background border border-border rounded text-center"
          title="Font Size"
        />
        <input
          type="number"
          value={scale.fontWeight}
          onChange={(e) => onChange({ fontWeight: parseInt(e.target.value) })}
          className="w-16 px-2 py-1 bg-background border border-border rounded text-center"
          step={100}
          min={100}
          max={900}
          title="Font Weight"
        />
        <input
          type="text"
          value={scale.lineHeight}
          onChange={(e) => onChange({ lineHeight: e.target.value })}
          className="w-12 px-2 py-1 bg-background border border-border rounded text-center"
          title="Line Height"
        />
      </div>
    </div>
  );
}















