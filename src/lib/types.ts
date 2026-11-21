export type ProjectKind =
  | "html"
  | "react"
  | "javascript"
  | "typescript"
  | "css"
  | "multi-file"
  | "unsupported";

export interface ProjectFile {
  path: string;
  content: string;
  isBinary?: boolean;
  mimeType?: string;
}

export interface UnsupportedInfo {
  language: string;
  headline: string;
  explanation: string;
  suggestion: string;
}

export interface DetectionResult {
  kind: ProjectKind;
  label: string;
  files: Record<string, ProjectFile>;
  entryFile: string;
  title: string;
  usesTailwind: boolean;
  dependencies: Record<string, string>;
  unsupported?: UnsupportedInfo;
}

export interface Project {
  id: string;
  name: string;
  files: Record<string, ProjectFile>;
  entryFile: string;
  rawInput: string;
  detectedKind: ProjectKind;
  usesTailwind?: boolean;
  dependencies?: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface RuntimeLog {
  id: string;
  level: "log" | "info" | "warn" | "error";
  message: string;
  timestamp: number;
}

export interface RuntimeError {
  type: "compile" | "runtime" | "timeout" | "unsupported" | "network";
  title: string;
  friendlyMessage: string;
  rawMessage: string;
  line?: number;
  column?: number;
  file?: string;
  stack?: string;
  suggestion?: string;
  /** True when the website still rendered, so the problem is shown as a small banner instead of a blocking screen. */
  nonBlocking?: boolean;
}

export type AIProvider = "auto" | "gemini" | "openai" | "anthropic";

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
}

export interface RepairProposal {
  explanation: string;
  fixedFiles: Record<string, string>;
  source: "ai" | "local";
  provider?: string;
  changesSummary?: string[];
}

export interface BundleResult {
  ok: boolean;
  html?: string;
  pageHtmlMap?: Record<string, string>;
  activePage?: string;
  error?: RuntimeError;
  warnings?: string[];
  requiresNetwork?: boolean;
}
