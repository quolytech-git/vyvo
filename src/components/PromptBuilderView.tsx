"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Download,
  FileText,
  Mail,
  Palette,
  RotateCcw,
  Sparkles,
  Wand2,
} from "lucide-react";
import {
  COLOR_PRESETS,
  CORNERS,
  EMPTY_PROMPT_DATA,
  FONT_STYLES,
  FORM_OPTIONS,
  LANGUAGES,
  MAIN_GOALS,
  MOODS,
  MOTION_LEVELS,
  SAMPLE_PROMPT_DATA,
  SECTION_LABELS,
  THEMES,
  TONES,
  WEBSITE_TYPES,
  buildFilledFilesText,
  buildFullMasterPrompt,
  buildIndividualFiles,
  exportPromptBriefAsZip,
  getCompletionStats,
  sectionsForType,
  type PromptBuilderData,
  type SectionKey,
} from "@/lib/masterPrompt";
import { loadPromptDraft, savePromptDraft } from "@/lib/storage";
import { triggerBlobDownload } from "@/lib/zipUtils";

interface PromptBuilderViewProps {
  onBackHome: () => void;
  onGoPasteCode: () => void;
  onNotify: (message: string) => void;
}

type StepId = "basics" | "style" | "content" | "contact" | "output";

interface StepMeta {
  id: StepId;
  shortLabel: string;
  title: string;
  subtitle: string;
  filesHint?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepMeta[] = [
  {
    id: "basics",
    shortLabel: "1. Basics",
    title: "About Your Website",
    subtitle: "Pick from the dropdowns and fill in only what you know. Everything is optional.",
    filesHint: "brand.txt",
    icon: Sparkles,
  },
  {
    id: "style",
    shortLabel: "2. Style",
    title: "Look & Feel",
    subtitle: "Choose a vibe from the dropdowns — or leave any option on 'Let AI choose'.",
    filesHint: "brand.txt · motion.txt",
    icon: Palette,
  },
  {
    id: "content",
    shortLabel: "3. Content",
    title: "Sections & Content",
    subtitle: "Tap the sections you want. Leave the text boxes blank if you want the AI to write the words.",
    filesHint: "content.txt · pages.txt",
    icon: FileText,
  },
  {
    id: "contact",
    shortLabel: "4. Contact",
    title: "Contact & Language",
    subtitle: "All optional — skip anything you don't need right now.",
    filesHint: "contact-seo.txt · references.txt",
    icon: Mail,
  },
  {
    id: "output",
    shortLabel: "5. Copy Prompt",
    title: "Your Complete AI Prompt",
    subtitle: "Copy and paste into ChatGPT, Claude, or Gemini — then paste the index.html code back into VYVO.",
    icon: Wand2,
  },
];

function FieldLabel({
  htmlFor,
  label,
  optional = true,
}: {
  htmlFor: string;
  label: string;
  optional?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 mb-1.5">
      <label htmlFor={htmlFor} className="text-xs font-semibold text-[var(--ink)]">
        {label}
      </label>
      {optional && <span className="text-[11px] text-[var(--ink-muted)]">Optional</span>}
    </div>
  );
}

const inputCls =
  "w-full h-10 px-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--accent)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none transition";

const selectCls =
  "w-full h-10 px-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--accent)] text-sm text-[var(--ink)] focus:outline-none transition cursor-pointer";

const textareaCls =
  "w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--accent)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none resize-y leading-relaxed transition";

export function PromptBuilderView({
  onBackHome,
  onGoPasteCode,
  onNotify,
}: PromptBuilderViewProps) {
  const [data, setData] = useState<PromptBuilderData>(EMPTY_PROMPT_DATA);
  const [activeStep, setActiveStep] = useState<StepId>("basics");
  const [previewMode, setPreviewMode] = useState<"full" | "files">("full");
  const [copiedType, setCopiedType] = useState<"full" | "files" | null>(null);
  const [showMoreContact, setShowMoreContact] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const stepButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const saved = loadPromptDraft();
    if (saved && typeof saved === "object" && "websiteType" in saved) {
      setData({
        ...EMPTY_PROMPT_DATA,
        ...saved,
        sections: {
          ...EMPTY_PROMPT_DATA.sections,
          ...(saved.sections || {}),
        },
      });
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) savePromptDraft(data);
  }, [data, hydrated]);

  useEffect(() => {
    const el = stepButtonRefs.current[activeStep];
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeStep]);

  const stepIndex = STEPS.findIndex((s) => s.id === activeStep);
  const currentStepMeta = STEPS[stepIndex];

  const stats = useMemo(() => getCompletionStats(data), [data]);
  const individualFiles = useMemo(() => buildIndividualFiles(data), [data]);
  const fullPromptText = useMemo(() => buildFullMasterPrompt(data), [data]);
  const filesOnlyText = useMemo(() => buildFilledFilesText(data), [data]);

  function update<K extends keyof PromptBuilderData>(key: K, value: PromptBuilderData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function handleWebsiteTypeChange(nextType: string) {
    setData((prev) => ({
      ...prev,
      websiteType: nextType,
      sections: sectionsForType(nextType),
    }));
  }

  function toggleSection(key: SectionKey) {
    setData((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [key]: !prev.sections[key],
      },
    }));
  }

  async function handleCopy(kind: "full" | "files") {
    const text = kind === "full" ? fullPromptText : filesOnlyText;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(kind);
      onNotify(
        kind === "full"
          ? "Complete Master Prompt copied! Paste it into ChatGPT, Claude, or Gemini."
          : "All 7 filled files copied!"
      );
      setTimeout(() => setCopiedType(null), 2600);
    } catch {
      onNotify("Select the prompt text below and press Copy (Ctrl+C / ⌘C).");
    }
  }

  async function handleDownloadBriefZip() {
    try {
      const blob = await exportPromptBriefAsZip(data);
      const slug =
        data.businessName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || "website-prompt-brief";
      triggerBlobDownload(blob, `${slug}-prompt-files.zip`);
      onNotify("Downloaded MASTER-PROMPT.txt + all 7 input files (.zip)");
    } catch {
      onNotify("Could not generate the prompt ZIP.");
    }
  }

  function handleLoadSample() {
    setData(SAMPLE_PROMPT_DATA);
    onNotify("Loaded Northwind Studio example — copy right away or change any dropdown!");
  }

  function handleReset() {
    setData(EMPTY_PROMPT_DATA);
    onNotify("Reset all fields — skipped questions automatically use smart AI defaults.");
  }

  const activePreviewFile =
    activeStep === "basics" || activeStep === "style"
      ? "brand.txt"
      : activeStep === "content"
      ? "content.txt"
      : activeStep === "contact"
      ? "contact-seo.txt"
      : null;

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--bg)] text-[var(--ink)]">
      {/* Sticky Minimal Top Bar */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md safe-top safe-x">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onBackHome}
              className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg hover:bg-[var(--surface-hover)] text-xs font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink)] transition cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="h-4 w-px bg-[var(--border)] hidden sm:block" />
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-[var(--accent)] shrink-0" />
              <h1 className="text-sm font-bold tracking-tight truncate">
                AI Website Prompt Builder
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleLoadSample}
              className="h-8 px-2.5 rounded-lg text-xs font-medium bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--ink-secondary)] hover:text-[var(--ink)] transition cursor-pointer"
            >
              Load Example
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="h-8 px-2.5 rounded-lg text-xs font-medium hover:bg-[var(--surface-hover)] text-[var(--ink-muted)] hover:text-[var(--ink)] inline-flex items-center gap-1 transition cursor-pointer"
              title="Reset all answers"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopy("full")}
              className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] text-xs font-bold transition cursor-pointer"
            >
              {copiedType === "full" ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedType === "full" ? "Copied!" : "Copy Master Prompt"}</span>
            </button>
          </div>
        </div>

        {/* Simple 5-Step Pill Navigation */}
        <div className="border-t border-[var(--border)] bg-[var(--bg)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-1.5 overflow-x-auto">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === activeStep;
              return (
                <button
                  key={step.id}
                  ref={(node) => {
                    stepButtonRefs.current[step.id] = node;
                  }}
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 border transition cursor-pointer ${
                    isActive
                      ? "bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)]"
                      : step.id === "output"
                      ? "bg-[var(--surface)] border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--surface-hover)]"
                      : "bg-[var(--surface)] border-[var(--border)] text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{step.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 sm:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Primary Card */}
          <section className="lg:col-span-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-5 sm:p-7 animate-vyvo-in">
            <div className="pb-5 mb-6 border-b border-[var(--border)]">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--accent)]">
                  All fields optional — skipped questions auto-fill with DEFAULT
                </span>
                {currentStepMeta.filesHint && (
                  <span className="text-[11px] font-mono text-[var(--ink-muted)] hidden sm:inline">
                    {currentStepMeta.filesHint}
                  </span>
                )}
              </div>
              <h2 className="mt-2.5 text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--ink)]">
                {currentStepMeta.title}
              </h2>
              <p className="mt-1 text-sm text-[var(--ink-secondary)] leading-relaxed">
                {currentStepMeta.subtitle}
              </p>
            </div>

            {/* STEP 1: BASICS (4 simple questions) */}
            {activeStep === "basics" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="pb-type" label="What kind of website is it?" optional={false} />
                    <select
                      id="pb-type"
                      name="websiteType"
                      value={data.websiteType}
                      onChange={(e) => handleWebsiteTypeChange(e.target.value)}
                      className={selectCls}
                    >
                      {WEBSITE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <FieldLabel htmlFor="pb-goal" label="Main action for visitors" />
                    <select
                      id="pb-goal"
                      name="mainGoal"
                      value={data.mainGoal}
                      onChange={(e) => update("mainGoal", e.target.value)}
                      className={selectCls}
                    >
                      {MAIN_GOALS.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <FieldLabel htmlFor="pb-name" label="Business or personal name" />
                  <input
                    id="pb-name"
                    name="businessName"
                    type="text"
                    value={data.businessName}
                    onChange={(e) => update("businessName", e.target.value)}
                    placeholder="e.g. Northwind Studio (or leave blank for AI to invent one)"
                    className={inputCls}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="pb-what" label="What do you do? (1–2 short sentences)" />
                  <textarea
                    id="pb-what"
                    name="whatYouDo"
                    rows={3}
                    value={data.whatYouDo}
                    onChange={(e) => update("whatYouDo", e.target.value)}
                    placeholder="e.g. Fresh sourdough bakery in Austin with daily pastries and espresso..."
                    className={textareaCls}
                  />
                </div>
              </div>
            )}

            {/* STEP 2: STYLE (Pure dropdowns!) */}
            {activeStep === "style" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="pb-mood" label="Visual style & mood" />
                    <select
                      id="pb-mood"
                      name="mood"
                      value={data.mood}
                      onChange={(e) => update("mood", e.target.value)}
                      className={selectCls}
                    >
                      {MOODS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <FieldLabel htmlFor="pb-colors" label="Color palette" />
                    <select
                      id="pb-colors"
                      name="colorPreset"
                      value={data.colorPreset}
                      onChange={(e) => update("colorPreset", e.target.value)}
                      className={selectCls}
                    >
                      {COLOR_PRESETS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {data.colorPreset === "custom" && (
                    <>
                      <div>
                        <FieldLabel htmlFor="pb-primary" label="Primary color" />
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={/^#[0-9a-fA-F]{6}$/.test(data.primaryColor) ? data.primaryColor : "#0F3D2E"}
                            onChange={(e) => update("primaryColor", e.target.value.toUpperCase())}
                            aria-label="Primary color picker"
                            className="w-10 h-10 rounded-lg border border-[var(--border)] bg-transparent cursor-pointer shrink-0 p-0.5"
                          />
                          <input
                            id="pb-primary"
                            name="primaryColor"
                            type="text"
                            value={data.primaryColor}
                            onChange={(e) => update("primaryColor", e.target.value)}
                            placeholder="#0F3D2E"
                            className={inputCls}
                          />
                        </div>
                      </div>
                      <div>
                        <FieldLabel htmlFor="pb-accent" label="Accent color" />
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={/^#[0-9a-fA-F]{6}$/.test(data.accentColor) ? data.accentColor : "#D4FF5A"}
                            onChange={(e) => update("accentColor", e.target.value.toUpperCase())}
                            aria-label="Accent color picker"
                            className="w-10 h-10 rounded-lg border border-[var(--border)] bg-transparent cursor-pointer shrink-0 p-0.5"
                          />
                          <input
                            id="pb-accent"
                            name="accentColor"
                            type="text"
                            value={data.accentColor}
                            onChange={(e) => update("accentColor", e.target.value)}
                            placeholder="#D4FF5A"
                            className={inputCls}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <FieldLabel htmlFor="pb-font" label="Font pairing" />
                    <select
                      id="pb-font"
                      name="fontStyle"
                      value={data.fontStyle}
                      onChange={(e) => update("fontStyle", e.target.value)}
                      className={selectCls}
                    >
                      {FONT_STYLES.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <FieldLabel htmlFor="pb-theme" label="Light or dark theme" />
                    <select
                      id="pb-theme"
                      name="theme"
                      value={data.theme}
                      onChange={(e) => update("theme", e.target.value)}
                      className={selectCls}
                    >
                      {THEMES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <FieldLabel htmlFor="pb-tone" label="Tone of voice" />
                    <select
                      id="pb-tone"
                      name="tone"
                      value={data.tone}
                      onChange={(e) => update("tone", e.target.value)}
                      className={selectCls}
                    >
                      {TONES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <FieldLabel htmlFor="pb-corners" label="Corner roundness" />
                    <select
                      id="pb-corners"
                      name="corners"
                      value={data.corners}
                      onChange={(e) => update("corners", e.target.value)}
                      className={selectCls}
                    >
                      {CORNERS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <FieldLabel htmlFor="pb-motion" label="Animations & motion" />
                  <select
                    id="pb-motion"
                    name="motion"
                    value={data.motion}
                    onChange={(e) => update("motion", e.target.value)}
                    className={selectCls}
                  >
                    {MOTION_LEVELS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* STEP 3: CONTENT & SECTIONS */}
            {activeStep === "content" && (
              <div className="space-y-5">
                <div>
                  <span className="block text-xs font-semibold text-[var(--ink)] mb-2">
                    Sections to include (tap to toggle)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {SECTION_LABELS.map(({ key, label }) => {
                      const active = data.sections[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleSection(key)}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                            active
                              ? "bg-[var(--accent)]/12 border-[var(--accent)] text-[var(--ink)]"
                              : "bg-[var(--bg)] border-[var(--border)] text-[var(--ink-secondary)]"
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded flex items-center justify-center border ${
                              active
                                ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-ink)]"
                                : "border-[var(--border-strong)]"
                            }`}
                          >
                            {active && <Check className="w-3 h-3" strokeWidth={3} />}
                          </span>
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <FieldLabel htmlFor="pb-headline" label="Main hero headline" />
                  <input
                    id="pb-headline"
                    name="headline"
                    type="text"
                    value={data.headline}
                    onChange={(e) => update("headline", e.target.value)}
                    placeholder="Leave blank and the AI will write a strong headline for you"
                    className={inputCls}
                  />
                </div>

                <div>
                  <FieldLabel
                    htmlFor="pb-details"
                    label="Any specific services, prices, menu items, or FAQs to include?"
                  />
                  <textarea
                    id="pb-details"
                    name="details"
                    rows={4}
                    value={data.details}
                    onChange={(e) => update("details", e.target.value)}
                    placeholder="Totally optional! Paste any notes, services, or prices you already have — or leave blank and the AI will draft realistic copy for your business."
                    className={textareaCls}
                  />
                </div>
              </div>
            )}

            {/* STEP 4: CONTACT & EXTRAS */}
            {activeStep === "contact" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="pb-email" label="Contact email" />
                    <input
                      id="pb-email"
                      name="email"
                      type="email"
                      value={data.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="hello@yourwebsite.com"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-location" label="City or location" />
                    <input
                      id="pb-location"
                      name="location"
                      type="text"
                      value={data.location}
                      onChange={(e) => update("location", e.target.value)}
                      placeholder="e.g. Austin, TX"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-form" label="How should the contact form work?" />
                    <select
                      id="pb-form"
                      name="formHandling"
                      value={data.formHandling}
                      onChange={(e) => update("formHandling", e.target.value)}
                      className={selectCls}
                    >
                      {FORM_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-lang" label="Website language" />
                    <select
                      id="pb-lang"
                      name="language"
                      value={data.language}
                      onChange={(e) => update("language", e.target.value)}
                      className={selectCls}
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Collapsible Extra Details */}
                <div className="pt-2 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setShowMoreContact((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink)] cursor-pointer"
                  >
                    <span>More optional details (phone, social links, inspiration)</span>
                    {showMoreContact ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {showMoreContact && (
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <FieldLabel htmlFor="pb-phone" label="Phone number" />
                          <input
                            id="pb-phone"
                            name="phone"
                            type="text"
                            value={data.phone}
                            onChange={(e) => update("phone", e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <FieldLabel htmlFor="pb-socials" label="Social links" />
                          <input
                            id="pb-socials"
                            name="socialLinks"
                            type="text"
                            value={data.socialLinks}
                            onChange={(e) => update("socialLinks", e.target.value)}
                            placeholder="Instagram, LinkedIn, X URLs"
                            className={inputCls}
                          />
                        </div>
                      </div>
                      <div>
                        <FieldLabel htmlFor="pb-likes" label="Websites or styles you like" />
                        <input
                          id="pb-likes"
                          name="likes"
                          type="text"
                          value={data.likes}
                          onChange={(e) => update("likes", e.target.value)}
                          placeholder="e.g. Clean editorial layout, big typography, warm colors"
                          className={inputCls}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 5: READY PROMPT OUTPUT */}
            {activeStep === "output" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    ["1. Copy Prompt", "Includes the Master Prompt + all 7 files completed for you."],
                    ["2. Paste Into AI", "Send to ChatGPT, Claude, or Gemini to generate index.html."],
                    ["3. Run in VYVO", "Copy the AI's code back into VYVO and press RUN MY WEBSITE."],
                  ].map(([title, desc]) => (
                    <div
                      key={title}
                      className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]"
                    >
                      <div className="text-xs font-bold text-[var(--accent)]">{title}</div>
                      <p className="text-xs text-[var(--ink-secondary)] mt-1 leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleCopy("full")}
                    className="w-full sm:w-auto sm:flex-1 h-12 shrink-0 px-5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] font-bold text-sm inline-flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {copiedType === "full" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>
                      {copiedType === "full"
                        ? "Copied Complete Prompt!"
                        : "Copy Complete Master Prompt"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy("files")}
                    className="h-12 shrink-0 px-4 rounded-xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-semibold text-[var(--ink)] inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedType === "files" ? (
                      <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copy 7 Files Only</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadBriefZip}
                    className="h-12 shrink-0 px-4 rounded-xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-semibold text-[var(--ink)] inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download (.zip)</span>
                  </button>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
                  <div className="px-3.5 py-2.5 border-b border-[var(--border)] flex items-center justify-between gap-2 flex-wrap">
                    <div className="inline-flex items-center p-0.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                      <button
                        type="button"
                        onClick={() => setPreviewMode("full")}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                          previewMode === "full"
                            ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                            : "text-[var(--ink-secondary)]"
                        }`}
                      >
                        Full Master Prompt + 7 Files
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode("files")}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                          previewMode === "files"
                            ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                            : "text-[var(--ink-secondary)]"
                        }`}
                      >
                        7 Filled Files Only
                      </button>
                    </div>
                    <span className="text-[11px] font-mono text-[var(--ink-muted)]">
                      {(previewMode === "full" ? fullPromptText : filesOnlyText).length.toLocaleString()}{" "}
                      chars
                    </span>
                  </div>

                  <pre className="p-4 max-h-[380px] overflow-auto font-mono text-xs text-[var(--ink-secondary)] whitespace-pre-wrap break-words leading-relaxed">
                    {previewMode === "full" ? fullPromptText : filesOnlyText}
                  </pre>
                </div>

                <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[var(--ink)]">
                      Got the code from your AI?
                    </p>
                    <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
                      Go back to VYVO, paste the code, and press RUN MY WEBSITE.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onGoPasteCode}
                    className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-[var(--ink)] text-[var(--bg)] font-bold text-xs shrink-0 hover:opacity-90 transition cursor-pointer"
                  >
                    <span>Paste &amp; Run Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step Footer Prev / Next Controls */}
            <div className="mt-8 pt-5 border-t border-[var(--border)] flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={stepIndex === 0}
                onClick={() => setActiveStep(STEPS[Math.max(0, stepIndex - 1)].id)}
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] disabled:opacity-40 border border-[var(--border)] text-xs font-semibold text-[var(--ink)] transition cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs text-[var(--ink-muted)] font-medium">
                Step {stepIndex + 1} of {STEPS.length}
              </span>

              {stepIndex < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep(STEPS[stepIndex + 1].id)}
                  className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] text-xs font-bold transition cursor-pointer"
                >
                  <span>
                    {stepIndex === STEPS.length - 2 ? "Review & Copy Prompt" : "Next"}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onGoPasteCode}
                  className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] text-xs font-bold transition cursor-pointer"
                >
                  <span>Go Paste Code</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </section>

          {/* Right Sticky Live Summary & Instant Copy Sidebar (Desktop) */}
          <aside className="hidden lg:flex lg:col-span-4 flex-col gap-4 sticky top-[7.5rem]">
            <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
                  Ready Anytime
                </span>
                <span className="text-xs font-semibold text-[var(--accent)]">
                  {stats.answered} customized · rest DEFAULT
                </span>
              </div>

              <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
                Copy your Master Prompt whenever you&apos;re ready. Any question left on{" "}
                <strong className="text-[var(--ink)]">Let AI choose</strong> or left blank is
                automatically filled with <code className="font-mono text-[var(--ink)]">DEFAULT</code>.
              </p>

              <button
                type="button"
                onClick={() => handleCopy("full")}
                className="w-full h-11 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] font-bold text-xs inline-flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {copiedType === "full" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>
                  {copiedType === "full" ? "Copied to Clipboard!" : "Copy Complete Prompt"}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveStep("output")}
                  className="h-9 rounded-lg bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-semibold text-[var(--ink)] transition cursor-pointer"
                >
                  Full Preview
                </button>
                <button
                  type="button"
                  onClick={handleDownloadBriefZip}
                  className="h-9 rounded-lg bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-semibold text-[var(--ink)] inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ZIP Brief</span>
                </button>
              </div>
            </div>

            {activePreviewFile && individualFiles[activePreviewFile] && (
              <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
                <div className="px-4 py-2.5 border-b border-[var(--border)] flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-[var(--ink)]">
                    {activePreviewFile}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                    Auto-completed
                  </span>
                </div>
                <pre className="p-4 max-h-72 overflow-auto font-mono text-[11px] text-[var(--ink-secondary)] whitespace-pre-wrap break-words leading-relaxed bg-[var(--bg)]">
                  {individualFiles[activePreviewFile]}
                </pre>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md px-4 pt-2.5 pb-safe-nav flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleCopy("full")}
          className="flex-1 h-11 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-bold text-xs inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          {copiedType === "full" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copiedType === "full" ? "Copied Prompt!" : "Copy Master Prompt"}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveStep("output")}
          className="h-11 px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs font-semibold text-[var(--ink)] cursor-pointer"
        >
          Preview
        </button>
      </div>
    </div>
  );
}
