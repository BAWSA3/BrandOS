'use client';

import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useBrandKitStore, ExtendedColor } from '@/lib/brandKitStore';

interface ColorSectionProps {
  brandId: string;
}

const colorCategories = [
  { id: 'primary', label: 'Primary' },
  { id: 'secondary', label: 'Secondary' },
  { id: 'accent', label: 'Accent' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'semantic', label: 'Semantic' },
] as const;

export default function ColorSection({ brandId }: ColorSectionProps) {
  const { getCurrentBrandKit, addColor, updateColor, deleteColor } = useBrandKitStore();
  const brandKit = getCurrentBrandKit(brandId);
  const [isAddingColor, setIsAddingColor] = useState(false);
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [newColor, setNewColor] = useState({
    name: '',
    hex: '#6366f1',
    category: 'primary' as ExtendedColor['category'],
    usage: '',
  });

  const handleAddColor = () => {
    if (!newColor.name.trim()) return;
    
    addColor(brandId, {
      name: newColor.name,
      hex: newColor.hex,
      category: newColor.category,
      usage: newColor.usage,
      contrastRatio: calculateContrastRatio(newColor.hex, '#ffffff'),
    });
    
    setNewColor({ name: '', hex: '#6366f1', category: 'primary', usage: '' });
    setIsAddingColor(false);
  };

  const handleUpdateColor = (colorId: string, updates: Partial<ExtendedColor>) => {
    updateColor(brandId, colorId, updates);
  };

  const handleDeleteColor = (colorId: string) => {
    deleteColor(brandId, colorId);
    setEditingColorId(null);
  };

  // Group colors by category
  const colorsByCategory = brandKit.extendedColors.reduce((acc, color) => {
    if (!acc[color.category]) acc[color.category] = [];
    acc[color.category].push(color);
    return acc;
  }, {} as Record<string, ExtendedColor[]>);

  return (
    <div className="space-y-6">
      {/* Add Color Button */}
      {!isAddingColor && (
        <button
          onClick={() => setIsAddingColor(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-dashed border-border rounded-lg hover:border-foreground transition-colors w-full justify-center"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Color
        </button>
      )}

      {/* Add Color Form */}
      {isAddingColor && (
        <div className="p-4 bg-surface rounded-lg space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <HexColorPicker color={newColor.hex} onChange={(hex) => setNewColor({ ...newColor, hex })} />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-xs text-muted mb-1">Color Name</label>
                <input
                  type="text"
                  value={newColor.name}
                  onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                  placeholder="e.g., Brand Blue"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-foreground"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Hex Value</label>
                <input
                  type="text"
                  value={newColor.hex}
                  onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono outline-none focus:border-foreground"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Category</label>
                <select
                  value={newColor.category}
                  onChange={(e) => setNewColor({ ...newColor, category: e.target.value as ExtendedColor['category'] })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-foreground"
                >
                  {colorCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Usage Notes</label>
                <input
                  type="text"
                  value={newColor.usage}
                  onChange={(e) => setNewColor({ ...newColor, usage: e.target.value })}
                  placeholder="e.g., Primary buttons, links"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-foreground"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAddingColor(false)}
              className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddColor}
              disabled={!newColor.name.trim()}
              className="px-4 py-2 text-sm bg-foreground text-background rounded-lg hover:opacity-90 disabled:opacity-30 transition-all"
            >
              Add Color
            </button>
          </div>
        </div>
      )}

      {/* Color Palette Display */}
      {brandKit.extendedColors.length === 0 && !isAddingColor ? (
        <div className="text-center py-8 text-muted">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <p className="text-sm">No colors added yet</p>
          <p className="text-xs mt-1">Add colors to build your brand palette</p>
        </div>
      ) : (
        <div className="space-y-6">
          {colorCategories.map((category) => {
            const colors = colorsByCategory[category.id] || [];
            if (colors.length === 0) return null;
            
            return (
              <div key={category.id}>
                <h4 className="text-xs uppercase tracking-widest text-muted mb-3">{category.label}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {colors.map((color) => (
                    <ColorSwatch
                      key={color.id}
                      color={color}
                      isEditing={editingColorId === color.id}
                      onEdit={() => setEditingColorId(editingColorId === color.id ? null : color.id)}
                      onUpdate={(updates) => handleUpdateColor(color.id, updates)}
                      onDelete={() => handleDeleteColor(color.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contrast Checker */}
      {brandKit.extendedColors.length >= 2 && (
        <div className="mt-8 p-4 bg-surface rounded-lg">
          <h4 className="text-xs uppercase tracking-widest text-muted mb-3">Contrast Checker</h4>
          <div className="grid grid-cols-2 gap-4">
            {brandKit.extendedColors.slice(0, 4).map((color) => (
              <div key={color.id} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg border border-border"
                  style={{ backgroundColor: color.hex }}
                />
                <div>
                  <p className="text-sm font-medium">{color.name}</p>
                  <p className="text-xs text-muted">
                    Contrast: {calculateContrastRatio(color.hex, '#ffffff').toFixed(2)}:1
                    {calculateContrastRatio(color.hex, '#ffffff') >= 4.5 ? (
                      <span className="ml-2 text-green-500">AA ✓</span>
                    ) : (
                      <span className="ml-2 text-orange-500">Low</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ColorSwatchProps {
  color: ExtendedColor;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (updates: Partial<ExtendedColor>) => void;
  onDelete: () => void;
}

function ColorSwatch({ color, isEditing, onEdit, onUpdate, onDelete }: ColorSwatchProps) {
  const [localColor, setLocalColor] = useState(color.hex);

  return (
    <div className="relative group">
      <div
        className="aspect-square rounded-xl border border-border cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
        style={{ backgroundColor: color.hex }}
        onClick={onEdit}
      />
      <div className="mt-2">
        <p className="text-sm font-medium truncate">{color.name}</p>
        <p className="text-xs font-mono text-muted">{color.hex}</p>
      </div>

      {/* Edit overlay */}
      {isEditing && (
        <div className="absolute top-full left-0 mt-2 z-10 w-56 bg-background border border-border rounded-lg shadow-xl p-3 space-y-3 animate-fade-in">
          <HexColorPicker
            color={localColor}
            onChange={(hex) => {
              setLocalColor(hex);
              onUpdate({ hex });
            }}
          />
          <input
            type="text"
            value={color.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full px-2 py-1 text-sm bg-surface border border-border rounded outline-none focus:border-foreground"
          />
          <input
            type="text"
            value={color.usage}
            onChange={(e) => onUpdate({ usage: e.target.value })}
            placeholder="Usage notes"
            className="w-full px-2 py-1 text-xs bg-surface border border-border rounded outline-none focus:border-foreground"
          />
          <div className="flex justify-between">
            <button
              onClick={onDelete}
              className="text-xs text-red-500 hover:text-red-400"
            >
              Delete
            </button>
            <button
              onClick={onEdit}
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

// Helper function to calculate contrast ratio
function calculateContrastRatio(hex1: string, hex2: string): number {
  const getLuminance = (hex: string) => {
    const rgb = hex.replace('#', '').match(/.{2}/g)?.map((x) => parseInt(x, 16) / 255) || [0, 0, 0];
    const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

