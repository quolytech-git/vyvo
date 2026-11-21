import type { AISettings, Project } from "./types";
import type { PromptBuilderData } from "./masterPrompt";

const DB_NAME = "vyvo_db";
const DB_VERSION = 1;
const STORE_PROJECTS = "projects";
const LS_FALLBACK_KEY = "vyvo_projects_v1";
const LS_DRAFT_KEY = "vyvo_draft_input_v1";
const LS_AI_SETTINGS_KEY = "vyvo_ai_settings_v1";
const LS_PROMPT_DRAFT_KEY = "vyvo_prompt_builder_v1";

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
          db.createObjectStore(STORE_PROJECTS, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function readLocalStorageProjects(): Project[] {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalStorageProjects(projects: Project[]): void {
  try {
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(projects));
  } catch {
    // Quota exceeded — IndexedDB handles larger payloads
  }
}

export async function listProjects(): Promise<Project[]> {
  const db = await openDb();
  if (!db) {
    return readLocalStorageProjects().sort((a, b) => b.updatedAt - a.updatedAt);
  }
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_PROJECTS, "readonly");
      const req = tx.objectStore(STORE_PROJECTS).getAll();
      req.onsuccess = () => {
        const rows = (req.result as Project[]) || [];
        resolve(rows.sort((a, b) => b.updatedAt - a.updatedAt));
      };
      req.onerror = () => resolve(readLocalStorageProjects());
    } catch {
      resolve(readLocalStorageProjects());
    }
  });
}

export async function saveProject(project: Project): Promise<void> {
  const db = await openDb();
  if (!db) {
    const all = readLocalStorageProjects().filter((p) => p.id !== project.id);
    all.unshift(project);
    writeLocalStorageProjects(all.slice(0, 50));
    return;
  }
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_PROJECTS, "readwrite");
      tx.objectStore(STORE_PROJECTS).put(project);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function deleteProjectById(id: string): Promise<void> {
  const db = await openDb();
  if (!db) {
    const all = readLocalStorageProjects().filter((p) => p.id !== id);
    writeLocalStorageProjects(all);
    return;
  }
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_PROJECTS, "readwrite");
      tx.objectStore(STORE_PROJECTS).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export function loadDraftInput(): string {
  try {
    return localStorage.getItem(LS_DRAFT_KEY) || "";
  } catch {
    return "";
  }
}

export function saveDraftInput(value: string): void {
  try {
    if (value.length < 400_000) {
      localStorage.setItem(LS_DRAFT_KEY, value);
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function loadAISettings(): AISettings {
  try {
    const raw = localStorage.getItem(LS_AI_SETTINGS_KEY);
    if (!raw) return { provider: "auto", apiKey: "" };
    const parsed = JSON.parse(raw) as Partial<AISettings>;
    return {
      provider: parsed.provider || "auto",
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
    };
  } catch {
    return { provider: "auto", apiKey: "" };
  }
}

export function saveAISettings(settings: AISettings): void {
  try {
    localStorage.setItem(LS_AI_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}

export function loadPromptDraft(): PromptBuilderData | null {
  try {
    const raw = localStorage.getItem(LS_PROMPT_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PromptBuilderData;
  } catch {
    return null;
  }
}

export function savePromptDraft(data: PromptBuilderData): void {
  try {
    localStorage.setItem(LS_PROMPT_DRAFT_KEY, JSON.stringify(data));
  } catch {
    // Ignore
  }
}
