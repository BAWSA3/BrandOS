/**
 * X Brand Score Journey Moments
 * Defines all capture points during the demo flow
 */

export interface JourneyMoment {
  id: string;
  label: string;
  description: string;
  delay: number; // ms to wait before capture (for animations)
  duration: number; // frames in final video
  transition: 'fade' | 'zoom' | 'slide';
}

export const JOURNEY_MOMENTS: JourneyMoment[] = [
  {
    id: 'score:landing',
    label: 'Landing',
    description: 'Hero section with username input form',
    delay: 500,
    duration: 60, // 2 seconds at 30fps
    transition: 'fade',
  },
  {
    id: 'score:input',
    label: 'Input Ready',
    description: 'Username entered, ready to analyze',
    delay: 300,
    duration: 45,
    transition: 'fade',
  },
  {
    id: 'score:analysis:define',
    label: 'Define Phase',
    description: 'DEFINE phase - analyzing profile identity',
    delay: 1000,
    duration: 45,
    transition: 'slide',
  },
  {
    id: 'score:analysis:check',
    label: 'Check Phase',
    description: 'CHECK phase - evaluating content quality',
    delay: 1000,
    duration: 45,
    transition: 'slide',
  },
  {
    id: 'score:analysis:generate',
    label: 'Generate Phase',
    description: 'GENERATE phase - creating brand DNA',
    delay: 1000,
    duration: 45,
    transition: 'slide',
  },
  {
    id: 'score:analysis:scale',
    label: 'Scale Phase',
    description: 'SCALE phase - finalizing brand strategy',
    delay: 1000,
    duration: 45,
    transition: 'slide',
  },
  {
    id: 'score:reveal',
    label: 'Score Reveal',
    description: 'Brand score reveal with confetti animation',
    delay: 2500, // Wait for confetti and score animation
    duration: 90, // 3 seconds - key moment
    transition: 'zoom',
  },
  {
    id: 'score:dashboard',
    label: 'Dashboard',
    description: 'BrandOS Dashboard with full results',
    delay: 1500,
    duration: 120, // 4 seconds
    transition: 'zoom',
  },
  {
    id: 'score:walkthrough:score',
    label: 'Score Walkthrough',
    description: 'Brand Score breakdown section',
    delay: 800,
    duration: 75,
    transition: 'slide',
  },
  {
    id: 'score:walkthrough:identity',
    label: 'Identity Walkthrough',
    description: 'Brand Identity analysis section',
    delay: 800,
    duration: 75,
    transition: 'slide',
  },
  {
    id: 'score:walkthrough:tone',
    label: 'Tone Walkthrough',
    description: 'Brand Tone analysis section',
    delay: 800,
    duration: 75,
    transition: 'slide',
  },
  {
    id: 'score:walkthrough:archetype',
    label: 'Archetype Walkthrough',
    description: 'Brand Archetype analysis section',
    delay: 800,
    duration: 75,
    transition: 'slide',
  },
  {
    id: 'score:walkthrough:keywords',
    label: 'Keywords Walkthrough',
    description: 'Brand Keywords analysis section',
    delay: 800,
    duration: 75,
    transition: 'slide',
  },
  {
    id: 'score:walkthrough:content',
    label: 'Content Walkthrough',
    description: 'Content pillars analysis section',
    delay: 800,
    duration: 75,
    transition: 'slide',
  },
];

export const MOMENT_IDS = JOURNEY_MOMENTS.map(m => m.id);

export function getMomentById(id: string): JourneyMoment | undefined {
  return JOURNEY_MOMENTS.find(m => m.id === id);
}

export function getMomentIndex(id: string): number {
  return JOURNEY_MOMENTS.findIndex(m => m.id === id);
}

export function getNextMoment(currentId: string): JourneyMoment | undefined {
  const currentIndex = getMomentIndex(currentId);
  if (currentIndex === -1 || currentIndex >= JOURNEY_MOMENTS.length - 1) {
    return undefined;
  }
  return JOURNEY_MOMENTS[currentIndex + 1];
}

export function getTotalVideoDuration(): number {
  return JOURNEY_MOMENTS.reduce((acc, m) => acc + m.duration, 0);
}
