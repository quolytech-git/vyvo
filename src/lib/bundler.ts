import * as Babel from "@babel/standalone";
import type { BundleResult, DetectionResult, ProjectFile } from "./types";
import { translateError } from "./errorTranslator";
import { detectReactCode, detectTailwindUsage, isFullHtmlDocument } from "./codeRecognizer";

function toBase64Utf8(input: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input, "utf-8").toString("base64");
  }
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function toDataUriJs(code: string): string {
  return `data:text/javascript;base64,${toBase64Utf8(code)}`;
}

function escapeScriptClose(code: string): string {
  return code.replace(/<\/script>/gi, "<\\/script>");
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\.?\//, "").replace(/\/+/g, "/");
}

function resolveRelativePath(fromFile: string, specifier: string): string {
  if (specifier.startsWith("@/")) {
    return normalizePath(specifier.slice(2));
  }
  const fromParts = normalizePath(fromFile).split("/");
  fromParts.pop(); // remove filename
  const specParts = specifier.split("/");
  for (const part of specParts) {
    if (!part || part === ".") continue;
    if (part === "..") {
      fromParts.pop();
    } else {
      fromParts.push(part);
    }
  }
  return fromParts.join("/");
}

function findProjectFile(
  files: Record<string, ProjectFile>,
  basePath: string
): ProjectFile | undefined {
  const normalized = normalizePath(basePath);
  const candidates = [
    normalized,
    `src/${normalized}`,
    `${normalized}.tsx`,
    `${normalized}.ts`,
    `${normalized}.jsx`,
    `${normalized}.js`,
    `${normalized}.json`,
    `${normalized}.css`,
    `${normalized}/index.tsx`,
    `${normalized}/index.ts`,
    `${normalized}/index.jsx`,
    `${normalized}/index.js`,
    `src/${normalized}.tsx`,
    `src/${normalized}.ts`,
    `src/${normalized}.jsx`,
    `src/${normalized}.js`,
    `src/${normalized}/index.tsx`,
    `src/${normalized}/index.ts`,
  ];

  for (const candidate of candidates) {
    if (files[candidate]) return files[candidate];
  }
  // Case-insensitive fallback
  const lowerMap = new Map(Object.keys(files).map((k) => [k.toLowerCase(), files[k]]));
  for (const candidate of candidates) {
    const match = lowerMap.get(candidate.toLowerCase());
    if (match) return match;
  }
  return undefined;
}

/**
 * Runtime prelude injected into the isolated iframe.
 * Provides:
 * - Safe in-memory localStorage/sessionStorage polyfill for opaque sandbox origins
 * - Console & error capture via postMessage
 * - Loop watchdog tick helper (prevents infinite loops from freezing the browser)
 * - Relative multi-page HTML navigation interception
 */
export function createRuntimeBridgeScript(runId: string): string {
  return `<script>
(function() {
  var RUN_ID = ${JSON.stringify(runId)};
  function post(payload) {
    try {
      window.parent.postMessage(Object.assign({ source: "vyvo-sandbox", runId: RUN_ID }, payload), "*");
    } catch (e) {}
  }

  // 1. Safe in-memory storage fallback for sandboxed opaque origins (no allow-same-origin)
  function createMemoryStorage() {
    var store = Object.create(null);
    return {
      getItem: function(k) { return Object.prototype.hasOwnProperty.call(store, String(k)) ? store[String(k)] : null; },
      setItem: function(k, v) { store[String(k)] = String(v); },
      removeItem: function(k) { delete store[String(k)]; },
      clear: function() { store = Object.create(null); },
      key: function(i) { return Object.keys(store)[i] || null; },
      get length() { return Object.keys(store).length; }
    };
  }
  ["localStorage", "sessionStorage"].forEach(function(name) {
    try {
      var s = window[name];
      s.setItem("__vyvo_probe__", "1");
      s.removeItem("__vyvo_probe__");
    } catch (e) {
      try {
        Object.defineProperty(window, name, {
          value: createMemoryStorage(),
          configurable: true,
          enumerable: true,
          writable: true
        });
      } catch (err) {}
    }
  });

  // 2. Infinite loop protection watchdog
  var __loops = Object.create(null);
  var __resetScheduled = false;
  window.__vyvoTick = function(id) {
    if (!__resetScheduled) {
      __resetScheduled = true;
      setTimeout(function() {
        for (var k in __loops) delete __loops[k];
        __resetScheduled = false;
      }, 0);
    }
    var entry = __loops[id];
    if (!entry) {
      entry = { c: 0, t: Date.now() };
      __loops[id] = entry;
    }
    if ((++entry.c & 1023) === 0) {
      if (Date.now() - entry.t > 2500) {
        throw new Error("Execution timed out (possible infinite loop)");
      }
    }
  };

  // 3. Console capture
  function formatArg(arg) {
    if (typeof arg === "string") return arg;
    if (arg instanceof Error) return arg.message || String(arg);
    try {
      return JSON.stringify(arg, null, 2);
    } catch (e) {
      return String(arg);
    }
  }
  ["log", "info", "warn", "error"].forEach(function(level) {
    var orig = console[level];
    console[level] = function() {
      var parts = [];
      for (var i = 0; i < arguments.length; i++) parts.push(formatArg(arguments[i]));
      post({ type: "console", level: level, message: parts.join(" ") });
      if (typeof orig === "function") {
        try { orig.apply(console, arguments); } catch (e) {}
      }
    };
  });

  // 4. Error & unhandled promise capture
  window.addEventListener("error", function(ev) {
    var msg = ev.message || (ev.error && ev.error.message) || "Runtime error";
    // Ignore benign ResizeObserver browser noise
    if (/ResizeObserver loop/i.test(msg)) return;
    post({
      type: "error",
      message: msg,
      line: ev.lineno || undefined,
      column: ev.colno || undefined,
      stack: ev.error && ev.error.stack ? String(ev.error.stack) : undefined
    });
  });

  window.addEventListener("unhandledrejection", function(ev) {
    var reason = ev.reason;
    var msg = reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "Unhandled async error";
    post({
      type: "error",
      message: msg,
      stack: reason && reason.stack ? String(reason.stack) : undefined
    });
  });

  window.__vyvoReportError = function(err) {
    post({
      type: "error",
      message: err && err.message ? String(err.message) : String(err),
      stack: err && err.stack ? String(err.stack) : undefined
    });
  };

  // 5. Multi-page HTML navigation & safe links
  document.addEventListener("click", function(ev) {
    var el = ev.target;
    while (el && el.tagName !== "A") el = el.parentElement;
    if (!el) return;
    var href = el.getAttribute("href");
    if (!href) return;
    if (href.startsWith("#")) return;
    if (/^https?:\\/\\//i.test(href) || /^mailto:/i.test(href) || /^tel:/i.test(href)) {
      if (!el.getAttribute("target")) el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
      return;
    }
    if (/\\.html?(?:[?#].*)?$/i.test(href)) {
      ev.preventDefault();
      post({ type: "navigate", href: href });
    }
  });

  // 6. Ready notification
  function sendReady() {
    post({ type: "ready", title: document.title || "" });
  }
  if (document.readyState === "interactive" || document.readyState === "complete") {
    sendReady();
  } else {
    document.addEventListener("DOMContentLoaded", sendReady);
  }
  window.addEventListener("load", sendReady);
})();
</script>`;
}

/**
 * Babel plugin that injects lightweight infinite-loop guards into while/for/do-while loops.
 */
function createLoopGuardPlugin() {
  let loopId = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function loopGuardPlugin(babel: any) {
    const t = babel.types;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function guardLoop(path: any) {
      const id = ++loopId;
      const call = t.expressionStatement(
        t.callExpression(
          t.memberExpression(t.identifier("window"), t.identifier("__vyvoTick")),
          [t.numericLiteral(id)]
        )
      );
      const body = path.get("body");
      if (body.isBlockStatement()) {
        body.unshiftContainer("body", call);
      } else {
        body.replaceWith(t.blockStatement([call, body.node]));
      }
    }
    return {
      visitor: {
        WhileStatement: guardLoop,
        DoWhileStatement: guardLoop,
        ForStatement: guardLoop,
      },
    };
  };
}

const REACT_HOOKS = [
  "useState",
  "useEffect",
  "useRef",
  "useMemo",
  "useCallback",
  "useReducer",
  "useContext",
  "useLayoutEffect",
  "useId",
  "useTransition",
  "useDeferredValue",
  "Fragment",
  "Suspense",
  "StrictMode",
  "createContext",
  "forwardRef",
  "memo",
];

/**
 * Normalizes AI-generated React/JSX snippets so missing imports, bare JSX,
 * or non-exported top-level components still run effortlessly.
 */
function preprocessReactEntry(code: string): { code: string; selfMounts: boolean } {
  let src = code.trim();

  // Strip 'use client' / 'use server' strings cleanly (harmless, keep clean)
  const selfMounts =
    /\b(?:ReactDOM\.)?createRoot\s*\(/.test(src) || /\bReactDOM\.render\s*\(/.test(src);

  // If user pasted raw JSX without any function/import/export (e.g., <div className="...">...</div>)
  const looksLikeBareJsx =
    src.startsWith("<") &&
    !/\b(?:import|export|function|const|let|var|class)\b/.test(src.slice(0, 80));

  if (looksLikeBareJsx) {
    src = `export default function App() {\n  return (\n    <>\n${src}\n    </>\n  );\n}`;
  }

  // Detect used React hooks that weren't imported or declared
  const hasReactImport = /\bfrom\s+['"]react['"]/.test(src);
  const missingHooks: string[] = [];
  for (const hook of REACT_HOOKS) {
    const usedRegex = new RegExp(`(?<![.\\w$])${hook}\\b`);
    const declaredRegex = new RegExp(
      `(?:import[\\s\\S]*?\\b${hook}\\b[\\s\\S]*?from|\\b(?:function|const|let|var|class)\\s+${hook}\\b|\\bReact\\.${hook}\\b)`
    );
    if (usedRegex.test(src) && !declaredRegex.test(src)) {
      missingHooks.push(hook);
    }
  }

  const usesReactNamespace =
    /\bReact\./.test(src) && !/import\s+React\b/.test(src) && !/import\s+\*\s+as\s+React\b/.test(src);

  if (!hasReactImport && (missingHooks.length > 0 || usesReactNamespace)) {
    const named = missingHooks.length > 0 ? `, { ${missingHooks.join(", ")} }` : "";
    src = `import React${named} from "react";\n${src}`;
  } else if (missingHooks.length > 0) {
    src = `import { ${missingHooks.join(", ")} } from "react";\n${src}`;
  } else if (usesReactNamespace) {
    src = `import React from "react";\n${src}`;
  }

  // If no export default and doesn't self-mount, find the primary PascalCase component and export it
  if (!selfMounts && !/\bexport\s+default\b/.test(src)) {
    const fnMatches = [...src.matchAll(/(?:^|\n)\s*(?:export\s+)?function\s+([A-Z][A-Za-z0-9_]*)\s*\(/g)];
    const constMatches = [
      ...src.matchAll(/(?:^|\n)\s*(?:export\s+)?const\s+([A-Z][A-Za-z0-9_]*)\s*(?::[^=]+)?=\s*(?:\(|function)/g),
    ];
    const classMatches = [...src.matchAll(/(?:^|\n)\s*(?:export\s+)?class\s+([A-Z][A-Za-z0-9_]*)\s+extends\b/g)];
    const allNames = [...fnMatches, ...constMatches, ...classMatches].map((m) => m[1]);

    const preferred =
      allNames.find((n) => n === "App" || n === "Page" || n === "Home" || n === "Main") ||
      allNames[allNames.length - 1];

    if (preferred) {
      src += `\n\nexport default ${preferred};\n`;
    }
  }

  return { code: src, selfMounts };
}

function createNextLinkShim(): string {
  return `import React from "react";
export default function Link({ href = "#", children, ...props }) {
  return React.createElement("a", { href, ...props }, children);
}`;
}

function createNextImageShim(): string {
  return `import React from "react";
export default function Image({ src = "", alt = "", fill, priority, unoptimized, ...props }) {
  const style = fill ? { width: "100%", height: "100%", objectFit: "cover", ...(props.style || {}) } : props.style;
  return React.createElement("img", { src, alt, ...props, style });
}`;
}

function buildEsmUrl(specifier: string, deps: Record<string, string>): string {
  if (specifier === "react") return "https://esm.sh/react@18.3.1";
  if (specifier === "react/jsx-runtime") return "https://esm.sh/react@18.3.1/jsx-runtime";
  if (specifier === "react/jsx-dev-runtime") return "https://esm.sh/react@18.3.1/jsx-dev-runtime";
  if (specifier === "react-dom") return "https://esm.sh/react-dom@18.3.1";
  if (specifier === "react-dom/client") return "https://esm.sh/react-dom@18.3.1/client";

  // Extract package name & optional subpath
  const isScoped = specifier.startsWith("@");
  const parts = specifier.split("/");
  const pkgName = isScoped ? parts.slice(0, 2).join("/") : parts[0];
  const subpath = isScoped ? parts.slice(2).join("/") : parts.slice(1).join("/");

  const rawVer = deps[pkgName];
  // Use pinned version only if it looks like a clean semver range without workspace/git protocols
  const cleanVer =
    rawVer &&
    rawVer !== "latest" &&
    /^[~^]?\d+\.\d+/.test(rawVer)
      ? `@${rawVer.replace(/^[~^]/, "")}`
      : "";

  const base = `https://esm.sh/${pkgName}${cleanVer}${subpath ? `/${subpath}` : ""}`;
  return `${base}?deps=react@18.3.1,react-dom@18.3.1`;
}

/**
 * Bundles a React / JSX / TSX / TypeScript / multi-file app using Babel + ES Import Maps.
 */
function bundleReactOrTsProject(
  detection: DetectionResult,
  runId: string
): BundleResult {
  const { files, entryFile, dependencies, title } = detection;
  let usesTailwind = detection.usesTailwind;
  const collectedCss: string[] = [];
  const cssSeen = new Set<string>();
  const importMap: Record<string, string> = {
    react: "https://esm.sh/react@18.3.1",
    "react/jsx-runtime": "https://esm.sh/react@18.3.1/jsx-runtime",
    "react/jsx-dev-runtime": "https://esm.sh/react@18.3.1/jsx-dev-runtime",
    "react-dom": "https://esm.sh/react-dom@18.3.1",
    "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
    "next/link": toDataUriJs(createNextLinkShim()),
    "next/image": toDataUriJs(createNextImageShim()),
  };

  // Collect all standalone CSS files in the project (e.g. styles.css, src/index.css)
  for (const file of Object.values(files)) {
    if (!file.isBinary && /\.css$/i.test(file.path)) {
      if (/@tailwind|@import\s+["']tailwindcss["']/.test(file.content)) {
        usesTailwind = true;
      }
      const cleanedCss = file.content
        .replace(/@tailwind\s+(?:base|components|utilities)\s*;/g, "")
        .replace(/@import\s+["']tailwindcss["']\s*;/g, "");
      if (!cssSeen.has(file.path) && cleanedCss.trim()) {
        cssSeen.add(file.path);
        collectedCss.push(`/* ${file.path} */\n${cleanedCss}`);
      }
    }
  }

  const compiledModules = new Set<string>();
  const entryFileObj = files[entryFile];
  if (!entryFileObj) {
    return {
      ok: false,
      error: translateError(`Entry file "${entryFile}" was not found.`, { type: "compile" }),
    };
  }

  const isReactMode =
    detection.kind === "react" ||
    /\.(?:tsx|jsx)$/i.test(entryFile) ||
    detectReactCode(entryFileObj.content);

  let selfMounts = false;

  function compileModule(filePath: string, isEntry: boolean): { ok: true; specifier: string } | { ok: false; error: BundleResult["error"] } {
    const normalized = normalizePath(filePath);
    const virtualSpec = `@vyvo-local/${normalized}`;
    if (compiledModules.has(virtualSpec)) {
      return { ok: true, specifier: virtualSpec };
    }
    compiledModules.add(virtualSpec);

    const fileObj = files[filePath] ?? findProjectFile(files, filePath);
    if (!fileObj) {
      return {
        ok: false,
        error: translateError(`Could not find file "${filePath}".`, {
          type: "compile",
          file: filePath,
        }),
      };
    }

    // Handle binary / asset files
    if (fileObj.isBinary || /\.(?:png|jpe?g|gif|webp|ico|woff2?|ttf)$/i.test(fileObj.path)) {
      const dataUrl = fileObj.content.startsWith("data:")
        ? fileObj.content
        : `data:${fileObj.mimeType || "application/octet-stream"};base64,${fileObj.content}`;
      importMap[virtualSpec] = toDataUriJs(`export default ${JSON.stringify(dataUrl)};`);
      return { ok: true, specifier: virtualSpec };
    }

    // Handle SVG imported into JS/TS
    if (/\.svg$/i.test(fileObj.path)) {
      const dataUrl = `data:image/svg+xml;base64,${toBase64Utf8(fileObj.content)}`;
      importMap[virtualSpec] = toDataUriJs(`export default ${JSON.stringify(dataUrl)};`);
      return { ok: true, specifier: virtualSpec };
    }

    // Handle JSON files
    if (/\.json$/i.test(fileObj.path)) {
      importMap[virtualSpec] = toDataUriJs(`export default ${fileObj.content.trim() || "{}"};`);
      return { ok: true, specifier: virtualSpec };
    }

    let sourceCode = fileObj.content;
    if (isEntry && isReactMode) {
      const processed = preprocessReactEntry(sourceCode);
      sourceCode = processed.code;
      selfMounts = processed.selfMounts;
    }

    const childLocalImports: string[] = [];

    // Custom Babel plugin to rewrite local imports, strip CSS imports, and record bare npm packages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const importRewritePlugin = (babel: any) => {
      const t = babel.types;
      return {
        visitor: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ImportDeclaration(path: any) {
            const rawSpec: string = path.node.source.value;
            if (!rawSpec) return;

            // CSS / SCSS imports -> strip from JS (already injected into <style>)
            if (/\.(?:css|scss|sass|less)(?:\?.*)?$/i.test(rawSpec)) {
              if (rawSpec.includes("tailwind")) usesTailwind = true;
              if (rawSpec.startsWith(".") || rawSpec.startsWith("@/")) {
                const resolved = resolveRelativePath(normalized, rawSpec);
                const cssFile = findProjectFile(files, resolved);
                if (cssFile && !cssSeen.has(cssFile.path)) {
                  cssSeen.add(cssFile.path);
                  const cleaned = cssFile.content
                    .replace(/@tailwind\s+(?:base|components|utilities)\s*;/g, "")
                    .replace(/@import\s+["']tailwindcss["']\s*;/g, "");
                  if (cleaned.trim()) collectedCss.push(`/* ${cssFile.path} */\n${cleaned}`);
                }
              }
              path.remove();
              return;
            }

            // Local relative or @/ alias import
            if (rawSpec.startsWith(".") || rawSpec.startsWith("@/")) {
              const resolved = resolveRelativePath(normalized, rawSpec);
              const target = findProjectFile(files, resolved);
              if (target) {
                const targetSpec = `@vyvo-local/${normalizePath(target.path)}`;
                path.node.source = t.stringLiteral(targetSpec);
                childLocalImports.push(target.path);
              }
              return;
            }

            // Bare package specifier
            if (
              !rawSpec.startsWith("http://") &&
              !rawSpec.startsWith("https://") &&
              !rawSpec.startsWith("@vyvo-local/")
            ) {
              if (!importMap[rawSpec]) {
                importMap[rawSpec] = buildEsmUrl(rawSpec, dependencies);
              }
            }
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ExportNamedDeclaration(path: any) {
            if (!path.node.source) return;
            const rawSpec: string = path.node.source.value;
            if (rawSpec.startsWith(".") || rawSpec.startsWith("@/")) {
              const resolved = resolveRelativePath(normalized, rawSpec);
              const target = findProjectFile(files, resolved);
              if (target) {
                path.node.source = t.stringLiteral(`@vyvo-local/${normalizePath(target.path)}`);
                childLocalImports.push(target.path);
              }
            } else if (!rawSpec.startsWith("http") && !importMap[rawSpec]) {
              importMap[rawSpec] = buildEsmUrl(rawSpec, dependencies);
            }
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ExportAllDeclaration(path: any) {
            if (!path.node.source) return;
            const rawSpec: string = path.node.source.value;
            if (rawSpec.startsWith(".") || rawSpec.startsWith("@/")) {
              const resolved = resolveRelativePath(normalized, rawSpec);
              const target = findProjectFile(files, resolved);
              if (target) {
                path.node.source = t.stringLiteral(`@vyvo-local/${normalizePath(target.path)}`);
                childLocalImports.push(target.path);
              }
            } else if (!rawSpec.startsWith("http") && !importMap[rawSpec]) {
              importMap[rawSpec] = buildEsmUrl(rawSpec, dependencies);
            }
          },
        },
      };
    };

    try {
      const effectiveFilename = /\.(?:tsx|ts|jsx|js|mjs)$/i.test(normalized)
        ? normalized
        : isReactMode
        ? `${normalized}.tsx`
        : `${normalized}.ts`;

      const presets: Array<string | [string, Record<string, unknown>]> = [
        ["typescript", { isTSX: true, allExtensions: true }],
      ];
      if (isReactMode || /\.(?:tsx|jsx)$/i.test(effectiveFilename)) {
        presets.push(["react", { runtime: "automatic" }]);
      }

      const transformed = Babel.transform(sourceCode, {
        filename: effectiveFilename,
        presets,
        plugins: [importRewritePlugin, createLoopGuardPlugin()],
        sourceType: "module",
      });

      const outCode = transformed.code ?? "";
      importMap[virtualSpec] = toDataUriJs(outCode);
    } catch (err) {
      const e = err as Error & { loc?: { line?: number; column?: number } };
      return {
        ok: false,
        error: translateError(e.message || "Compilation error", {
          type: "compile",
          file: normalized,
          line: e.loc?.line,
          column: e.loc?.column,
        }),
      };
    }

    for (const childPath of childLocalImports) {
      const childResult = compileModule(childPath, false);
      if (!childResult.ok) return childResult;
    }

    return { ok: true, specifier: virtualSpec };
  }

  const entryRes = compileModule(entryFile, true);
  if (!entryRes.ok) {
    return { ok: false, error: entryRes.error };
  }

  // Extract any extra <head> links (like Google Fonts) if an index.html also exists alongside the React files
  let extraHead = "";
  const siblingHtml = files["index.html"] ?? files["public/index.html"];
  if (siblingHtml && !siblingHtml.isBinary) {
    const fontLinks = siblingHtml.content.match(/<link[^>]+href=["']https?:\/\/[^"']+["'][^>]*>/gi);
    if (fontLinks) extraHead += fontLinks.join("\n");
  }

  const tailwindTag = usesTailwind
    ? `<script src="https://cdn.tailwindcss.com"></script>`
    : "";

  const baseStyles = `
    html, body { margin: 0; padding: 0; min-height: 100%; }
    ${!usesTailwind ? `body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif; -webkit-font-smoothing: antialiased; }` : ""}
    ${collectedCss.join("\n\n")}
  `;

  const bootstrapScript = isReactMode
    ? selfMounts
      ? `<script type="module">
import ${JSON.stringify(entryRes.specifier)};
</script>`
      : `<script type="module">
import React from "react";
import { createRoot } from "react-dom/client";
import * as EntryModule from ${JSON.stringify(entryRes.specifier)};

class VyvoErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    if (window.__vyvoReportError) window.__vyvoReportError(error);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

const Component =
  EntryModule.default ||
  EntryModule.App ||
  EntryModule.Page ||
  EntryModule.Home ||
  Object.values(EntryModule).find((v) => typeof v === "function");

const rootEl = document.getElementById("root");
if (!Component) {
  if (window.__vyvoReportError) {
    window.__vyvoReportError(new Error("Could not find a React component to display. Make sure your code exports a component."));
  }
} else if (rootEl) {
  createRoot(rootEl).render(
    React.createElement(VyvoErrorBoundary, null, React.createElement(Component))
  );
}
</script>`
    : `<script type="module">
const __logs = [];
const __origLog = console.log;
console.log = function(...args) {
  __logs.push(args.map(a => typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)).join(" "));
  __origLog.apply(console, args);
};
await import(${JSON.stringify(entryRes.specifier)});
setTimeout(() => {
  const root = document.getElementById("root");
  const app = document.getElementById("app");
  const hasDom = (root && root.innerHTML.trim().length > 0) || (app && app.innerHTML.trim().length > 0) || document.body.children.length > 3;
  if (!hasDom && __logs.length > 0 && root) {
    root.style.cssText = "max-width:720px;margin:40px auto;padding:24px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#111114;color:#fafafa;border-radius:12px;border:1px solid #27272a;";
    root.innerHTML = "<div style='font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#10b981;margin-bottom:12px;font-family:system-ui,sans-serif;font-weight:600;'>Program Output</div><pre style='margin:0;white-space:pre-wrap;line-height:1.6;'>" +
      __logs.map(l => l.replace(/&/g,"&amp;").replace(/</g,"&lt;")).join("\\n") + "</pre>";
  }
}, 120);
</script>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  ${createRuntimeBridgeScript(runId)}
  ${extraHead}
  ${tailwindTag}
  <script type="importmap">
${JSON.stringify({ imports: importMap }, null, 2)}
  </script>
  <style>${baseStyles}</style>
</head>
<body>
  <div id="root"></div>
  <div id="app"></div>
  ${bootstrapScript}
</body>
</html>`;

  return {
    ok: true,
    html,
    requiresNetwork: isReactMode || usesTailwind || Object.keys(dependencies).length > 0,
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resolveAssetDataUrl(file: ProjectFile): string {
  if (file.content.startsWith("data:")) return file.content;
  if (/\.svg$/i.test(file.path)) {
    return `data:image/svg+xml;base64,${toBase64Utf8(file.content)}`;
  }
  const mime = file.mimeType || "application/octet-stream";
  return `data:${mime};base64,${file.content}`;
}

/**
 * Compiles a single HTML page inside a single-file or multi-file HTML/CSS/JS project.
 */
function buildHtmlPage(
  pagePath: string,
  files: Record<string, ProjectFile>,
  runId: string,
  globalTailwind: boolean
): string {
  const pageFile = files[pagePath];
  let raw = pageFile ? pageFile.content : "";

  // Wrap fragments cleanly into a complete HTML5 document
  if (!isFullHtmlDocument(raw)) {
    raw = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Website</title>
</head>
<body>
${raw}
</body>
</html>`;
  }

  const inlinedCssPaths = new Set<string>();
  const inlinedJsPaths = new Set<string>();

  // 1. Inline local <link rel="stylesheet" href="...">
  raw = raw.replace(
    /<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>|<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*\/?>/gi,
    (fullMatch, href1, href2) => {
      const href = (href1 || href2 || "").trim();
      if (!href || /^https?:\/\/|^\/\//i.test(href)) return fullMatch;
      const resolved = resolveRelativePath(pagePath, href.split("?")[0]);
      const target = findProjectFile(files, resolved);
      if (!target || target.isBinary) return fullMatch;
      inlinedCssPaths.add(target.path);
      return `<style data-vyvo-file="${escapeHtml(target.path)}">\n${target.content}\n</style>`;
    }
  );

  // 2. Inline local <script src="..."></script>
  raw = raw.replace(
    /<script\b([^>]*)src=["']([^"']+)["']([^>]*)>\s*<\/script>/gi,
    (fullMatch, before, src, after) => {
      const cleanSrc = src.trim();
      if (!cleanSrc || /^https?:\/\/|^\/\//i.test(cleanSrc)) return fullMatch;
      const resolved = resolveRelativePath(pagePath, cleanSrc.split("?")[0]);
      const target = findProjectFile(files, resolved);
      if (!target || target.isBinary) return fullMatch;
      inlinedJsPaths.add(target.path);
      const attrs = `${before} ${after}`.trim();
      return `<script ${attrs} data-vyvo-file="${escapeHtml(target.path)}">\n${escapeScriptClose(target.content)}\n</script>`;
    }
  );

  // 3. Inline local binary/image references in src="..." and url(...)
  raw = raw.replace(/\bsrc=["']([^"']+)["']/gi, (fullMatch, src) => {
    if (/^(?:https?:|data:|blob:|\/\/)/i.test(src)) return fullMatch;
    const resolved = resolveRelativePath(pagePath, src.split("?")[0]);
    const target = findProjectFile(files, resolved);
    if (!target || (!target.isBinary && !/\.svg$/i.test(target.path))) return fullMatch;
    return `src="${resolveAssetDataUrl(target)}"`;
  });

  // 4. Auto-attach unlinked sibling CSS and JS files (crucial when AI outputs separate HTML, CSS, and JS blocks!)
  const extraStyles: string[] = [];
  const extraScripts: string[] = [];
  for (const file of Object.values(files)) {
    if (file.isBinary) continue;
    if (/\.css$/i.test(file.path) && !inlinedCssPaths.has(file.path)) {
      extraStyles.push(`<style data-vyvo-auto="${escapeHtml(file.path)}">\n${file.content}\n</style>`);
    } else if (/\.(?:js|mjs)$/i.test(file.path) && !inlinedJsPaths.has(file.path)) {
      extraScripts.push(
        `<script data-vyvo-auto="${escapeHtml(file.path)}">\n${escapeScriptClose(file.content)}\n</script>`
      );
    }
  }

  // 5. Inject runtime bridge + optional Tailwind + unlinked CSS into <head>
  const needsTailwind =
    (globalTailwind || detectTailwindUsage(raw)) && !/tailwindcss/i.test(raw);
  const headInjection = [
    createRuntimeBridgeScript(runId),
    needsTailwind ? `<script src="https://cdn.tailwindcss.com"></script>` : "",
    ...extraStyles,
  ]
    .filter(Boolean)
    .join("\n");

  if (/<head[^>]*>/i.test(raw)) {
    raw = raw.replace(/<head[^>]*>/i, (m) => `${m}\n${headInjection}`);
  } else if (/<html[^>]*>/i.test(raw)) {
    raw = raw.replace(/<html[^>]*>/i, (m) => `${m}\n<head>${headInjection}</head>`);
  } else {
    raw = `${headInjection}\n${raw}`;
  }

  // 6. Inject unlinked JS before </body>
  if (extraScripts.length > 0) {
    const jsBlock = extraScripts.join("\n");
    if (/<\/body>/i.test(raw)) {
      raw = raw.replace(/<\/body>/i, `${jsBlock}\n</body>`);
    } else {
      raw += `\n${jsBlock}`;
    }
  }

  return raw;
}

function bundleCssShowcase(detection: DetectionResult, runId: string): BundleResult {
  const cssContent = Object.values(detection.files)
    .filter((f) => !f.isBinary)
    .map((f) => f.content)
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CSS Preview</title>
  ${createRuntimeBridgeScript(runId)}
  <style>${cssContent}</style>
</head>
<body>
  <main class="container card wrapper" style="max-width:720px;margin:48px auto;padding:32px;">
    <h1>CSS Style Preview</h1>
    <p>You pasted CSS styling rules without HTML structure, so VYVO generated a sample layout to preview your styles.</p>
    <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;">
      <button class="btn button primary">Primary Button</button>
      <a href="#demo" class="link">Sample Link</a>
    </div>
  </main>
</body>
</html>`;

  return { ok: true, html, requiresNetwork: false };
}

/**
 * Main execution bundler entry point.
 * Transforms any detected project into a runnable, isolated sandbox HTML document.
 */
export function bundleProject(detection: DetectionResult, runId: string): BundleResult {
  if (detection.kind === "unsupported" && detection.unsupported) {
    return {
      ok: false,
      error: {
        type: "unsupported",
        title: detection.unsupported.headline,
        friendlyMessage: detection.unsupported.explanation,
        rawMessage: `Unsupported language: ${detection.unsupported.language}`,
        suggestion: detection.unsupported.suggestion,
      },
    };
  }

  if (detection.kind === "css") {
    return bundleCssShowcase(detection, runId);
  }

  const entryFileObj = detection.files[detection.entryFile];
  const isHtmlEntry =
    detection.entryFile && /\.html?$/i.test(detection.entryFile) &&
    !(entryFileObj && detectReactCode(entryFileObj.content));

  if (isHtmlEntry || detection.kind === "html") {
    const htmlFiles = Object.keys(detection.files).filter((p) => /\.html?$/i.test(p));
    const pageHtmlMap: Record<string, string> = {};
    for (const page of htmlFiles) {
      pageHtmlMap[page] = buildHtmlPage(page, detection.files, runId, detection.usesTailwind);
    }
    const activePage = pageHtmlMap[detection.entryFile]
      ? detection.entryFile
      : htmlFiles[0] ?? "index.html";
    const html =
      pageHtmlMap[activePage] ??
      buildHtmlPage(detection.entryFile, detection.files, runId, detection.usesTailwind);

    return {
      ok: true,
      html,
      pageHtmlMap,
      activePage,
      requiresNetwork: detection.usesTailwind,
    };
  }

  // React, JSX, TSX, TypeScript, JavaScript, or Multi-File React apps
  return bundleReactOrTsProject(detection, runId);
}
