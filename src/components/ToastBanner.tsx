"use client";

import React from "react";
import { RefreshCw, X } from "lucide-react";

interface ToastBannerProps {
  message: string | null;
  updateAvailable: boolean;
  onApplyUpdate: () => void;
  onDismissToast: () => void;
}

export function ToastBanner({
  message,
  updateAvailable,
  onApplyUpdate,
  onDismissToast,
}: ToastBannerProps) {
  if (!message && !updateAvailable) return null;

  return (
    <div className="fixed bottom-20 md:bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 w-[calc(100%-2rem)] max-w-md pointer-events-none">
      {updateAvailable && (
        <div className="pointer-events-auto w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--accent)]/40 shadow-2xl animate-vyvo-in">
          <span className="text-xs sm:text-sm font-medium text-[var(--ink)]">
            A new version of VYVO is ready.
          </span>
          <button
            type="button"
            onClick={onApplyUpdate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-ink)] text-xs font-bold shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Update</span>
          </button>
        </div>
      )}

      {message && (
        <div className="pointer-events-auto inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-strong)] text-xs sm:text-sm font-medium text-[var(--ink)] shadow-xl animate-vyvo-in">
          <span>{message}</span>
          <button
            type="button"
            onClick={onDismissToast}
            className="text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
