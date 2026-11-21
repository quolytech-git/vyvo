import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import {
  EMPTY_PROMPT_DATA,
  SAMPLE_PROMPT_DATA,
  buildFilledFilesText,
  buildFullMasterPrompt,
  buildIndividualFiles,
  exportPromptBriefAsZip,
  getCompletionStats,
} from "@/lib/masterPrompt";

describe("Master Prompt Builder", () => {
  it("fills empty gaps automatically with DEFAULT / NONE and preserves all 7 files", () => {
    const files = buildIndividualFiles(EMPTY_PROMPT_DATA);
    expect(Object.keys(files)).toEqual([
      "brand.txt",
      "content.txt",
      "pages.txt",
      "assets.txt",
      "contact-seo.txt",
      "references.txt",
      "motion.txt",
    ]);

    expect(files["brand.txt"]).toContain("Business / person name: DEFAULT");
    expect(files["brand.txt"]).toContain("Theme: DEFAULT");
    expect(files["content.txt"]).toContain("Headline (3-8 words): DEFAULT");
    expect(files["pages.txt"]).toContain("[x] Hero");
    expect(files["pages.txt"]).toContain("[ ] Work");
    expect(files["motion.txt"]).toContain("Amount: subtle (recommended)");
  });

  it("populates user answers accurately into all 7 files and full master prompt", () => {
    const full = buildFullMasterPrompt(SAMPLE_PROMPT_DATA);
    expect(full).toContain("PART 0 — YOUR ROLE AND GOAL");
    expect(full).toContain("PART 9 — SELF-REVIEW CHECKLIST");
    expect(full).toContain("PART 10 — OUTPUT INSTRUCTIONS");
    expect(full).toContain("===== FILE: brand.txt =====");
    expect(full).toContain("Business / person name: Northwind Studio");
    expect(full).toContain("primary #0F3D2E | accent #D4FF5A");
    expect(full).toContain("Climate brands, built to scale.");
    expect(full).toContain("[x] Work");
    expect(full).toContain("Email: hello@northwind.studio");
    expect(full).toContain("Dark/light toggle: yes");

    const stats = getCompletionStats(SAMPLE_PROMPT_DATA);
    expect(stats.totalFilled).toBeGreaterThan(15);
  });

  it("exports MASTER-PROMPT.txt and all 7 filled files into a ZIP archive", async () => {
    const blob = await exportPromptBriefAsZip(SAMPLE_PROMPT_DATA);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    expect(zip.files["MASTER-PROMPT.txt"]).toBeDefined();
    expect(zip.files["brand.txt"]).toBeDefined();
    expect(zip.files["motion.txt"]).toBeDefined();
    expect(zip.files["README.txt"]).toBeDefined();

    const filesOnly = buildFilledFilesText(SAMPLE_PROMPT_DATA);
    expect(filesOnly).toContain("===== FILE: motion.txt =====");
  });
});
