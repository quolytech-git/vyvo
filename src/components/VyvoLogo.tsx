"use client";

import React from "react";

interface VyvoLogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export function VyvoLogo({ size = 28, showWordmark = true, className = "" }: VyvoLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="64" height="64" rx="14" fill="#09090B" />
        <rect
          x="1"
          y="1"
          width="62"
          height="62"
          rx="13"
          stroke="#27272A"
          strokeWidth="2"
        />
        <polygon points="14,17 23.5,17 36.5,47 27.5,47" fill="#FAFAFA" />
        <polygon points="40.5,17 50,17 36.5,47 32,36.5" fill="#10B981" />
      </svg>
      {showWordmark && (
        <span className="font-extrabold tracking-[-0.04em] text-[1.15rem] leading-none text-[var(--ink)]">
          VYVO
        </span>
      )}
    </span>
  );
}
