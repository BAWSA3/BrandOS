'use client';

import { useState } from 'react';
import { useBrandKitStore } from '@/lib/brandKitStore';

interface BrandKitToolbarProps {
  zoom: number;
  gridEnabled: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onToggleGrid: () => void;
  brandId: string;
}

export default function BrandKitToolbar({
  zoom,
  gridEnabled,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleGrid,
  brandId,
}: BrandKitToolbarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExportPDF = async () => {
    // Will be implemented in export features
    console.log('Export PDF');
    setShowExportMenu(false);
  };

  const handleExportZIP = async () => {
    // Will be implemented in export features
    console.log('Export ZIP');
    setShowExportMenu(false);
  };

  const handleShare = async () => {
    // Will be implemented
    console.log('Share');
    setShowExportMenu(false);
  };

  return (
    <div className="h-12 border-b border-border bg-background flex items-center justify-between px-4">
      {/* Left: View Controls */}
      <div className="flex items-center gap-2">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-surface rounded-lg p-1">
          <button
            onClick={onZoomOut}
            disabled={zoom <= 0.5}
            className="p-1.5 rounded hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Zoom Out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <button
            onClick={onResetZoom}
            className="px-2 py-1 text-xs font-medium hover:bg-border rounded transition-colors min-w-[50px]"
            title="Reset Zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            disabled={zoom >= 2}
            className="p-1.5 rounded hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Zoom In"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border" />

        {/* Grid Toggle */}
        <button
          onClick={onToggleGrid}
          className={`p-2 rounded-lg transition-colors ${
            gridEnabled ? 'bg-foreground text-background' : 'hover:bg-surface'
          }`}
          title={gridEnabled ? 'Hide Grid' : 'Show Grid'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
      </div>

      {/* Center: Title */}
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium">Brand Kit Canvas</h2>
        <span className="text-xs text-muted px-2 py-0.5 bg-surface rounded">Beta</span>
      </div>

      {/* Right: Export & Share */}
      <div className="flex items-center gap-2">
        {/* Export Menu */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-surface hover:bg-border rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Export
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showExportMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowExportMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50 animate-fade-in">
                <button
                  onClick={handleExportPDF}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface transition-colors"
                >
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Export as PDF
                </button>
                <button
                  onClick={handleExportZIP}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface transition-colors"
                >
                  <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  Export as ZIP
                </button>
                <div className="border-t border-border" />
                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface transition-colors"
                >
                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share Link
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

