"use client";

import React from "react";
import { Check, Download, MonitorDown, PlusSquare, Share, Smartphone, X } from "lucide-react";
import { VyvoLogo } from "./VyvoLogo";

interface InstallModalProps {
  open: boolean;
  isIOS: boolean;
  canPromptInstall: boolean;
  justDownloaded: boolean;
  onNativeInstall: () => void;
  onDownloadApp: () => void;
  onClose: () => void;
}

export function InstallModal({
  open,
  isIOS,
  canPromptInstall,
  justDownloaded,
  onNativeInstall,
  onDownloadApp,
  onClose,
}: InstallModalProps) {
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
              <h2 className="text-base font-bold text-[var(--ink)]">
                {justDownloaded ? "VYVO App Downloaded!" : "Get the VYVO App"}
              </h2>
              <p className="text-xs text-[var(--ink-secondary)]">
                {justDownloaded
                  ? "Open VYVO-App.html from your Downloads folder anytime"
                  : "Download directly or install to your home screen & desktop"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-[var(--surface-hover)] text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer"
            aria-label="Close install dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Direct 1-Click App Download */}
        <div className="mt-5 space-y-2.5">
          {canPromptInstall && (
            <button
              type="button"
              onClick={onNativeInstall}
              className="w-full h-11 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] font-bold text-sm inline-flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <MonitorDown className="w-4 h-4" />
              <span>Install App Now</span>
            </button>
          )}

          <button
            type="button"
            onClick={onDownloadApp}
            className={`w-full h-11 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 transition cursor-pointer ${
              canPromptInstall
                ? "bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--ink)]"
                : "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)]"
            }`}
          >
            {justDownloaded ? (
              <>
                <Check className="w-4 h-4" />
                <span>Downloaded VYVO-App.html (Download Again)</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download VYVO App (VYVO-App.html)</span>
              </>
            )}
          </button>
        </div>

        {isIOS ? (
          <ol className="mt-5 pt-4 border-t border-[var(--border)] space-y-3.5">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center shrink-0 text-xs font-bold text-[var(--accent)]">
                1
              </span>
              <div className="text-xs text-[var(--ink)] leading-snug">
                Or in Safari, tap{" "}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--surface-elevated)] border border-[var(--border)] font-semibold align-middle">
                  <Share className="w-3 h-3 text-[var(--accent)]" /> Share
                </span>{" "}
                →{" "}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--surface-elevated)] border border-[var(--border)] font-semibold align-middle">
                  <PlusSquare className="w-3 h-3" /> Add to Home Screen
                </span>
                .
              </div>
            </li>
          </ol>
        ) : (
          <div className="mt-5 pt-4 border-t border-[var(--border)] space-y-2.5 text-xs text-[var(--ink-secondary)]">
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-start gap-2.5">
              <MonitorDown className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[var(--ink)]">How to use VYVO-App.html</p>
                <p className="mt-0.5 leading-relaxed">
                  Double-click <strong>VYVO-App.html</strong> in your Downloads or Desktop folder to
                  open VYVO anytime, or use your browser&apos;s address-bar install icon to pin it to
                  your taskbar.
                </p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-start gap-2.5">
              <Smartphone className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[var(--ink)]">On Phone / Tablet</p>
                <p className="mt-0.5 leading-relaxed">
                  Open your browser menu (or Safari Share on iPhone) and tap{" "}
                  <strong>Add to Home Screen</strong>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
