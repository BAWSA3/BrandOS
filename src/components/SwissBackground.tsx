'use client';

import React from 'react';

interface SwissBackgroundProps {
  mode?: 'full' | 'page';
  showClouds?: boolean;
  showOrbs?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function SwissBackground({
  mode = 'full',
  showClouds,
  showOrbs = true,
  className = '',
  children,
}: SwissBackgroundProps) {
  const clouds = showClouds ?? (mode === 'full');
  const orbOpacity = mode === 'page' ? 'opacity-30' : '';

  if (mode === 'full') {
    return (
      <div className={`fixed inset-0 z-[100] bg-brand-cream flex flex-col overflow-hidden ${className}`}>
        {/* Grid lines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(15,15,15,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,15,15,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Color orbs */}
        {showOrbs && (
          <div className={`absolute inset-0 pointer-events-none overflow-hidden ${orbOpacity}`}>
            <div
              className="absolute"
              style={{
                width: '50vw', height: '50vh', top: '-5%', left: '-8%',
                background: 'radial-gradient(ellipse 80% 80% at 55% 60%, rgba(47,84,235,1) 0%, rgba(47,84,235,0.7) 25%, rgba(47,84,235,0.25) 50%, transparent 70%)',
                filter: 'blur(15px)',
              }}
            />
            <div
              className="absolute"
              style={{
                width: '18vw', height: '18vw', top: '-4%', right: '8%',
                background: 'radial-gradient(circle, rgba(47,84,235,1) 0%, rgba(47,84,235,0.6) 35%, transparent 65%)',
                filter: 'blur(10px)',
              }}
            />
            <div
              className="absolute"
              style={{
                width: '45vw', height: '55vh', top: '5%', right: '-8%',
                background: 'radial-gradient(ellipse 75% 80% at 45% 50%, rgba(250,140,22,1) 0%, rgba(250,140,22,0.65) 25%, rgba(250,140,22,0.2) 50%, transparent 70%)',
                filter: 'blur(15px)',
              }}
            />
            <div
              className="absolute"
              style={{
                width: '40vw', height: '40vh', bottom: '-8%', left: '0%',
                background: 'radial-gradient(ellipse 80% 80% at 50% 40%, rgba(47,84,235,1) 0%, rgba(47,84,235,0.6) 25%, rgba(47,84,235,0.15) 50%, transparent 70%)',
                filter: 'blur(12px)',
              }}
            />
          </div>
        )}

        {/* Dithered cloud artwork */}
        {clouds && (
          <div className="absolute inset-0 pointer-events-none">
            <img
              src="/assets/cloud-bg.png"
              alt=""
              className="w-full h-full object-contain blend-dither opacity-40"
            />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col">
          {children}
        </div>
      </div>
    );
  }

  // mode === 'page'
  return (
    <div className={`relative bg-brand-cream min-h-0 ${className}`}>
      {/* Grid lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(15,15,15,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,15,15,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Color orbs (reduced opacity for page mode) */}
      {showOrbs && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          <div
            className="absolute"
            style={{
              width: '50vw', height: '50vh', top: '-5%', left: '-8%',
              background: 'radial-gradient(ellipse 80% 80% at 55% 60%, rgba(47,84,235,1) 0%, rgba(47,84,235,0.7) 25%, rgba(47,84,235,0.25) 50%, transparent 70%)',
              filter: 'blur(15px)',
            }}
          />
          <div
            className="absolute"
            style={{
              width: '45vw', height: '55vh', top: '5%', right: '-8%',
              background: 'radial-gradient(ellipse 75% 80% at 45% 50%, rgba(250,140,22,1) 0%, rgba(250,140,22,0.65) 25%, rgba(250,140,22,0.2) 50%, transparent 70%)',
              filter: 'blur(15px)',
            }}
          />
        </div>
      )}

      {/* Dithered cloud artwork */}
      {clouds && (
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/assets/cloud-bg.png"
            alt=""
            className="w-full h-full object-contain blend-dither opacity-40"
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
