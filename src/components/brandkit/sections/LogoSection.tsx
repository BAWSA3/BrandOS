'use client';

import { useState, useRef } from 'react';
import { useBrandKitStore, LogoAsset } from '@/lib/brandKitStore';

interface LogoSectionProps {
  brandId: string;
}

const logoTypes = [
  { id: 'primary', label: 'Primary Logo' },
  { id: 'secondary', label: 'Secondary' },
  { id: 'icon', label: 'Icon/Mark' },
  { id: 'wordmark', label: 'Wordmark' },
  { id: 'monochrome', label: 'Monochrome' },
] as const;

export default function LogoSection({ brandId }: LogoSectionProps) {
  const { getCurrentBrandKit, addLogo, updateLogo, deleteLogo } = useBrandKitStore();
  const brandKit = getCurrentBrandKit(brandId);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // For now, create object URL (in production, upload to server)
    const url = URL.createObjectURL(file);
    
    addLogo(brandId, {
      name: file.name.replace(/\.[^/.]+$/, ''),
      type: 'primary',
      url,
      fileType: file.type,
      clearSpace: 10,
      minSize: 32,
      usageNotes: '',
    });

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpdateLogo = (logoId: string, updates: Partial<LogoAsset>) => {
    updateLogo(brandId, logoId, updates);
  };

  const handleDeleteLogo = (logoId: string) => {
    deleteLogo(brandId, logoId);
    setSelectedLogo(null);
  };

  // Group logos by type
  const logosByType = brandKit.logos.reduce((acc, logo) => {
    if (!acc[logo.type]) acc[logo.type] = [];
    acc[logo.type].push(logo);
    return acc;
  }, {} as Record<string, LogoAsset[]>);

  return (
    <div className="space-y-6">
      {/* Upload Button */}
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.svg"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-dashed border-border rounded-lg hover:border-foreground transition-colors"
        >
          {isUploading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          )}
          Upload Logo
        </button>
        <span className="text-xs text-muted">PNG, SVG, or JPG (recommended: SVG for scalability)</span>
      </div>

      {/* Logo Display */}
      {brandKit.logos.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <svg className="w-16 h-16 mx-auto mb-4 text-muted opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-muted mb-2">No logos uploaded yet</p>
          <p className="text-xs text-muted">Upload your brand logos to organize and manage them</p>
        </div>
      ) : (
        <div className="space-y-8">
          {logoTypes.map((type) => {
            const logos = logosByType[type.id] || [];
            if (logos.length === 0) return null;

            return (
              <div key={type.id}>
                <h4 className="text-xs uppercase tracking-widest text-muted mb-4">{type.label}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {logos.map((logo) => (
                    <LogoCard
                      key={logo.id}
                      logo={logo}
                      isSelected={selectedLogo === logo.id}
                      onSelect={() => setSelectedLogo(selectedLogo === logo.id ? null : logo.id)}
                      onUpdate={(updates) => handleUpdateLogo(logo.id, updates)}
                      onDelete={() => handleDeleteLogo(logo.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Ungrouped logos */}
          {brandKit.logos.filter((l) => !logosByType[l.type]?.includes(l)).length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Uncategorized</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {brandKit.logos
                  .filter((l) => !Object.keys(logosByType).includes(l.type))
                  .map((logo) => (
                    <LogoCard
                      key={logo.id}
                      logo={logo}
                      isSelected={selectedLogo === logo.id}
                      onSelect={() => setSelectedLogo(selectedLogo === logo.id ? null : logo.id)}
                      onUpdate={(updates) => handleUpdateLogo(logo.id, updates)}
                      onDelete={() => handleDeleteLogo(logo.id)}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Logo Usage Guidelines */}
      {brandKit.logos.length > 0 && (
        <div className="mt-8 p-4 bg-surface rounded-lg">
          <h4 className="text-xs uppercase tracking-widest text-muted mb-3">Usage Guidelines</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Use approved logo files only</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Maintain minimum clear space</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-500">✗</span>
              <span>Don&apos;t stretch or distort</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-500">✗</span>
              <span>Don&apos;t change colors</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface LogoCardProps {
  logo: LogoAsset;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<LogoAsset>) => void;
  onDelete: () => void;
}

function LogoCard({ logo, isSelected, onSelect, onUpdate, onDelete }: LogoCardProps) {
  return (
    <div className="relative group">
      {/* Logo Preview */}
      <div
        className={`aspect-square bg-white dark:bg-neutral-900 border rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
          isSelected ? 'border-foreground ring-2 ring-foreground/20' : 'border-border'
        }`}
        onClick={onSelect}
      >
        <div className="w-full h-full p-4 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo.url}
            alt={logo.name}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </div>

      {/* Logo Info */}
      <div className="mt-2">
        <p className="text-sm font-medium truncate">{logo.name}</p>
        <p className="text-xs text-muted capitalize">{logo.type}</p>
      </div>

      {/* Edit Panel */}
      {isSelected && (
        <div className="absolute top-full left-0 right-0 mt-2 z-10 bg-background border border-border rounded-lg shadow-xl p-4 space-y-3 animate-fade-in">
          <div>
            <label className="block text-xs text-muted mb-1">Name</label>
            <input
              type="text"
              value={logo.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="w-full px-2 py-1 text-sm bg-surface border border-border rounded outline-none focus:border-foreground"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Type</label>
            <select
              value={logo.type}
              onChange={(e) => onUpdate({ type: e.target.value as LogoAsset['type'] })}
              className="w-full px-2 py-1 text-sm bg-surface border border-border rounded outline-none focus:border-foreground"
            >
              {logoTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Clear Space (%)</label>
            <input
              type="number"
              value={logo.clearSpace}
              onChange={(e) => onUpdate({ clearSpace: parseInt(e.target.value) || 0 })}
              min={0}
              max={50}
              className="w-full px-2 py-1 text-sm bg-surface border border-border rounded outline-none focus:border-foreground"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Min Size (px)</label>
            <input
              type="number"
              value={logo.minSize}
              onChange={(e) => onUpdate({ minSize: parseInt(e.target.value) || 0 })}
              min={0}
              className="w-full px-2 py-1 text-sm bg-surface border border-border rounded outline-none focus:border-foreground"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Usage Notes</label>
            <textarea
              value={logo.usageNotes}
              onChange={(e) => onUpdate({ usageNotes: e.target.value })}
              rows={2}
              className="w-full px-2 py-1 text-sm bg-surface border border-border rounded outline-none focus:border-foreground resize-none"
            />
          </div>
          <div className="flex justify-between pt-2">
            <button
              onClick={onDelete}
              className="text-xs text-red-500 hover:text-red-400"
            >
              Delete Logo
            </button>
            <button
              onClick={onSelect}
              className="text-xs text-muted hover:text-foreground"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}







