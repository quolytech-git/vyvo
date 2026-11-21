import { triggerBlobDownload } from "./zipUtils";

/**
 * Generates a complete, self-contained, double-clickable standalone VYVO Desktop/Portable App
 * (VYVO-App.html) so users can download and open VYVO directly from their Desktop or Downloads
 * folder on any computer or device — even without a server running.
 */
export function buildStandaloneVyvoAppHtml(appOrigin = ""): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>VYVO — From AI Code to Reality</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none'%3E%3Crect width='64' height='64' rx='14' fill='%2309090B'/%3E%3Cpolygon points='14,17 23.5,17 36.5,47 27.5,47' fill='%23FAFAFA'/%3E%3Cpolygon points='40.5,17 50,17 36.5,47 32,36.5' fill='%2310B981'/%3E%3C/svg%3E" />
  <style>
    :root {
      --bg: #09090b; --surface: #111114; --surface-2: #18181c; --hover: #202026;
      --border: #232329; --border-strong: #32323b;
      --ink: #fafafa; --ink-2: #a1a1aa; --ink-3: #71717a;
      --accent: #10b981; --accent-hover: #34d399; --accent-ink: #031a11;
    }
    html.light {
      --bg: #fafafa; --surface: #ffffff; --surface-2: #f4f4f5; --hover: #e4e4e7;
      --border: #e4e4e7; --border-strong: #d4d4d8;
      --ink: #09090b; --ink-2: #52525b; --ink-3: #71717a;
      --accent: #059669; --accent-hover: #047857; --accent-ink: #ffffff;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      height: 100%; background: var(--bg); color: var(--ink);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .app { min-height: 100dvh; display: flex; flex-direction: column; }
    header {
      height: 60px; max-width: 1040px; width: 100%; margin: 0 auto; padding: 0 20px;
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
    }
    .logo {
      display: inline-flex; align-items: center; gap: 10px;
      font-weight: 800; font-size: 1.15rem; letter-spacing: -0.04em;
      background: none; border: 0; color: var(--ink); cursor: pointer;
    }
    .btn {
      height: 36px; padding: 0 12px; border-radius: 10px;
      border: 1px solid var(--border); background: var(--surface); color: var(--ink);
      font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;
      cursor: pointer; transition: background .15s, border-color .15s; text-decoration: none;
    }
    .btn:hover { background: var(--hover); border-color: var(--border-strong); }
    .btn-primary {
      background: var(--accent); color: var(--accent-ink); border-color: var(--accent); font-weight: 700;
    }
    .btn-primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); }
    main {
      flex: 1; display: flex; flex-direction: column; justify-content: center;
      max-width: 760px; width: 100%; margin: 0 auto; padding: 16px 20px 48px;
    }
    h1 {
      text-align: center; font-size: clamp(1.8rem, 4.2vw, 2.75rem);
      font-weight: 800; letter-spacing: -0.035em; line-height: 1.12;
    }
    h1 span { color: var(--accent); }
    .sub {
      text-align: center; color: var(--ink-2); font-size: 1rem;
      max-width: 540px; margin: 12px auto 28px; line-height: 1.55;
    }
    .card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 18px;
      overflow: hidden;
    }
    .card-bar {
      padding: 10px 14px; border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;
    }
    textarea {
      width: 100%; height: 270px; padding: 18px; background: transparent; border: 0;
      color: var(--ink); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 13px; line-height: 1.6; resize: none; outline: none;
    }
    .run-wrap { margin-top: 18px; display: flex; flex-direction: column; align-items: center; }
    .run-btn {
      width: min(320px, 100%); height: 54px; border-radius: 14px; border: 0;
      background: var(--accent); color: var(--accent-ink);
      font-size: 15px; font-weight: 800; letter-spacing: -0.01em;
      cursor: pointer; transition: background .15s, transform .1s;
    }
    .run-btn:hover { background: var(--accent-hover); }
    .run-btn:active { transform: scale(0.99); }
    .note { margin-top: 12px; font-size: 12px; color: var(--ink-3); text-align: center; }
    #previewView { display: none; height: 100dvh; flex-direction: column; }
    .preview-bar {
      height: 52px; padding: 0 14px; background: var(--surface); border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
    }
    .stage { flex: 1; display: flex; min-height: 0; position: relative; }
    #editorPane {
      display: none; width: 42%; min-width: 300px; height: 100%;
      border-right: 1px solid var(--border); background: var(--surface); flex-direction: column;
    }
    #editorPane textarea { height: 100%; flex: 1; }
    iframe { flex: 1; width: 100%; height: 100%; border: 0; background: #fff; }
  </style>
</head>
<body>
  <div class="app" id="homeView">
    <header>
      <button class="logo" onclick="showHome()">
        <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
          <rect width="64" height="64" rx="14" fill="#09090B"/>
          <rect x="1" y="1" width="62" height="62" rx="13" stroke="#27272A" stroke-width="2"/>
          <polygon points="14,17 23.5,17 36.5,47 27.5,47" fill="#FAFAFA"/>
          <polygon points="40.5,17 50,17 36.5,47 32,36.5" fill="#10B981"/>
        </svg>
        <span>VYVO</span>
      </button>
      <div style="display:flex;align-items:center;gap:8px;">
        ${appOrigin ? `<a class="btn" href="${appOrigin}" target="_blank" rel="noopener">Open Web App</a>` : ""}
        <button class="btn" onclick="toggleTheme()" id="themeBtn">Light / Dark</button>
      </div>
    </header>

    <main>
      <h1>Your AI wrote the code. <span>VYVO</span> brings it to life.</h1>
      <p class="sub">Copy code from any AI, paste it here, and instantly see your website. No coding skills required.</p>

      <div class="card">
        <div class="card-bar">
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn" onclick="loadExample()">Try an example</button>
            <button class="btn" onclick="pasteClip()">Paste from clipboard</button>
            <button class="btn" onclick="clearCode()">Clear code</button>
          </div>
        </div>
        <textarea id="codeInput" placeholder="Paste your AI-generated code here..." spellcheck="false"></textarea>
      </div>

      <div class="run-wrap">
        <button class="run-btn" onclick="runWebsite()">RUN MY WEBSITE →</button>
        <p class="note">Works with ChatGPT, Claude, Gemini and more.</p>
      </div>
    </main>
  </div>

  <div id="previewView">
    <div class="preview-bar">
      <div style="display:flex;align-items:center;gap:10px;">
        <button class="btn" onclick="showHome()">← Back</button>
        <span style="width:8px;height:8px;border-radius:99px;background:var(--accent);"></span>
        <strong id="siteTitle" style="font-size:13px;">My Website</strong>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
        <button class="btn" onclick="runWebsite()">Refresh</button>
        <button class="btn" onclick="toggleEditor()">Edit Code</button>
        <button class="btn" onclick="goFullscreen()">Full Screen</button>
        <button class="btn btn-primary" onclick="downloadHtml()">Download Website</button>
      </div>
    </div>
    <div class="stage">
      <div id="editorPane">
        <div style="padding:8px 12px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12px;font-weight:700;color:var(--ink-2);">EDIT CODE</span>
          <button class="btn btn-primary" onclick="applyEditor()">Update Preview</button>
        </div>
        <textarea id="editorArea" spellcheck="false"></textarea>
      </div>
      <iframe id="previewFrame" sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads"></iframe>
    </div>
  </div>

  <script>
    const input = document.getElementById("codeInput");
    const editorArea = document.getElementById("editorArea");
    const frame = document.getElementById("previewFrame");
    let currentHtml = "";

    try { input.value = localStorage.getItem("vyvo_portable_draft") || ""; } catch (e) {}
    input.addEventListener("input", () => {
      try { localStorage.setItem("vyvo_portable_draft", input.value); } catch (e) {}
    });

    function toggleTheme() {
      document.documentElement.classList.toggle("light");
      document.documentElement.classList.toggle("dark");
    }

    async function pasteClip() {
      try {
        const t = await navigator.clipboard.readText();
        if (t) { input.value = t; localStorage.setItem("vyvo_portable_draft", t); }
      } catch (e) { input.focus(); }
    }

    function clearCode() {
      input.value = "";
      try { localStorage.removeItem("vyvo_portable_draft"); } catch (e) {}
      input.focus();
    }

    function loadExample() {
      input.value = \`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Solstice Studio</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; background: #09090b; color: #fafafa; display: grid; place-items: center; min-height: 100vh; text-align: center; padding: 24px; }
    .card { max-width: 520px; background: #111114; border: 1px solid #27272a; border-radius: 20px; padding: 40px; }
    h1 { font-size: 2.2rem; letter-spacing: -0.03em; margin: 0 0 12px; }
    p { color: #a1a1aa; line-height: 1.6; margin: 0 0 24px; }
    button { background: #10b981; color: #031a11; border: 0; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 15px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Your Website Is Live</h1>
    <p>Running directly inside your downloaded VYVO Desktop App.</p>
    <button onclick="this.textContent = 'Clicked! ✨'">Test Interaction</button>
  </div>
</body>
</html>\`;
      runWebsite();
    }

    function extractRunnableHtml(raw) {
      let code = raw.trim();
      const docMatch = code.match(/<!doctype\\s+html[^>]*>|<html[\\s>]/i);
      if (docMatch && docMatch.index !== undefined) {
        const end = code.toLowerCase().lastIndexOf("</html>");
        code = end > docMatch.index ? code.slice(docMatch.index, end + 7) : code.slice(docMatch.index);
        code = code.replace(/^[ \\t]*\`\`\`[\\w-]*[ \\t]*$/gm, "").trim();
        return code;
      }
      const fence = code.match(/\`\`\`(?:[a-zA-Z0-9_-]*)\\s*\\n([\\s\\S]*?)\`\`\`/);
      if (fence) code = fence[1].trim();
      if (/^<!doctype\\s+html|^<html/i.test(code)) return code;
      return \`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>\${code}</body></html>\`;
    }

    function runWebsite() {
      const raw = input.value.trim();
      if (!raw) { input.focus(); return; }
      currentHtml = extractRunnableHtml(raw);
      editorArea.value = raw;
      const titleMatch = currentHtml.match(/<title[^>]*>([^<]+)<\\/title>/i);
      document.getElementById("siteTitle").textContent = titleMatch ? titleMatch[1].trim() : "My Website";
      document.getElementById("homeView").style.display = "none";
      document.getElementById("previewView").style.display = "flex";
      frame.srcdoc = currentHtml;
    }

    function showHome() {
      document.getElementById("previewView").style.display = "none";
      document.getElementById("homeView").style.display = "flex";
    }

    function toggleEditor() {
      const pane = document.getElementById("editorPane");
      pane.style.display = pane.style.display === "flex" ? "none" : "flex";
    }

    function applyEditor() {
      input.value = editorArea.value;
      runWebsite();
    }

    function goFullscreen() {
      if (frame.requestFullscreen) frame.requestFullscreen();
    }

    function downloadHtml() {
      const blob = new Blob([currentHtml || input.value], { type: "text/html;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "index.html";
      a.click();
    }
  </script>
</body>
</html>`;
}

export function downloadStandaloneVyvoApp(): void {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const html = buildStandaloneVyvoAppHtml(origin);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  triggerBlobDownload(blob, "VYVO-App.html");
}
