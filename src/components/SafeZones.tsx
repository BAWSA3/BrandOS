'use client';

import { useState } from 'react';
import { useBrandStore } from '@/lib/store';
import { SafeZone } from '@/lib/types';

const CATEGORIES: SafeZone['category'][] = ['logo', 'color', 'typography', 'voice', 'imagery', 'motion', 'layout'];
const STATUSES: SafeZone['status'][] = ['locked', 'flexible', 'experimental'];

const statusStyles = {
  locked: 'bg-red-500/20 text-red-400 border-red-500/30',
  flexible: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  experimental: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const statusDescriptions = {
  locked: 'Never change. Core brand elements.',
  flexible: 'Can adapt within guidelines.',
  experimental: 'Open for creative exploration.',
};

export default function SafeZones() {
  const { safeZones, currentBrandId, addSafeZone, updateSafeZone, deleteSafeZone } = useBrandStore();
  const currentZones = currentBrandId ? safeZones[currentBrandId] || [] : [];
  
  const [isAdding, setIsAdding] = useState(false);
  const [newZone, setNewZone] = useState({
    element: '',
    category: 'voice' as SafeZone['category'],
    status: 'flexible' as SafeZone['status'],
    rules: '',
  });

  const handleAdd = () => {
    if (!newZone.element.trim()) return;
    
    addSafeZone({
      element: newZone.element,
      category: newZone.category,
      status: newZone.status,
      rules: newZone.rules.split('\n').filter(r => r.trim()),
    });
    
    setNewZone({ element: '', category: 'voice', status: 'flexible', rules: '' });
    setIsAdding(false);
  };

  const groupedZones = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = currentZones.filter(z => z.category === cat);
    return acc;
  }, {} as Record<SafeZone['category'], SafeZone[]>);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs uppercase tracking-widest text-muted mb-2">Brand Safe Zones</h3>
          <p className="text-sm text-muted">Define what&apos;s locked vs. flexible in your brand.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-80 transition-opacity"
        >
          {isAdding ? 'Cancel' : '+ Add Zone'}
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="border border-border rounded-lg p-6 animate-fade-in">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">
                Element
              </label>
              <input
                type="text"
                value={newZone.element}
                onChange={(e) => setNewZone({ ...newZone, element: e.target.value })}
                placeholder="e.g., Primary Logo, Headline Font"
                className="w-full bg-transparent border border-border rounded-lg px-4 py-3 outline-none placeholder:text-muted focus:border-foreground transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">
                Category
              </label>
              <select
                value={newZone.category}
                onChange={(e) => setNewZone({ ...newZone, category: e.target.value as SafeZone['category'] })}
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 outline-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-xs uppercase tracking-widest text-muted mb-2">
              Status
            </label>
            <div className="flex gap-2">
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => setNewZone({ ...newZone, status: s })}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    newZone.status === s
                      ? `${statusStyles[s]} border-current`
                      : 'border-border hover:border-muted'
                  }`}
                >
                  <div className="font-medium mb-1">{s.charAt(0).toUpperCase() + s.slice(1)}</div>
                  <div className="text-xs opacity-70">{statusDescriptions[s]}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs uppercase tracking-widest text-muted mb-2">
              Rules (one per line)
            </label>
            <textarea
              value={newZone.rules}
              onChange={(e) => setNewZone({ ...newZone, rules: e.target.value })}
              placeholder="e.g., Always use minimum 48px clearance&#10;Never rotate or distort&#10;Only use on white or black backgrounds"
              className="w-full h-24 bg-transparent border border-border rounded-lg px-4 py-3 outline-none placeholder:text-muted focus:border-foreground transition-colors resize-none"
            />
          </div>

          <button
            onClick={handleAdd}
            disabled={!newZone.element.trim()}
            className="w-full py-3 bg-foreground text-background rounded-full text-sm font-medium disabled:opacity-30 transition-opacity hover:opacity-80"
          >
            Add Safe Zone
          </button>
        </div>
      )}

      {/* Zones by Category */}
      {CATEGORIES.map(category => {
        const zones = groupedZones[category];
        if (zones.length === 0) return null;
        
        return (
          <div key={category}>
            <h4 className="text-xs uppercase tracking-widest text-muted mb-4">
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </h4>
            <div className="space-y-3">
              {zones.map(zone => (
                <div key={zone.id} className="border border-border rounded-lg p-4 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{zone.element}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${statusStyles[zone.status]}`}>
                        {zone.status}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteSafeZone(zone.id)}
                      className="text-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
                    >
                      ×
                    </button>
                  </div>
                  {zone.rules.length > 0 && (
                    <ul className="space-y-1">
                      {zone.rules.map((rule, i) => (
                        <li key={i} className="text-sm text-muted flex items-start gap-2">
                          <span>→</span> {rule}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty State */}
      {currentZones.length === 0 && !isAdding && (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="text-muted mb-4">No safe zones defined yet.</p>
          <button
            onClick={() => setIsAdding(true)}
            className="text-sm text-foreground hover:opacity-80 transition-opacity"
          >
            + Add your first safe zone
          </button>
        </div>
      )}
    </div>
  );
}

