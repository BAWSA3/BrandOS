'use client';

import { ReactNode, createContext, useContext, Children, cloneElement, isValidElement } from 'react';
import { usePinnedSection } from './PinnedSection';

// Context to share reveal progress with RevealItems
interface RevealContextValue {
  containerProgress: number;
  revealStart: number;
  revealEnd: number;
  getItemRevealProgress: (itemIndex: number, totalItems: number) => number;
}

const RevealContext = createContext<RevealContextValue>({
  containerProgress: 0,
  revealStart: 0.1,
  revealEnd: 0.6,
  getItemRevealProgress: () => 0,
});

export const useRevealContext = () => useContext(RevealContext);

interface RevealContainerProps {
  children: ReactNode;
  revealStart?: number; // progress threshold to start revealing (default 0.1)
  revealEnd?: number; // progress threshold when all items revealed (default 0.6)
  staggerDelay?: number; // normalized delay between items (default 0.05)
  className?: string;
}

export default function RevealContainer({
  children,
  revealStart = 0.1,
  revealEnd = 0.6,
  staggerDelay = 0.05,
  className = '',
}: RevealContainerProps) {
  const { progress: sectionProgress, isActive } = usePinnedSection();

  // Calculate reveal progress for individual items
  const getItemRevealProgress = (itemIndex: number, totalItems: number): number => {
    // If section is active but hasn't scrolled yet (first section at start), show all content
    if (isActive && sectionProgress === 0) {
      return 1;
    }

    // Each item starts revealing at a staggered point
    const itemStart = revealStart + (itemIndex * staggerDelay);
    const itemEnd = itemStart + ((revealEnd - revealStart) / totalItems);

    if (sectionProgress <= itemStart) return 0;
    if (sectionProgress >= itemEnd) return 1;

    // Normalize progress between item's start and end
    return (sectionProgress - itemStart) / (itemEnd - itemStart);
  };

  // Count valid children to pass total to items
  const childArray = Children.toArray(children);
  const totalItems = childArray.length;

  // Clone children and inject index
  const childrenWithIndex = childArray.map((child, index) => {
    if (isValidElement(child)) {
      return cloneElement(child as React.ReactElement<{ itemIndex?: number; totalItems?: number }>, {
        itemIndex: index,
        totalItems,
      });
    }
    return child;
  });

  return (
    <RevealContext.Provider
      value={{
        containerProgress: sectionProgress,
        revealStart,
        revealEnd,
        getItemRevealProgress,
      }}
    >
      <div className={className}>{childrenWithIndex}</div>
    </RevealContext.Provider>
  );
}
