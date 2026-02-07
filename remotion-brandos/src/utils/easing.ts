/**
 * Cinematic easing functions
 */

// Dramatic ease-out for impactful arrivals
export const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

// Slow start for building tension
export const easeInQuart = (t: number): number => t * t * t * t;

// Smooth in-out for transitions
export const easeInOutQuart = (t: number): number => {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
};

// Bounce back for impacts
export const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

// Exponential ease out for quick stops
export const easeOutExpo = (t: number): number => {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
};

// Cubic bezier approximation for cinematic feel
export const cinematicEase = (t: number): number => {
  // Approximates cubic-bezier(0.16, 1, 0.3, 1)
  return 1 - Math.pow(1 - t, 3);
};
