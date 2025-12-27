'use client';

import { ExtractedValue } from '@/lib/importTypes';

interface ExtractedElementProps<T> {
  label: string;
  value: ExtractedValue<T>;
  type: 'text' | 'color' | 'slider' | 'list';
  included: boolean;
  onToggle: () => void;
  onEdit?: (newValue: T) => void;
  renderValue?: (value: T) => React.ReactNode;
}

export default function ExtractedElement<T>({
  label,
  value,
  type,
  included,
  onToggle,
  onEdit,
  renderValue,
}: ExtractedElementProps<T>) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-500';
    if (confidence >= 60) return 'text-yellow-500';
    return 'text-orange-500';
  };

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      included ? 'border-foreground bg-surface' : 'border-border opacity-50'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggle}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              included ? 'bg-foreground border-foreground' : 'border-muted'
            }`}
          >
            {included && (
              <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <span className="font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${getConfidenceColor(value.confidence)}`}>
            {value.confidence}% confidence
          </span>
        </div>
      </div>

      <div className="ml-8">
        {type === 'color' && (
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg border border-border"
              style={{ backgroundColor: value.value as string }}
            />
            <div>
              <input
                type="text"
                value={value.value as string}
                onChange={(e) => onEdit?.(e.target.value as T)}
                className="font-mono text-sm bg-transparent border-b border-border pb-1 outline-none focus:border-foreground w-24"
                disabled={!included}
              />
              <p className="text-xs text-muted mt-1">from {value.source}</p>
            </div>
          </div>
        )}

        {type === 'text' && (
          <div>
            {renderValue ? (
              renderValue(value.value)
            ) : (
              <input
                type="text"
                value={value.value as string}
                onChange={(e) => onEdit?.(e.target.value as T)}
                className="w-full text-lg bg-transparent border-b border-border pb-1 outline-none focus:border-foreground"
                disabled={!included}
              />
            )}
            <p className="text-xs text-muted mt-2">from {value.source}</p>
          </div>
        )}

        {type === 'slider' && (
          <div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={value.value as number}
                onChange={(e) => onEdit?.(parseInt(e.target.value) as T)}
                className="flex-1"
                disabled={!included}
              />
              <span className="text-lg font-light w-12 text-right">{value.value as number}</span>
            </div>
            <p className="text-xs text-muted mt-2">from {value.source}</p>
          </div>
        )}

        {type === 'list' && Array.isArray(value.value) && (
          <div className="flex flex-wrap gap-2">
            {(value.value as string[]).map((item, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-background rounded-full text-sm"
              >
                {item}
              </span>
            ))}
            <p className="w-full text-xs text-muted mt-2">from {value.source}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Simplified version for single items in a list
interface ExtractedListItemProps {
  value: string;
  confidence: number;
  source: string;
  included: boolean;
  onToggle: () => void;
  onEdit?: (newValue: string) => void;
}

export function ExtractedListItem({
  value,
  confidence,
  source,
  included,
  onToggle,
  onEdit,
}: ExtractedListItemProps) {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return 'text-green-500';
    if (conf >= 60) return 'text-yellow-500';
    return 'text-orange-500';
  };

  return (
    <div className={`group flex items-center gap-3 p-3 rounded-lg border transition-all ${
      included ? 'border-foreground/20 bg-surface' : 'border-border opacity-50'
    }`}>
      <button
        onClick={onToggle}
        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
          included ? 'bg-foreground border-foreground' : 'border-muted'
        }`}
      >
        {included && (
          <svg className="w-2.5 h-2.5 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <input
        type="text"
        value={value}
        onChange={(e) => onEdit?.(e.target.value)}
        className="flex-1 bg-transparent outline-none text-sm"
        disabled={!included}
      />
      <span className={`text-xs ${getConfidenceColor(confidence)} opacity-0 group-hover:opacity-100 transition-opacity`}>
        {confidence}%
      </span>
    </div>
  );
}








