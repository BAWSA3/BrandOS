"use client";

import { ReactNode } from "react";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  span?: "default" | "wide" | "tall" | "large";
  variant?: "default" | "accent" | "muted" | "glass";
  interactive?: boolean;
  onClick?: () => void;
}

const spanClasses = {
  default: "",
  wide: "md:col-span-2",
  tall: "md:row-span-2",
  large: "md:col-span-2 md:row-span-2",
};

const variantClasses = {
  default: "bg-surface border-border hover:border-muted",
  accent: "bg-foreground/5 border-foreground/20 hover:border-foreground/40",
  muted: "bg-surface/50 border-border/50 hover:border-border",
  glass: "bg-surface/30 backdrop-blur-xl border-border/50 hover:border-border",
};

export default function BentoCard({
  children,
  className = "",
  span = "default",
  variant = "default",
  interactive = true,
  onClick,
}: BentoCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl border p-6
        transition-all duration-300 ease-out
        ${spanClasses[span]}
        ${variantClasses[variant]}
        ${interactive ? "cursor-pointer group hover:scale-[1.01] hover:shadow-lg" : ""}
        ${className}
      `}
    >
      {interactive && (
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
