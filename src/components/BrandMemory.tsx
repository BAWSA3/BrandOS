'use client';

import { useState } from 'react';
import { useBrandStore } from '@/lib/store';
import { MemoryEvent } from '@/lib/types';

const EVENT_TYPES: { id: MemoryEvent['type']; name: string; icon: string; color: string }[] = [
  { id: 'success', name: 'Success', icon: '✓', color: 'bg-green-500/20 text-green-400' },
  { id: 'failure', name: 'Failure', icon: '✗', color: 'bg-red-500/20 text-red-400' },
  { id: 'experiment', name: 'Experiment', icon: '⚗', color: 'bg-purple-500/20 text-purple-400' },
  { id: 'feedback', name: 'Feedback', icon: '💬', color: 'bg-blue-500/20 text-blue-400' },
];

export default function BrandMemory() {
  const { brandMemory, currentBrandId, addMemoryEvent, deleteMemoryEvent } = useBrandStore();
  const events = currentBrandId ? brandMemory[currentBrandId] || [] : [];
  
  const [isAdding, setIsAdding] = useState(false);
  const [newEvent, setNewEvent] = useState<{
    type: MemoryEvent['type'];
    title: string;
    description: string;
    content: string;
    outcome: string;
    tags: string;
    sentiment: 'positive' | 'neutral' | 'negative';
  }>({
    type: 'success',
    title: '',
    description: '',
    content: '',
    outcome: '',
    tags: '',
    sentiment: 'positive',
  });
  const [filter, setFilter] = useState<MemoryEvent['type'] | 'all'>('all');

  const handleAdd = () => {
    if (!newEvent.title.trim()) return;
    
    addMemoryEvent({
      type: newEvent.type,
      title: newEvent.title,
      description: newEvent.description,
      content: newEvent.content || undefined,
      outcome: newEvent.outcome || undefined,
      metrics: {
        sentiment: newEvent.sentiment,
      },
      tags: newEvent.tags.split(',').map(t => t.trim()).filter(Boolean),
    });
    
    setNewEvent({
      type: 'success',
      title: '',
      description: '',
      content: '',
      outcome: '',
      tags: '',
      sentiment: 'positive',
    });
    setIsAdding(false);
  };

  const filteredEvents = filter === 'all' ? events : events.filter(e => e.type === filter);

  // Derive patterns from events
  const patterns = {
    successful: events.filter(e => e.type === 'success').flatMap(e => e.tags).slice(0, 5),
    failed: events.filter(e => e.type === 'failure').flatMap(e => e.tags).slice(0, 5),
    trending: events.slice(0, 10).flatMap(e => e.tags).slice(0, 5),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs uppercase tracking-widest text-muted mb-2">Brand Memory Timeline</h3>
          <p className="text-sm text-muted">Track what worked and what failed.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-80 transition-opacity"
        >
          {isAdding ? 'Cancel' : '+ Add Memory'}
        </button>
      </div>

      {/* Patterns Summary */}
      {events.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
            <h4 className="text-xs uppercase tracking-widest text-green-500 mb-2">Successful Patterns</h4>
            <div className="flex flex-wrap gap-1">
              {patterns.successful.length > 0 
                ? patterns.successful.map((p, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-green-500/10 rounded-full">{p}</span>
                  ))
                : <span className="text-xs text-muted">No patterns yet</span>
              }
            </div>
          </div>
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
            <h4 className="text-xs uppercase tracking-widest text-red-500 mb-2">Failed Patterns</h4>
            <div className="flex flex-wrap gap-1">
              {patterns.failed.length > 0 
                ? patterns.failed.map((p, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-red-500/10 rounded-full">{p}</span>
                  ))
                : <span className="text-xs text-muted">No patterns yet</span>
              }
            </div>
          </div>
          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <h4 className="text-xs uppercase tracking-widest text-blue-500 mb-2">Recent Tags</h4>
            <div className="flex flex-wrap gap-1">
              {patterns.trending.length > 0 
                ? patterns.trending.map((p, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-blue-500/10 rounded-full">{p}</span>
                  ))
                : <span className="text-xs text-muted">No patterns yet</span>
              }
            </div>
          </div>
        </div>
      )}

      {/* Add Form */}
      {isAdding && (
        <div className="border border-border rounded-lg p-6 animate-fade-in">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">Event Type</label>
              <div className="flex gap-2">
                {EVENT_TYPES.map(et => (
                  <button
                    key={et.id}
                    onClick={() => setNewEvent({ ...newEvent, type: et.id })}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      newEvent.type === et.id
                        ? `${et.color} border-current`
                        : 'border-border hover:border-muted'
                    }`}
                  >
                    <span className="text-lg mr-2">{et.icon}</span>
                    <span className="text-xs">{et.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">Title</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="e.g., Q1 Campaign Launch"
                className="w-full bg-transparent border border-border rounded-lg px-4 py-3 outline-none placeholder:text-muted focus:border-foreground transition-colors"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-xs uppercase tracking-widest text-muted mb-2">Description</label>
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              placeholder="What happened? What did you learn?"
              className="w-full h-24 bg-transparent border border-border rounded-lg px-4 py-3 outline-none placeholder:text-muted focus:border-foreground transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">Content (optional)</label>
              <input
                type="text"
                value={newEvent.content}
                onChange={(e) => setNewEvent({ ...newEvent, content: e.target.value })}
                placeholder="The actual content used"
                className="w-full bg-transparent border border-border rounded-lg px-4 py-3 outline-none placeholder:text-muted focus:border-foreground transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                value={newEvent.tags}
                onChange={(e) => setNewEvent({ ...newEvent, tags: e.target.value })}
                placeholder="e.g., social, launch, minimal"
                className="w-full bg-transparent border border-border rounded-lg px-4 py-3 outline-none placeholder:text-muted focus:border-foreground transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={!newEvent.title.trim()}
            className="w-full py-3 bg-foreground text-background rounded-full text-sm font-medium disabled:opacity-30 transition-opacity hover:opacity-80"
          >
            Add to Memory
          </button>
        </div>
      )}

      {/* Filter */}
      {events.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              filter === 'all' ? 'bg-foreground text-background' : 'bg-surface hover:bg-border/50'
            }`}
          >
            All
          </button>
          {EVENT_TYPES.map(et => (
            <button
              key={et.id}
              onClick={() => setFilter(et.id)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                filter === et.id ? 'bg-foreground text-background' : 'bg-surface hover:bg-border/50'
              }`}
            >
              {et.icon} {et.name}
            </button>
          ))}
        </div>
      )}

      {/* Timeline */}
      {filteredEvents.length > 0 ? (
        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const eventType = EVENT_TYPES.find(et => et.id === event.type);
            return (
              <div key={event.id} className="border border-border rounded-lg p-4 group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center ${eventType?.color}`}>
                      {eventType?.icon}
                    </span>
                    <div>
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-xs text-muted">
                        {new Date(event.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMemoryEvent(event.id)}
                    className="text-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-muted mb-3">{event.description}</p>
                {event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {event.tags.map((tag, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-surface rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="text-muted mb-4">
            {filter === 'all' ? 'No memories recorded yet.' : `No ${filter} events yet.`}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => setIsAdding(true)}
              className="text-sm text-foreground hover:opacity-80 transition-opacity"
            >
              + Record your first brand memory
            </button>
          )}
        </div>
      )}
    </div>
  );
}

