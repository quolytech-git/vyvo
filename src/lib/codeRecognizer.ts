import type { DetectionResult, ProjectFile, ProjectKind, UnsupportedInfo } from "./types";

interface ExtractedBlock {
  lang: string;
  code: string;
  filename?: string;
}

const KNOWN_FILENAME_REGEX =
  /(?:^|[\s`*"'#/:(-])((?:[\w.-]+\/)*[\w.-]+\.(?:html?|css|scss|jsx?|tsx?|mjs|json|svg))(?:$|[\s`*"'):])/i;

function normalizePath(p: string): string {
  return p
    .replace(/\\/g, "/")
    .replace(/^\.?\//, "")
    .replace(/\/+/g, "/")
    .trim();
}

function guessFilenameFromContext(precedingText: string, code: string, lang: string, index: number): string | undefined {
  // 1. Check the first line of the code block for a filename comment (e.g. // src/App.tsx or <!-- index.html -->)
  const firstLine = code.split(/\r?\n/, 1)[0]?.trim() ?? "";
  if (
    firstLine.startsWith("//") ||
    firstLine.startsWith("/*") ||
    firstLine.startsWith("<!--") ||
    firstLine.startsWith("#")
  ) {
    const m = firstLine.match(KNOWN_FILENAME_REGEX);
    if (m) return normalizePath(m[1]);
  }

  // 2. Check the last 2 non-empty lines before the fenced block (e.g. "### `styles.css`" or "File: index.html")
  const prevLines = precedingText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(-2);

  for (let i = prevLines.length - 1; i >= 0; i--) {
    const m = prevLines[i].match(KNOWN_FILENAME_REGEX);
    if (m) return normalizePath(m[1]);
  }

  // 3. Fallback default name by language
  const l = lang.toLowerCase();
  if (l === "html" || l === "htm") return index === 0 ? "index.html" : `page-${index + 1}.html`;
  if (l === "css" || l === "scss") return index === 0 ? "styles.css" : `styles-${index + 1}.css`;
  if (l === "tsx") return "App.tsx";
  if (l === "jsx") return "App.jsx";
  if (l === "ts" || l === "typescript") return "index.ts";
  if (l === "js" || l === "javascript") return "script.js";
  if (l === "json") return "data.json";
  return undefined;
}

/**
 * Extracts markdown fenced code blocks (```lang ... ```) while ignoring surrounding AI chatter.
 */
export function extractMarkdownBlocks(input: string): ExtractedBlock[] {
  const blocks: ExtractedBlock[] = [];
  const fenceRegex = /```([a-zA-Z0-9_+-]*)[ \t]*(?:[^\r\n]*)\r?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fenceRegex.exec(input)) !== null) {
    const preceding = input.slice(lastIndex, match.index);
    const headerLine = input.slice(match.index, input.indexOf("\n", match.index));
    const lang = (match[1] || "").trim().toLowerCase();
    const code = match[2].trim();
    lastIndex = fenceRegex.lastIndex;

    if (!code) continue;

    // Check if the fence header itself has a filename like ```tsx title="App.tsx" or ```html index.html
    const headerMatch = headerLine.replace(/^```[a-zA-Z0-9_+-]*/, "").match(KNOWN_FILENAME_REGEX);
    const filename = headerMatch
      ? normalizePath(headerMatch[1])
      : guessFilenameFromContext(preceding, code, lang, blocks.length);

    blocks.push({ lang, code, filename });
  }

  // Handle truncated single fence (AI output cut off before closing ```)
  if (blocks.length === 0) {
    const unclosed = input.match(/```([a-zA-Z0-9_+-]*)[ \t]*\r?\n([\s\S]+)$/);
    if (unclosed && unclosed[2].trim().length > 10) {
      const lang = (unclosed[1] || "").trim().toLowerCase();
      const code = unclosed[2].trim();
      const preceding = input.slice(0, unclosed.index ?? 0);
      blocks.push({
        lang,
        code,
        filename: guessFilenameFromContext(preceding, code, lang, 0),
      });
    }
  }

  return blocks;
}

/**
 * Detects multi-file plain text formatted with divider headers like:
 * --- index.html --- or // === src/App.tsx ===
 */
function extractDelimitedFiles(input: string): ExtractedBlock[] {
  const lines = input.split(/\r?\n/);
  const markerRegex =
    /^\s*(?:\/\/|\/\*|<!--|#)?\s*(?:={3,}|-{3,}|FILE:)\s*([\w./-]+\.(?:html?|css|scss|jsx?|tsx?|json))\s*(?:={3,}|-{3,})?\s*(?:\*\/|-->)?\s*$/i;

  const sections: { filename: string; lines: string[] }[] = [];
  let current: { filename: string; lines: string[] } | null = null;

  for (const line of lines) {
    const m = line.match(markerRegex);
    if (m) {
      if (current) sections.push(current);
      current = { filename: normalizePath(m[1]), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);

  if (sections.length < 2) return [];
  return sections
    .map((s) => ({
      filename: s.filename,
      lang: s.filename.split(".").pop()?.toLowerCase() ?? "",
      code: s.lines.join("\n").trim(),
    }))
    .filter((b) => b.code.length > 0);
}

// Strict Tailwind utility matcher: only classes that are unmistakably Tailwind
// (plain words like "grid", "flex", "hidden" or "container" are common in hand-written CSS too).
const TAILWIND_TOKEN =
  /^(?:(?:sm|md|lg|xl|2xl|hover|focus|active|dark|group-hover|disabled|first|last):)*-?(?:(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y|w|h|min-w|min-h|max-w|max-h|top|left|right|bottom|inset|z|translate-x|translate-y)-(?:\d+(?:\.5)?|px|full|screen|auto|\[[^\]]+\]|\d\/\d|xs|sm|md|lg|xl|[2-7]xl|prose)|(?:text|bg|border|ring|from|to|via|fill|stroke|divide|placeholder|outline|decoration|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black|transparent)(?:-\d{2,3})?(?:\/\d+)?|text-(?:xs|sm|base|lg|xl|[2-9]xl)|font-(?:thin|light|normal|medium|semibold|bold|extrabold|black)|rounded-(?:none|sm|md|lg|xl|2xl|3xl|full)|shadow-(?:sm|md|lg|xl|2xl|none)|items-(?:center|start|end|baseline|stretch)|justify-(?:center|between|around|evenly|start|end)|flex-(?:col|row|wrap|1)|grid-cols-\d+|col-span-\d+|leading-(?:none|tight|snug|normal|relaxed|loose|\d+)|tracking-(?:tighter|tight|normal|wide|wider|widest)|min-h-screen|overflow-(?:x-auto|y-auto)|object-(?:cover|contain)|duration-\d+|opacity-\d+|backdrop-blur(?:-\w+)?|cursor-pointer)$/;

export function detectTailwindUsage(code: string): boolean {
  if (/@tailwind\s+(base|components|utilities)|@import\s+["']tailwindcss["']/.test(code)) {
    return true;
  }
  if (/cdn\.tailwindcss\.com|tailwindcss/.test(code)) {
    return false; // Already loaded explicitly
  }

  const attrRegex = /(?:class|className)\s*=\s*(?:\{\s*)?["'`]([^"'`]+)["'`]/g;
  const distinct = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = attrRegex.exec(code)) !== null) {
    for (const token of m[1].split(/\s+/)) {
      if (token && TAILWIND_TOKEN.test(token)) distinct.add(token);
    }
  }

  // Pages that already ship their own stylesheet need much stronger evidence,
  // otherwise Tailwind's reset would override their design.
  let ownCss = 0;
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  while ((m = styleRegex.exec(code)) !== null) ownCss += m[1].length;
  const threshold = ownCss > 4000 ? 15 : ownCss > 0 ? 8 : 4;
  return distinct.size >= threshold;
}

export function detectReactCode(code: string): boolean {
  // Explicit React imports or hooks or ReactDOM
  if (
    /\bfrom\s+['"]react(?:-dom(?:\/client)?)?['"]/.test(code) ||
    /\bReact\.(?:createElement|useState|useEffect|Component|Fragment)\b/.test(code) ||
    /\bReactDOM\.(?:createRoot|render)\b/.test(code) ||
    /\b(?:useState|useEffect|useRef|useMemo|useCallback|useReducer|useContext)\s*(?:<[^>]+>)?\s*\(/.test(code)
  ) {
    return true;
  }

  // Component returning JSX (must not be a full HTML document)
  if (isFullHtmlDocument(code)) return false;

  const hasJsxReturn =
    /\breturn\s*\(?\s*<(?:[A-Z][\w.]*|[a-z]+[\w-]*|\s*>)/.test(code) ||
    /=>\s*\(?\s*<(?:[A-Z][\w.]*|div|section|main|header|button|form|span|p|h[1-6]|ul|nav|article)\b/.test(code);
  const hasJsStructure =
    /\b(?:export\s+default|function\s+[A-Z]|const\s+[A-Z][\w]*\s*=|className=)/.test(code);

  if (hasJsxReturn && hasJsStructure) return true;

  // Bare JSX with className= or onClick={
  if (/\bclassName\s*=/.test(code) || /\bon(?:Click|Change|Submit)\s*=\s*\{/.test(code)) {
    return true;
  }

  return false;
}

export function detectTypeScriptSyntax(code: string): boolean {
  return (
    /\binterface\s+[A-Z]\w*\s*(?:extends\s+[\w<>,.\s]+)?\{/.test(code) ||
    /\btype\s+[A-Z]\w*\s*(?:<[^>]+>)?\s*=/.test(code) ||
    /\b(?:useState|useRef|useReducer|createContext)\s*<[^>]+\>/.test(code) ||
    /:\s*(?:React\.)?(?:FC|FunctionComponent|ReactNode|ChangeEvent|FormEvent|MouseEvent|KeyboardEvent|CSSProperties)\b/.test(
      code
    ) ||
    /\(\s*[\w$]+\s*:\s*(?:string|number|boolean|any|unknown|void|Record<|Array<|[A-Z]\w*(?:\[\])?)\s*[,)=]/.test(
      code
    ) ||
    /\bas\s+(?:const|string|number|boolean|any|unknown|HTML\w+Element)\b/.test(code)
  );
}

export function isFullHtmlDocument(code: string): boolean {
  const trimmed = code
    .replace(/^\uFEFF/, "")
    .replace(/^\s*(?:<!--[\s\S]*?-->\s*)*/, "")
    .trim();
  return /^<!doctype\s+html/i.test(trimmed) || /^<html[\s>]/i.test(trimmed);
}

/**
 * Pulls a complete HTML document out of whatever the user pasted:
 * AI chat text before/after it, a "```html" fence, or an answer that was split
 * into two parts ("Type CONTINUE") with extra fence lines in the middle.
 */
export function extractFullHtmlDocument(
  input: string
): { html: string; spannedFences: boolean } | null {
  const startMatch = input.match(/<!doctype\s+html[^>]*>|<html[\s>]/i);
  if (!startMatch || startMatch.index === undefined) return null;
  const start = startMatch.index;
  const end = input.toLowerCase().lastIndexOf("</html>");
  let segment = end > start ? input.slice(start, end + 7) : input.slice(start);
  const fenceLines = /^[ \t]*```[\w-]*[ \t]*$/m;
  const spannedFences = fenceLines.test(segment);
  segment = segment.replace(/^[ \t]*```[\w-]*[ \t]*(?:\r?\n|$)/gm, "");
  return { html: segment.trim(), spannedFences };
}

export function isHtmlFragment(code: string): boolean {
  const trimmed = code.trim();
  if (!trimmed.startsWith("<")) return false;
  if (trimmed.startsWith("<?php")) return false;
  if (detectReactCode(trimmed)) return false;
  return /<(?:div|section|main|header|footer|nav|article|h[1-6]|p|a|button|form|input|table|ul|ol|canvas|svg|style|script|body|head|meta|link|img|video|audio|span)\b/i.test(
    trimmed
  );
}

export function isPureCss(code: string): boolean {
  const trimmed = code.trim();
  if (!trimmed || trimmed.startsWith("<")) return false;
  if (/\b(?:function|const|let|var|import|export|class\s+[A-Z]|return\s)\b/.test(trimmed)) {
    return false;
  }
  const ruleMatches = trimmed.match(/[^{}]+\{[^{}]*:[^;{}]+;?[^{}]*\}/g);
  return Boolean(ruleMatches && ruleMatches.length >= 1);
}

export function detectUnsupportedCode(code: string, langHint = ""): UnsupportedInfo | undefined {
  const trimmed = code.trim();
  const lang = langHint.toLowerCase();

  // Never flag valid HTML or React frontend code
  if (isFullHtmlDocument(trimmed) || isHtmlFragment(trimmed) || detectReactCode(trimmed)) {
    return undefined;
  }

  // Python
  if (
    lang === "python" ||
    lang === "py" ||
    /^(?:from\s+[\w.]+\s+import\s+|import\s+(?:os|sys|flask|django|fastapi|streamlit|numpy|pandas|requests|json|math)\b|def\s+\w+\s*\([^)]*\)\s*:)/m.test(
      trimmed
    ) ||
    /if\s+__name__\s*==\s*['"]__main__['"]\s*:/.test(trimmed)
  ) {
    return {
      language: "Python",
      headline: "Python apps need a server to run",
      explanation:
        "This code is written in Python, which runs on a backend server rather than directly inside your web browser.",
      suggestion:
        'Ask your AI: "Rebuild this as a self-contained HTML, CSS, and JavaScript (or React) website that runs directly in the browser."',
    };
  }

  // PHP
  if (lang === "php" || /^<\?php\b/i.test(trimmed)) {
    return {
      language: "PHP",
      headline: "PHP websites require a backend server",
      explanation:
        "This code uses PHP, a server-side language that web browsers cannot execute directly.",
      suggestion:
        'Ask your AI: "Convert this into a client-side HTML, CSS, and JavaScript website with no PHP required."',
    };
  }

  // Node / Express server-only
  if (
    /\brequire\s*\(\s*['"](?:express|http|fs|path|fastify|koa|pg|mysql2?|mongoose|sqlite3)['"]\s*\)/.test(
      trimmed
    ) ||
    /\bfrom\s+['"](?:express|fastify|koa|node:http|node:fs|next\/server)['"]/.test(trimmed) ||
    /\bapp\.listen\s*\(/.test(trimmed)
  ) {
    return {
      language: "Backend Server (Node.js)",
      headline: "This is server code, not a website interface",
      explanation:
        "This code sets up a backend API server (like Express) instead of a visual webpage your browser can display.",
      suggestion:
        'Ask your AI: "Give me the frontend website code (HTML/CSS/JS or React) so I can view and interact with it in the browser."',
    };
  }

  // Java / C# / C++ / Rust / Go
  if (
    lang === "java" ||
    /\bpublic\s+class\s+\w+/.test(trimmed) ||
    /\bpublic\s+static\s+void\s+main\s*\(/.test(trimmed)
  ) {
    return {
      language: "Java",
      headline: "Java programs can't run directly in a web browser",
      explanation:
        "This looks like a Java program rather than a web page.",
      suggestion:
        'Ask your AI: "Rewrite this as an interactive HTML/JavaScript or React web app."',
    };
  }

  if (
    lang === "cpp" ||
    lang === "c++" ||
    lang === "c" ||
    /^#include\s*<[a-zA-Z0-9_.h]+>/m.test(trimmed)
  ) {
    return {
      language: "C / C++",
      headline: "C/C++ programs can't run directly in a browser",
      explanation: "This code needs to be compiled into a native program rather than opened as a website.",
      suggestion:
        'Ask your AI: "Create a browser-based HTML and JavaScript version of this."',
    };
  }

  if (lang === "rust" || lang === "rs" || /\bfn\s+main\s*\(\s*\)\s*\{/.test(trimmed)) {
    return {
      language: "Rust",
      headline: "Rust programs can't run directly in a browser",
      explanation: "Rust is a compiled systems language and cannot be displayed directly as a website.",
      suggestion:
        'Ask your AI: "Build an interactive web version using HTML, CSS, and JavaScript or React."',
    };
  }

  if (lang === "go" || lang === "golang" || /^package\s+main\b/m.test(trimmed)) {
    return {
      language: "Go",
      headline: "Go programs need a server to run",
      explanation: "This code is written in Go, which runs on a server rather than in a web browser.",
      suggestion:
        'Ask your AI: "Create a browser-based HTML/CSS/JavaScript or React version instead."',
    };
  }

  if (
    lang === "sql" ||
    (/^\s*(?:CREATE\s+TABLE|SELECT\s+[\w*,.\s]+\s+FROM|INSERT\s+INTO|ALTER\s+TABLE)\b/i.test(trimmed) &&
      !trimmed.includes("<"))
  ) {
    return {
      language: "SQL",
      headline: "This is a database query, not a website",
      explanation: "SQL defines database tables and queries, not a visual web interface.",
      suggestion:
        'Ask your AI: "Build a frontend web app with sample data in JavaScript or React that shows this visually."',
    };
  }

  if (
    lang === "bash" ||
    lang === "sh" ||
    lang === "shell" ||
    lang === "powershell" ||
    /^#!\/bin\/(?:ba)?sh/m.test(trimmed)
  ) {
    return {
      language: "Terminal Script",
      headline: "Terminal scripts aren't websites",
      explanation:
        "This looks like a list of command-line instructions rather than website code.",
      suggestion:
        'Copy the HTML, CSS, JavaScript, or React website code from your AI instead of the setup commands.',
    };
  }

  return undefined;
}

export function extractDependenciesFromCode(code: string): Record<string, string> {
  const deps: Record<string, string> = {};
  const importRegex =
    /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"./][^'"]*)['"]|import\s*\(\s*['"]([^'"./][^'"]*)['"]\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = importRegex.exec(code)) !== null) {
    const spec = m[1] || m[2];
    if (!spec || spec.startsWith("http://") || spec.startsWith("https://") || spec.startsWith("@vyvo-local/")) {
      continue;
    }
    // Normalize scoped vs unscoped package names
    const pkgName = spec.startsWith("@")
      ? spec.split("/").slice(0, 2).join("/")
      : spec.split("/")[0];
    if (pkgName && !deps[pkgName]) {
      deps[pkgName] = "latest";
    }
  }
  return deps;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&apos;|&#39;|&#x27;/gi, "'")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–");
}

export function extractTitle(files: Record<string, ProjectFile>, fallback = "My Website"): string {
  for (const file of Object.values(files)) {
    if (file.isBinary) continue;
    const titleMatch = file.content.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1].trim()) {
      return decodeHtmlEntities(titleMatch[1].trim()).slice(0, 60);
    }
  }
  for (const file of Object.values(files)) {
    if (file.isBinary) continue;
    const h1Match = file.content.match(/<h1[^>]*>([^<{]{2,50})<\/h1>/i);
    if (h1Match && h1Match[1].trim()) {
      return decodeHtmlEntities(h1Match[1].trim()).slice(0, 60);
    }
  }
  for (const file of Object.values(files)) {
    if (file.isBinary) continue;
    const compMatch = file.content.match(/export\s+default\s+function\s+([A-Z][a-zA-Z0-9]+)/);
    if (compMatch && compMatch[1] !== "App" && compMatch[1] !== "Page" && compMatch[1] !== "Home") {
      return compMatch[1].replace(/([a-z])([A-Z])/g, "$1 $2");
    }
  }
  return fallback;
}

function classifySingleFile(code: string, langHint = ""): { kind: ProjectKind; filename: string } {
  const lang = langHint.toLowerCase();

  if (lang === "html" || lang === "htm" || isFullHtmlDocument(code)) {
    return { kind: "html", filename: "index.html" };
  }
  if (lang === "tsx" || (detectReactCode(code) && detectTypeScriptSyntax(code))) {
    return { kind: "react", filename: "App.tsx" };
  }
  if (lang === "jsx" || detectReactCode(code)) {
    return { kind: "react", filename: "App.jsx" };
  }
  if (isHtmlFragment(code)) {
    return { kind: "html", filename: "index.html" };
  }
  if (lang === "css" || lang === "scss" || isPureCss(code)) {
    return { kind: "css", filename: "styles.css" };
  }
  if (lang === "ts" || lang === "typescript" || detectTypeScriptSyntax(code)) {
    return { kind: "typescript", filename: "index.ts" };
  }
  return { kind: "javascript", filename: "script.js" };
}

/**
 * Recognizes an already-structured map of project files (e.g. from ZIP upload or code editor).
 */
export function recognizeProjectFiles(
  files: Record<string, ProjectFile>,
  fallbackTitle = "My Website"
): DetectionResult {
  const paths = Object.keys(files);
  const textContent = Object.values(files)
    .filter((f) => !f.isBinary)
    .map((f) => (/\.(?:css|scss)$/i.test(f.path) ? `<style>${f.content}</style>` : f.content))
    .join("\n");

  // Parse package.json if present
  const pkgFile =
    files["package.json"] ??
    Object.values(files).find((f) => f.path.toLowerCase().endsWith("/package.json") || f.path.toLowerCase() === "package.json");

  const dependencies: Record<string, string> = {};
  if (pkgFile) {
    try {
      const parsed = JSON.parse(pkgFile.content);
      if (parsed.dependencies && typeof parsed.dependencies === "object") {
        Object.assign(dependencies, parsed.dependencies);
      }
      // Check if package.json is purely backend
      const depKeys = Object.keys(dependencies);
      const hasFrontend =
        depKeys.some((k) => ["react", "react-dom", "vue", "svelte", "vite", "next"].includes(k)) ||
        paths.some((p) => /\.(?:html?|jsx|tsx)$/i.test(p));
      const hasBackendOnly =
        !hasFrontend && depKeys.some((k) => ["express", "fastify", "koa", "@nestjs/core"].includes(k));
      if (hasBackendOnly) {
        return {
          kind: "unsupported",
          label: "Server Project",
          files,
          entryFile: paths[0] ?? "package.json",
          title: parsed.name || fallbackTitle,
          usesTailwind: false,
          dependencies,
          unsupported: {
            language: "Node.js Backend",
            headline: "This project is a backend server",
            explanation:
              "This package contains server code without a browser frontend interface.",
            suggestion:
              "Upload a frontend website project (HTML/CSS/JS or React/TypeScript) to preview it live in VYVO.",
          },
        };
      }
    } catch {
      // Ignore malformed package.json
    }
  }

  Object.assign(dependencies, extractDependenciesFromCode(textContent));

  // Detect React / TSX / JSX entry point
  const reactCandidates = [
    "src/App.tsx",
    "src/App.jsx",
    "App.tsx",
    "App.jsx",
    "src/main.tsx",
    "src/main.jsx",
    "src/index.tsx",
    "src/index.jsx",
    "index.tsx",
    "index.jsx",
    "src/page.tsx",
    "app/page.tsx",
    "src/app/page.tsx",
  ];
  const foundReactEntry =
    reactCandidates.find((c) => files[c]) ||
    paths.find((p) => /\.(?:tsx|jsx)$/i.test(p)) ||
    paths.find((p) => /\.(?:js|ts)$/i.test(p) && !fIsConfig(p) && detectReactCode(files[p].content));

  // Detect HTML entry point
  const htmlEntry =
    files["index.html"]
      ? "index.html"
      : paths.find((p) => /(?:^|\/)index\.html?$/i.test(p)) ||
        paths.find((p) => /\.html?$/i.test(p));

  const usesTailwind = detectTailwindUsage(textContent);
  const title = extractTitle(files, fallbackTitle);

  // If React files exist (even alongside Vite's index.html stub), run in React mode!
  if (foundReactEntry) {
    return {
      kind: paths.length > 1 ? "multi-file" : "react",
      label: paths.length > 1 ? "Interactive Web App" : "React App",
      files,
      entryFile: foundReactEntry,
      title,
      usesTailwind,
      dependencies,
    };
  }

  if (htmlEntry) {
    return {
      kind: paths.filter((p) => /\.html?$/i.test(p)).length > 1 ? "multi-file" : "html",
      label: paths.length > 1 ? "Multi-File Website" : "Website",
      files,
      entryFile: htmlEntry,
      title,
      usesTailwind,
      dependencies,
    };
  }

  const tsEntry = paths.find((p) => /\.ts$/i.test(p) && !fIsConfig(p));
  if (tsEntry) {
    return {
      kind: "typescript",
      label: "TypeScript App",
      files,
      entryFile: tsEntry,
      title,
      usesTailwind,
      dependencies,
    };
  }

  const jsEntry = paths.find((p) => /\.(?:js|mjs)$/i.test(p) && !fIsConfig(p));
  if (jsEntry) {
    return {
      kind: "javascript",
      label: "JavaScript App",
      files,
      entryFile: jsEntry,
      title,
      usesTailwind,
      dependencies,
    };
  }

  const cssEntry = paths.find((p) => /\.css$/i.test(p));
  if (cssEntry) {
    return {
      kind: "css",
      label: "CSS Stylesheet",
      files,
      entryFile: cssEntry,
      title,
      usesTailwind,
      dependencies,
    };
  }

  const firstPath = paths[0] ?? "index.html";
  const unsupported = detectUnsupportedCode(files[firstPath]?.content ?? "");
  return {
    kind: unsupported ? "unsupported" : "html",
    label: unsupported ? unsupported.language : "Website",
    files,
    entryFile: firstPath,
    title,
    usesTailwind,
    dependencies,
    unsupported,
  };
}

function fIsConfig(filePath: string): boolean {
  const base = filePath.split("/").pop()?.toLowerCase() ?? "";
  return (
    base.includes("config.") ||
    base.startsWith("vite.") ||
    base.startsWith("tailwind.") ||
    base.startsWith("postcss.") ||
    base.startsWith("eslint.") ||
    base.startsWith("next.config")
  );
}

/**
 * Main entry point: takes ANY raw text pasted from ChatGPT, Claude, Gemini, Cursor, etc.
 * and automatically determines project structure, language, dependencies, and entry point.
 */
export function recognizePastedCode(rawInput: string): DetectionResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      kind: "html",
      label: "Website",
      files: { "index.html": { path: "index.html", content: "" } },
      entryFile: "index.html",
      title: "My Website",
      usesTailwind: false,
      dependencies: {},
    };
  }

  // 1. Try markdown code fences (handles AI chat copy-paste with prose & multiple blocks!)
  let blocks = extractMarkdownBlocks(trimmed);

  // 2. Try delimited multi-file paste (e.g. "--- index.html ---")
  if (blocks.length === 0) {
    blocks = extractDelimitedFiles(trimmed);
  }

  // Filter out pure terminal/install instruction blocks (e.g. "npm install lucide-react") when accompanied by real code blocks
  if (blocks.length > 1) {
    const codeBlocks = blocks.filter(
      (b) => !["bash", "sh", "shell", "zsh", "powershell", "cmd", "console", "text", "txt"].includes(b.lang)
    );
    if (codeBlocks.length > 0) {
      blocks = codeBlocks;
    }
  }

  // Complete HTML document (the most common AI answer). Handles chat text around it,
  // split "CONTINUE" answers, and small example snippets from the AI's guide that must NOT be merged in.
  const docCount =
    (trimmed.match(/<!doctype\s+html/gi) || []).length ||
    (trimmed.match(/<html[\s>]/gi) || []).length;
  let forcedSingle: { code: string } | null = null;

  if (docCount === 1) {
    const doc = extractFullHtmlDocument(trimmed);
    if (doc && doc.html) {
      const docIdx = blocks.findIndex((b) => isFullHtmlDocument(b.code));
      if (doc.spannedFences || blocks.length <= 1 || docIdx === -1) {
        forcedSingle = { code: doc.html };
      } else {
        const docCode = blocks[docIdx].code;
        const hasInlineStyle = /<style[\s>]/i.test(docCode);
        const hasInlineScript = /<script(?![^>]*\bsrc\s*=)[^>]*>\s*\S/i.test(docCode);
        const kept = blocks.filter((b, i) => {
          if (i === docIdx) return true;
          const base = (b.filename || "").split("/").pop() || "";
          if (base && /\.(?:css|js|mjs|json|svg)$/i.test(base) && docCode.includes(base)) return true;
          const kind = classifySingleFile(b.code, b.lang).kind;
          if (kind === "css" && !hasInlineStyle && b.code.length > 80) return true;
          if (kind === "javascript" && !hasInlineScript && b.code.length > 80) return true;
          return false;
        });
        if (kept.length === 1) {
          forcedSingle = { code: docCode };
        } else {
          blocks = kept.map((b, i) =>
            i === kept.indexOf(blocks[docIdx]) && !/\.html?$/i.test(b.filename || "")
              ? { ...b, filename: "index.html" }
              : b
          );
        }
      }
    }
  }

  // Multi-block AI response: assemble all blocks into a clean project
  if (!forcedSingle && blocks.length > 1) {
    const files: Record<string, ProjectFile> = {};
    const usedNames = new Set<string>();

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const classified = classifySingleFile(b.code, b.lang);
      let name = b.filename || classified.filename;
      if (usedNames.has(name)) {
        const ext = name.includes(".") ? "." + name.split(".").pop() : "";
        const base = ext ? name.slice(0, -ext.length) : name;
        name = `${base}-${i + 1}${ext}`;
      }
      usedNames.add(name);
      files[name] = { path: name, content: b.code };
    }

    return recognizeProjectFiles(files);
  }

  // Single block (either extracted from markdown fence or raw pasted code)
  const singleCode = forcedSingle ? forcedSingle.code : blocks.length === 1 ? blocks[0].code : trimmed;
  const singleLang = forcedSingle ? "html" : blocks.length === 1 ? blocks[0].lang : "";
  const singleFilename = forcedSingle ? "index.html" : blocks.length === 1 ? blocks[0].filename : undefined;

  // Check for unsupported non-browser languages first
  const unsupported = forcedSingle ? undefined : detectUnsupportedCode(singleCode, singleLang);
  if (unsupported) {
    const fallbackName = singleFilename || `code.${singleLang || "txt"}`;
    return {
      kind: "unsupported",
      label: unsupported.language,
      files: { [fallbackName]: { path: fallbackName, content: singleCode } },
      entryFile: fallbackName,
      title: unsupported.language,
      usesTailwind: false,
      dependencies: {},
      unsupported,
    };
  }

  const classified = classifySingleFile(singleCode, singleLang);
  const entryFile = singleFilename && /\.(?:html?|css|jsx?|tsx?)$/i.test(singleFilename)
    ? singleFilename
    : classified.filename;

  const files: Record<string, ProjectFile> = {
    [entryFile]: { path: entryFile, content: singleCode },
  };

  const usesTailwind = detectTailwindUsage(singleCode);
  const dependencies = extractDependenciesFromCode(singleCode);
  const title = extractTitle(files);

  const labelMap: Record<ProjectKind, string> = {
    html: "Website",
    react: "Interactive App",
    javascript: "JavaScript App",
    typescript: "TypeScript App",
    css: "CSS Design",
    "multi-file": "Multi-File Website",
    unsupported: "Unsupported",
  };

  return {
    kind: classified.kind,
    label: labelMap[classified.kind],
    files,
    entryFile,
    title,
    usesTailwind,
    dependencies,
  };
}
