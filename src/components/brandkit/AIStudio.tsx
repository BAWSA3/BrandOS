'use client';

import { useState, useEffect } from 'react';
import { useCurrentBrand } from '@/lib/store';
import useBrandKitStore from '@/lib/brandKitStore';

type GenerationType = 'logo' | 'imagery' | 'icon' | 'colors' | 'tagline' | 'voice';

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

export default function AIStudio() {
  const brandDNA = useCurrentBrand();
  const { addLogo, addColor, addImage } = useBrandKitStore();

  const [activeTab, setActiveTab] = useState<GenerationType>('logo');
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [connectionMessage, setConnectionMessage] = useState('');
  
  // Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  
  // Form states
  const [style, setStyle] = useState('minimal');
  const [description, setDescription] = useState('');
  const [mood, setMood] = useState(moodOptions[0]);
  const [industry, setIndustry] = useState('technology');

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
    }
  };

  const saveToKit = (asset: GeneratedAsset) => {
    switch (asset.type) {
      case 'logo':
        addLogo({
          url: asset.data as string,
          name: `AI Generated Logo - ${new Date().toLocaleDateString()}`,
          type: 'primary',
        });
        break;
      case 'imagery':
        addImage({
          url: asset.data as string,
          name: `AI Generated Imagery - ${new Date().toLocaleDateString()}`,
          category: 'ai-generated',
        });
        break;
      case 'colors':
        const palette = asset.data as { colors: { name: string; hex: string; role: string }[] };
        palette.colors.forEach(color => {
          addColor({
            name: color.name,
            hex: color.hex,
            role: color.role,
          });
        });
        break;
    }
  };

  const tabs: { id: GenerationType; label: string; icon: React.ReactNode }[] = [
    { id: 'logo', label: 'Logo', icon: <LogoIcon /> },
    { id: 'imagery', label: 'Imagery', icon: <ImageIcon /> },
    { id: 'icon', label: 'Icons', icon: <IconIcon /> },
    { id: 'colors', label: 'Colors', icon: <ColorIcon /> },
    { id: 'tagline', label: 'Taglines', icon: <TaglineIcon /> },
    { id: 'voice', label: 'Voice', icon: <VoiceIcon /> },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full text-sm mb-4">
          <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse"></span>
          Powered by Gemini 2.0
        </div>
        <h2 className="text-3xl font-light tracking-tight mb-2">AI Studio</h2>
        <p className="text-muted">Generate brand assets with AI</p>
        
        {/* Connection Status */}
        <div className={`inline-flex items-center gap-2 mt-4 px-3 py-1 rounded-full text-xs ${
          isConnected === null ? 'bg-surface text-muted' :
          isConnected ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            isConnected === null ? 'bg-muted' :
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></span>
          {isConnected === null ? 'Checking connection...' : connectionMessage}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-foreground text-background'
                : 'bg-surface hover:bg-border'
            }`}
          >
            {tab.icon}
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Generation Form */}
      <div className="grid grid-cols-2 gap-8">
        {/* Left - Controls */}
        <div className="space-y-6">
          {/* Style Selection (for image types) */}
          {['logo', 'imagery', 'icon'].includes(activeTab) && (
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
          )}

          {/* Mood Selection (for colors/text) */}
          {['colors', 'tagline', 'voice'].includes(activeTab) && (
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
          )}

          {/* Industry */}
          {['colors', 'tagline', 'voice'].includes(activeTab) && (
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
          )}

          {/* Description */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-3">
              {['logo', 'imagery', 'icon'].includes(activeTab) ? 'Description' : 'Additional Context'}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                activeTab === 'logo' ? 'Describe your ideal logo...' :
                activeTab === 'imagery' ? 'Describe the imagery you want...' :
                activeTab === 'icon' ? 'What should the icon represent?' :
                'Any additional context for generation...'
              }
              rows={4}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 outline-none focus:border-foreground resize-none"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !isConnected}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
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
              `Generate ${tabs.find(t => t.id === activeTab)?.label}`
            )}
          </button>

          {generationError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-500">{generationError}</p>
            </div>
          )}
        </div>

        {/* Right - Generated Assets */}
        <div>
          <h3 className="text-xs uppercase tracking-widest text-muted mb-4">Generated Assets</h3>
          
          {generatedAssets.length === 0 ? (
            <div className="aspect-square bg-surface rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-border flex items-center justify-center">
                  <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <p className="text-muted text-sm">No assets generated yet</p>
                <p className="text-xs text-muted mt-1">Configure options and click generate</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {generatedAssets.map((asset, i) => (
                <div key={i} className="bg-surface rounded-xl p-4">
                  {/* Image Assets */}
                  {['logo', 'imagery', 'icon'].includes(asset.type) && (
                    <div>
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
                  )}

                  {/* Color Palette */}
                  {asset.type === 'colors' && (
                    <div>
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
                  )}

                  {/* Text Content */}
                  {['tagline', 'voice'].includes(asset.type) && (
                    <div>
                      <div className="p-4 bg-background rounded-lg mb-3">
                        <pre className="text-sm whitespace-pre-wrap">{asset.data as string}</pre>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted capitalize">{asset.type}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(asset.data as string)}
                          className="text-xs px-3 py-1 border border-border rounded-full hover:border-foreground"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Icon Components
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

