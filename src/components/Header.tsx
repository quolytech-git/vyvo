"use client";

import React from "react";
import { Download, FolderOpen, Moon, Sparkles, Sun, WifiOff } from "lucide-react";
import { VyvoLogo } from "./VyvoLogo";
import type { Theme } from "@/hooks/useTheme";

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  projectCount: number;
  onOpenProjects: () => void;
  onOpenPrompts: () => void;
  showInstallButton: boolean;
  onInstallClick: () => void;
  isOffline: boolean;
  onLogoClick: () => void;
}

export function Header({
  theme,
  onToggleTheme,
  projectCount,
  onOpenProjects,
  onOpenPrompts,
  showInstallButton,
  onInstallClick,
  isOffline,
  onLogoClick,
}: HeaderProps) {
  return (
    <header className="w-full safe-top safe-x">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onLogoClick}
          className="inline-flex items-center gap-2 shrink-0 cursor-pointer rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          aria-label="VYVO Home"
        >
          <VyvoLogo size={26} />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isOffline && (
            <span
              className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-full text-xs font-medium bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--ink-secondary)] whitespace-nowrap"
              title="You are offline. Saved websites and HTML/CSS/JS still work locally."
            >
              <WifiOff className="w-3.5 h-3.5 text-[var(--warning)] shrink-0" />
              <span className="hidden sm:inline">Offline</span>
            </span>
          )}

          <button
            type="button"
            onClick={onOpenPrompts}
            className="inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--ink)] whitespace-nowrap shrink-0 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
            <span className="sm:hidden">Prompts</span>
            <span className="hidden sm:inline">Prompt Builder</span>
          </button>

          {showInstallButton && (
            <button
              type="button"
              onClick={onInstallClick}
              className="inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--ink)] whitespace-nowrap shrink-0 transition cursor-pointer"
              aria-label="Install VYVO"
            >
              <Download className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
              <span className="sm:hidden">Install</span>
              <span className="hidden sm:inline">Install VYVO</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenProjects}
            className="inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--ink)] whitespace-nowrap shrink-0 transition cursor-pointer"
            aria-label="My Websites"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[var(--ink-secondary)] shrink-0" />
            <span className="hidden sm:inline">My Websites</span>
            {projectCount > 0 && (
              <span className="px-1.5 py-0.5 text-[11px] leading-none rounded-md bg-[var(--surface-elevated)] text-[var(--ink-secondary)] font-semibold">
                {projectCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--ink-secondary)] hover:text-[var(--ink)] shrink-0 transition cursor-pointer"
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Light theme" : "Dark theme"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
