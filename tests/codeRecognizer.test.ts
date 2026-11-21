import { describe, expect, it } from "vitest";
import { recognizePastedCode } from "@/lib/codeRecognizer";

describe("Automatic Code Recognition", () => {
  it("recognizes a complete HTML document directly", () => {
    const html = `<!DOCTYPE html>
<html>
<head><title>My Bakery</title></head>
<body><h1>Hello VYVO!</h1></body>
</html>`;
    const result = recognizePastedCode(html);
    expect(result.kind).toBe("html");
    expect(result.entryFile).toBe("index.html");
    expect(result.title).toBe("My Bakery");
    expect(result.files["index.html"].content).toContain("Hello VYVO!");
  });

  it("extracts code cleanly when user copies surrounding ChatGPT/Claude prose", () => {
    const pasted = `Sure! Here is a website for your coffee shop:

\`\`\`html
<!DOCTYPE html>
<html>
<head><title>Bean & Bloom</title></head>
<body><h1>Welcome</h1></body>
</html>
\`\`\`

Let me know if you want to change the colors!`;

    const result = recognizePastedCode(pasted);
    expect(result.kind).toBe("html");
    expect(result.title).toBe("Bean & Bloom");
    expect(result.files["index.html"].content).not.toContain("Sure! Here is");
    expect(result.files["index.html"].content).toContain("<h1>Welcome</h1>");
  });

  it("combines separate HTML, CSS, and JS blocks from one AI response", () => {
    const pasted = `Here are the three files you need:

### index.html
\`\`\`html
<div id="box">Hello</div>
\`\`\`

### styles.css
\`\`\`css
#box { color: emerald; }
\`\`\`

### script.js
\`\`\`js
document.getElementById("box").textContent = "Updated!";
\`\`\``;

    const result = recognizePastedCode(pasted);
    expect(Object.keys(result.files)).toEqual(
      expect.arrayContaining(["index.html", "styles.css", "script.js"])
    );
    expect(result.entryFile).toBe("index.html");
  });

  it("recognizes React + TypeScript (TSX) components with Tailwind and npm imports", () => {
    const tsx = `import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface Item { id: number; label: string }

export default function TodoDashboard() {
  const [items, setItems] = useState<Item[]>([]);
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 flex items-center justify-center">
      <Sparkles /> {items.length}
    </div>
  );
}`;
    const result = recognizePastedCode(tsx);
    expect(result.kind).toBe("react");
    expect(result.entryFile).toBe("App.tsx");
    expect(result.usesTailwind).toBe(true);
    expect(result.dependencies["lucide-react"]).toBeDefined();
    expect(result.title).toBe("Todo Dashboard");
  });

  it("identifies unsupported backend languages clearly without false positives", () => {
    const py = `from flask import Flask
app = Flask(__name__)

@app.route("/")
def hello():
    return "Hello World"

if __name__ == "__main__":
    app.run()`;

    const result = recognizePastedCode(py);
    expect(result.kind).toBe("unsupported");
    expect(result.unsupported?.language).toBe("Python");
    expect(result.unsupported?.suggestion).toContain("HTML");
  });

  it("identifies Express backend server code as unsupported", () => {
    const express = `const express = require('express');
const app = express();
app.get('/api/users', (req, res) => res.json([]));
app.listen(3000);`;

    const result = recognizePastedCode(express);
    expect(result.kind).toBe("unsupported");
    expect(result.unsupported?.language).toContain("Backend");
  });

  it("decodes HTML entities like &apos; when extracting website titles", () => {
    const jsx = `import React from 'react';
export default function App() {
  return <h1>Today&apos;s Workspace &amp; Notes</h1>;
}`;
    const result = recognizePastedCode(jsx);
    expect(result.title).toBe("Today's Workspace & Notes");
  });
});
