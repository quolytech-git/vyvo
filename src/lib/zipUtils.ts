import JSZip from "jszip";
import type { Project, ProjectFile } from "./types";
import { bundleProject } from "./bundler";
import { recognizeProjectFiles } from "./codeRecognizer";

const BINARY_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "ico",
  "bmp",
  "woff",
  "woff2",
  "ttf",
  "otf",
  "mp3",
  "wav",
  "mp4",
  "webm",
  "pdf",
]);

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  ico: "image/x-icon",
  svg: "image/svg+xml",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
};

const IGNORED_PATH_PARTS = [
  "__MACOSX/",
  "node_modules/",
  ".git/",
  ".next/",
  "dist/",
  ".DS_Store",
  "Thumbs.db",
];

function shouldIgnore(path: string): boolean {
  return IGNORED_PATH_PARTS.some((part) => path.includes(part));
}

function stripCommonRootFolder(paths: string[]): (p: string) => string {
  if (paths.length === 0) return (p) => p;
  const firstSegments = new Set(paths.map((p) => (p.includes("/") ? p.split("/")[0] : "")));
  if (firstSegments.size === 1) {
    const only = [...firstSegments][0];
    if (only) {
      const prefix = `${only}/`;
      return (p) => (p.startsWith(prefix) ? p.slice(prefix.length) : p);
    }
  }
  return (p) => p;
}

/**
 * Imports a user-uploaded ZIP archive into a clean VYVO file map.
 * Enforces safety limits on file count and total size to protect browser memory.
 */
export async function importZipFile(
  file: File | ArrayBuffer
): Promise<{ files: Record<string, ProjectFile>; name: string }> {
  const MAX_FILES = 120;
  const MAX_TOTAL_BYTES = 15 * 1024 * 1024; // 15 MB

  const zip = await JSZip.loadAsync(file);
  const rawEntries = Object.values(zip.files).filter(
    (entry) => !entry.dir && !shouldIgnore(entry.name)
  );

  if (rawEntries.length === 0) {
    throw new Error("This ZIP file doesn't appear to contain any website files.");
  }
  if (rawEntries.length > MAX_FILES) {
    throw new Error(`This ZIP contains too many files (${rawEntries.length}). Please upload a frontend project with fewer than ${MAX_FILES} files.`);
  }

  const stripRoot = stripCommonRootFolder(rawEntries.map((e) => e.name));
  const files: Record<string, ProjectFile> = {};
  let totalBytes = 0;

  for (const entry of rawEntries) {
    const cleanPath = stripRoot(entry.name).replace(/^\/+/, "");
    if (!cleanPath) continue;

    const ext = cleanPath.split(".").pop()?.toLowerCase() ?? "";
    const isBinary = BINARY_EXTENSIONS.has(ext);

    if (isBinary) {
      const base64 = await entry.async("base64");
      totalBytes += Math.ceil((base64.length * 3) / 4);
      if (totalBytes > MAX_TOTAL_BYTES) {
        throw new Error("This ZIP project is larger than the 15 MB browser limit.");
      }
      files[cleanPath] = {
        path: cleanPath,
        content: base64,
        isBinary: true,
        mimeType: MIME_BY_EXT[ext] || "application/octet-stream",
      };
    } else {
      const text = await entry.async("string");
      totalBytes += text.length;
      if (totalBytes > MAX_TOTAL_BYTES) {
        throw new Error("This ZIP project is larger than the 15 MB browser limit.");
      }
      files[cleanPath] = {
        path: cleanPath,
        content: text,
        isBinary: false,
      };
    }
  }

  const zipName =
    file instanceof File
      ? file.name.replace(/\.zip$/i, "").replace(/[-_]+/g, " ").trim() || "Imported Website"
      : "Imported Website";

  return { files, name: zipName };
}

/**
 * Exports a VYVO project as a clean, ready-to-open downloadable ZIP file.
 * For React/TypeScript projects, includes BOTH the source files AND a standalone
 * double-clickable `open-website.html` so non-programmers can open it offline/locally!
 */
export async function exportProjectAsZip(project: Project): Promise<Blob> {
  const zip = new JSZip();

  for (const file of Object.values(project.files)) {
    if (file.isBinary) {
      const cleanBase64 = file.content.replace(/^data:[^;]+;base64,/, "");
      zip.file(file.path, cleanBase64, { base64: true });
    } else {
      zip.file(file.path, file.content);
    }
  }

  const detection = recognizeProjectFiles(project.files, project.name);

  // If the project isn't a plain index.html, also include a standalone runnable HTML file
  if (!project.files["index.html"] || detection.kind === "react" || detection.kind === "multi-file") {
    const bundled = bundleProject(detection, "export");
    if (bundled.ok && bundled.html) {
      const targetName = project.files["index.html"] ? "open-website.html" : "index.html";
      zip.file(targetName, bundled.html);
    }
  }

  const readme = `${project.name}
Exported from VYVO — From AI Code to Reality.

HOW TO OPEN YOUR WEBSITE:
Double-click "${project.files["index.html"] && detection.kind !== "react" ? "index.html" : project.files["index.html"] ? "open-website.html" : "index.html"}" to open your website directly in Chrome, Safari, Edge, or Firefox.
`;
  zip.file("README.txt", readme);

  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
