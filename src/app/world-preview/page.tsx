import { resolveWorld } from '@/worlds';
import { WorldProvider } from '@/components/world/WorldProvider';
import WorldScene from '@/components/world/WorldScene';
import MuteButton from '@/components/world/MuteButton';
import PreviewPanel from './PreviewPanel';
import WizardPreview from './WizardPreview';

// Unauthenticated preview for verifying the WorldProvider runtime.
// Visit /world-preview?world=terminal-os (world param optional; defaults to terminal-os).
// Add &wizard=1 to preview the first-run BrandSetupWizard under the theme
// (writes to the local brand store only — nothing syncs from this page).
export default async function WorldPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ world?: string; wizard?: string }>;
}) {
  const { world: worldId, wizard } = await searchParams;
  const world = resolveWorld(worldId ?? null);

  return (
    <WorldProvider world={world}>
      <div
        className="relative min-h-screen"
        style={{ backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}
      >
        <WorldScene intensity={0.9} />
        <div className="relative z-10">
          {wizard ? <WizardPreview /> : <PreviewPanel />}
        </div>
        <MuteButton />
      </div>
    </WorldProvider>
  );
}
