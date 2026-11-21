import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import type { Project, ProjectFile } from "./types";

interface SharePayload {
  v: 1;
  n: string; // project name
  e: string; // entryFile
  f: Record<string, string>; // text files
}

const MAX_SHARE_URL_LENGTH = 24000;

export function createShareUrl(project: Project, origin: string): { url: string } | { error: string } {
  const textFiles: Record<string, string> = {};
  let hasBinary = false;

  for (const file of Object.values(project.files)) {
    if (file.isBinary) {
      hasBinary = true;
      continue;
    }
    textFiles[file.path] = file.content;
  }

  if (Object.keys(textFiles).length === 0) {
    return { error: "There is no website code to share yet." };
  }

  const payload: SharePayload = {
    v: 1,
    n: project.name.slice(0, 80),
    e: project.entryFile,
    f: textFiles,
  };

  const encoded = compressToEncodedURIComponent(JSON.stringify(payload));
  const url = `${origin.replace(/\/$/, "")}/#s=${encoded}`;

  if (url.length > MAX_SHARE_URL_LENGTH) {
    return {
      error:
        "This project is too large for a direct share link. Use Download Website (ZIP) to share it instead.",
    };
  }

  if (hasBinary) {
    // Still shareable with text files; binary images are skipped in URL mode
    return { url };
  }

  return { url };
}

export function parseShareHash(
  hash: string
): { name: string; entryFile: string; files: Record<string, ProjectFile> } | null {
  if (!hash) return null;
  const match = hash.match(/#s=([A-Za-z0-9+\-$_.!*'(),%]+)/);
  if (!match) return null;

  try {
    const json = decompressFromEncodedURIComponent(match[1]);
    if (!json) return null;
    const parsed = JSON.parse(json) as Partial<SharePayload>;
    if (parsed.v !== 1 || !parsed.f || typeof parsed.f !== "object") return null;

    const files: Record<string, ProjectFile> = {};
    for (const [path, content] of Object.entries(parsed.f)) {
      if (typeof content === "string") {
        files[path] = { path, content, isBinary: false };
      }
    }
    if (Object.keys(files).length === 0) return null;

    const entryFile =
      typeof parsed.e === "string" && files[parsed.e] ? parsed.e : Object.keys(files)[0];

    return {
      name: typeof parsed.n === "string" && parsed.n.trim() ? parsed.n.trim() : "Shared Website",
      entryFile,
      files,
    };
  } catch {
    return null;
  }
}
