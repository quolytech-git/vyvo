"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { BundleResult, Project, ProjectFile, RuntimeError, RuntimeLog } from "@/lib/types";
import { recognizePastedCode, recognizeProjectFiles } from "@/lib/codeRecognizer";
import { bundleProject } from "@/lib/bundler";
import { loadDraftInput, saveDraftInput } from "@/lib/storage";
import { exportProjectAsZip, importZipFile, triggerBlobDownload } from "@/lib/zipUtils";
import { downloadStandaloneVyvoApp } from "@/lib/downloadApp";
import { parseShareHash } from "@/lib/shareUtils";
import { useTheme } from "@/hooks/useTheme";
import { usePWA } from "@/hooks/usePWA";
import { useProjects } from "@/hooks/useProjects";
import { Header } from "./Header";
import { HomeView } from "./HomeView";
import { PreviewView } from "./PreviewView";
import { PromptBuilderView } from "./PromptBuilderView";
import { ProjectsDrawer } from "./ProjectsDrawer";
import { InstallModal } from "./InstallModal";
import { ShareModal } from "./ShareModal";
import { ToastBanner } from "./ToastBanner";

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `vyvo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function nextRunToken(): string {
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function VyvoApp() {
  const { theme, toggleTheme } = useTheme();
  const pwa = usePWA();
  const { projects, upsertProject, renameProject, removeProject } = useProjects();

  const [mode, setMode] = useState<"home" | "preview" | "prompts">("home");
  const [rawCode, setRawCode] = useState("");
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [bundle, setBundle] = useState<BundleResult | null>(null);
  const [runId, setRunId] = useState<string>("");
  const [activePage, setActivePage] = useState<string | undefined>(undefined);
  const [runtimeError, setRuntimeError] = useState<RuntimeError | null>(null);
  const [logs, setLogs] = useState<RuntimeLog[]>([]);

  const [projectsOpen, setProjectsOpen] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [appJustDownloaded, setAppJustDownloaded] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const toastTimerRef = useRef<number | null>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  const executeProject = useCallback(
    async (project: Project, persist = true) => {
      const detection = recognizeProjectFiles(project.files, project.name);
      const token = nextRunToken();
      const result = bundleProject(detection, token);

      const finalized: Project = {
        ...project,
        entryFile: detection.entryFile,
        detectedKind: detection.kind,
        usesTailwind: detection.usesTailwind,
        dependencies: detection.dependencies,
        updatedAt: Date.now(),
      };

      setActiveProject(finalized);
      setBundle(result);
      setRunId(token);
      setActivePage(result.activePage);
      setRuntimeError(null);
      setLogs([]);
      setMode("preview");

      if (persist && detection.kind !== "unsupported") {
        await upsertProject(finalized);
      }
    },
    [upsertProject]
  );

  // Hydrate shared link (#s=...), PWA shortcuts, or saved local draft
  useEffect(() => {
    if (typeof window === "undefined") return;

    const shared = parseShareHash(window.location.hash);
    if (shared) {
      const detection = recognizeProjectFiles(shared.files, shared.name);
      const sharedProject: Project = {
        id: generateId(),
        name: shared.name,
        files: shared.files,
        entryFile: shared.entryFile,
        rawInput: shared.files[shared.entryFile]?.content ?? "",
        detectedKind: detection.kind,
        usesTailwind: detection.usesTailwind,
        dependencies: detection.dependencies,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setRawCode(sharedProject.rawInput);
      executeProject(sharedProject, true);
      notify(`Loaded shared website: ${shared.name}`);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("projects") === "1") {
      setProjectsOpen(true);
    }
    if (params.get("new") === "1") {
      setRawCode("");
      saveDraftInput("");
      return;
    }

    const draft = loadDraftInput();
    if (draft) setRawCode(draft);
  }, [executeProject, notify]);

  const handleCodeChange = useCallback((value: string) => {
    setRawCode(value);
    saveDraftInput(value);
  }, []);

  const handleRunFromHome = useCallback(
    async (codeOverride?: string) => {
      const input = (codeOverride ?? rawCode).trim();
      if (!input) return;

      const detection = recognizePastedCode(input);
      const token = nextRunToken();
      const result = bundleProject(detection, token);

      const now = Date.now();
      const newProject: Project = {
        id:
          activeProject && activeProject.rawInput === input
            ? activeProject.id
            : generateId(),
        name: detection.title || "My Website",
        files: detection.files,
        entryFile: detection.entryFile,
        rawInput: input,
        detectedKind: detection.kind,
        usesTailwind: detection.usesTailwind,
        dependencies: detection.dependencies,
        createdAt: now,
        updatedAt: now,
      };

      setActiveProject(newProject);
      setBundle(result);
      setRunId(token);
      setActivePage(result.activePage);
      setRuntimeError(null);
      setLogs([]);
      setMode("preview");

      if (detection.kind !== "unsupported") {
        await upsertProject(newProject);
      }
    },
    [rawCode, activeProject, upsertProject]
  );

  const handleUploadZip = useCallback(
    async (file: File) => {
      try {
        const { files, name } = await importZipFile(file);
        const detection = recognizeProjectFiles(files, name);
        const now = Date.now();
        const project: Project = {
          id: generateId(),
          name: detection.title !== "My Website" ? detection.title : name,
          files,
          entryFile: detection.entryFile,
          rawInput: files[detection.entryFile]?.content ?? "",
          detectedKind: detection.kind,
          usesTailwind: detection.usesTailwind,
          dependencies: detection.dependencies,
          createdAt: now,
          updatedAt: now,
        };
        setRawCode(project.rawInput);
        await executeProject(project, true);
        notify(`Imported ${Object.keys(files).length} files from ${file.name}`);
      } catch (err) {
        notify(err instanceof Error ? err.message : "Could not open that ZIP file.");
      }
    },
    [executeProject, notify]
  );

  const handleRefresh = useCallback(() => {
    if (!activeProject) return;
    const detection = recognizeProjectFiles(activeProject.files, activeProject.name);
    const token = nextRunToken();
    const result = bundleProject(detection, token);
    setBundle(result);
    setRunId(token);
    setActivePage(result.activePage);
    setRuntimeError(null);
    setLogs([]);
  }, [activeProject]);

  const handleUpdateFile = useCallback((path: string, content: string) => {
    setActiveProject((prev) => {
      if (!prev) return prev;
      const nextFiles: Record<string, ProjectFile> = {
        ...prev.files,
        [path]: { ...(prev.files[path] || { path }), content, isBinary: false },
      };
      const updated: Project = {
        ...prev,
        files: nextFiles,
        rawInput: path === prev.entryFile ? content : prev.rawInput,
        updatedAt: Date.now(),
      };
      if (path === prev.entryFile) {
        setRawCode(content);
        saveDraftInput(content);
      }
      return updated;
    });
  }, []);

  const handleAddFile = useCallback((path: string) => {
    setActiveProject((prev) => {
      if (!prev || prev.files[path]) return prev;
      return {
        ...prev,
        files: {
          ...prev.files,
          [path]: { path, content: "", isBinary: false },
        },
        updatedAt: Date.now(),
      };
    });
  }, []);

  const handleDeleteFile = useCallback((path: string) => {
    setActiveProject((prev) => {
      if (!prev) return prev;
      const keys = Object.keys(prev.files).filter((k) => k !== path);
      if (keys.length === 0) return prev;
      const nextFiles = { ...prev.files };
      delete nextFiles[path];
      return {
        ...prev,
        files: nextFiles,
        entryFile: prev.entryFile === path ? keys[0] : prev.entryFile,
        updatedAt: Date.now(),
      };
    });
  }, []);

  const handleRunChanges = useCallback(() => {
    if (!activeProject) return;
    executeProject(activeProject, true);
  }, [activeProject, executeProject]);

  const handleRenameActive = useCallback(
    async (newName: string) => {
      if (!activeProject) return;
      const updated = { ...activeProject, name: newName, updatedAt: Date.now() };
      setActiveProject(updated);
      await renameProject(activeProject.id, newName);
    },
    [activeProject, renameProject]
  );

  const handleDownloadProject = useCallback(
    async (project: Project) => {
      try {
        const blob = await exportProjectAsZip(project);
        const safeName =
          project.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || "vyvo-website";
        triggerBlobDownload(blob, `${safeName}.zip`);
        notify(`Downloaded ${safeName}.zip`);
      } catch {
        notify("Could not prepare the ZIP download.");
      }
    },
    [notify]
  );

  const handleNavigatePage = useCallback(
    (href: string) => {
      if (!bundle?.pageHtmlMap) return;
      const clean = href.replace(/^\.?\//, "").split(/[?#]/)[0];
      if (bundle.pageHtmlMap[clean]) {
        setActivePage(clean);
        setRunId(nextRunToken());
        return;
      }
      const match = Object.keys(bundle.pageHtmlMap).find(
        (k) => k.toLowerCase() === clean.toLowerCase() || k.toLowerCase().endsWith(`/${clean.toLowerCase()}`)
      );
      if (match) {
        setActivePage(match);
        setRunId(nextRunToken());
      } else {
        notify(`Page "${clean}" wasn't included in this project.`);
      }
    },
    [bundle, notify]
  );

  const handleApplyRepair = useCallback(
    async (fixedFiles: Record<string, string>, explanation: string) => {
      if (!activeProject) return;
      const merged: Record<string, ProjectFile> = { ...activeProject.files };
      for (const [path, content] of Object.entries(fixedFiles)) {
        merged[path] = { path, content, isBinary: false };
      }
      const updated: Project = {
        ...activeProject,
        files: merged,
        rawInput: merged[activeProject.entryFile]?.content ?? activeProject.rawInput,
        updatedAt: Date.now(),
      };
      setRawCode(updated.rawInput);
      saveDraftInput(updated.rawInput);
      await executeProject(updated, true);
      notify(explanation.slice(0, 90) || "Applied fix and restarted your website.");
    },
    [activeProject, executeProject, notify]
  );

  const handleDownloadAppFile = useCallback(() => {
    downloadStandaloneVyvoApp();
    setAppJustDownloaded(true);
    notify("Downloaded VYVO-App.html! Open it from your Downloads folder anytime.");
  }, [notify]);

  const handleInstallClick = useCallback(async () => {
    const outcome = await pwa.promptInstall();
    if (outcome === "accepted") {
      notify("VYVO installed! Launch it anytime from your home screen or desktop.");
    } else if (outcome === "ios") {
      setInstallModalOpen(true);
    } else {
      // Browser didn't trigger native install prompt -> immediately download the standalone VYVO App
      handleDownloadAppFile();
      setInstallModalOpen(true);
    }
  }, [pwa, notify, handleDownloadAppFile]);

  const handleOpenSavedProject = useCallback(
    (project: Project) => {
      setRawCode(project.rawInput || project.files[project.entryFile]?.content || "");
      executeProject(project, false);
    },
    [executeProject]
  );

  const handleNewWebsite = useCallback(() => {
    setActiveProject(null);
    setBundle(null);
    setRuntimeError(null);
    setRawCode("");
    saveDraftInput("");
    setMode("home");
    if (typeof window !== "undefined" && window.location.hash.startsWith("#s=")) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--bg)] text-[var(--ink)]">
      {mode === "prompts" ? (
        <PromptBuilderView
          onBackHome={() => setMode("home")}
          onGoPasteCode={() => setMode("home")}
          onNotify={notify}
        />
      ) : mode === "home" || !activeProject || !bundle ? (
        <>
          <Header
            theme={theme}
            onToggleTheme={toggleTheme}
            projectCount={projects.length}
            onOpenProjects={() => setProjectsOpen(true)}
            onOpenPrompts={() => setMode("prompts")}
            showInstallButton={!pwa.isInstalled}
            onInstallClick={handleInstallClick}
            isOffline={pwa.isOffline}
            onLogoClick={() => setMode("home")}
          />
          <HomeView
            code={rawCode}
            onChangeCode={handleCodeChange}
            onRun={handleRunFromHome}
            onUploadZip={handleUploadZip}
            onOpenPrompts={() => setMode("prompts")}
            onNotify={notify}
          />
        </>
      ) : (
        <PreviewView
          project={activeProject}
          bundle={bundle}
          runId={runId}
          activePage={activePage}
          runtimeError={runtimeError}
          logs={logs}
          theme={theme}
          isOffline={pwa.isOffline}
          onBackHome={() => {
            if (activeProject.detectedKind === "unsupported") {
              handleNewWebsite();
            } else {
              setMode("home");
            }
          }}
          onRefresh={handleRefresh}
          onRename={handleRenameActive}
          onUpdateFile={handleUpdateFile}
          onAddFile={handleAddFile}
          onDeleteFile={handleDeleteFile}
          onRunChanges={handleRunChanges}
          onDownload={() => handleDownloadProject(activeProject)}
          onShare={() => setShareModalOpen(true)}
          onReady={(pageTitle) => {
            if (
              pageTitle &&
              pageTitle.trim() &&
              activeProject.name === "My Website" &&
              pageTitle.trim() !== "My Website"
            ) {
              handleRenameActive(pageTitle.trim().slice(0, 60));
            }
          }}
          onRuntimeError={(err) => setRuntimeError(err)}
          onConsoleLog={(entry) => setLogs((prev) => [...prev.slice(-199), entry])}
          onClearLogs={() => setLogs([])}
          onNavigatePage={handleNavigatePage}
          onApplyRepair={handleApplyRepair}
          onDismissError={() => setRuntimeError(null)}
        />
      )}

      {/* Modals & Drawers */}
      <ProjectsDrawer
        open={projectsOpen}
        projects={projects}
        currentProjectId={activeProject?.id}
        onClose={() => setProjectsOpen(false)}
        onOpenProject={handleOpenSavedProject}
        onRenameProject={renameProject}
        onDeleteProject={(id) => {
          removeProject(id);
          if (activeProject?.id === id) {
            setActiveProject(null);
            setMode("home");
          }
          notify("Website deleted");
        }}
        onDownloadProject={handleDownloadProject}
        onNewProject={handleNewWebsite}
      />

      <InstallModal
        open={installModalOpen}
        isIOS={pwa.isIOS}
        canPromptInstall={pwa.canPromptInstall}
        justDownloaded={appJustDownloaded}
        onNativeInstall={async () => {
          const res = await pwa.promptInstall();
          if (res === "accepted") {
            setInstallModalOpen(false);
            notify("VYVO installed!");
          }
        }}
        onDownloadApp={handleDownloadAppFile}
        onClose={() => setInstallModalOpen(false)}
      />

      <ShareModal
        open={shareModalOpen}
        project={activeProject}
        onClose={() => setShareModalOpen(false)}
        onDownloadZip={() => {
          if (activeProject) handleDownloadProject(activeProject);
        }}
      />

      <ToastBanner
        message={toast}
        updateAvailable={pwa.updateAvailable}
        onApplyUpdate={pwa.applyUpdate}
        onDismissToast={() => setToast(null)}
      />
    </div>
  );
}
