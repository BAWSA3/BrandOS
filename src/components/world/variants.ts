import type { WorldMotionPreset } from '@/worlds/types';

export function buildVariants(motion: WorldMotionPreset) {
  return {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: motion.fadeIn.duration, ease: motion.fadeIn.ease },
    },
    slideIn: {
      initial: { opacity: 0, y: motion.slideIn.distance },
      animate: { opacity: 1, y: 0 },
      transition: { duration: motion.slideIn.duration, ease: motion.slideIn.ease },
    },
    hover: {
      whileHover: { scale: motion.hover.scale },
      transition: { duration: motion.hover.duration },
    },
  };
}

export const ZERO_MOTION_PRESET: WorldMotionPreset = {
  fadeIn: { duration: 0, ease: 'linear' },
  slideIn: { duration: 0, ease: 'linear', distance: 0 },
  hover: { scale: 1, duration: 0 },
  reducedMotion: 'disable',
};
