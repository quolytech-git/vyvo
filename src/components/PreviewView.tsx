"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Code2,
  Download,
  Eye,
  Maximize2,
  Minimize2,
  RefreshCw,
  Share2,
} from "lucide-react";
import type { BundleResult, Project, RuntimeError, RuntimeLog } from "@/lib/types";
import type { Theme } from "@/hooks/useTheme";
import { SandboxFrame } from "./SandboxFrame";
import { CodeEditorDrawer } from "./CodeEditorDrawer";
import { ErrorRepairOverlay } from "./ErrorRepairOverlay";

interface PreviewViewProps {
  project: Project;
  bundle: BundleResult;
  runId: string;
  activePage?: string;
  runtimeError: RuntimeError | null;
  logs: RuntimeLog[];
  theme: Theme;
  isOffline: boolean;
  onBackHome: () => void;
  onRefresh: () => void;
  onRename: (name: string) => void;
  onUpdateFile: (path: string, content: string) => void;
  onAddFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onRunChanges: () => void;
  onDownload: () => void;
  onShare: () => void;
  onReady: (pageTitle?: string) => void;
  onRuntimeError: (error: RuntimeError) => void;
  onConsoleLog: (log: RuntimeLog) => void;
  onClearLogs: () => void;
  onNavigatePage: (href: string) => void;
  onApplyRepair: (fixedFiles: Record<string, string>, explanation: string) => void;
  onDismissError: () => void;
}

export function PreviewView({
  project,
  bundle,
  runId,
  activePage,
  runtimeError,
  logs,
  theme,
  isOffline,
  onBackHome,
  onRefresh,
  onRename,
  onUpdateFile,
  onAddFile,
  onDeleteFile,
  onRunChanges,
  onDownload,
  onShare,
  onReady,
  onRuntimeError,
  onConsoleLog,
  onClearLogs,
  onNavigatePage,
  onApplyRepair,
  onDismissError,
}: PreviewViewProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"preview" | "code">("preview");
  const [fullScreen, setFullScreen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(project.entryFile);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(project.name);

  useEffect(() => {
    setTitleDraft(project.name);
  }, [project.name]);

  useEffect(() => {
    if (!project.files[selectedFile]) {
      setSelectedFile(project.entryFile);
    }
  }, [project.entryFile, project.files, selectedFile]);

  // Allow Escape key to leave Full Screen mode cleanly
  useEffect(() => {
    if (!fullScreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullScreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullScreen]);

  const activeError = !bundle.ok && bundle.error ? bundle.error : runtimeError;
  const isUnsupported = activeError?.type === "unsupported";
  const activeHtml =
    (activePage && bundle.pageHtmlMap?.[activePage]) || bundle.html || "";

  const isSubPage =
    Boolean(activePage) &&
    Boolean(bundle.activePage) &&
    activePage !== bundle.activePage;

  function openCodeEditor() {
    setEditorOpen(true);
    setMobileTab("code");
  }

  return (
    <div className="h-dvh w-full flex flex-col bg-[var(--bg)] overflow-hidden">
      {/* Minimal Top Controls Bar (hidden in Full Screen) */}
      {!fullScreen && (
        <header className="h-14 px-3 sm:px-4 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-2 shrink-0 safe-top safe-x">
          {/* Left: Back + Editable Project Name */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onBackHome}
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg hover:bg-[var(--surface-hover)] text-[var(--ink-secondary)] hover:text-[var(--ink)] transition shrink-0 cursor-pointer"
              title="Back to paste screen"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isUnsupported ? "bg-[var(--warning)]" : "bg-[var(--accent)]"
              }`}
            />

            {editingTitle ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (titleDraft.trim()) onRename(titleDraft.trim());
                  setEditingTitle(false);
                }}
                className="min-w-0"
              >
                <input
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={() => {
                    if (titleDraft.trim()) onRename(titleDraft.trim());
                    setEditingTitle(false);
                  }}
                  autoFocus
                  className="h-8 px-2 rounded-md bg-[var(--bg)] border border-[var(--accent)] text-sm font-semibold text-[var(--ink)] focus:outline-none w-40 sm:w-56"
                />
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setEditingTitle(true)}
                className="text-sm font-semibold text-[var(--ink)] hover:text-[var(--accent)] truncate max-w-[165px] sm:max-w-xs transition-colors cursor-pointer"
                title="Click to rename website"
              >
                {project.name}
              </button>
            )}

            {isSubPage && bundle.activePage && (
              <button
                type="button"
                onClick={() => onNavigatePage(bundle.activePage!)}
                className="hidden sm:inline-flex items-center gap-1 ml-1 px-2 py-0.5 rounded-md text-xs bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--ink-secondary)] hover:text-[var(--ink)] cursor-pointer"
              >
                ← Back to {bundle.activePage}
              </button>
            )}
          </div>

          {/* Right: Essential Desktop Controls ONLY (Refresh, Edit Code, Full Screen, Download, Share) */}
          {!isUnsupported && (
          <div className="hidden md:flex items-center gap-1.5">
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition cursor-pointer"
              title="Refresh website"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => setEditorOpen((o) => !o)}
              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium border transition cursor-pointer ${
                editorOpen
                  ? "bg-[var(--surface-elevated)] border-[var(--accent)]/50 text-[var(--ink)]"
                  : "border-transparent text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]"
              }`}
              title="Edit code"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Edit Code</span>
            </button>

            <button
              type="button"
              onClick={() => setFullScreen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition cursor-pointer"
              title="Full screen preview"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Screen</span>
            </button>

            <div className="w-px h-5 bg-[var(--border)] mx-1" />

            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--ink)] transition cursor-pointer"
              title="Download website as a ZIP file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              type="button"
              onClick={onShare}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-bold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] transition cursor-pointer"
              title="Share live website link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
          )}

          {/* Right: Compact Mobile Top Action (Full Screen only; main actions live in thumb-friendly bottom bar) */}
          {!isUnsupported && (
          <div className="flex md:hidden items-center gap-1">
            <button
              type="button"
              onClick={() => setFullScreen(true)}
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg hover:bg-[var(--surface-hover)] text-[var(--ink-secondary)] hover:text-[var(--ink)] cursor-pointer"
              aria-label="Full screen preview"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
          )}
        </header>
      )}

      {/* Main Content Stage: Website occupies almost the entire screen */}
      <div className="flex-1 min-h-0 flex relative overflow-hidden">
        {/* Desktop Optional Split Code Editor */}
        {!fullScreen && editorOpen && (
          <div className="hidden md:flex w-[42%] max-w-[600px] min-w-[340px] h-full shrink-0">
            <CodeEditorDrawer
              files={project.files}
              activeFile={selectedFile}
              onSelectFile={setSelectedFile}
              onUpdateFile={onUpdateFile}
              onAddFile={onAddFile}
              onDeleteFile={onDeleteFile}
              onRunChanges={onRunChanges}
              onClose={() => setEditorOpen(false)}
              logs={logs}
              onClearLogs={onClearLogs}
              theme={theme}
            />
          </div>
        )}

        {/* Mobile Code Tab View */}
        {!fullScreen && mobileTab === "code" && (
          <div className="flex md:hidden w-full h-full">
            <CodeEditorDrawer
              files={project.files}
              activeFile={selectedFile}
              onSelectFile={setSelectedFile}
              onUpdateFile={onUpdateFile}
              onAddFile={onAddFile}
              onDeleteFile={onDeleteFile}
              onRunChanges={() => {
                onRunChanges();
                setMobileTab("preview");
              }}
              logs={logs}
              onClearLogs={onClearLogs}
              theme={theme}
              isMobile
            />
          </div>
        )}

        {/* Live Website Preview Surface */}
        <div
          className={`flex-1 min-w-0 h-full relative ${
            !fullScreen && mobileTab === "code" ? "hidden md:block" : "block"
          }`}
        >
          {bundle.ok && activeHtml && (
            <SandboxFrame
              html={activeHtml}
              runId={runId}
              requiresNetwork={bundle.requiresNetwork}
              onReady={onReady}
              onError={onRuntimeError}
              onConsole={onConsoleLog}
              onNavigatePage={onNavigatePage}
            />
          )}

          {/* Friendly Error & AI Repair Overlay */}
          {activeError && (
            <ErrorRepairOverlay
              error={activeError}
              files={project.files}
              entryFile={project.entryFile}
              isOffline={isOffline}
              onRetry={onRefresh}
              onEditCode={openCodeEditor}
              onApplyRepair={onApplyRepair}
              onDismiss={bundle.ok ? onDismissError : undefined}
              onGoHome={onBackHome}
            />
          )}

          {/* Floating Exit Full Screen Pill */}
          {fullScreen && (
            <button
              type="button"
              onClick={() => setFullScreen(false)}
              className="fixed top-4 right-4 z-40 safe-top inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-zinc-950/90 hover:bg-zinc-900 text-zinc-100 border border-zinc-700/80 text-xs font-semibold shadow-xl backdrop-blur-md transition cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Full Screen</span>
            </button>
          )}
        </div>
      </div>

      {/* Dedicated Mobile Bottom Navigation Bar (Native App Feel) */}
      {!fullScreen && !isUnsupported && (
        <nav
          aria-label="Website Controls"
          className="md:hidden border-t border-[var(--border)] bg-[var(--surface)] px-3 pt-2 pb-safe-nav safe-x shrink-0"
        >
          <div className="flex items-center justify-between gap-2">
            {/* Segmented Preview / Code Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setMobileTab("preview")}
                className={`inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-xs font-bold transition cursor-pointer ${
                  mobileTab === "preview"
                    ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                    : "text-[var(--ink-secondary)]"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("code")}
                className={`inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-xs font-bold transition cursor-pointer ${
                  mobileTab === "code"
                    ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                    : "text-[var(--ink-secondary)]"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Code</span>
              </button>
            </div>

            {/* Touch-friendly Essential Action Icons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onRefresh}
                className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] active:scale-95 transition cursor-pointer"
                aria-label="Refresh website"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onDownload}
                className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] active:scale-95 transition cursor-pointer"
                aria-label="Download website"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onShare}
                className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] active:scale-95 transition cursor-pointer"
                aria-label="Share website"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
