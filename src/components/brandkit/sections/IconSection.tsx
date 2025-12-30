'use client';

import { useState, useRef } from 'react';
import { useBrandKitStore, IconAsset } from '@/lib/brandKitStore';

interface IconSectionProps {
  brandId: string;
}

const iconStyles = [
  { id: 'outline', label: 'Outline' },
  { id: 'filled', label: 'Filled' },
  { id: 'duotone', label: 'Duotone' },
] as const;

const defaultCategories = [
  'Navigation',
  'Actions',
  'Social',
  'Communication',
  'Media',
  'Commerce',
  'Misc',
];

export default function IconSection({ brandId }: IconSectionProps) {
  const { getCurrentBrandKit, addIcon, updateIcon, deleteIcon } = useBrandKitStore();
  const brandKit = getCurrentBrandKit(brandId);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file);
      
      addIcon(brandId, {
        name: file.name.replace(/\.[^/.]+$/, ''),
        url,
        category: 'Misc',
        sizes: [24],
        style: 'outline',
      });
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpdateIcon = (iconId: string, updates: Partial<IconAsset>) => {
    updateIcon(brandId, iconId, updates);
  };

  const handleDeleteIcon = (iconId: string) => {
    deleteIcon(brandId, iconId);
    setSelectedIcon(null);
  };

  // Get unique categories from icons
  const categories = Array.from(new Set([
    ...defaultCategories,
    ...brandKit.icons.map((i) => i.category),
  ]));

  const filteredIcons = activeFilter === 'all'
    ? brandKit.icons
    : brandKit.icons.filter((icon) => icon.category === activeFilter);

  // Group by category
  const iconsByCategory = filteredIcons.reduce((acc, icon) => {
    if (!acc[icon.category]) acc[icon.category] = [];
    acc[icon.category].push(icon);
    return acc;
  }, {} as Record<string, IconAsset[]>);

  return (
    <div className="space-y-6">
      {/* Upload & Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".svg,image/svg+xml,.png"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-foreground text-background rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {isUploading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
            Upload Icons
          </button>
          <span className="text-xs text-muted">SVG recommended</span>
        </div>

        {/* Style Filter */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              activeFilter === 'all' ? 'bg-foreground text-background' : 'hover:bg-surface'
            }`}
          >
            All
          </button>
          {iconStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => setActiveFilter(style.id)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                activeFilter === style.id ? 'bg-foreground text-background' : 'hover:bg-surface'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* Icon Grid */}
      {brandKit.icons.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <svg className="w-16 h-16 mx-auto mb-4 text-muted opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
          </svg>
          <p className="text-muted mb-2">No icons uploaded yet</p>
          <p className="text-xs text-muted">Upload SVG icons to build your icon library</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(iconsByCategory).map(([category, icons]) => (
            <div key={category}>
              <h4 className="text-xs uppercase tracking-widest text-muted mb-4">{category}</h4>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {icons.map((icon) => (
                  <IconCard
                    key={icon.id}
                    icon={icon}
                    isSelected={selectedIcon === icon.id}
                    onSelect={() => setSelectedIcon(selectedIcon === icon.id ? null : icon.id)}
                    onUpdate={(updates) => handleUpdateIcon(icon.id, updates)}
                    onDelete={() => handleDeleteIcon(icon.id)}
                    categories={categories}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Icon Usage Guidelines */}
      {brandKit.icons.length > 0 && (
        <div className="p-4 bg-surface rounded-lg">
          <h4 className="text-xs uppercase tracking-widest text-muted mb-3">Icon Guidelines</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium mb-2">Sizing</p>
              <ul className="space-y-1 text-muted text-xs">
                <li>• Small: 16px</li>
                <li>• Default: 24px</li>
                <li>• Large: 32px</li>
                <li>• XL: 48px</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Best Practices</p>
              <ul className="space-y-1 text-muted text-xs">
                <li>• Use consistent stroke width</li>
                <li>• Maintain optical balance</li>
                <li>• Match icon style to context</li>
                <li>• Ensure accessibility contrast</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface IconCardProps {
  icon: IconAsset;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<IconAsset>) => void;
  onDelete: () => void;
  categories: string[];
}

function IconCard({ icon, isSelected, onSelect, onUpdate, onDelete, categories }: IconCardProps) {
  return (
    <div className="relative group">
      {/* Icon Preview */}
      <div
        className={`aspect-square bg-surface rounded-xl flex items-center justify-center cursor-pointer transition-all hover:bg-border ${
          isSelected ? 'ring-2 ring-foreground bg-border' : ''
        }`}
        onClick={onSelect}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={icon.url}
          alt={icon.name}
          className="w-6 h-6 object-contain"
        />
      </div>

      {/* Icon Name Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {icon.name}
      </div>

      {/* Edit Panel */}
      {isSelected && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-10 bg-background border border-border rounded-lg shadow-xl p-4 space-y-3 animate-fade-in w-56">
          <div className="flex justify-center mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={icon.url} alt={icon.name} className="w-12 h-12 object-contain" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Name</label>
            <input
              type="text"
              value={icon.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="w-full px-2 py-1 text-sm bg-surface border border-border rounded outline-none focus:border-foreground"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Category</label>
            <select
              value={icon.category}
              onChange={(e) => onUpdate({ category: e.target.value })}
              className="w-full px-2 py-1 text-sm bg-surface border border-border rounded outline-none focus:border-foreground"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Style</label>
            <select
              value={icon.style}
              onChange={(e) => onUpdate({ style: e.target.value as IconAsset['style'] })}
              className="w-full px-2 py-1 text-sm bg-surface border border-border rounded outline-none focus:border-foreground"
            >
              {iconStyles.map((style) => (
                <option key={style.id} value={style.id}>{style.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Available Sizes</label>
            <div className="flex flex-wrap gap-1">
              {[16, 20, 24, 32, 48, 64].map((size) => (
                <label key={size} className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={icon.sizes.includes(size)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onUpdate({ sizes: [...icon.sizes, size].sort((a, b) => a - b) });
                      } else {
                        onUpdate({ sizes: icon.sizes.filter((s) => s !== size) });
                      }
                    }}
                    className="w-3 h-3"
                  />
                  {size}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-between pt-2">
            <button
              onClick={onDelete}
              className="text-xs text-red-500 hover:text-red-400"
            >
              Delete
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















