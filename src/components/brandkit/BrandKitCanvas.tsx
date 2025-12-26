'use client';

import { useState, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useBrandKitStore } from '@/lib/brandKitStore';
import { useBrandStore } from '@/lib/store';
import BrandKitSidebar from './BrandKitSidebar';
import BrandKitToolbar from './BrandKitToolbar';
import LogoSection from './sections/LogoSection';
import ColorSection from './sections/ColorSection';
import TypographySection from './sections/TypographySection';
import ImagerySection from './sections/ImagerySection';
import IconSection from './sections/IconSection';
import TemplateSection from './sections/TemplateSection';

export default function BrandKitCanvas() {
  const { currentBrandId } = useBrandStore();
  const { getCurrentBrandKit, updateCanvasLayout } = useBrandKitStore();
  
  const brandKit = currentBrandId ? getCurrentBrandKit(currentBrandId) : null;
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('all');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null);
    // Handle drag end logic here
  }, []);

  const handleZoomIn = useCallback(() => {
    if (!currentBrandId || !brandKit) return;
    const newZoom = Math.min(brandKit.canvasLayout.zoom + 0.1, 2);
    updateCanvasLayout(currentBrandId, { zoom: newZoom });
  }, [currentBrandId, brandKit, updateCanvasLayout]);

  const handleZoomOut = useCallback(() => {
    if (!currentBrandId || !brandKit) return;
    const newZoom = Math.max(brandKit.canvasLayout.zoom - 0.1, 0.5);
    updateCanvasLayout(currentBrandId, { zoom: newZoom });
  }, [currentBrandId, brandKit, updateCanvasLayout]);

  const handleResetZoom = useCallback(() => {
    if (!currentBrandId) return;
    updateCanvasLayout(currentBrandId, { zoom: 1, panX: 0, panY: 0 });
  }, [currentBrandId, updateCanvasLayout]);

  const handleToggleGrid = useCallback(() => {
    if (!currentBrandId || !brandKit) return;
    updateCanvasLayout(currentBrandId, { gridEnabled: !brandKit.canvasLayout.gridEnabled });
  }, [currentBrandId, brandKit, updateCanvasLayout]);

  if (!currentBrandId || !brandKit) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted">Select a brand to start building your brand kit</p>
      </div>
    );
  }

  const renderSection = (sectionType: string) => {
    switch (sectionType) {
      case 'logos':
        return <LogoSection brandId={currentBrandId} />;
      case 'colors':
        return <ColorSection brandId={currentBrandId} />;
      case 'typography':
        return <TypographySection brandId={currentBrandId} />;
      case 'imagery':
        return <ImagerySection brandId={currentBrandId} />;
      case 'icons':
        return <IconSection brandId={currentBrandId} />;
      case 'templates':
        return <TemplateSection brandId={currentBrandId} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {/* Toolbar */}
      <BrandKitToolbar
        zoom={brandKit.canvasLayout.zoom}
        gridEnabled={brandKit.canvasLayout.gridEnabled}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onToggleGrid={handleToggleGrid}
        brandId={currentBrandId}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <BrandKitSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          brandId={currentBrandId}
        />

        {/* Main Canvas Area */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(event) => setActiveDragId(event.active.id as string)}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-auto bg-surface/30">
            <div 
              className={`min-h-full p-8 transition-transform duration-200 ${
                brandKit.canvasLayout.gridEnabled ? 'bg-grid-pattern' : ''
              }`}
              style={{
                transform: `scale(${brandKit.canvasLayout.zoom})`,
                transformOrigin: 'top left',
              }}
            >
              {/* Sections Grid */}
              <div className="max-w-6xl mx-auto space-y-8">
                {activeSection === 'all' ? (
                  <>
                    {/* Logos Section */}
                    <CanvasSection title="Logos & Marks" type="logos">
                      {renderSection('logos')}
                    </CanvasSection>

                    {/* Colors Section */}
                    <CanvasSection title="Color Palette" type="colors">
                      {renderSection('colors')}
                    </CanvasSection>

                    {/* Typography Section */}
                    <CanvasSection title="Typography" type="typography">
                      {renderSection('typography')}
                    </CanvasSection>

                    {/* Imagery Section */}
                    <CanvasSection title="Imagery & Mood" type="imagery">
                      {renderSection('imagery')}
                    </CanvasSection>

                    {/* Icons Section */}
                    <CanvasSection title="Icon Library" type="icons">
                      {renderSection('icons')}
                    </CanvasSection>

                    {/* Templates Section */}
                    <CanvasSection title="Templates" type="templates">
                      {renderSection('templates')}
                    </CanvasSection>
                  </>
                ) : (
                  <CanvasSection 
                    title={getSectionTitle(activeSection)} 
                    type={activeSection}
                    expanded
                  >
                    {renderSection(activeSection)}
                  </CanvasSection>
                )}
              </div>
            </div>
          </div>

          <DragOverlay>
            {activeDragId ? (
              <div className="bg-background border border-border rounded-lg p-4 shadow-xl opacity-80">
                Dragging...
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

// Section wrapper component
interface CanvasSectionProps {
  title: string;
  type: string;
  children: React.ReactNode;
  expanded?: boolean;
}

function CanvasSection({ title, type, children, expanded = false }: CanvasSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`bg-background border border-border rounded-xl overflow-hidden transition-all ${
      expanded ? 'min-h-[400px]' : ''
    }`}>
      {/* Section Header */}
      <div 
        className="flex items-center justify-between px-6 py-4 border-b border-border cursor-pointer hover:bg-surface/50 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          <SectionIcon type={type} />
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
        <button className="text-muted hover:text-foreground transition-colors">
          <svg 
            className={`w-5 h-5 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Section Content */}
      {!isCollapsed && (
        <div className="p-6">
          {children}
        </div>
      )}
    </div>
  );
}

function SectionIcon({ type }: { type: string }) {
  const iconClass = "w-5 h-5 text-muted";
  
  switch (type) {
    case 'logos':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'colors':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      );
    case 'typography':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      );
    case 'imagery':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'icons':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
        </svg>
      );
    case 'templates':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      );
    default:
      return null;
  }
}

function getSectionTitle(type: string): string {
  const titles: Record<string, string> = {
    logos: 'Logos & Marks',
    colors: 'Color Palette',
    typography: 'Typography',
    imagery: 'Imagery & Mood',
    icons: 'Icon Library',
    templates: 'Templates',
  };
  return titles[type] || type;
}







