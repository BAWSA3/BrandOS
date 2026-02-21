"use client"

// Re-export only the motion-plus components we use in BrandOS
// This avoids type-checking unused components (Ticker, Carousel, Cursor)
// that have forwardRef generic issues with our strict TypeScript config

export { AnimateNumber } from "../../plus/packages/motion-plus/src/components/AnimateNumber"
export { Typewriter } from "../../plus/packages/motion-plus/src/components/Typewriter"
export { ScrambleText } from "../../plus/packages/motion-plus/src/components/ScrambleText"
