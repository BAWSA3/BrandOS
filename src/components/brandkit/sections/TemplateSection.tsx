'use client';

import { useState } from 'react';
import { useBrandKitStore, TemplateAsset } from '@/lib/brandKitStore';

interface TemplateSectionProps {
  brandId: string;
}

const templateTypes = [
  { id: 'social', label: 'Social Media', platforms: ['Instagram Post', 'Instagram Story', 'Twitter', 'LinkedIn', 'Facebook'] },
  { id: 'email', label: 'Email', platforms: ['Header', 'Newsletter', 'Promotional'] },
  { id: 'ad', label: 'Advertising', platforms: ['Banner', 'Leaderboard', 'Skyscraper', 'Square'] },
  { id: 'presentation', label: 'Presentation', platforms: ['Title Slide', 'Content Slide', 'Quote Slide'] },
  { id: 'document', label: 'Document', platforms: ['Letterhead', 'Business Card', 'Invoice'] },
] as const;

const templateDimensions: Record<string, { width: number; height: number }> = {
  'Instagram Post': { width: 1080, height: 1080 },
  'Instagram Story': { width: 1080, height: 1920 },
  'Twitter': { width: 1200, height: 675 },
  'LinkedIn': { width: 1200, height: 627 },
  'Facebook': { width: 1200, height: 630 },
  'Header': { width: 600, height: 200 },
  'Newsletter': { width: 600, height: 800 },
  'Promotional': { width: 600, height: 600 },
  'Banner': { width: 728, height: 90 },
  'Leaderboard': { width: 970, height: 250 },
  'Skyscraper': { width: 160, height: 600 },
  'Square': { width: 300, height: 300 },
  'Title Slide': { width: 1920, height: 1080 },
  'Content Slide': { width: 1920, height: 1080 },
  'Quote Slide': { width: 1920, height: 1080 },
  'Letterhead': { width: 612, height: 792 },
  'Business Card': { width: 350, height: 200 },
  'Invoice': { width: 612, height: 792 },
};

export default function TemplateSection({ brandId }: TemplateSectionProps) {
  const { getCurrentBrandKit, addTemplate, deleteTemplate } = useBrandKitStore();
  const brandKit = getCurrentBrandKit(brandId);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('social');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [templateName, setTemplateName] = useState('');

  const handleCreateTemplate = () => {
    if (!templateName.trim() || !selectedPlatform) return;

    const dimensions = templateDimensions[selectedPlatform] || { width: 1000, height: 1000 };
    const type = templateTypes.find((t) => t.platforms.includes(selectedPlatform as never))?.id || 'social';

    addTemplate(brandId, {
      name: templateName,
      type: type as TemplateAsset['type'],
      platform: selectedPlatform,
      dimensions,
      content: {
        layout: 'default',
        elements: [],
      },
    });

    setTemplateName('');
    setSelectedPlatform('');
    setIsCreating(false);
  };

  const handleDeleteTemplate = (templateId: string) => {
    deleteTemplate(brandId, templateId);
  };

  const currentType = templateTypes.find((t) => t.id === selectedType);

  // Group templates by type
  const templatesByType = brandKit.templates.reduce((acc, template) => {
    if (!acc[template.type]) acc[template.type] = [];
    acc[template.type].push(template);
    return acc;
  }, {} as Record<string, TemplateAsset[]>);

  return (
    <div className="space-y-6">
      {/* Template Type Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-4">
        {templateTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              selectedType === type.id
                ? 'bg-foreground text-background'
                : 'hover:bg-surface'
            }`}
          >
            {type.label}
            {templatesByType[type.id]?.length > 0 && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                selectedType === type.id ? 'bg-background/20' : 'bg-surface'
              }`}>
                {templatesByType[type.id].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Create Template */}
      {!isCreating ? (
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-3 text-sm border border-dashed border-border rounded-lg hover:border-foreground transition-colors w-full justify-center"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
          Create {currentType?.label} Template
        </button>
      ) : (
        <div className="p-4 bg-surface rounded-lg space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">Template Name</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Product Launch Post"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Format</label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-foreground"
              >
                <option value="">Select format...</option>
                {currentType?.platforms.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform} ({templateDimensions[platform]?.width}×{templateDimensions[platform]?.height})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTemplate}
              disabled={!templateName.trim() || !selectedPlatform}
              className="px-4 py-2 text-sm bg-foreground text-background rounded-lg hover:opacity-90 disabled:opacity-30 transition-all"
            >
              Create Template
            </button>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      {(templatesByType[selectedType]?.length || 0) === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <svg className="w-16 h-16 mx-auto mb-4 text-muted opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          <p className="text-muted mb-2">No {currentType?.label.toLowerCase()} templates yet</p>
          <p className="text-xs text-muted">Create templates to maintain consistent brand layouts</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {templatesByType[selectedType]?.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onDelete={() => handleDeleteTemplate(template.id)}
            />
          ))}
        </div>
      )}

      {/* Quick Format Reference */}
      <div className="p-4 bg-surface rounded-lg">
        <h4 className="text-xs uppercase tracking-widest text-muted mb-3">{currentType?.label} Dimensions</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {currentType?.platforms.map((platform) => {
            const dims = templateDimensions[platform];
            return (
              <div key={platform} className="text-center p-3 bg-background rounded-lg">
                <div 
                  className="mx-auto mb-2 bg-border rounded"
                  style={{
                    width: Math.min(dims.width / 20, 60),
                    height: Math.min(dims.height / 20, 60),
                  }}
                />
                <p className="text-xs font-medium">{platform}</p>
                <p className="text-xs text-muted">{dims.width}×{dims.height}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: TemplateAsset;
  onDelete: () => void;
}

function TemplateCard({ template, onDelete }: TemplateCardProps) {
  const aspectRatio = template.dimensions.width / template.dimensions.height;
  
  return (
    <div className="group">
      {/* Template Preview */}
      <div 
        className="relative bg-surface rounded-xl overflow-hidden border border-border hover:border-foreground transition-colors"
        style={{ 
          aspectRatio: Math.min(Math.max(aspectRatio, 0.5), 2),
        }}
      >
        {/* Placeholder content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <div className="w-12 h-12 mb-3 rounded-lg bg-border flex items-center justify-center">
            <svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <p className="text-xs text-muted text-center">
            {template.dimensions.width}×{template.dimensions.height}
          </p>
        </div>

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            title="Edit Template"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            title="Duplicate"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
            title="Delete"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Template Info */}
      <div className="mt-3">
        <p className="text-sm font-medium truncate">{template.name}</p>
        <p className="text-xs text-muted">{template.platform}</p>
      </div>
    </div>
  );
}
















