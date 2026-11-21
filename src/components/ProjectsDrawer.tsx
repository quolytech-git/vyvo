"use client";

import React, { useState } from "react";
import {
  Check,
  Download,
  FolderOpen,
  Globe,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { Project } from "@/lib/types";

interface ProjectsDrawerProps {
  open: boolean;
  projects: Project[];
  currentProjectId?: string;
  onClose: () => void;
  onOpenProject: (project: Project) => void;
  onRenameProject: (id: string, name: string) => void;
  onDeleteProject: (id: string) => void;
  onDownloadProject: (project: Project) => void;
  onNewProject: () => void;
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function ProjectsDrawer({
  open,
  projects,
  currentProjectId,
  onClose,
  onOpenProject,
  onRenameProject,
  onDeleteProject,
  onDownloadProject,
  onNewProject,
}: ProjectsDrawerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!open) return null;

  function startEdit(p: Project) {
    setEditingId(p.id);
    setEditValue(p.name);
    setConfirmDeleteId(null);
  }

  function commitEdit(id: string) {
    if (editValue.trim()) {
      onRenameProject(id, editValue.trim());
    }
    setEditingId(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside className="relative z-10 w-full max-w-md h-full bg-[var(--surface)] border-l border-[var(--border)] flex flex-col safe-top safe-bottom animate-vyvo-in">
        <div className="px-5 h-16 flex items-center justify-between border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-2.5">
            <FolderOpen className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="font-bold text-base tracking-tight text-[var(--ink)]">
              My Websites
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onNewProject();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] text-xs font-bold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-[var(--surface-hover)] text-[var(--ink-secondary)] hover:text-[var(--ink)] cursor-pointer"
              aria-label="Close saved websites"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {projects.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center mb-4">
                <Globe className="w-5 h-5 text-[var(--ink-muted)]" />
              </div>
              <p className="text-sm font-semibold text-[var(--ink)]">No saved websites yet</p>
              <p className="text-xs text-[var(--ink-muted)] mt-1.5 max-w-xs mx-auto leading-relaxed">
                Every website you run in VYVO is automatically saved right here on your device.
              </p>
            </div>
          ) : (
            projects.map((project) => {
              const isCurrent = project.id === currentProjectId;
              const isEditing = editingId === project.id;
              const isConfirmingDelete = confirmDeleteId === project.id;
              const fileCount = Object.keys(project.files).length;

              return (
                <div
                  key={project.id}
                  className={`rounded-xl p-3.5 border transition ${
                    isCurrent
                      ? "bg-[var(--surface-elevated)] border-[var(--accent)]/50"
                      : "bg-[var(--bg)] border-[var(--border)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    {isEditing ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          commitEdit(project.id);
                        }}
                        className="flex-1 flex items-center gap-1.5"
                      >
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="flex-1 h-8 px-2.5 rounded-lg bg-[var(--surface)] border border-[var(--accent)] text-sm text-[var(--ink)] focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-ink)] cursor-pointer"
                          aria-label="Save name"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenProject(project);
                          onClose();
                        }}
                        className="flex-1 text-left min-w-0 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[var(--ink)] group-hover:text-[var(--accent)] truncate transition-colors">
                            {project.name}
                          </span>
                          {isCurrent && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-[var(--ink-muted)] mt-1">
                          {formatRelativeTime(project.updatedAt)}
                          {fileCount > 1 ? ` · ${fileCount} files` : ""}
                        </p>
                      </button>
                    )}

                    {!isEditing && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(project)}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition cursor-pointer"
                          title="Rename"
                          aria-label={`Rename ${project.name}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDownloadProject(project)}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition cursor-pointer"
                          title="Download ZIP"
                          aria-label={`Download ${project.name}`}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDeleteId(isConfirmingDelete ? null : project.id)
                          }
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[var(--ink-muted)] hover:text-[var(--danger)] hover:bg-[var(--surface-hover)] transition cursor-pointer"
                          title="Delete"
                          aria-label={`Delete ${project.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isConfirmingDelete && (
                    <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between gap-2">
                      <span className="text-xs text-[var(--ink-secondary)]">
                        Delete this website?
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--surface-elevated)] text-[var(--ink-secondary)] cursor-pointer"
                        >
                          Keep
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteProject(project.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2.5 py-1 rounded-md text-xs font-bold bg-[var(--danger)] text-white cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="px-5 py-3 border-t border-[var(--border)] text-[11px] text-[var(--ink-muted)]">
          Saved locally on your device — works offline anytime.
        </div>
      </aside>
    </div>
  );
}
