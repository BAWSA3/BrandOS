import { Easing } from "remotion";

// Custom easing functions for emotional weight

// Slow start, fast end - for building momentum
export const easeInQuart = (t: number): number => t * t * t * t;

// Fast start, slow end - for impactful arrivals
export const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

// Slow start and end - for contemplative moments
export const easeInOutQuart = (t: number): number => {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
};

// Very slow start - for heavy/weighted feeling
export const easeInQuint = (t: number): number => t * t * t * t * t;

// Bounce back effect - for impacts
export const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

// Elastic effect - for text reveals
export const easeOutElastic = (t: number): number => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

// Standard Remotion easings re-exported for convenience
export const easings = {
  linear: Easing.linear,
  ease: Easing.ease,
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
  easeInQuart,
  easeOutQuart,
  easeInOutQuart,
  easeInQuint,
  easeOutBack,
  easeOutElastic,
} as const;
