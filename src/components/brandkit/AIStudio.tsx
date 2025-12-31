'use client';

import { useState, useEffect } from 'react';
import { useCurrentBrand } from '@/lib/store';
import { useBrandKitStore } from '@/lib/brandKitStore';
import { 
  AnimationConcept, 
  AnimationContext, 
  UIStyle, 
  UIComponentType, 
  Pattern, 
  PatternType,
  IconSet,
  IconStyle,
  IconCategory,
  MotionBrief
} from '@/lib/types';

type GenerationType = 
  | 'logo' | 'imagery' | 'icon' | 'colors' | 'tagline' | 'voice'
  | 'animation' | 'ui-style' | 'pattern' | 'icon-set' | 'motion-brief';

interface GeneratedAsset {
  type: GenerationType;
  data: string | object;
  prompt: string;
  timestamp: Date;
}

const styleOptions = [
  { id: 'minimal', label: 'Minimal', description: 'Clean, simple, modern' },
  { id: 'bold', label: 'Bold', description: 'Strong, impactful, striking' },
  { id: 'elegant', label: 'Elegant', description: 'Sophisticated, refined' },
  { id: 'playful', label: 'Playful', description: 'Fun, friendly, approachable' },
  { id: 'tech', label: 'Tech', description: 'Modern, digital, innovative' },
  { id: 'organic', label: 'Organic', description: 'Natural, flowing, earthy' },
];

const moodOptions = [
  'Professional and trustworthy',
  'Innovative and cutting-edge',
  'Warm and friendly',
  'Bold and confident',
  'Calm and serene',
  'Energetic and dynamic',
];

const animationContextOptions: { id: AnimationContext; label: string; description: string }[] = [
  { id: 'page-load', label: 'Page Load', description: 'Initial page animations' },
  { id: 'hover', label: 'Hover', description: 'Mouse hover interactions' },
  { id: 'click', label: 'Click', description: 'Button/element clicks' },
  { id: 'transition', label: 'Transition', description: 'Page/section transitions' },
  { id: 'scroll', label: 'Scroll', description: 'Scroll-triggered animations' },
  { id: 'micro-interaction', label: 'Micro', description: 'Subtle feedback' },
  { id: 'loading', label: 'Loading', description: 'Loading states' },
];

const componentTypeOptions: { id: UIComponentType; label: string }[] = [
  { id: 'button', label: 'Button' },
  { id: 'card', label: 'Card' },
  { id: 'input', label: 'Input' },
  { id: 'modal', label: 'Modal' },
  { id: 'tooltip', label: 'Tooltip' },
  { id: 'badge', label: 'Badge' },
  { id: 'avatar', label: 'Avatar' },
  { id: 'nav-item', label: 'Nav Item' },
];

const patternTypeOptions: { id: PatternType; label: string; description: string }[] = [
  { id: 'geometric', label: 'Geometric', description: 'Shapes and angles' },
  { id: 'organic', label: 'Organic', description: 'Flowing, natural' },
  { id: 'noise', label: 'Noise', description: 'Grainy texture' },
  { id: 'gradient', label: 'Gradient', description: 'Color transitions' },
  { id: 'dots', label: 'Dots', description: 'Dot patterns' },
  { id: 'lines', label: 'Lines', description: 'Line patterns' },
  { id: 'waves', label: 'Waves', description: 'Wave patterns' },
];

const iconStyleOptions: { id: IconStyle; label: string }[] = [
  { id: 'line', label: 'Line' },
  { id: 'filled', label: 'Filled' },
  { id: 'duotone', label: 'Duotone' },
  { id: 'outline', label: 'Outline' },
];

const iconCategoryOptions: { id: IconCategory; label: string }[] = [
  { id: 'navigation', label: 'Navigation' },
  { id: 'actions', label: 'Actions' },
  { id: 'status', label: 'Status' },
  { id: 'social', label: 'Social' },
  { id: 'media', label: 'Media' },
  { id: 'commerce', label: 'Commerce' },
];

export default function AIStudio() {
  const brandDNA = useCurrentBrand();
  const { addLogo, addColor, addImagery } = useBrandKitStore();

  const [activeTab, setActiveTab] = useState<GenerationType>('logo');
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [connectionMessage, setConnectionMessage] = useState('');
  
  // Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  
  // Form states - Original
  const [style, setStyle] = useState('minimal');
  const [description, setDescription] = useState('');
  const [mood, setMood] = useState(moodOptions[0]);
  const [industry, setIndustry] = useState('technology');

  // Form states - Visual Engine
  const [animationContext, setAnimationContext] = useState<AnimationContext>('hover');
  const [componentType, setComponentType] = useState<UIComponentType>('button');
  const [patternType, setPatternType] = useState<PatternType>('geometric');
  const [patternDensity, setPatternDensity] = useState('medium');
  const [iconStyle, setIconStyle] = useState<IconStyle>('line');
  const [iconCategory, setIconCategory] = useState<IconCategory>('navigation');
  const [iconList, setIconList] = useState('home, search, settings, user, menu');

  // Check Gemini connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const res = await fetch('/api/gemini/status');
      const data = await res.json();
      setIsConnected(data.status === 'connected');
      setConnectionMessage(data.message);
    } catch {
      setIsConnected(false);
      setConnectionMessage('Failed to check Gemini connection');
    }
  };

  const generateImage = async (type: 'logo' | 'imagery' | 'icon') => {
    if (!brandDNA?.name) {
      setGenerationError('Please set a brand name first');
      return;
    }

    setIsGenerating(true);
    setGenerationError('');

    try {
      const res = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          brandName: brandDNA.name,
          style,
          description: description || `A ${style} ${type} for ${brandDNA.name}`,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Generation failed');
      }

      const imageUrl = `data:${data.image.mimeType};base64,${data.image.base64}`;
      
      setGeneratedAssets(prev => [{
        type,
        data: imageUrl,
        prompt: data.prompt,
        timestamp: new Date(),
      }, ...prev]);

    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateColors = async () => {
    setIsGenerating(true);
    setGenerationError('');

    try {
      const res = await fetch('/api/gemini/generate-colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandDescription: description || `${brandDNA?.name || 'A brand'} - ${industry}`,
          mood,
          industry,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Color generation failed');
      }

      setGeneratedAssets(prev => [{
        type: 'colors',
        data: data.palette,
        prompt: `${mood} - ${industry}`,
        timestamp: new Date(),
      }, ...prev]);

    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateText = async (type: 'tagline' | 'voice') => {
    setIsGenerating(true);
    setGenerationError('');

    try {
      const res = await fetch('/api/gemini/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          brandName: brandDNA?.name || 'Brand',
          industry,
          values: brandDNA?.keywords || ['innovation', 'quality'],
          tone: mood.toLowerCase(),
          audience: 'modern professionals',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Text generation failed');
      }

      setGeneratedAssets(prev => [{
        type,
        data: data.content,
        prompt: `${type} for ${brandDNA?.name}`,
        timestamp: new Date(),
      }, ...prev]);

    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // Visual Engine Generation Functions
  const generateAnimation = async () => {
    if (!brandDNA?.name) {
      setGenerationError('Please set a brand name first');
      return;
    }

    setIsGenerating(true);
    setGenerationError('');

    try {
      const res = await fetch('/api/gemini/generate-animation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandDNA.name,
          tone: brandDNA.tone,
          context: animationContext,
          description: description || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Animation generation failed');
      }

      setGeneratedAssets(prev => [{
        type: 'animation',
        data: data.animation as AnimationConcept,
        prompt: `${animationContext} animation for ${brandDNA.name}`,
        timestamp: new Date(),
      }, ...prev]);

    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateUIStyle = async () => {
    if (!brandDNA?.name) {
      setGenerationError('Please set a brand name first');
      return;
    }

    setIsGenerating(true);
    setGenerationError('');

    try {
      const res = await fetch('/api/gemini/generate-ui-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandDNA.name,
          colors: brandDNA.colors,
          tone: brandDNA.tone,
          componentType,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'UI Style generation failed');
      }

      setGeneratedAssets(prev => [{
        type: 'ui-style',
        data: data.style as UIStyle,
        prompt: `${componentType} style for ${brandDNA.name}`,
        timestamp: new Date(),
      }, ...prev]);

    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePattern = async () => {
    if (!brandDNA?.name) {
      setGenerationError('Please set a brand name first');
      return;
    }

    setIsGenerating(true);
    setGenerationError('');

    try {
      const res = await fetch('/api/gemini/generate-pattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandDNA.name,
          colors: brandDNA.colors,
          patternType,
          density: patternDensity,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Pattern generation failed');
      }

      setGeneratedAssets(prev => [{
        type: 'pattern',
        data: data.pattern as Pattern,
        prompt: `${patternType} pattern for ${brandDNA.name}`,
        timestamp: new Date(),
      }, ...prev]);

    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateIconSet = async () => {
    if (!brandDNA?.name) {
      setGenerationError('Please set a brand name first');
      return;
    }

    setIsGenerating(true);
    setGenerationError('');

    try {
      const icons = iconList.split(',').map(s => s.trim()).filter(Boolean);
      if (icons.length === 0) {
        throw new Error('Please enter at least one icon name');
      }

      const res = await fetch('/api/gemini/generate-icons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandDNA.name,
          tone: brandDNA.tone,
          style: iconStyle,
          category: iconCategory,
          iconList: icons,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Icon generation failed');
      }

      setGeneratedAssets(prev => [{
        type: 'icon-set',
        data: data.iconSet as IconSet,
        prompt: `${iconCategory} icons for ${brandDNA.name}`,
        timestamp: new Date(),
      }, ...prev]);

    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMotionBrief = async () => {
    if (!brandDNA?.name) {
      setGenerationError('Please set a brand name first');
      return;
    }

    setIsGenerating(true);
    setGenerationError('');

    try {
      const res = await fetch('/api/gemini/generate-motion-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandDNA.name,
          tone: brandDNA.tone,
          keywords: brandDNA.keywords,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Motion brief generation failed');
      }

      setGeneratedAssets(prev => [{
        type: 'motion-brief',
        data: data.motionBrief as MotionBrief,
        prompt: `Motion brief for ${brandDNA.name}`,
        timestamp: new Date(),
      }, ...prev]);

    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = () => {
    switch (activeTab) {
      case 'logo':
      case 'imagery':
      case 'icon':
        generateImage(activeTab);
        break;
      case 'colors':
        generateColors();
        break;
      case 'tagline':
      case 'voice':
        generateText(activeTab);
        break;
      case 'animation':
        generateAnimation();
        break;
      case 'ui-style':
        generateUIStyle();
        break;
      case 'pattern':
        generatePattern();
        break;
      case 'icon-set':
        generateIconSet();
        break;
      case 'motion-brief':
        generateMotionBrief();
        break;
    }
  };

  const saveToKit = (asset: GeneratedAsset) => {
    switch (asset.type) {
      case 'logo':
        addLogo(brandDNA?.id || '', {
          url: asset.data as string,
          name: `AI Generated Logo - ${new Date().toLocaleDateString()}`,
          type: 'primary',
          fileType: 'png',
          clearSpace: 10,
          minSize: 32,
          usageNotes: 'AI-generated logo',
        });
        break;
      case 'imagery':
        addImagery(brandDNA?.id || '', {
          url: asset.data as string,
          name: `AI Generated Imagery - ${new Date().toLocaleDateString()}`,
          category: 'abstract',
          type: 'illustration',
          tags: ['ai-generated'],
          notes: 'AI-generated brand imagery',
        });
        break;
      case 'colors':
        const palette = asset.data as { colors: { name: string; hex: string; role: string }[] };
        palette.colors.forEach(color => {
          addColor(brandDNA?.id || '', {
            name: color.name,
            hex: color.hex,
            category: 'primary',
            usage: color.role || 'General use',
          });
        });
        break;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Tab groups for organization
  const assetTabs: { id: GenerationType; label: string; icon: React.ReactNode }[] = [
    { id: 'logo', label: 'Logo', icon: <LogoIcon /> },
    { id: 'imagery', label: 'Imagery', icon: <ImageIcon /> },
    { id: 'icon', label: 'Icons', icon: <IconIcon /> },
    { id: 'colors', label: 'Colors', icon: <ColorIcon /> },
    { id: 'tagline', label: 'Taglines', icon: <TaglineIcon /> },
    { id: 'voice', label: 'Voice', icon: <VoiceIcon /> },
  ];

  const visualEngineTabs: { id: GenerationType; label: string; icon: React.ReactNode }[] = [
    { id: 'animation', label: 'Animations', icon: <AnimationIcon /> },
    { id: 'ui-style', label: 'UI Styles', icon: <UIStyleIcon /> },
    { id: 'pattern', label: 'Patterns', icon: <PatternIcon /> },
    { id: 'icon-set', label: 'Icon Sets', icon: <IconSetIcon /> },
    { id: 'motion-brief', label: 'Motion Brief', icon: <MotionBriefIcon /> },
  ];

  const renderFormControls = () => {
    // Original tabs controls
    if (['logo', 'imagery', 'icon'].includes(activeTab)) {
      return (
        <>
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-3">Style</label>
            <div className="grid grid-cols-3 gap-2">
              {styleOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setStyle(opt.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    style === opt.id
                      ? 'border-foreground bg-surface'
                      : 'border-border hover:border-muted'
                  }`}
                >
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-3">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                activeTab === 'logo' ? 'Describe your ideal logo...' :
                activeTab === 'imagery' ? 'Describe the imagery you want...' :
                'What should the icon represent?'
              }
              rows={4}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 outline-none focus:border-foreground resize-none"
            />
          </div>
        </>
      );
    }

    if (['colors', 'tagline', 'voice'].includes(activeTab)) {
      return (
        <>
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-3">Mood</label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 outline-none focus:border-foreground"
            >
              {moodOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-3">Industry</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., technology, fashion, healthcare"
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 outline-none focus:border-foreground"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-3">Additional Context</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any additional context for generation..."
              rows={4}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 outline-none focus:border-foreground resize-none"
            />
          </div>
        </>
      );
    }

    // Animation tab
    if (activeTab === 'animation') {
      return (
        <>
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-3">Animation Context</label>
            <div className="grid grid-cols-3 gap-2">
              {animationContextOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setAnimationContext(opt.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    animationContext === opt.id
                      ? 'border-foreground bg-surface'
                      : 'border-border hover:border-muted'
                  }`}
                >
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-3">Additional Notes</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe specific animation requirements..."
              rows={3}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 outline-none focus:border-foreground resize-none"
            />
          </div>
        </>
      );
    }

    // UI Style tab
    if (activeTab === 'ui-style') {
      return (
        <>
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-3">Component Type</label>
            <div className="grid grid-cols-4 gap-2">
              {componentTypeOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setComponentType(opt.id)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    componentType === opt.id
                      ? 'border-foreground bg-surface'
                      : 'border-border hover:border-muted'
                  }`}
                >
                  <p className="text-sm font-medium">{opt.label}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 bg-surface/50 rounded-lg">
            <p className="text-xs text-muted mb-2">Brand Colors Used:</p>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded" style={{ backgroundColor: brandDNA?.colors.primary || '#000' }} />
              <div className="w-8 h-8 rounded" style={{ backgroundColor: brandDNA?.colors.secondary || '#666' }} />
              <div className="w-8 h-8 rounded" style={{ backgroundColor: brandDNA?.colors.accent || '#00f' }} />
            </div>
          </div>
        </>
      );
    }

    // Pattern tab
    if (activeTab === 'pattern') {
      return (
        <>
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-3">Pattern Type</label>
            <div className="grid grid-cols-3 gap-2">
              {patternTypeOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setPatternType(opt.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    patternType === opt.id
                      ? 'border-foreground bg-surface'
                      : 'border-border hover:border-muted'
                  }`}
                >
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-3">Density</label>
            <div className="grid grid-cols-3 gap-2">
              {['sparse', 'medium', 'dense'].map(d => (
                <button
                  key={d}
                  onClick={() => setPatternDensity(d)}
                  className={`p-3 rounded-lg border text-center transition-all capitalize ${
                    patternDensity === d
                      ? 'border-foreground bg-surface'
                      : 'border-border hover:border-muted'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </>
      );
    }

    // Icon Set tab
    if (activeTab === 'icon-set') {
      return (
        <>
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-3">Icon Style</label>
            <div className="grid grid-cols-4 gap-2">
              {iconStyleOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setIconStyle(opt.id)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    iconStyle === opt.id
                      ? 'border-foreground bg-surface'
                      : 'border-border hover:border-muted'
                  }`}
                >
                  <p className="text-sm font-medium">{opt.label}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-3">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {iconCategoryOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setIconCategory(opt.id)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    iconCategory === opt.id
                      ? 'border-foreground bg-surface'
                      : 'border-border hover:border-muted'
                  }`}
                >
                  <p className="text-sm font-medium">{opt.label}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-3">Icons to Generate</label>
            <textarea
              value={iconList}
              onChange={(e) => setIconList(e.target.value)}
              placeholder="home, search, settings, user (comma-separated)"
              rows={2}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 outline-none focus:border-foreground resize-none"
            />
          </div>
        </>
      );
    }

    // Motion Brief tab
    if (activeTab === 'motion-brief') {
      return (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Motion Design Brief</h4>
            <p className="text-xs text-muted">
              Generate a comprehensive motion design document based on your brand&apos;s tone. 
              This includes animation principles, timing guidelines, easing preferences, and code snippets.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-surface rounded-lg">
              <p className="text-xs text-muted mb-1">Minimal</p>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-foreground" style={{ width: `${brandDNA?.tone.minimal || 50}%` }} />
              </div>
            </div>
            <div className="p-3 bg-surface rounded-lg">
              <p className="text-xs text-muted mb-1">Playful</p>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-foreground" style={{ width: `${brandDNA?.tone.playful || 50}%` }} />
              </div>
            </div>
            <div className="p-3 bg-surface rounded-lg">
              <p className="text-xs text-muted mb-1">Bold</p>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-foreground" style={{ width: `${brandDNA?.tone.bold || 50}%` }} />
              </div>
            </div>
            <div className="p-3 bg-surface rounded-lg">
              <p className="text-xs text-muted mb-1">Experimental</p>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-foreground" style={{ width: `${brandDNA?.tone.experimental || 50}%` }} />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted text-center">
            The brief will be generated based on these brand tone values
          </p>
        </div>
      );
    }

    return null;
  };

  const renderGeneratedAsset = (asset: GeneratedAsset, index: number) => {
    // Original asset types
    if (['logo', 'imagery', 'icon'].includes(asset.type)) {
      return (
        <div key={index} className="bg-surface rounded-xl p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset.data as string}
            alt={`Generated ${asset.type}`}
            className="w-full rounded-lg mb-3"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted capitalize">{asset.type}</span>
            <button
              onClick={() => saveToKit(asset)}
              className="text-xs px-3 py-1 bg-foreground text-background rounded-full hover:opacity-80"
            >
              Save to Kit
            </button>
          </div>
        </div>
      );
    }

    if (asset.type === 'colors') {
      return (
        <div key={index} className="bg-surface rounded-xl p-4">
          <div className="flex gap-2 mb-3">
            {(asset.data as { colors: { hex: string }[] }).colors.map((c, j) => (
              <div
                key={j}
                className="flex-1 h-16 rounded-lg"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted">Color Palette</span>
            <button
              onClick={() => saveToKit(asset)}
              className="text-xs px-3 py-1 bg-foreground text-background rounded-full hover:opacity-80"
            >
              Save to Kit
            </button>
          </div>
        </div>
      );
    }

    if (['tagline', 'voice'].includes(asset.type)) {
      return (
        <div key={index} className="bg-surface rounded-xl p-4">
          <div className="p-4 bg-background rounded-lg mb-3">
            <pre className="text-sm whitespace-pre-wrap">{asset.data as string}</pre>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted capitalize">{asset.type}</span>
            <button
              onClick={() => copyToClipboard(asset.data as string)}
              className="text-xs px-3 py-1 border border-border rounded-full hover:border-foreground"
            >
              Copy
            </button>
          </div>
        </div>
      );
    }

    // Animation
    if (asset.type === 'animation') {
      const anim = asset.data as AnimationConcept;
      return (
        <div key={index} className="bg-surface rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{anim.name}</h4>
            <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-500 rounded">{anim.context}</span>
          </div>
          <p className="text-sm text-muted">{anim.description}</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 bg-background rounded">
              <span className="text-muted">Duration:</span> {anim.timing.duration}
            </div>
            <div className="p-2 bg-background rounded">
              <span className="text-muted">Easing:</span> {anim.timing.easing}
            </div>
            {anim.timing.delay && (
              <div className="p-2 bg-background rounded">
                <span className="text-muted">Delay:</span> {anim.timing.delay}
              </div>
            )}
          </div>
          <div className="p-3 bg-background rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted">CSS Code</span>
              <button
                onClick={() => copyToClipboard(anim.cssCode)}
                className="text-xs text-muted hover:text-foreground"
              >
                Copy
              </button>
            </div>
            <pre className="text-xs overflow-x-auto">{anim.cssCode}</pre>
          </div>
          {anim.framerMotionCode && (
            <div className="p-3 bg-background rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted">Framer Motion</span>
                <button
                  onClick={() => copyToClipboard(anim.framerMotionCode!)}
                  className="text-xs text-muted hover:text-foreground"
                >
                  Copy
                </button>
              </div>
              <pre className="text-xs overflow-x-auto">{anim.framerMotionCode}</pre>
            </div>
          )}
          <p className="text-xs text-muted italic">{anim.brandAlignment}</p>
        </div>
      );
    }

    // UI Style
    if (asset.type === 'ui-style') {
      const uiStyle = asset.data as UIStyle;
      return (
        <div key={index} className="bg-surface rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{uiStyle.name}</h4>
            <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-500 rounded">{uiStyle.componentType}</span>
          </div>
          <p className="text-sm text-muted">{uiStyle.description}</p>
          <div className="flex gap-2">
            {Object.entries(uiStyle.colors).map(([key, value]) => (
              <div key={key} className="flex items-center gap-1">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: value }} />
                <span className="text-xs text-muted">{key}</span>
              </div>
            ))}
          </div>
          <div className="p-3 bg-background rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted">Tailwind Classes</span>
              <button
                onClick={() => copyToClipboard(uiStyle.tailwindClasses)}
                className="text-xs text-muted hover:text-foreground"
              >
                Copy
              </button>
            </div>
            <code className="text-xs">{uiStyle.tailwindClasses}</code>
          </div>
          <div className="p-3 bg-background rounded-lg">
            <span className="text-xs text-muted block mb-2">CSS Variables</span>
            <pre className="text-xs overflow-x-auto">
              {Object.entries(uiStyle.cssVariables).map(([k, v]) => `${k}: ${v};`).join('\n')}
            </pre>
          </div>
        </div>
      );
    }

    // Pattern
    if (asset.type === 'pattern') {
      const pattern = asset.data as Pattern;
      return (
        <div key={index} className="bg-surface rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{pattern.name}</h4>
            <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded">{pattern.patternType}</span>
          </div>
          <p className="text-sm text-muted">{pattern.description}</p>
          <div 
            className="h-24 rounded-lg border border-border"
            style={{ background: pattern.cssCode.includes('background') ? undefined : pattern.cssCode }}
            dangerouslySetInnerHTML={pattern.cssCode.includes('background') ? undefined : undefined}
          />
          <div className="p-3 bg-background rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted">CSS Code</span>
              <button
                onClick={() => copyToClipboard(pattern.cssCode)}
                className="text-xs text-muted hover:text-foreground"
              >
                Copy
              </button>
            </div>
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">{pattern.cssCode}</pre>
          </div>
          {pattern.svgCode && (
            <div className="p-3 bg-background rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted">SVG Code</span>
                <button
                  onClick={() => copyToClipboard(pattern.svgCode!)}
                  className="text-xs text-muted hover:text-foreground"
                >
                  Copy
                </button>
              </div>
              <pre className="text-xs overflow-x-auto max-h-32">{pattern.svgCode}</pre>
            </div>
          )}
        </div>
      );
    }

    // Icon Set
    if (asset.type === 'icon-set') {
      const iconSet = asset.data as IconSet;
      return (
        <div key={index} className="bg-surface rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{iconSet.name}</h4>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 bg-orange-500/10 text-orange-500 rounded">{iconSet.style}</span>
              <span className="text-xs px-2 py-1 bg-orange-500/10 text-orange-500 rounded">{iconSet.category}</span>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {iconSet.icons.map((icon, i) => (
              <div key={i} className="p-3 bg-background rounded-lg text-center group cursor-pointer" onClick={() => copyToClipboard(icon.svgCode)}>
                <div 
                  className="w-8 h-8 mx-auto mb-1"
                  dangerouslySetInnerHTML={{ __html: icon.svgCode }}
                />
                <span className="text-xs text-muted group-hover:text-foreground">{icon.name}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted italic">{iconSet.brandAlignment}</p>
        </div>
      );
    }

    // Motion Brief
    if (asset.type === 'motion-brief') {
      const brief = asset.data as MotionBrief;
      return (
        <div key={index} className="bg-surface rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Motion Design Brief</h4>
            <span className="text-xs px-2 py-1 bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-500 rounded">
              {brief.brandName}
            </span>
          </div>
          
          <div className="p-4 bg-background rounded-lg">
            <h5 className="text-sm font-medium mb-2">Philosophy</h5>
            <p className="text-sm text-muted">{brief.philosophy}</p>
          </div>

          <div>
            <h5 className="text-sm font-medium mb-2">Principles</h5>
            <div className="space-y-2">
              {brief.principles.map((p, i) => (
                <div key={i} className="p-3 bg-background rounded-lg">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted">{p.description}</p>
                  <p className="text-xs mt-1 italic">Example: {p.example}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-background rounded-lg">
              <p className="text-xs text-muted mb-1">Micro-interactions</p>
              <p className="text-sm">{brief.timingGuidelines.microInteractions}</p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="text-xs text-muted mb-1">Transitions</p>
              <p className="text-sm">{brief.timingGuidelines.transitions}</p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="text-xs text-muted mb-1">Page Animations</p>
              <p className="text-sm">{brief.timingGuidelines.pageAnimations}</p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="text-xs text-muted mb-1">Loading</p>
              <p className="text-sm">{brief.timingGuidelines.loading}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
              <p className="text-xs text-green-500 mb-2">Do</p>
              <ul className="text-xs space-y-1">
                {brief.doRules.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
            </div>
            <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
              <p className="text-xs text-red-500 mb-2">Don&apos;t</p>
              <ul className="text-xs space-y-1">
                {brief.dontRules.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
            </div>
          </div>

          {brief.codeSnippets.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2">Code Snippets</h5>
              {brief.codeSnippets.map((snippet, i) => (
                <div key={i} className="p-3 bg-background rounded-lg mb-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{snippet.name}</span>
                    <button
                      onClick={() => copyToClipboard(snippet.code)}
                      className="text-xs text-muted hover:text-foreground"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-muted mb-2">{snippet.description}</p>
                  <pre className="text-xs overflow-x-auto">{snippet.code}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-6xl mx-auto relative">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[rgba(0,71,255,0.1)] border border-[rgba(0,71,255,0.2)] rounded-full text-sm mb-6">
          <span className="w-2 h-2 bg-[#0047FF] rounded-full animate-pulse shadow-[0_0_10px_rgba(0,71,255,0.5)]"></span>
          <span className="text-white/80">Powered by</span>
          <span className="text-[#0047FF] font-medium">Gemini 2.0</span>
        </div>
        <h2 className="text-4xl font-light tracking-tight mb-3 text-white">AI Studio</h2>
        <p className="text-white/50 text-lg">Generate brand assets, animations, and design systems</p>
        
        {/* Connection Status */}
        <div className={`inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full text-xs backdrop-blur-xl ${
          isConnected === null ? 'bg-[rgba(255,255,255,0.05)] text-white/50 border border-[rgba(255,255,255,0.1)]' :
          isConnected ? 'bg-[rgba(34,197,94,0.1)] text-green-400 border border-[rgba(34,197,94,0.2)]' : 'bg-[rgba(239,68,68,0.1)] text-red-400 border border-[rgba(239,68,68,0.2)]'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            isConnected === null ? 'bg-white/30' :
            isConnected ? 'bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-400'
          }`}></span>
          {isConnected === null ? 'Checking connection...' : connectionMessage}
        </div>
      </div>

      {/* Tab Groups */}
      <div className="mb-10 space-y-6">
        {/* Asset Generation Tabs */}
        <div className="bg-[rgba(255,255,255,0.03)] backdrop-blur-xl rounded-2xl p-4 border border-[rgba(255,255,255,0.05)]">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-3">Brand Assets</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {assetTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-[#0a0a0a] shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                    : 'bg-[rgba(255,255,255,0.05)] text-white/70 border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.1)] hover:text-white'
                }`}
              >
                {tab.icon}
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Visual Engine Tabs */}
        <div className="bg-[rgba(0,71,255,0.05)] backdrop-blur-xl rounded-2xl p-4 border border-[rgba(0,71,255,0.1)]">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#0047FF]/60 mb-3">Visual Design Engine</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {visualEngineTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#0047FF] text-white shadow-[0_0_30px_rgba(0,71,255,0.4)]'
                    : 'bg-[rgba(0,71,255,0.1)] text-white/70 border border-[rgba(0,71,255,0.2)] hover:bg-[rgba(0,71,255,0.2)] hover:text-white'
                }`}
              >
                {tab.icon}
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generation Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left - Controls */}
        <div className="bg-[rgba(255,255,255,0.03)] backdrop-blur-xl rounded-2xl p-6 border border-[rgba(255,255,255,0.05)] space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[rgba(255,255,255,0.1)]">
            <div className="w-8 h-8 rounded-lg bg-[rgba(0,71,255,0.15)] border border-[rgba(0,71,255,0.2)] flex items-center justify-center">
              <svg className="w-4 h-4 text-[#0047FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Configuration</h3>
              <p className="text-xs text-white/40">Customize your generation settings</p>
            </div>
          </div>
          
          {renderFormControls()}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !isConnected}
            className={`w-full py-4 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
              visualEngineTabs.some(t => t.id === activeTab)
                ? 'bg-[#0047FF] text-white shadow-[0_0_30px_rgba(0,71,255,0.3)] hover:shadow-[0_0_40px_rgba(0,71,255,0.5)]'
                : 'bg-white text-[#0a0a0a] hover:bg-white/90'
            }`}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </span>
            ) : (
              `Generate ${[...assetTabs, ...visualEngineTabs].find(t => t.id === activeTab)?.label}`
            )}
          </button>

          {generationError && (
            <div className="p-4 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-xl">
              <p className="text-sm text-red-400">{generationError}</p>
            </div>
          )}
        </div>

        {/* Right - Generated Assets */}
        <div className="bg-[rgba(255,255,255,0.03)] backdrop-blur-xl rounded-2xl p-6 border border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-3 pb-4 border-b border-[rgba(255,255,255,0.1)] mb-6">
            <div className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.1)] flex items-center justify-center">
              <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Generated Assets</h3>
              <p className="text-xs text-white/40">{generatedAssets.length} items</p>
            </div>
          </div>
          
          {generatedAssets.length === 0 ? (
            <div className="aspect-square bg-[rgba(255,255,255,0.02)] rounded-xl flex items-center justify-center border border-dashed border-[rgba(255,255,255,0.1)]">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[rgba(0,71,255,0.1)] border border-[rgba(0,71,255,0.2)] flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#0047FF]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <p className="text-white/50 text-sm">No assets generated yet</p>
                <p className="text-xs text-white/30 mt-1">Configure options and click generate</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
              {generatedAssets.map((asset, i) => renderGeneratedAsset(asset, i))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Original Icon Components
function LogoIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function IconIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
    </svg>
  );
}

function ColorIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  );
}

function TaglineIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
  );
}

function VoiceIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

// Visual Engine Icon Components
function AnimationIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function UIStyleIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  );
}

function PatternIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function IconSetIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function MotionBriefIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
