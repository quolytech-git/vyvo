import { describe, expect, it } from "vitest";
import { attemptLocalRepair } from "@/lib/localRepair";
import { translateError } from "@/lib/errorTranslator";

describe("Local Auto-Repair & Error Translation", () => {
  it("translates ReferenceError into plain English", () => {
    const err = translateError("useState is not defined");
    expect(err.friendlyMessage).toContain("useState");
    expect(err.title).toContain("missing");
  });

  it("repairs missing React hook import locally", () => {
    const files = {
      "App.tsx": {
        path: "App.tsx",
        content: `export default function App() { const [x] = useState(1); return <div>{x}</div>; }`,
      },
    };
    const err = translateError("useState is not defined");
    const proposal = attemptLocalRepair(files, "App.tsx", err);

    expect(proposal).not.toBeNull();
    expect(proposal?.fixedFiles["App.tsx"]).toContain('import { useState } from "react"');
  });

  it("repairs truncated HTML tags", () => {
    const files = {
      "index.html": {
        path: "index.html",
        content: `<!DOCTYPE html><html><body><h1>Hi</h1><script>console.log(1)`,
      },
    };
    const err = translateError("Unexpected end of input", { type: "compile" });
    const proposal = attemptLocalRepair(files, "index.html", err);

    expect(proposal).not.toBeNull();
    expect(proposal?.fixedFiles["index.html"]).toContain("</script>");
    expect(proposal?.fixedFiles["index.html"]).toContain("</body>");
  });

  it("repairs while(true) infinite loops after timeout", () => {
    const files = {
      "script.js": {
        path: "script.js",
        content: `while (true) { console.log("loop"); }`,
      },
    };
    const err = translateError("Execution timed out (possible infinite loop)", { type: "timeout" });
    const proposal = attemptLocalRepair(files, "script.js", err);

    expect(proposal).not.toBeNull();
    expect(proposal?.fixedFiles["script.js"]).not.toContain("while (true)");
  });
});
