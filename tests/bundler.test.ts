import { describe, expect, it } from "vitest";
import { recognizePastedCode, recognizeProjectFiles } from "@/lib/codeRecognizer";
import { bundleProject } from "@/lib/bundler";

describe("VYVO Execution Bundler", () => {
  it("bundles HTML + unlinked CSS + JS blocks into one runnable HTML document", () => {
    const pasted = `
\`\`\`html
<h1>Counter</h1><button id="btn">0</button>
\`\`\`
\`\`\`css
button { padding: 12px; }
\`\`\`
\`\`\`js
document.getElementById("btn").onclick = () => {};
\`\`\``;
    const detection = recognizePastedCode(pasted);
    const result = bundleProject(detection, "test-run-1");

    expect(result.ok).toBe(true);
    expect(result.html).toContain("vyvo-sandbox");
    expect(result.html).toContain("button { padding: 12px; }");
    expect(result.html).toContain('document.getElementById("btn").onclick');
  });

  it("compiles React TSX with missing hook imports, Tailwind, and loop guards", () => {
    const tsx = `function ClickCounter() {
  const [count, setCount] = useState<number>(0);
  for (let i = 0; i < 3; i++) {}
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 flex items-center">
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
    </div>
  );
}`;
    const detection = recognizePastedCode(tsx);
    const result = bundleProject(detection, "test-run-2");

    expect(result.ok).toBe(true);
    expect(result.html).toContain('<script type="importmap">');
    expect(result.html).toContain("https://esm.sh/react@18.3.1");
    expect(result.html).toContain("https://cdn.tailwindcss.com");
    expect(result.html).toContain("VyvoErrorBoundary");

    // Verify compiled data URI contains loop guard and transpiled JSX
    const dataUriMatch = result.html?.match(
      /"@vyvo-local\/App\.tsx":\s*"data:text\/javascript;base64,([^"]+)"/
    );
    expect(dataUriMatch).toBeTruthy();
    const decoded = Buffer.from(dataUriMatch![1], "base64").toString("utf-8");
    expect(decoded).toContain("__vyvoTick");
    expect(decoded).toContain("export default ClickCounter");
    expect(decoded).toContain("useState");
  });

  it("resolves multi-file React local imports and CSS imports", () => {
    const detection = recognizeProjectFiles({
      "src/App.tsx": {
        path: "src/App.tsx",
        content: `import React from "react";
import "./styles.css";
import { Greeting } from "./components/Greeting";
export default function App() { return <Greeting name="VYVO" />; }`,
      },
      "src/components/Greeting.tsx": {
        path: "src/components/Greeting.tsx",
        content: `import React from "react";
export function Greeting({ name }: { name: string }) { return <h1>Hello {name}</h1>; }`,
      },
      "src/styles.css": {
        path: "src/styles.css",
        content: `body { background: #111; color: #fff; }`,
      },
    });

    const result = bundleProject(detection, "test-run-3");
    expect(result.ok).toBe(true);
    expect(result.html).toContain("@vyvo-local/src/App.tsx");
    expect(result.html).toContain("@vyvo-local/src/components/Greeting.tsx");
    expect(result.html).toContain("body { background: #111; color: #fff; }");
  });

  it("builds multi-page HTML map for relative page links", () => {
    const detection = recognizeProjectFiles({
      "index.html": {
        path: "index.html",
        content: `<!DOCTYPE html><html><body><h1>Home</h1><a href="about.html">About</a></body></html>`,
      },
      "about.html": {
        path: "about.html",
        content: `<!DOCTYPE html><html><body><h1>About Page</h1><a href="index.html">Back</a></body></html>`,
      },
    });

    const result = bundleProject(detection, "test-run-4");
    expect(result.ok).toBe(true);
    expect(result.pageHtmlMap?.["index.html"]).toContain("Home");
    expect(result.pageHtmlMap?.["about.html"]).toContain("About Page");
  });

  it("reports friendly compile errors for broken JSX syntax", () => {
    const broken = `import React from "react";
export default function App() {
  return <div><h1>Unclosed;
}`;
    const detection = recognizePastedCode(broken);
    const result = bundleProject(detection, "test-run-5");
    expect(result.ok).toBe(false);
    expect(result.error?.type).toBe("compile");
    expect(result.error?.friendlyMessage.length).toBeGreaterThan(10);
  });

  it("auto-heals truncated HTML scripts and preserves $ characters in HTML/JS", () => {
    const truncatedHtml = `<!DOCTYPE html>
<html>
<head><title>Framer Site</title><style>.reveal { opacity: 0; }</style></head>
<body>
  <h1 class="reveal">Price: $& $' $\` $100</h1>
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      const price = "$100";
      console.log(price);
      const cutOffLine = 
  `;
    const detection = recognizePastedCode(truncatedHtml);
    const result = bundleProject(detection, "test-run-6");
    expect(result.ok).toBe(true);
    expect(result.html).toContain("Price: $& $' $` $100");
    expect(result.html).toContain("</script>");
    expect(result.html).toContain("ensureRevealed");
  });
});
