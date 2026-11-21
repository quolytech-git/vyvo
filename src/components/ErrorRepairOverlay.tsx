"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  KeyRound,
  RefreshCw,
  Wand2,
  X,
} from "lucide-react";
import type { AIProvider, AISettings, ProjectFile, RepairProposal, RuntimeError } from "@/lib/types";
import { attemptLocalRepair } from "@/lib/localRepair";
import { loadAISettings, saveAISettings } from "@/lib/storage";

interface ErrorRepairOverlayProps {
  error: RuntimeError;
  files: Record<string, ProjectFile>;
  entryFile: string;
  isOffline: boolean;
  onRetry: () => void;
  onEditCode: () => void;
  onApplyRepair: (fixedFiles: Record<string, string>, explanation: string) => void;
  onDismiss?: () => void;
  onGoHome: () => void;
}

export function ErrorRepairOverlay({
  error,
  files,
  entryFile,
  isOffline,
  onRetry,
  onEditCode,
  onApplyRepair,
  onDismiss,
  onGoHome,
}: ErrorRepairOverlayProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [proposal, setProposal] = useState<RepairProposal | null>(null);
  const [repairError, setRepairError] = useState<string | null>(null);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [serverConfigured, setServerConfigured] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings>({ provider: "auto", apiKey: "" });
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  useEffect(() => {
    setAiSettings(loadAISettings());
    fetch("/api/ai-repair")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.serverConfigured) setServerConfigured(true);
      })
      .catch(() => {});
  }, []);

  async function handleFixWithAI(settingsOverride?: AISettings) {
    setRepairing(true);
    setRepairError(null);
    setProposal(null);

    const activeSettings = settingsOverride ?? aiSettings;

    // 1. If offline, try built-in deterministic local repair first
    if (isOffline) {
      const local = attemptLocalRepair(files, entryFile, error);
      setRepairing(false);
      if (local) {
        setProposal(local);
      } else {
        setRepairError(
          "You're currently offline. Connect to the internet to use AI repair, or open Edit Code to adjust manually."
        );
      }
      return;
    }

    // 2. If server AI OR user API key is configured, call modular AI Repair endpoint
    if (serverConfigured || activeSettings.apiKey.trim()) {
      try {
        const textFiles: Record<string, string> = {};
        for (const [k, f] of Object.entries(files)) {
          if (!f.isBinary) textFiles[k] = f.content;
        }
        const res = await fetch("/api/ai-repair", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: textFiles,
            entryFile,
            errorMessage: error.rawMessage,
            errorStack: error.stack,
            provider: activeSettings.provider,
            userApiKey: activeSettings.apiKey.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (res.ok && data.fixedFiles) {
          setProposal({
            explanation: data.explanation || "Fixed the issue that prevented your website from running.",
            fixedFiles: data.fixedFiles,
            source: "ai",
            provider: data.provider,
          });
          setShowKeyForm(false);
          setRepairing(false);
          return;
        }
        if (data.needsApiKey) {
          // Fall through to local repair + optional key prompt
        } else {
          setRepairError(data.error || "AI repair couldn't finish right now.");
          setRepairing(false);
          return;
        }
      } catch {
        // Fall through to local repair
      }
    }

    // 3. Try VYVO's built-in instant local auto-repair (works with zero API key!)
    const localFix = attemptLocalRepair(files, entryFile, error);
    setRepairing(false);
    if (localFix) {
      setProposal(localFix);
      return;
    }

    // 4. Offer optional API key setup OR 1-click "Copy fix prompt for ChatGPT/Claude"
    setShowKeyForm(true);
    setRepairError(
      "Connect an AI key (Gemini, OpenAI, or Anthropic) for automatic deep repairs — or copy a ready-made fix request back into your AI chat."
    );
  }

  function handleSaveKeyAndRetry(e: React.FormEvent) {
    e.preventDefault();
    saveAISettings(aiSettings);
    handleFixWithAI(aiSettings);
  }

  async function handleCopyFixPrompt() {
    const fileContent = files[entryFile]?.content ?? "";
    const prompt = `My website had this error when running in the browser:\n${error.rawMessage}\n\nPlease fix it and return the complete working code:\n\n\`\`\`\n${fileContent.slice(0, 12000)}\n\`\`\``;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {
      // Ignore
    }
  }

  const isUnsupported = error.type === "unsupported";

  return (
    <div className="absolute inset-0 z-30 bg-[var(--bg)]/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-vyvo-in">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border-strong)] p-6 sm:p-7 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--danger)]/12 border border-[var(--danger)]/25 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-[var(--danger)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[var(--ink)]">
                {isUnsupported
                  ? error.title
                  : "Your website couldn't load. Let VYVO help fix it."}
              </h2>
              <p className="mt-1.5 text-sm text-[var(--ink-secondary)] leading-relaxed">
                {error.friendlyMessage}
              </p>
            </div>
          </div>

          {onDismiss && !isUnsupported && (
            <button
              type="button"
              onClick={onDismiss}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-[var(--surface-hover)] text-[var(--ink-muted)] hover:text-[var(--ink)] shrink-0 cursor-pointer"
              aria-label="Close notice"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Unsupported Language Plain-English Guidance */}
        {isUnsupported && error.suggestion && (
          <div className="mt-5 p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-1.5">
              How to run this in VYVO
            </p>
            <p className="text-sm text-[var(--ink)] leading-relaxed">{error.suggestion}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onGoHome}
                className="px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] text-sm font-bold transition cursor-pointer"
              >
                Paste Different Code
              </button>
            </div>
          </div>
        )}

        {/* Proposed Repair Preview */}
        {proposal && (
          <div className="mt-5 p-4 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 space-y-3 animate-vyvo-in">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                {proposal.source === "ai"
                  ? `Fix Ready (${proposal.provider || "AI"})`
                  : "Instant Fix Ready"}
              </span>
            </div>
            <p className="text-sm text-[var(--ink)] leading-relaxed">{proposal.explanation}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => onApplyRepair(proposal.fixedFiles, proposal.explanation)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] font-bold text-sm transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Apply Fix & Run</span>
              </button>
              <button
                type="button"
                onClick={() => setProposal(null)}
                className="px-3.5 py-2.5 rounded-xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-sm font-medium text-[var(--ink-secondary)] transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Primary Repair Actions */}
        {!isUnsupported && !proposal && (
          <div className="mt-5 space-y-3">
            <button
              type="button"
              disabled={repairing}
              onClick={() => handleFixWithAI()}
              className="w-full h-12 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-[var(--accent-ink)] font-bold text-sm tracking-wide inline-flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {repairing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Diagnosing and repairing…</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>FIX IT WITH AI</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onRetry}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-semibold text-[var(--ink)] transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                onClick={onEditCode}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-semibold text-[var(--ink)] transition cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Edit Code</span>
              </button>
              <button
                type="button"
                onClick={handleCopyFixPrompt}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-semibold text-[var(--ink)] transition cursor-pointer"
                title="Copy a ready-made fix message to paste into ChatGPT, Claude, or Gemini"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Fix Prompt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Repair Notice & Optional Provider Key Form */}
        {repairError && (
          <p className="mt-4 text-xs text-[var(--ink-secondary)] leading-relaxed">{repairError}</p>
        )}

        {showKeyForm && !isUnsupported && !proposal && (
          <form
            onSubmit={handleSaveKeyAndRetry}
            className="mt-4 p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-3"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ink)]">
              <KeyRound className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Optional: Connect your AI provider</span>
            </div>
            <div className="flex gap-2">
              <select
                value={aiSettings.provider}
                onChange={(e) =>
                  setAiSettings((s) => ({ ...s, provider: e.target.value as AIProvider }))
                }
                aria-label="AI Provider"
                className="h-9 px-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="auto">Auto-detect</option>
                <option value="gemini">Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
              <input
                type="password"
                value={aiSettings.apiKey}
                onChange={(e) => setAiSettings((s) => ({ ...s, apiKey: e.target.value }))}
                placeholder="Paste API key (stored only in your browser)"
                className="flex-1 h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-[var(--ink-muted)]">
                Never required to run websites.
              </span>
              <button
                type="submit"
                disabled={!aiSettings.apiKey.trim() || repairing}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-xs font-bold cursor-pointer"
              >
                Save & Repair
              </button>
            </div>
          </form>
        )}

        {/* Collapsed Technical Details */}
        {!isUnsupported && (
          <div className="mt-5 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-muted)] hover:text-[var(--ink-secondary)] transition cursor-pointer"
            >
              <span>Technical details</span>
              {showDetails ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showDetails && (
              <pre className="mt-2.5 p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] font-mono text-[11px] text-[var(--ink-secondary)] overflow-x-auto whitespace-pre-wrap break-words max-h-36">
                {error.file ? `File: ${error.file}${error.line ? `:${error.line}` : ""}\n` : ""}
                {error.rawMessage}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
