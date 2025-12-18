'use client';

import { useBrandKitStore } from '@/lib/brandKitStore';

interface BrandKitSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  brandId: string;
}

const sections = [
  { id: 'all', label: 'All Sections', icon: 'grid' },
  { id: 'logos', label: 'Logos', icon: 'image' },
  { id: 'colors', label: 'Colors', icon: 'palette' },
  { id: 'typography', label: 'Typography', icon: 'type' },
  { id: 'imagery', label: 'Imagery', icon: 'photo' },
  { id: 'icons', label: 'Icons', icon: 'shapes' },
  { id: 'templates', label: 'Templates', icon: 'layout' },
];

export default function BrandKitSidebar({ activeSection, onSectionChange, brandId }: BrandKitSidebarProps) {
  const { getCurrentBrandKit } = useBrandKitStore();
  const brandKit = getCurrentBrandKit(brandId);

  const getAssetCount = (sectionId: string): number => {
    switch (sectionId) {
      case 'logos':
        return brandKit.logos.length;
      case 'colors':
        return brandKit.extendedColors.length;
      case 'typography':
        return brandKit.typography.fonts.length;
      case 'imagery':
        return brandKit.imagery.length;
      case 'icons':
        return brandKit.icons.length;
      case 'templates':
        return brandKit.templates.length;
      case 'all':
        return (
          brandKit.logos.length +
          brandKit.extendedColors.length +
          brandKit.typography.fonts.length +
          brandKit.imagery.length +
          brandKit.icons.length +
          brandKit.templates.length
        );
      default:
        return 0;
    }
  };

  return (
    <div className="w-56 border-r border-border bg-background flex flex-col">
      {/* Section Navigation */}
      <div className="flex-1 py-4">
        <div className="px-4 mb-2">
          <h3 className="text-xs uppercase tracking-widest text-muted">Sections</h3>
        </div>
        <nav className="space-y-1 px-2">
          {sections.map((section) => {
            const count = getAssetCount(section.id);
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all
                  ${activeSection === section.id
                    ? 'bg-foreground text-background'
                    : 'text-muted hover:text-foreground hover:bg-surface'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <SidebarIcon icon={section.icon} />
                  <span>{section.label}</span>
                </div>
                {count > 0 && (
                  <span className={`
                    text-xs px-1.5 py-0.5 rounded-full
                    ${activeSection === section.id
                      ? 'bg-background/20 text-background'
                      : 'bg-surface text-muted'
                    }
                  `}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Quick Stats */}
      <div className="border-t border-border p-4">
        <h3 className="text-xs uppercase tracking-widest text-muted mb-3">Brand Kit Stats</h3>
        <div className="space-y-2">
          <StatItem label="Total Assets" value={getAssetCount('all')} />
          <StatItem label="Colors" value={brandKit.extendedColors.length} />
          <StatItem label="Fonts" value={brandKit.typography.fonts.length} />
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function SidebarIcon({ icon }: { icon: string }) {
  const className = "w-4 h-4";
  
  switch (icon) {
    case 'grid':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case 'image':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'palette':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      );
    case 'type':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      );
    case 'photo':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'shapes':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
        </svg>
      );
    case 'layout':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      );
    default:
      return null;
  }
}

