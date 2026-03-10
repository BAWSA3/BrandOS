'use client';

import { motion } from 'motion/react';

// TypeScript interface definitions as background art
const CODE_BLOCKS = [
  {
    code: `interface BrandDNA {
  identity: string;
  voice: ToneProfile;
  values: string[];
  audience: Persona[];
}`,
    position: { top: '8%', left: '5%' },
    opacity: 0.08,
  },
  {
    code: `type ToneProfile = {
  formal: number;
  playful: number;
  bold: number;
  minimal: number;
};`,
    position: { top: '15%', right: '8%' },
    opacity: 0.06,
  },
  {
    code: `interface ContentEngine {
  generate: (dna: BrandDNA) => Content;
  analyze: (input: string) => Score;
  optimize: (content: Content) => Content;
}`,
    position: { top: '45%', left: '3%' },
    opacity: 0.05,
  },
  {
    code: `type Score = {
  overall: number;
  phases: {
    define: number;
    check: number;
    generate: number;
    scale: number;
  };
};`,
    position: { bottom: '25%', right: '5%' },
    opacity: 0.07,
  },
  {
    code: `export const createBrand = (
  config: BrandConfig
): BrandOS => {
  return new BrandOS(config);
};`,
    position: { bottom: '8%', left: '8%' },
    opacity: 0.06,
  },
  {
    code: `interface Persona {
  archetype: string;
  traits: string[];
  goals: string[];
}`,
    position: { top: '70%', right: '12%' },
    opacity: 0.05,
  },
  {
    code: `// @brandos/core v2.0
import { DNA } from './dna';
import { Engine } from './engine';`,
    position: { top: '3%', right: '35%' },
    opacity: 0.04,
  },
  {
    code: `type BrandConfig = {
  name: string;
  domain: string;
  keywords: string[];
};`,
    position: { bottom: '40%', left: '25%' },
    opacity: 0.04,
  },
];

export default function TypeScriptInterfaceBg() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {CODE_BLOCKS.map((block, index) => (
        <motion.pre
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: block.opacity }}
          transition={{ duration: 1.5, delay: index * 0.15 }}
          style={{
            position: 'absolute',
            ...block.position,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: 'clamp(10px, 1.2vw, 14px)',
            lineHeight: 1.6,
            color: '#000000',
            margin: 0,
            whiteSpace: 'pre',
            userSelect: 'none',
          }}
        >
          {block.code}
        </motion.pre>
      ))}

      {/* Subtle decorative brackets */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.03 }}
        transition={{ duration: 2, delay: 1 }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 'clamp(200px, 30vw, 400px)',
          color: '#000000',
          userSelect: 'none',
        }}
      >
        {'{ }'}
      </motion.span>
    </div>
  );
}
