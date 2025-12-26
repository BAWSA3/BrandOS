'use client';

import { useState, useRef } from 'react';
import { useBrandKitStore, ImageryAsset } from '@/lib/brandKitStore';

interface ImagerySectionProps {
  brandId: string;
}

const imageryCategories = [
  { id: 'hero', label: 'Hero Images' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'product', label: 'Product' },
  { id: 'abstract', label: 'Abstract' },
  { id: 'moodboard', label: 'Mood Board' },
] as const;

const imageryTypes = [
  { id: 'photo', label: 'Photography' },
  { id: 'illustration', label: 'Illustration' },
  { id: 'pattern', label: 'Pattern' },
  { id: 'texture', label: 'Texture' },
] as const;

export default function ImagerySection({ brandId }: ImagerySectionProps) {
  const { getCurrentBrandKit, addImagery, updateImagery, deleteImagery } = useBrandKitStore();
  const brandKit = getCurrentBrandKit(brandId);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file);
      
      addImagery(brandId, {
        name: file.name.replace(/\.[^/.]+$/, ''),
        url,
        type: 'photo',
        category: 'moodboard',
        tags: [],
        notes: '',
      });
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpdateImage = (imageId: string, updates: Partial<ImageryAsset>) => {
    updateImagery(brandId, imageId, updates);
  };

  const handleDeleteImage = (imageId: string) => {
    deleteImagery(brandId, imageId);
    setSelectedImage(null);
  };

  const filteredImages = activeFilter === 'all' 
    ? brandKit.imagery 
    : brandKit.imagery.filter((img) => img.category === activeFilter);

  const doExamples = brandKit.imagery.filter((img) => img.doExample);
  const dontExamples = brandKit.imagery.filter((img) => img.dontExample);

  return (
    <div className="space-y-6">
      {/* Upload & Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
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
            Upload Images
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              activeFilter === 'all' ? 'bg-foreground text-background' : 'hover:bg-surface'
            }`}
          >
            All
          </button>
          {imageryCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                activeFilter === cat.id ? 'bg-foreground text-background' : 'hover:bg-surface'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Image Grid */}
      {filteredImages.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <svg className="w-16 h-16 mx-auto mb-4 text-muted opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-muted mb-2">No images uploaded yet</p>
          <p className="text-xs text-muted">Upload images to create your mood board and style guide</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredImages.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              isSelected={selectedImage === image.id}
              onSelect={() => setSelectedImage(selectedImage === image.id ? null : image.id)}
              onUpdate={(updates) => handleUpdateImage(image.id, updates)}
              onDelete={() => handleDeleteImage(image.id)}
            />
          ))}
        </div>
      )}

      {/* Do/Don't Section */}
      {(doExamples.length > 0 || dontExamples.length > 0) && (
        <div className="grid grid-cols-2 gap-8 mt-8">
          {/* Do Examples */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
              <span className="text-green-500">✓</span> Do
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {doExamples.map((img) => (
                <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden border-2 border-green-500/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Don't Examples */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
              <span className="text-red-500">✗</span> Don&apos;t
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {dontExamples.map((img) => (
                <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden border-2 border-red-500/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Style Guidelines */}
      {brandKit.imagery.length > 0 && (
        <div className="p-4 bg-surface rounded-lg">
          <h4 className="text-xs uppercase tracking-widest text-muted mb-3">Photography Guidelines</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-muted">•</span>
              Use natural lighting when possible
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted">•</span>
              Maintain consistent color grading
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted">•</span>
              Focus on authentic moments
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted">•</span>
              Avoid over-processed or stock-looking images
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

interface ImageCardProps {
  image: ImageryAsset;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ImageryAsset>) => void;
  onDelete: () => void;
}

function ImageCard({ image, isSelected, onSelect, onUpdate, onDelete }: ImageCardProps) {
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    if (!tagInput.trim()) return;
    onUpdate({ tags: [...image.tags, tagInput.trim()] });
    setTagInput('');
  };

  const removeTag = (index: number) => {
    onUpdate({ tags: image.tags.filter((_, i) => i !== index) });
  };

  return (
    <div className="relative group">
      {/* Image Preview */}
      <div
        className={`aspect-square rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
          isSelected ? 'ring-2 ring-foreground' : ''
        } ${image.doExample ? 'ring-2 ring-green-500' : ''} ${image.dontExample ? 'ring-2 ring-red-500' : ''}`}
        onClick={onSelect}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.name}
          className="w-full h-full object-cover"
        />
        
        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onUpdate({ doExample: !image.doExample, dontExample: false }); }}
            className={`p-2 rounded-lg ${image.doExample ? 'bg-green-500' : 'bg-white/20 hover:bg-white/30'}`}
            title="Mark as Do"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onUpdate({ dontExample: !image.dontExample, doExample: false }); }}
            className={`p-2 rounded-lg ${image.dontExample ? 'bg-red-500' : 'bg-white/20 hover:bg-white/30'}`}
            title="Mark as Don't"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Image Info */}
      <div className="mt-2">
        <p className="text-sm font-medium truncate">{image.name}</p>
        <p className="text-xs text-muted capitalize">{image.category}</p>
      </div>

      {/* Edit Panel */}
      {isSelected && (
        <div className="absolute top-full left-0 right-0 mt-2 z-10 bg-background border border-border rounded-lg shadow-xl p-4 space-y-3 animate-fade-in min-w-[280px]">
          <div>
            <label className="block text-xs text-muted mb-1">Name</label>
            <input
              type="text"
              value={image.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="w-full px-2 py-1 text-sm bg-surface border border-border rounded outline-none focus:border-foreground"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-muted mb-1">Type</label>
              <select
                value={image.type}
                onChange={(e) => onUpdate({ type: e.target.value as ImageryAsset['type'] })}
                className="w-full px-2 py-1 text-sm bg-surface border border-border rounded outline-none focus:border-foreground"
              >
                {imageryTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Category</label>
              <select
                value={image.category}
                onChange={(e) => onUpdate({ category: e.target.value as ImageryAsset['category'] })}
                className="w-full px-2 py-1 text-sm bg-surface border border-border rounded outline-none focus:border-foreground"
              >
                {imageryCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Tags</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {image.tags.map((tag, i) => (
                <span
                  key={i}
                  onClick={() => removeTag(i)}
                  className="px-2 py-0.5 text-xs bg-surface rounded cursor-pointer hover:bg-border"
                >
                  {tag} ×
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                placeholder="Add tag"
                className="flex-1 px-2 py-1 text-xs bg-surface border border-border rounded outline-none"
              />
              <button
                onClick={addTag}
                className="px-2 py-1 text-xs bg-surface border border-border rounded hover:bg-border"
              >
                Add
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Notes</label>
            <textarea
              value={image.notes}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              rows={2}
              className="w-full px-2 py-1 text-xs bg-surface border border-border rounded outline-none focus:border-foreground resize-none"
            />
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







