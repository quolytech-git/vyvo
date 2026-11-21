import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { createShareUrl, parseShareHash } from "@/lib/shareUtils";
import { exportProjectAsZip, importZipFile } from "@/lib/zipUtils";
import type { Project } from "@/lib/types";

describe("ZIP Import/Export & Share URLs", () => {
  const sampleProject: Project = {
    id: "proj-1",
    name: "Demo Site",
    entryFile: "index.html",
    rawInput: "<!DOCTYPE html><html><body><h1>Hello Share</h1></body></html>",
    detectedKind: "html",
    files: {
      "index.html": {
        path: "index.html",
        content: "<!DOCTYPE html><html><body><h1>Hello Share</h1></body></html>",
      },
      "styles.css": {
        path: "styles.css",
        content: "h1 { color: green; }",
      },
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  it("round-trips a project through a compressed share link", () => {
    const created = createShareUrl(sampleProject, "https://vyvo.app");
    expect("url" in created).toBe(true);
    if (!("url" in created)) return;

    const hash = new URL(created.url).hash;
    const restored = parseShareHash(hash);

    expect(restored).not.toBeNull();
    expect(restored?.name).toBe("Demo Site");
    expect(restored?.files["index.html"].content).toContain("Hello Share");
    expect(restored?.files["styles.css"].content).toContain("color: green");
  });

  it("exports a ZIP and cleanly imports it back", async () => {
    const blob = await exportProjectAsZip(sampleProject);
    const buffer = await blob.arrayBuffer();
    const loadedZip = await JSZip.loadAsync(buffer);
    expect(loadedZip.files["index.html"]).toBeDefined();
    expect(loadedZip.files["README.txt"]).toBeDefined();

    const imported = await importZipFile(buffer);
    expect(imported.files["index.html"].content).toContain("Hello Share");
    expect(imported.files["styles.css"].content).toContain("color: green");
  });
});
