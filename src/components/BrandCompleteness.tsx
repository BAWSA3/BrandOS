'use client';

import { useMemo } from 'react';
import { useCurrentBrand } from '@/lib/store';

interface CompletionItem {
  id: string;
  label: string;
  description: string;
  isComplete: boolean;
  weight: number;
}

interface BrandCompletenessProps {
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function BrandCompleteness({ showDetails = true, size = 'md' }: BrandCompletenessProps) {
  const brandDNA = useCurrentBrand();

  const completionItems: CompletionItem[] = useMemo(() => [
    {
      id: 'name',
      label: 'Brand name',
      description: 'Give your brand a name',
      isComplete: Boolean(brandDNA?.name && brandDNA.name.trim().length > 0),
      weight: 15,
    },
    {
      id: 'colors',
      label: 'Brand colors',
      description: 'Define primary, secondary, and accent colors',
      isComplete: Boolean(
        brandDNA?.colors?.primary && 
        brandDNA?.colors?.secondary && 
        brandDNA?.colors?.accent
      ),
      weight: 15,
    },
    {
      id: 'tone',
      label: 'Tone settings',
      description: 'Configure your brand\'s voice personality',
      isComplete: Boolean(
        brandDNA?.tone?.minimal !== undefined &&
        brandDNA?.tone?.playful !== undefined &&
        brandDNA?.tone?.bold !== undefined
      ),
      weight: 15,
    },
    {
      id: 'keywords',
      label: 'Brand keywords',
      description: 'Add at least 3 keywords',
      isComplete: Boolean(brandDNA?.keywords && brandDNA.keywords.length >= 3),
      weight: 15,
    },
    {
      id: 'doPatterns',
      label: 'Do patterns',
      description: 'Define what your brand should do',
      isComplete: Boolean(brandDNA?.doPatterns && brandDNA.doPatterns.length >= 2),
      weight: 15,
    },
    {
      id: 'dontPatterns',
      label: 'Don\'t patterns',
      description: 'Define what your brand should avoid',
      isComplete: Boolean(brandDNA?.dontPatterns && brandDNA.dontPatterns.length >= 2),
      weight: 10,
    },
    {
      id: 'voiceSamples',
      label: 'Voice samples',
      description: 'Add at least 2 example texts',
      isComplete: Boolean(brandDNA?.voiceSamples && brandDNA.voiceSamples.length >= 2),
      weight: 15,
    },
  ], [brandDNA]);

  const { completeness, completedCount } = useMemo(() => {
    const totalWeight = completionItems.reduce((sum, item) => sum + item.weight, 0);
    const completedWeight = completionItems
      .filter(item => item.isComplete)
      .reduce((sum, item) => sum + item.weight, 0);
    
    return {
      completeness: Math.round((completedWeight / totalWeight) * 100),
      completedCount: completionItems.filter(item => item.isComplete).length,
    };
  }, [completionItems]);

  const nextAction = useMemo(() => {
    return completionItems.find(item => !item.isComplete);
  }, [completionItems]);

  const sizeClasses = {
    sm: { ring: 'w-12 h-12', text: 'text-sm', stroke: 3 },
    md: { ring: 'w-20 h-20', text: 'text-xl', stroke: 4 },
    lg: { ring: 'w-32 h-32', text: 'text-3xl', stroke: 6 },
  };

  const { ring, text, stroke } = sizeClasses[size];
  const radius = size === 'sm' ? 20 : size === 'md' ? 36 : 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completeness / 100) * circumference;

  // Color based on completeness
  const getColor = () => {
    if (completeness >= 80) return 'text-green-500';
    if (completeness >= 50) return 'text-yellow-500';
    return 'text-orange-500';
  };

  return (
    <div className="flex items-start gap-6">
      {/* Progress Ring */}
      <div className={`relative ${ring} flex-shrink-0`}>
        <svg className="w-full h-full -rotate-90">
          {/* Background circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="none"
            className="text-surface"
          />
          {/* Progress circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            className={`transition-all duration-700 ease-out ${getColor()}`}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
            }}
          />
        </svg>
        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${text} font-light`}>{completeness}</span>
          {size !== 'sm' && <span className="text-xs text-muted">%</span>}
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Brand Completeness</h3>
            <span className="text-xs text-muted">{completedCount}/{completionItems.length}</span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-surface rounded-full overflow-hidden mb-4">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                completeness >= 80 ? 'bg-green-500' :
                completeness >= 50 ? 'bg-yellow-500' :
                'bg-orange-500'
              }`}
              style={{ width: `${completeness}%` }}
            />
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            {completionItems.map((item) => (
              <div 
                key={item.id}
                className={`flex items-center gap-2 text-sm ${
                  item.isComplete ? 'text-muted' : 'text-foreground'
                }`}
              >
                {item.isComplete ? (
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="w-4 h-4 rounded-full border border-border flex-shrink-0" />
                )}
                <span className={item.isComplete ? 'line-through' : ''}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Next action suggestion */}
          {nextAction && completeness < 100 && (
            <div className="mt-4 p-3 bg-surface rounded-lg">
              <p className="text-xs text-muted mb-1">Next step</p>
              <p className="text-sm font-medium">{nextAction.description}</p>
            </div>
          )}

          {completeness === 100 && (
            <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Brand fully configured!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Hook to get completeness value for other components
export function useBrandCompleteness() {
  const brandDNA = useCurrentBrand();
  
  return useMemo(() => {
    const items = [
      { isComplete: Boolean(brandDNA?.name?.trim()), weight: 15 },
      { isComplete: Boolean(brandDNA?.colors?.primary && brandDNA?.colors?.secondary && brandDNA?.colors?.accent), weight: 15 },
      { isComplete: Boolean(brandDNA?.tone?.minimal !== undefined), weight: 15 },
      { isComplete: Boolean(brandDNA?.keywords && brandDNA.keywords.length >= 3), weight: 15 },
      { isComplete: Boolean(brandDNA?.doPatterns && brandDNA.doPatterns.length >= 2), weight: 15 },
      { isComplete: Boolean(brandDNA?.dontPatterns && brandDNA.dontPatterns.length >= 2), weight: 10 },
      { isComplete: Boolean(brandDNA?.voiceSamples && brandDNA.voiceSamples.length >= 2), weight: 15 },
    ];
    
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const completedWeight = items.filter(i => i.isComplete).reduce((sum, item) => sum + item.weight, 0);
    
    return Math.round((completedWeight / totalWeight) * 100);
  }, [brandDNA]);
}
















