"use client";

import React, { useMemo, useState } from "react";
import { Check, Copy, Download, Link2, Share2, X } from "lucide-react";
import type { Project } from "@/lib/types";
import { createShareUrl } from "@/lib/shareUtils";

interface ShareModalProps {
  open: boolean;
  project: Project | null;
  onClose: () => void;
  onDownloadZip: () => void;
}

export function ShareModal({ open, project, onClose, onDownloadZip }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const shareResult = useMemo(() => {
    if (!open || !project || typeof window === "undefined") return null;
    return createShareUrl(project, window.location.origin);
  }, [open, project]);

  if (!open || !project || !shareResult) return null;

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  }

  async function handleNativeShare(url: string) {
    try {
      await navigator.share({
        title: project?.name || "My Website on VYVO",
        text: "Check out this website running live in VYVO:",
        url,
      });
    } catch {
      // User cancelled share sheet
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative z-10 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[var(--surface)] border border-[var(--border-strong)] p-6 pb-safe-modal shadow-2xl animate-vyvo-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--ink)]">Share Website</h2>
              <p className="text-xs text-[var(--ink-secondary)]">
                Anyone with this link can open and interact with it
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-[var(--surface-hover)] text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer"
            aria-label="Close share dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {"error" in shareResult ? (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
              {shareResult.error}
            </p>
            <button
              type="button"
              onClick={() => {
                onDownloadZip();
                onClose();
              }}
              className="w-full h-11 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Website (.zip)</span>
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
              <input
                id="vyvo-share-url"
                name="shareUrl"
                type="text"
                readOnly
                value={shareResult.url}
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Shareable website link"
                className="flex-1 bg-transparent px-2.5 text-xs font-mono text-[var(--ink-secondary)] focus:outline-none truncate"
              />
              <button
                type="button"
                onClick={() => handleCopy(shareResult.url)}
                className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] text-xs font-bold shrink-0 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>

            {canNativeShare && (
              <button
                type="button"
                onClick={() => handleNativeShare(shareResult.url)}
                className="w-full h-11 rounded-xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--ink)] font-semibold text-sm inline-flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share via Device…</span>
              </button>
            )}

            <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
              Your website is encoded directly inside the link — no account or cloud hosting needed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
