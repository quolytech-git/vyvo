"use client";

import React, { Suspense, lazy, useState } from "react";
import {
  FileCode2,
  Play,
  Plus,
  Terminal,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { ProjectFile, RuntimeLog } from "@/lib/types";
import type { Theme } from "@/hooks/useTheme";

const MonacoEditor = lazy(() => import("@monaco-editor/react"));

interface CodeEditorDrawerProps {
  files: Record<string, ProjectFile>;
  activeFile: string;
  onSelectFile: (path: string) => void;
  onUpdateFile: (path: string, content: string) => void;
  onAddFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onRunChanges: () => void;
  onClose?: () => void;
  logs: RuntimeLog[];
  onClearLogs: () => void;
  theme: Theme;
  isMobile?: boolean;
}

function getLanguageForFile(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "html":
    case "htm":
      return "html";
    case "css":
      return "css";
    case "tsx":
    case "ts":
      return "typescript";
    case "jsx":
    case "js":
    case "mjs":
      return "javascript";
    case "json":
      return "json";
    default:
      return "plaintext";
  }
}

export function CodeEditorDrawer({
  files,
  activeFile,
  onSelectFile,
  onUpdateFile,
  onAddFile,
  onDeleteFile,
  onRunChanges,
  onClose,
  logs,
  onClearLogs,
  theme,
  isMobile = false,
}: CodeEditorDrawerProps) {
  const [addingFile, setAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [monacoFailed, setMonacoFailed] = useState(false);

  const fileList = Object.values(files).filter((f) => !f.isBinary);
  const currentFile = files[activeFile] || fileList[0];

  function handleCreateFile(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = newFileName.trim().replace(/^\/+/, "");
    if (!cleaned || files[cleaned]) {
      setAddingFile(false);
      setNewFileName("");
      return;
    }
    onAddFile(cleaned);
    onSelectFile(cleaned);
    setAddingFile(false);
    setNewFileName("");
  }

  return (
    <div className="flex flex-col h-full w-full bg-[var(--surface)] border-r border-[var(--border)] text-[var(--ink)]">
      {/* Editor Header */}
      <div className="h-12 px-3 flex items-center justify-between gap-2 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode2 className="w-4 h-4 text-[var(--accent)] shrink-0" />
          <span className="text-xs font-semibold tracking-wide uppercase text-[var(--ink-secondary)]">
            Code
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onRunChanges}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Update Preview</span>
          </button>

          {onClose && !isMobile && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-[var(--surface-hover)] text-[var(--ink-secondary)] hover:text-[var(--ink)] transition cursor-pointer"
              aria-label="Close code editor"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* File Tabs */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[var(--border)] overflow-x-auto shrink-0 bg-[var(--bg)]">
        {fileList.map((file) => {
          const isActive = currentFile?.path === file.path;
          return (
            <div
              key={file.path}
              className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono shrink-0 transition ${
                isActive
                  ? "bg-[var(--surface-elevated)] text-[var(--ink)] border border-[var(--border-strong)]"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)] border border-transparent"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectFile(file.path)}
                className="cursor-pointer"
              >
                {file.path}
              </button>
              {fileList.length > 1 && (
                <button
                  type="button"
                  onClick={() => onDeleteFile(file.path)}
                  className="opacity-60 hover:opacity-100 hover:text-[var(--danger)] transition cursor-pointer"
                  aria-label={`Remove ${file.path}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {addingFile ? (
          <form onSubmit={handleCreateFile} className="inline-flex items-center gap-1">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="styles.css"
              autoFocus
              onBlur={() => {
                if (!newFileName.trim()) setAddingFile(false);
              }}
              className="w-28 px-2 py-1 text-xs font-mono rounded bg-[var(--surface)] border border-[var(--accent)] text-[var(--ink)] focus:outline-none"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAddingFile(true)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)] transition shrink-0 cursor-pointer"
            title="Add another file"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add file</span>
          </button>
        )}
      </div>

      {/* Main Editor Surface */}
      <div className="flex-1 min-h-0 relative">
        {currentFile ? (
          isMobile || monacoFailed || (typeof navigator !== "undefined" && !navigator.onLine) ? (
            <textarea
              value={currentFile.content}
              onChange={(e) => onUpdateFile(currentFile.path, e.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              aria-label={`Edit ${currentFile.path}`}
              className="w-full h-full p-4 bg-[var(--bg)] text-[var(--ink)] font-mono text-[13px] leading-relaxed resize-none focus:outline-none"
            />
          ) : (
            <Suspense
              fallback={
                <textarea
                  value={currentFile.content}
                  onChange={(e) => onUpdateFile(currentFile.path, e.target.value)}
                  spellCheck={false}
                  className="w-full h-full p-4 bg-[var(--bg)] text-[var(--ink)] font-mono text-[13px] leading-relaxed resize-none focus:outline-none"
                />
              }
            >
              <MonacoEditor
                height="100%"
                path={currentFile.path}
                language={getLanguageForFile(currentFile.path)}
                value={currentFile.content}
                theme={theme === "dark" ? "vs-dark" : "light"}
                onChange={(val) => onUpdateFile(currentFile.path, val ?? "")}
                loading={
                  <div className="w-full h-full flex items-center justify-center text-xs text-[var(--ink-muted)] bg-[var(--bg)]">
                    Loading code editor…
                  </div>
                }
                onValidate={() => {}}
                beforeMount={() => {}}
                onMount={(editor) => {
                  if (!editor) setMonacoFailed(true);
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineHeight: 21,
                  fontFamily: "var(--font-mono), monospace",
                  wordWrap: "on",
                  padding: { top: 14, bottom: 14 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  tabSize: 2,
                  automaticLayout: true,
                }}
              />
            </Suspense>
          )
        ) : (
          <div className="p-6 text-sm text-[var(--ink-muted)]">Select a file to edit.</div>
        )}
      </div>

      {/* Collapsible Optional Console Drawer (Hidden by default) */}
      <div className="border-t border-[var(--border)] bg-[var(--bg)] shrink-0">
        <button
          type="button"
          onClick={() => setConsoleOpen((o) => !o)}
          className="w-full px-3 py-2 flex items-center justify-between text-xs text-[var(--ink-secondary)] hover:text-[var(--ink)] transition cursor-pointer"
        >
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Terminal className="w-3.5 h-3.5" />
            <span>Console</span>
            {logs.length > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-[var(--surface-elevated)] text-[10px] font-semibold">
                {logs.length}
              </span>
            )}
          </span>
          {consoleOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>

        {consoleOpen && (
          <div className="max-h-40 overflow-y-auto border-t border-[var(--border)] px-3 py-2 font-mono text-xs space-y-1.5">
            {logs.length === 0 ? (
              <p className="text-[var(--ink-muted)] py-2">No console output yet.</p>
            ) : (
              <>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={onClearLogs}
                    className="text-[11px] font-sans text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
                {logs.map((entry) => (
                  <div
                    key={entry.id}
                    className={`whitespace-pre-wrap break-words py-0.5 ${
                      entry.level === "error"
                        ? "text-[var(--danger)]"
                        : entry.level === "warn"
                        ? "text-[var(--warning)]"
                        : "text-[var(--ink-secondary)]"
                    }`}
                  >
                    {entry.message}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
