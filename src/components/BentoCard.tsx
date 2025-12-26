"use client";

import { ReactNode } from "react";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  span?: "default" | "wide" | "tall" | "large" | "full";
  variant?: "default" | "accent" | "glow" | "hero";
  interactive?: boolean;
  onClick?: () => void;
  padding?: "none" | "sm" | "md" | "lg";
}

const spanClasses = {
  default: "col-span-12 md:col-span-4",
  wide: "col-span-12 md:col-span-8",
  tall: "col-span-12 md:col-span-4 md:row-span-2",
  large: "col-span-12 md:col-span-8 md:row-span-2",
  full: "col-span-12",
};

const paddingClasses = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function BentoCard({
  children,
  className = "",
  span = "default",
  variant = "default",
  interactive = true,
  onClick,
  padding = "md",
}: BentoCardProps) {
  const baseClasses = `
    relative overflow-hidden rounded-[24px]
    transition-all duration-300 ease-out
    ${spanClasses[span]}
    ${paddingClasses[padding]}
  `;

  const variantStyles = {
    default: `
      bg-[rgba(255,255,255,0.05)]
      backdrop-blur-xl
      border border-[rgba(255,255,255,0.1)]
      hover:border-[rgba(255,255,255,0.15)]
      hover:bg-[rgba(255,255,255,0.08)]
    `,
    accent: `
      bg-[rgba(0,71,255,0.1)]
      backdrop-blur-xl
      border border-[rgba(0,71,255,0.2)]
      hover:border-[rgba(0,71,255,0.4)]
      hover:bg-[rgba(0,71,255,0.15)]
    `,
    glow: `
      bg-[rgba(255,255,255,0.05)]
      backdrop-blur-xl
      border border-[rgba(255,255,255,0.1)]
      shadow-[0_0_40px_rgba(0,71,255,0.1)]
      hover:border-[rgba(0,71,255,0.3)]
      hover:shadow-[0_0_60px_rgba(0,71,255,0.2)]
    `,
    hero: `
      bg-gradient-to-br from-[rgba(255,255,255,0.1)] to-[rgba(255,255,255,0.02)]
      backdrop-blur-xl
      border border-[rgba(255,255,255,0.15)]
      shadow-[0_4px_24px_rgba(0,0,0,0.2)]
      hover:shadow-[0_8px_40px_rgba(0,0,0,0.3),0_0_40px_rgba(0,71,255,0.15)]
    `,
  };

  const interactiveClasses = interactive
    ? "cursor-pointer group hover:scale-[1.01] hover:-translate-y-1"
    : "";

  return (
    <div
      onClick={onClick}
      className={`
        ${baseClasses}
        ${variantStyles[variant]}
        ${interactiveClasses}
        ${className}
      `}
    >
      {/* Subtle gradient overlay on hover */}
      {interactive && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      )}
      
      {/* Blue glow accent for glow variant */}
      {variant === "glow" && (
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[rgba(0,71,255,0.2)] rounded-full blur-[80px] pointer-events-none" />
      )}
      
      {/* Content */}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

// Specialized card components
export function BentoHeroCard({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <BentoCard
      span="large"
      variant="hero"
      padding="lg"
      className={className}
      onClick={onClick}
    >
      {children}
    </BentoCard>
  );
}

export function BentoStatCard({
  label,
  value,
  suffix,
  trend,
  className = "",
}: {
  label: string;
  value: string | number;
  suffix?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}) {
  const trendColors = {
    up: "text-green-400",
    down: "text-red-400",
    neutral: "text-white/50",
  };

  return (
    <BentoCard variant="default" className={className} interactive={false}>
      <div className="flex flex-col h-full justify-between">
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/50">
          {label}
        </span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className={`text-4xl font-light ${trend ? trendColors[trend] : "text-white"}`}>
            {value}
          </span>
          {suffix && (
            <span className="text-lg text-white/50">{suffix}</span>
          )}
        </div>
      </div>
    </BentoCard>
  );
}

export function BentoActionCard({
  icon,
  title,
  description,
  onClick,
  className = "",
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <BentoCard 
      variant="default" 
      className={className} 
      onClick={onClick}
      interactive={!!onClick}
    >
      <div className="flex flex-col h-full">
        <div className="w-10 h-10 rounded-xl bg-[rgba(0,71,255,0.15)] border border-[rgba(0,71,255,0.2)] flex items-center justify-center text-[#0047FF] mb-4">
          {icon}
        </div>
        <h3 className="text-base font-medium text-white mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-white/50 leading-relaxed">{description}</p>
        )}
        {onClick && (
          <div className="mt-auto pt-4 flex items-center text-[#0047FF] text-sm font-medium">
            <span>Open</span>
            <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    </BentoCard>
  );
}
