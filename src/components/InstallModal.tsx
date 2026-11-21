"use client";

import React from "react";
import { PlusSquare, Share, Smartphone, X, MonitorDown } from "lucide-react";
import { VyvoLogo } from "./VyvoLogo";

interface InstallModalProps {
  open: boolean;
  isIOS: boolean;
  onClose: () => void;
}

export function InstallModal({ open, isIOS, onClose }: InstallModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative z-10 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[var(--surface)] border border-[var(--border-strong)] p-6 pb-safe-modal shadow-2xl animate-vyvo-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <VyvoLogo size={38} showWordmark={false} />
            <div>
              <h2 className="text-base font-bold text-[var(--ink)]">Install VYVO App</h2>
              <p className="text-xs text-[var(--ink-secondary)]">
                Launch instantly from your home screen or desktop
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-[var(--surface-hover)] text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer"
            aria-label="Close install instructions"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIOS ? (
          <ol className="mt-6 space-y-4">
            <li className="flex items-start gap-3.5">
              <span className="w-7 h-7 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center shrink-0 text-xs font-bold text-[var(--accent)]">
                1
              </span>
              <div className="text-sm text-[var(--ink)] leading-snug">
                Tap the{" "}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--surface-elevated)] border border-[var(--border)] font-semibold text-xs align-middle">
                  <Share className="w-3.5 h-3.5 text-[var(--accent)]" /> Share
                </span>{" "}
                button in Safari&apos;s toolbar.
              </div>
            </li>
            <li className="flex items-start gap-3.5">
              <span className="w-7 h-7 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center shrink-0 text-xs font-bold text-[var(--accent)]">
                2
              </span>
              <div className="text-sm text-[var(--ink)] leading-snug">
                Scroll down and tap{" "}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--surface-elevated)] border border-[var(--border)] font-semibold text-xs align-middle">
                  <PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen
                </span>
                .
              </div>
            </li>
            <li className="flex items-start gap-3.5">
              <span className="w-7 h-7 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center shrink-0 text-xs font-bold text-[var(--accent)]">
                3
              </span>
              <div className="text-sm text-[var(--ink)] leading-snug">
                Tap <strong>Add</strong> in the top-right corner. VYVO will open full-screen like a
                native iPhone or iPad app.
              </div>
            </li>
          </ol>
        ) : (
          <div className="mt-6 space-y-4 text-sm text-[var(--ink-secondary)]">
            <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-start gap-3">
              <MonitorDown className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[var(--ink)]">Desktop (Chrome, Edge, Safari)</p>
                <p className="text-xs mt-1 leading-relaxed">
                  Click the install icon in your browser&apos;s address bar, or open the browser
                  menu and choose <strong>Install VYVO</strong> / <strong>Add to Dock</strong>.
                </p>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[var(--ink)]">Android & iPhone</p>
                <p className="text-xs mt-1 leading-relaxed">
                  Open your browser menu (or Safari&apos;s Share button on iPhone) and select{" "}
                  <strong>Add to Home Screen</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full h-11 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] font-bold text-sm transition cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
