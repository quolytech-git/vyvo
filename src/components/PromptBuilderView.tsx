"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  Mail,
  Palette,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Wand2,
  Zap,
} from "lucide-react";
import {
  EMPTY_PROMPT_DATA,
  SAMPLE_PROMPT_DATA,
  buildFilledFilesText,
  buildFullMasterPrompt,
  buildIndividualFiles,
  exportPromptBriefAsZip,
  getCompletionStats,
  type PromptBuilderData,
} from "@/lib/masterPrompt";
import { loadPromptDraft, savePromptDraft } from "@/lib/storage";
import { triggerBlobDownload } from "@/lib/zipUtils";

interface PromptBuilderViewProps {
  onBackHome: () => void;
  onGoPasteCode: () => void;
  onNotify: (message: string) => void;
}

type StepId =
  | "brand"
  | "content"
  | "pages"
  | "assets"
  | "contact"
  | "references"
  | "motion"
  | "output";

interface StepMeta {
  id: StepId;
  shortLabel: string;
  fileName?: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepMeta[] = [
  {
    id: "brand",
    shortLabel: "1. Brand",
    fileName: "brand.txt",
    title: "Your Brand & Visual Style",
    subtitle: "Tell your AI who you are, what you do, and the mood you want. Skip anything to let the AI choose.",
    icon: Palette,
  },
  {
    id: "content",
    shortLabel: "2. Content",
    fileName: "content.txt",
    title: "Website Content & Offer",
    subtitle: "Write what you already have — any blank fields automatically become DEFAULT so the AI drafts clean copy.",
    icon: FileText,
  },
  {
    id: "pages",
    shortLabel: "3. Sections",
    fileName: "pages.txt",
    title: "Sections & Navigation",
    subtitle: "Pick which sections should appear on your single-page website.",
    icon: LayoutGrid,
  },
  {
    id: "assets",
    shortLabel: "4. Assets",
    fileName: "assets.txt",
    title: "Images, Logo & Media",
    subtitle: "Optional: list photos or logos you plan to place in your assets folder. Otherwise the AI builds clean SVG/CSS visuals.",
    icon: ImageIcon,
  },
  {
    id: "contact",
    shortLabel: "5. Contact & SEO",
    fileName: "contact-seo.txt",
    title: "Contact Details & Search (SEO)",
    subtitle: "How visitors reach you and how your site appears on Google and social links.",
    icon: Mail,
  },
  {
    id: "references",
    shortLabel: "6. Inspiration",
    fileName: "references.txt",
    title: "Inspiration & Dislikes",
    subtitle: "Optional, but one of the fastest ways to get Framer-level taste from your AI.",
    icon: Sparkles,
  },
  {
    id: "motion",
    shortLabel: "7. Motion",
    fileName: "motion.txt",
    title: "Animation & Polish",
    subtitle: "Control how lively your website feels and whether visitors can switch dark/light mode.",
    icon: Zap,
  },
  {
    id: "output",
    shortLabel: "8. Ready Prompt",
    title: "Your Complete Master Prompt",
    subtitle: "Copy this into ChatGPT, Claude, Gemini, or Cursor — then paste the index.html code back into VYVO.",
    icon: Wand2,
  },
];

const MOOD_OPTIONS: Array<{
  value: PromptBuilderData["brand"]["mood"];
  label: string;
  desc: string;
}> = [
  { value: "DEFAULT", label: "Let AI choose", desc: "Best fit for your brand" },
  { value: "minimal-editorial", label: "Minimal Editorial", desc: "Serif headlines, crisp whitespace" },
  { value: "dark-tech", label: "Dark Tech / SaaS", desc: "Deep dark canvas, vivid accent" },
  { value: "soft-scenic", label: "Soft & Warm", desc: "Calm light neutrals, pill buttons" },
  { value: "luxury-serif", label: "Luxury Serif", desc: "Refined, high-contrast elegance" },
  { value: "bold-brutalist", label: "Bold Brutalist", desc: "Oversized type, sharp grid" },
  { value: "playful-colorful", label: "Playful Colorful", desc: "Energetic, expressive palette" },
];

const SECTION_TOGGLES: Array<{
  key: keyof PromptBuilderData["pages"]["sections"];
  label: string;
  hint: string;
}> = [
  { key: "hero", label: "Hero", hint: "Main opening headline & CTA" },
  { key: "logos", label: "Logos", hint: "Client or partner logo strip" },
  { key: "services", label: "Services / Features", hint: "What you offer" },
  { key: "work", label: "Work / Case Studies", hint: "Featured projects with pop-up details" },
  { key: "process", label: "Process", hint: "3–5 step workflow" },
  { key: "numbers", label: "Key Numbers", hint: "Real metrics & results" },
  { key: "testimonials", label: "Testimonials", hint: "Real customer quotes" },
  { key: "pricing", label: "Pricing", hint: "Plans with billing toggle" },
  { key: "faq", label: "FAQ", hint: "Expandable Q&A accordion" },
  { key: "aboutTeam", label: "About / Team", hint: "Your story & people" },
  { key: "blog", label: "Blog / News", hint: "Articles in a reading modal" },
  { key: "contact", label: "Contact", hint: "Details + contact form" },
  { key: "finalCta", label: "Final CTA", hint: "Strong closing call-to-action band" },
  { key: "footer", label: "Footer", hint: "Links, wordmark & copyright" },
];

const MOTION_TOGGLES: Array<{
  key: keyof PromptBuilderData["motion"]["allow"];
  label: string;
}> = [
  { key: "scrollReveals", label: "Scroll reveals" },
  { key: "hoverEffects", label: "Hover effects" },
  { key: "smoothScroll", label: "Smooth scroll" },
  { key: "marquee", label: "Logo marquee" },
  { key: "kineticHero", label: "Kinetic hero headline" },
  { key: "parallax", label: "Subtle parallax" },
  { key: "customCursor", label: "Custom cursor" },
];

function FieldLabel({
  htmlFor,
  label,
  hint,
}: {
  htmlFor: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 mb-1.5">
      <label htmlFor={htmlFor} className="text-xs font-semibold text-[var(--ink)]">
        {label}
      </label>
      {hint && <span className="text-[11px] text-[var(--ink-muted)]">{hint}</span>}
    </div>
  );
}

const inputCls =
  "w-full h-10 px-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--accent)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none transition";

const textareaCls =
  "w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--accent)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none resize-y leading-relaxed transition";

export function PromptBuilderView({
  onBackHome,
  onGoPasteCode,
  onNotify,
}: PromptBuilderViewProps) {
  const [data, setData] = useState<PromptBuilderData>(EMPTY_PROMPT_DATA);
  const [activeStep, setActiveStep] = useState<StepId>("brand");
  const [previewMode, setPreviewMode] = useState<"full" | "files">("full");
  const [copiedType, setCopiedType] = useState<"full" | "files" | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const stepButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const el = stepButtonRefs.current[activeStep];
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeStep]);

  useEffect(() => {
    const saved = loadPromptDraft();
    if (saved) {
      setData({
        ...EMPTY_PROMPT_DATA,
        ...saved,
        brand: { ...EMPTY_PROMPT_DATA.brand, ...(saved.brand || {}) },
        content: { ...EMPTY_PROMPT_DATA.content, ...(saved.content || {}) },
        pages: {
          ...EMPTY_PROMPT_DATA.pages,
          ...(saved.pages || {}),
          sections: {
            ...EMPTY_PROMPT_DATA.pages.sections,
            ...(saved.pages?.sections || {}),
          },
        },
        assets: { ...EMPTY_PROMPT_DATA.assets, ...(saved.assets || {}) },
        contactSeo: { ...EMPTY_PROMPT_DATA.contactSeo, ...(saved.contactSeo || {}) },
        references: { ...EMPTY_PROMPT_DATA.references, ...(saved.references || {}) },
        motion: {
          ...EMPTY_PROMPT_DATA.motion,
          ...(saved.motion || {}),
          allow: {
            ...EMPTY_PROMPT_DATA.motion.allow,
            ...(saved.motion?.allow || {}),
          },
        },
      });
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) savePromptDraft(data);
  }, [data, hydrated]);

  const stepIndex = STEPS.findIndex((s) => s.id === activeStep);
  const currentStepMeta = STEPS[stepIndex];

  const stats = useMemo(() => getCompletionStats(data), [data]);
  const individualFiles = useMemo(() => buildIndividualFiles(data), [data]);
  const fullPromptText = useMemo(() => buildFullMasterPrompt(data), [data]);
  const filesOnlyText = useMemo(() => buildFilledFilesText(data), [data]);

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
        data.brand.businessName
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
    onNotify("Loaded Northwind Studio example — customize any answer or copy right away!");
  }

  function handleReset() {
    setData(EMPTY_PROMPT_DATA);
    onNotify("Cleared all fields (empty gaps auto-fill with DEFAULT).");
  }

  function updateBrand<K extends keyof PromptBuilderData["brand"]>(
    key: K,
    value: PromptBuilderData["brand"][K]
  ) {
    setData((prev) => ({ ...prev, brand: { ...prev.brand, [key]: value } }));
  }

  function updateContent<K extends keyof PromptBuilderData["content"]>(
    key: K,
    value: PromptBuilderData["content"][K]
  ) {
    setData((prev) => ({ ...prev, content: { ...prev.content, [key]: value } }));
  }

  function updateContact<K extends keyof PromptBuilderData["contactSeo"]>(
    key: K,
    value: PromptBuilderData["contactSeo"][K]
  ) {
    setData((prev) => ({ ...prev, contactSeo: { ...prev.contactSeo, [key]: value } }));
  }

  const activeFilePreview = currentStepMeta.fileName
    ? individualFiles[currentStepMeta.fileName]
    : null;

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--bg)] text-[var(--ink)]">
      {/* Sticky Minimal Top Bar */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md safe-top safe-x">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
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

        {/* Scrollable 8-Step Pill Navigation */}
        <div className="border-t border-[var(--border)] bg-[var(--bg)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-1.5 overflow-x-auto">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === activeStep;
              const stepStat = stats.steps[step.id];
              const hasInput = stepStat && stepStat.filled > 0;
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
                  {hasInput && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 sm:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Primary Questionnaire Card */}
          <section className="lg:col-span-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-5 sm:p-7 animate-vyvo-in">
            <div className="flex items-start justify-between gap-3 pb-5 mb-6 border-b border-[var(--border)]">
              <div>
                {currentStepMeta.fileName && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--accent)] mb-2">
                    {currentStepMeta.fileName}
                  </span>
                )}
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--ink)]">
                  {currentStepMeta.title}
                </h2>
                <p className="mt-1 text-sm text-[var(--ink-secondary)] leading-relaxed">
                  {currentStepMeta.subtitle}
                </p>
              </div>
            </div>

            {/* STEP 1: BRAND */}
            {activeStep === "brand" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="pb-name" label="Business or personal name" hint="Empty → DEFAULT" />
                    <input
                      id="pb-name"
                      name="businessName"
                      type="text"
                      value={data.brand.businessName}
                      onChange={(e) => updateBrand("businessName", e.target.value)}
                      placeholder="e.g. Northwind Studio"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-tagline" label="One-line tagline" hint="Max 8 words" />
                    <input
                      id="pb-tagline"
                      name="tagline"
                      type="text"
                      value={data.brand.tagline}
                      onChange={(e) => updateBrand("tagline", e.target.value)}
                      placeholder="e.g. Brand systems for climate startups."
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel htmlFor="pb-what" label="What you do (in 2 sentences)" />
                  <textarea
                    id="pb-what"
                    name="whatYouDo"
                    rows={3}
                    value={data.brand.whatYouDo}
                    onChange={(e) => updateBrand("whatYouDo", e.target.value)}
                    placeholder="Describe your product or service simply, as if explaining to a friend..."
                    className={textareaCls}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="pb-audience" label="Who is it for? (Ideal customer)" />
                  <input
                    id="pb-audience"
                    name="idealCustomer"
                    type="text"
                    value={data.brand.idealCustomer}
                    onChange={(e) => updateBrand("idealCustomer", e.target.value)}
                    placeholder="e.g. Small business owners, independent founders, local homeowners..."
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="pb-main-action" label="Main action visitors should take" />
                    <input
                      id="pb-main-action"
                      name="mainAction"
                      type="text"
                      value={data.brand.mainAction}
                      onChange={(e) => updateBrand("mainAction", e.target.value)}
                      placeholder="e.g. Book a call / Buy / Sign up / Contact"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-main-link" label="Main button link" hint="Default: #contact" />
                    <input
                      id="pb-main-link"
                      name="mainActionLink"
                      type="text"
                      value={data.brand.mainActionLink}
                      onChange={(e) => updateBrand("mainActionLink", e.target.value)}
                      placeholder="e.g. #contact or https://cal.com/you"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-sec-action" label="Secondary action" hint="Optional" />
                    <input
                      id="pb-sec-action"
                      name="secondaryAction"
                      type="text"
                      value={data.brand.secondaryAction}
                      onChange={(e) => updateBrand("secondaryAction", e.target.value)}
                      placeholder="e.g. See our work"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-sec-link" label="Secondary link" hint="Optional" />
                    <input
                      id="pb-sec-link"
                      name="secondaryActionLink"
                      type="text"
                      value={data.brand.secondaryActionLink}
                      onChange={(e) => updateBrand("secondaryActionLink", e.target.value)}
                      placeholder="e.g. #work"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="pb-tone" label="Tone of voice (3 words)" />
                    <input
                      id="pb-tone"
                      name="toneOfVoice"
                      type="text"
                      value={data.brand.toneOfVoice}
                      onChange={(e) => updateBrand("toneOfVoice", e.target.value)}
                      placeholder="e.g. calm, precise, optimistic"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-avoid" label="Words to avoid" hint="Optional" />
                    <input
                      id="pb-avoid"
                      name="wordsToAvoid"
                      type="text"
                      value={data.brand.wordsToAvoid}
                      onChange={(e) => updateBrand("wordsToAvoid", e.target.value)}
                      placeholder='e.g. "synergy", "cutting-edge"'
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Theme & Corner Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-semibold text-[var(--ink)] mb-2">
                      Color theme
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {(["DEFAULT", "light", "dark", "both with toggle"] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => updateBrand("theme", opt)}
                          className={`h-9 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                            data.brand.theme === opt
                              ? "bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)]"
                              : "bg-[var(--bg)] border-[var(--border)] text-[var(--ink-secondary)] hover:text-[var(--ink)]"
                          }`}
                        >
                          {opt === "DEFAULT"
                            ? "Let AI choose"
                            : opt === "both with toggle"
                            ? "Light + Dark"
                            : opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-[var(--ink)] mb-2">
                      Corner style
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {(["DEFAULT", "sharp", "slightly rounded", "very rounded"] as const).map(
                        (opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => updateBrand("cornerStyle", opt)}
                            className={`h-9 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                              data.brand.cornerStyle === opt
                                ? "bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)]"
                                : "bg-[var(--bg)] border-[var(--border)] text-[var(--ink-secondary)] hover:text-[var(--ink)]"
                            }`}
                          >
                            {opt === "DEFAULT"
                              ? "Let AI choose"
                              : opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Visual Mood Cards */}
                <div>
                  <span className="block text-xs font-semibold text-[var(--ink)] mb-2">
                    Visual mood
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {MOOD_OPTIONS.map((m) => {
                      const active = data.brand.mood === m.value;
                      return (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => updateBrand("mood", m.value)}
                          className={`text-left p-3 rounded-xl border transition cursor-pointer ${
                            active
                              ? "bg-[var(--accent)]/12 border-[var(--accent)] text-[var(--ink)]"
                              : "bg-[var(--bg)] border-[var(--border)] hover:border-[var(--border-strong)]"
                          }`}
                        >
                          <div className="text-xs font-bold text-[var(--ink)]">{m.label}</div>
                          <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">{m.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Brand Colors */}
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs font-semibold text-[var(--ink)]">
                      Brand colors (optional — leave blank for AI palette)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(
                      [
                        ["primaryColor", "Primary", "#0F3D2E"],
                        ["accentColor", "Accent", "#D4FF5A"],
                        ["backgroundColor", "Background", "#FAFAFA"],
                        ["textColor", "Text", "#111111"],
                      ] as const
                    ).map(([field, label, fallbackHex]) => {
                      const val = data.brand[field];
                      return (
                        <div key={field} className="space-y-1">
                          <label htmlFor={`pb-${field}`} className="text-[11px] text-[var(--ink-muted)]">
                            {label}
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={/^#[0-9a-fA-F]{6}$/.test(val) ? val : fallbackHex}
                              onChange={(e) => updateBrand(field, e.target.value.toUpperCase())}
                              aria-label={`${label} color picker`}
                              className="w-9 h-9 rounded-lg border border-[var(--border)] bg-transparent cursor-pointer shrink-0 p-0.5"
                            />
                            <input
                              id={`pb-${field}`}
                              name={field}
                              type="text"
                              value={val}
                              onChange={(e) => updateBrand(field, e.target.value)}
                              placeholder="DEFAULT"
                              className="w-full h-9 px-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-xs font-mono text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent)]"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Fonts & Logo Filenames */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="pb-hfont" label="Heading font" hint="Optional (Google Font)" />
                    <input
                      id="pb-hfont"
                      name="headingFont"
                      type="text"
                      value={data.brand.headingFont}
                      onChange={(e) => updateBrand("headingFont", e.target.value)}
                      placeholder="e.g. Fraunces, Space Grotesk, or leave blank"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-bfont" label="Body font" hint="Optional (Google Font)" />
                    <input
                      id="pb-bfont"
                      name="bodyFont"
                      type="text"
                      value={data.brand.bodyFont}
                      onChange={(e) => updateBrand("bodyFont", e.target.value)}
                      placeholder="e.g. Manrope, DM Sans, or leave blank"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-logo" label="Logo filename (in assets folder)" hint="Optional" />
                    <input
                      id="pb-logo"
                      name="logoFile"
                      type="text"
                      value={data.brand.logoFile}
                      onChange={(e) => updateBrand("logoFile", e.target.value)}
                      placeholder="e.g. logo.svg"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-logo-dark" label="Logo for dark backgrounds" hint="Optional" />
                    <input
                      id="pb-logo-dark"
                      name="logoDarkFile"
                      type="text"
                      value={data.brand.logoDarkFile}
                      onChange={(e) => updateBrand("logoDarkFile", e.target.value)}
                      placeholder="e.g. logo-white.svg"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: CONTENT */}
            {activeStep === "content" && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                    Hero Section (Top of Page)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel htmlFor="pb-eyebrow" label="Small eyebrow label" hint="Optional" />
                      <input
                        id="pb-eyebrow"
                        name="eyebrow"
                        type="text"
                        value={data.content.eyebrow}
                        onChange={(e) => updateContent("eyebrow", e.target.value)}
                        placeholder="e.g. Brand & Web Studio, Est. 2019"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="pb-headline" label="Main headline" hint="3–8 words" />
                      <input
                        id="pb-headline"
                        name="headline"
                        type="text"
                        value={data.content.headline}
                        onChange={(e) => updateContent("headline", e.target.value)}
                        placeholder="e.g. Climate brands, built to scale."
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-subheadline" label="Sub-headline (1–2 sentences)" />
                    <textarea
                      id="pb-subheadline"
                      name="subHeadline"
                      rows={2}
                      value={data.content.subHeadline}
                      onChange={(e) => updateContent("subHeadline", e.target.value)}
                      placeholder="Explain the core benefit clearly in 1–2 short sentences..."
                      className={textareaCls}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <FieldLabel htmlFor="pb-btn1" label="Primary button" />
                      <input
                        id="pb-btn1"
                        name="primaryButtonText"
                        type="text"
                        value={data.content.primaryButtonText}
                        onChange={(e) => updateContent("primaryButtonText", e.target.value)}
                        placeholder="e.g. Book a Call"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="pb-btn2" label="Secondary button" />
                      <input
                        id="pb-btn2"
                        name="secondaryButtonText"
                        type="text"
                        value={data.content.secondaryButtonText}
                        onChange={(e) => updateContent("secondaryButtonText", e.target.value)}
                        placeholder="e.g. View Work"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="pb-trust" label="Trust line" />
                      <input
                        id="pb-trust"
                        name="trustLine"
                        type="text"
                        value={data.content.trustLine}
                        onChange={(e) => updateContent("trustLine", e.target.value)}
                        placeholder="e.g. Trusted by 40+ teams"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                {/* Services / Features */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
                      Services / Features (3–8)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateContent("services", [
                          ...data.content.services,
                          { title: "", description: "" },
                        ])
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add item
                    </button>
                  </div>
                  {data.content.services.map((svc, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]"
                    >
                      <input
                        type="text"
                        aria-label={`Service ${idx + 1} title`}
                        value={svc.title}
                        onChange={(e) => {
                          const next = [...data.content.services];
                          next[idx] = { ...svc, title: e.target.value };
                          updateContent("services", next);
                        }}
                        placeholder="Title (e.g. Brand identity)"
                        className="sm:col-span-4 h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                      />
                      <input
                        type="text"
                        aria-label={`Service ${idx + 1} description`}
                        value={svc.description}
                        onChange={(e) => {
                          const next = [...data.content.services];
                          next[idx] = { ...svc, description: e.target.value };
                          updateContent("services", next);
                        }}
                        placeholder="One sentence explaining the benefit..."
                        className="sm:col-span-7 h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                      />
                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            updateContent(
                              "services",
                              data.content.services.filter((_, i) => i !== idx)
                            )
                          }
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[var(--ink-muted)] hover:text-[var(--danger)] cursor-pointer"
                          aria-label="Remove service"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Process, Numbers, Client Logos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="pb-numbers" label="Key numbers (real only)" hint="Optional" />
                    <input
                      id="pb-numbers"
                      name="keyNumbers"
                      type="text"
                      value={data.content.keyNumbers}
                      onChange={(e) => updateContent("keyNumbers", e.target.value)}
                      placeholder="e.g. 48 launches | 4 weeks average"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-logos" label="Client logos" hint="Real names or NONE" />
                    <input
                      id="pb-logos"
                      name="clientLogos"
                      type="text"
                      value={data.content.clientLogos}
                      onChange={(e) => updateContent("clientLogos", e.target.value)}
                      placeholder="Names matching logo files, or leave blank"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel htmlFor="pb-process" label="Process steps (3–5 steps)" hint="Optional" />
                  <textarea
                    id="pb-process"
                    name="processSteps"
                    rows={2}
                    value={data.content.processSteps}
                    onChange={(e) => updateContent("processSteps", e.target.value)}
                    placeholder="e.g. 1. Discover ... 2. Design ... 3. Launch ..."
                    className={textareaCls}
                  />
                </div>

                {/* Optional Case Studies / Work */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
                      Work / Case Studies (Optional)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateContent("workItems", [
                          ...data.content.workItems,
                          { title: "", client: "", year: "", result: "", image: "" },
                        ])
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add project
                    </button>
                  </div>
                  {data.content.workItems.map((w, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={w.title}
                          onChange={(e) => {
                            const next = [...data.content.workItems];
                            next[idx] = { ...w, title: e.target.value };
                            updateContent("workItems", next);
                          }}
                          placeholder="Project title"
                          className="h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)]"
                        />
                        <input
                          type="text"
                          value={w.client}
                          onChange={(e) => {
                            const next = [...data.content.workItems];
                            next[idx] = { ...w, client: e.target.value };
                            updateContent("workItems", next);
                          }}
                          placeholder="Client name"
                          className="h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)]"
                        />
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={w.year}
                            onChange={(e) => {
                              const next = [...data.content.workItems];
                              next[idx] = { ...w, year: e.target.value };
                              updateContent("workItems", next);
                            }}
                            placeholder="Year"
                            className="flex-1 h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateContent(
                                "workItems",
                                data.content.workItems.filter((_, i) => i !== idx)
                              )
                            }
                            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[var(--ink-muted)] hover:text-[var(--danger)] cursor-pointer"
                            aria-label="Remove project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={w.result}
                          onChange={(e) => {
                            const next = [...data.content.workItems];
                            next[idx] = { ...w, result: e.target.value };
                            updateContent("workItems", next);
                          }}
                          placeholder="1-line outcome or result"
                          className="sm:col-span-2 h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)]"
                        />
                        <input
                          type="text"
                          value={w.image}
                          onChange={(e) => {
                            const next = [...data.content.workItems];
                            next[idx] = { ...w, image: e.target.value };
                            updateContent("workItems", next);
                          }}
                          placeholder="Image file (or DEFAULT)"
                          className="h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)]"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Real Testimonials */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
                      Testimonials (Real quotes only)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateContent("testimonials", [
                          ...data.content.testimonials,
                          { quote: "", name: "", roleCompany: "", photo: "" },
                        ])
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add quote
                    </button>
                  </div>
                  {data.content.testimonials.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2"
                    >
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={t.quote}
                          onChange={(e) => {
                            const next = [...data.content.testimonials];
                            next[idx] = { ...t, quote: e.target.value };
                            updateContent("testimonials", next);
                          }}
                          placeholder="Exact customer quote..."
                          className="flex-1 h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateContent(
                              "testimonials",
                              data.content.testimonials.filter((_, i) => i !== idx)
                            )
                          }
                          className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[var(--ink-muted)] hover:text-[var(--danger)] cursor-pointer"
                          aria-label="Remove testimonial"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={t.name}
                          onChange={(e) => {
                            const next = [...data.content.testimonials];
                            next[idx] = { ...t, name: e.target.value };
                            updateContent("testimonials", next);
                          }}
                          placeholder="Person's name"
                          className="h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)]"
                        />
                        <input
                          type="text"
                          value={t.roleCompany}
                          onChange={(e) => {
                            const next = [...data.content.testimonials];
                            next[idx] = { ...t, roleCompany: e.target.value };
                            updateContent("testimonials", next);
                          }}
                          placeholder="Role, Company"
                          className="h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)]"
                        />
                        <input
                          type="text"
                          value={t.photo}
                          onChange={(e) => {
                            const next = [...data.content.testimonials];
                            next[idx] = { ...t, photo: e.target.value };
                            updateContent("testimonials", next);
                          }}
                          placeholder="Photo file (optional)"
                          className="h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)]"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing Plans */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
                      Pricing Plans (Optional)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateContent("pricingPlans", [
                          ...data.content.pricingPlans,
                          {
                            plan: "",
                            price: "",
                            billing: "monthly",
                            features: "",
                            button: "Get Started",
                            highlight: false,
                          },
                        ])
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add plan
                    </button>
                  </div>
                  {data.content.pricingPlans.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                        <input
                          type="text"
                          value={p.plan}
                          onChange={(e) => {
                            const next = [...data.content.pricingPlans];
                            next[idx] = { ...p, plan: e.target.value };
                            updateContent("pricingPlans", next);
                          }}
                          placeholder="Plan name"
                          className="h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)]"
                        />
                        <input
                          type="text"
                          value={p.price}
                          onChange={(e) => {
                            const next = [...data.content.pricingPlans];
                            next[idx] = { ...p, price: e.target.value };
                            updateContent("pricingPlans", next);
                          }}
                          placeholder="Price (e.g. $49)"
                          className="h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)]"
                        />
                        <input
                          type="text"
                          value={p.billing}
                          onChange={(e) => {
                            const next = [...data.content.pricingPlans];
                            next[idx] = { ...p, billing: e.target.value };
                            updateContent("pricingPlans", next);
                          }}
                          placeholder="Billing (e.g. /month)"
                          className="h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)]"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <label className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-secondary)] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={p.highlight}
                              onChange={(e) => {
                                const next = [...data.content.pricingPlans];
                                next[idx] = { ...p, highlight: e.target.checked };
                                updateContent("pricingPlans", next);
                              }}
                              className="accent-[var(--accent)]"
                            />
                            Popular
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              updateContent(
                                "pricingPlans",
                                data.content.pricingPlans.filter((_, i) => i !== idx)
                              )
                            }
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[var(--ink-muted)] hover:text-[var(--danger)] cursor-pointer"
                            aria-label="Remove plan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={p.features}
                          onChange={(e) => {
                            const next = [...data.content.pricingPlans];
                            next[idx] = { ...p, features: e.target.value };
                            updateContent("pricingPlans", next);
                          }}
                          placeholder="4–6 features separated by commas"
                          className="sm:col-span-2 h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)]"
                        />
                        <input
                          type="text"
                          value={p.button}
                          onChange={(e) => {
                            const next = [...data.content.pricingPlans];
                            next[idx] = { ...p, button: e.target.value };
                            updateContent("pricingPlans", next);
                          }}
                          placeholder="Button text"
                          className="h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)]"
                        />
                      </div>
                    </div>
                  ))}
                  {data.content.pricingPlans.length > 0 && (
                    <div>
                      <FieldLabel htmlFor="pb-discount" label="Yearly discount note" hint="Optional" />
                      <input
                        id="pb-discount"
                        name="yearlyDiscount"
                        type="text"
                        value={data.content.yearlyDiscount}
                        onChange={(e) => updateContent("yearlyDiscount", e.target.value)}
                        placeholder="e.g. save 16%"
                        className={inputCls}
                      />
                    </div>
                  )}
                </div>

                {/* FAQs */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
                      FAQ Questions (Optional)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateContent("faqs", [...data.content.faqs, { question: "", answer: "" }])
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add FAQ
                    </button>
                  </div>
                  {data.content.faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2"
                    >
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => {
                            const next = [...data.content.faqs];
                            next[idx] = { ...faq, question: e.target.value };
                            updateContent("faqs", next);
                          }}
                          placeholder="Question..."
                          className="flex-1 h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateContent(
                              "faqs",
                              data.content.faqs.filter((_, i) => i !== idx)
                            )
                          }
                          className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[var(--ink-muted)] hover:text-[var(--danger)] cursor-pointer"
                          aria-label="Remove FAQ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={faq.answer}
                        onChange={(e) => {
                          const next = [...data.content.faqs];
                          next[idx] = { ...faq, answer: e.target.value };
                          updateContent("faqs", next);
                        }}
                        placeholder="Short, clear answer..."
                        className="w-full h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)]"
                      />
                    </div>
                  ))}
                </div>

                {/* About, Blog, Final CTA, Footer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="pb-about" label="About / Team story" hint="Optional" />
                    <textarea
                      id="pb-about"
                      name="aboutTeam"
                      rows={2}
                      value={data.content.aboutTeam}
                      onChange={(e) => updateContent("aboutTeam", e.target.value)}
                      placeholder="Short story paragraph + team names/roles..."
                      className={textareaCls}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-blog" label="Blog / News items" hint="Optional" />
                    <textarea
                      id="pb-blog"
                      name="blogNews"
                      rows={2}
                      value={data.content.blogNews}
                      onChange={(e) => updateContent("blogNews", e.target.value)}
                      placeholder="Title | Date | Summary"
                      className={textareaCls}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-finalcta" label="Final call-to-action headline" />
                    <input
                      id="pb-finalcta"
                      name="finalCtaHeadline"
                      type="text"
                      value={data.content.finalCtaHeadline}
                      onChange={(e) => updateContent("finalCtaHeadline", e.target.value)}
                      placeholder="e.g. Ready to launch something good?"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-footer" label="Footer copyright note" />
                    <input
                      id="pb-footer"
                      name="footerNote"
                      type="text"
                      value={data.content.footerNote}
                      onChange={(e) => updateContent("footerNote", e.target.value)}
                      placeholder="e.g. Made in Lisbon. © 2026 Northwind Studio"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: PAGES / SECTIONS */}
            {activeStep === "pages" && (
              <div className="space-y-6">
                <div>
                  <span className="block text-xs font-semibold text-[var(--ink)] mb-2.5">
                    Select sections to include on your page
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SECTION_TOGGLES.map((item) => {
                      const checked = data.pages.sections[item.key];
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() =>
                            setData((prev) => ({
                              ...prev,
                              pages: {
                                ...prev.pages,
                                sections: {
                                  ...prev.pages.sections,
                                  [item.key]: !checked,
                                },
                              },
                            }))
                          }
                          className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                            checked
                              ? "bg-[var(--accent)]/10 border-[var(--accent)]/60"
                              : "bg-[var(--bg)] border-[var(--border)] hover:border-[var(--border-strong)]"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[var(--ink)]">{item.label}</div>
                            <div className="text-[11px] text-[var(--ink-muted)] truncate">
                              {item.hint}
                            </div>
                          </div>
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition ${
                              checked
                                ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-ink)]"
                                : "border-[var(--border-strong)]"
                            }`}
                          >
                            {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="pb-nav" label="Top navigation links" hint="Max 5 links" />
                    <input
                      id="pb-nav"
                      name="navLinks"
                      type="text"
                      value={data.pages.navLinks}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          pages: { ...prev.pages, navLinks: e.target.value },
                        }))
                      }
                      placeholder="e.g. Work, Services, Pricing, About, Contact"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-order" label="Custom section order" hint="Empty → DEFAULT" />
                    <input
                      id="pb-order"
                      name="sectionOrder"
                      type="text"
                      value={data.pages.sectionOrder}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          pages: { ...prev.pages, sectionOrder: e.target.value },
                        }))
                      }
                      placeholder="Leave blank for smart editorial flow"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel
                    htmlFor="pb-popups"
                    label="Pop-up panels needed (modals)"
                    hint="e.g. Privacy, Terms, case studies"
                  />
                  <input
                    id="pb-popups"
                    name="popupPanels"
                    type="text"
                    value={data.pages.popupPanels}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        pages: { ...prev.pages, popupPanels: e.target.value },
                      }))
                    }
                    placeholder="e.g. Privacy, Terms, case study details"
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {/* STEP 4: ASSETS */}
            {activeStep === "assets" && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
                      Your own images / logos (Optional)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setData((prev) => ({
                          ...prev,
                          assets: {
                            ...prev.assets,
                            items: [
                              ...prev.assets.items,
                              { fileName: "", description: "", whereToUse: "", altText: "" },
                            ],
                          },
                        }))
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add image file
                    </button>
                  </div>

                  {data.assets.items.length === 0 ? (
                    <div className="p-4 rounded-xl bg-[var(--bg)] border border-dashed border-[var(--border-strong)] text-xs text-[var(--ink-secondary)] leading-relaxed">
                      No custom image files listed — that&apos;s totally fine! The AI will automatically
                      create custom inline SVG &amp; CSS visual art so your website works with zero
                      broken image links.
                    </div>
                  ) : (
                    data.assets.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] grid grid-cols-1 sm:grid-cols-4 gap-2 items-center"
                      >
                        <input
                          type="text"
                          value={item.fileName}
                          onChange={(e) => {
                            const next = [...data.assets.items];
                            next[idx] = { ...item, fileName: e.target.value };
                            setData((prev) => ({
                              ...prev,
                              assets: { ...prev.assets, items: next },
                            }));
                          }}
                          placeholder="hero.jpg"
                          className="h-9 px-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs font-mono text-[var(--ink)]"
                        />
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => {
                            const next = [...data.assets.items];
                            next[idx] = { ...item, description: e.target.value };
                            setData((prev) => ({
                              ...prev,
                              assets: { ...prev.assets, items: next },
                            }));
                          }}
                          placeholder="What it shows"
                          className="h-9 px-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)]"
                        />
                        <input
                          type="text"
                          value={item.whereToUse}
                          onChange={(e) => {
                            const next = [...data.assets.items];
                            next[idx] = { ...item, whereToUse: e.target.value };
                            setData((prev) => ({
                              ...prev,
                              assets: { ...prev.assets, items: next },
                            }));
                          }}
                          placeholder="Where (e.g. hero, nav)"
                          className="h-9 px-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)]"
                        />
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={item.altText}
                            onChange={(e) => {
                              const next = [...data.assets.items];
                              next[idx] = { ...item, altText: e.target.value };
                              setData((prev) => ({
                                ...prev,
                                assets: { ...prev.assets, items: next },
                              }));
                            }}
                            placeholder="Alt text"
                            className="flex-1 h-9 px-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setData((prev) => ({
                                ...prev,
                                assets: {
                                  ...prev.assets,
                                  items: prev.assets.items.filter((_, i) => i !== idx),
                                },
                              }))
                            }
                            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[var(--ink-muted)] hover:text-[var(--danger)] cursor-pointer"
                            aria-label="Remove asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="pb-video" label="Background video file" hint="Optional (< 8 MB)" />
                    <input
                      id="pb-video"
                      name="video"
                      type="text"
                      value={data.assets.video}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          assets: { ...prev.assets, video: e.target.value },
                        }))
                      }
                      placeholder="e.g. hero-loop.mp4 | hero"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-og" label="Social share image (1200×630)" hint="Empty → DEFAULT" />
                    <input
                      id="pb-og"
                      name="socialShareImage"
                      type="text"
                      value={data.assets.socialShareImage}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          assets: { ...prev.assets, socialShareImage: e.target.value },
                        }))
                      }
                      placeholder="e.g. og-image.jpg"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[var(--ink)] mb-2">
                    Embed images inside the HTML file as base64?
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(["NO (default)", "YES only for tiny logos and icons"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setData((prev) => ({
                            ...prev,
                            assets: { ...prev.assets, embedBase64: opt },
                          }))
                        }
                        className={`h-10 px-3.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          data.assets.embedBase64 === opt
                            ? "bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)]"
                            : "bg-[var(--bg)] border-[var(--border)] text-[var(--ink-secondary)]"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: CONTACT & SEO */}
            {activeStep === "contact" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="pb-email" label="Contact email" />
                    <input
                      id="pb-email"
                      name="email"
                      type="email"
                      value={data.contactSeo.email}
                      onChange={(e) => updateContact("email", e.target.value)}
                      placeholder="hello@yourbrand.com"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-phone" label="Phone number" hint="Optional" />
                    <input
                      id="pb-phone"
                      name="phone"
                      type="text"
                      value={data.contactSeo.phone}
                      onChange={(e) => updateContact("phone", e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-address" label="Location / Address" hint="Optional" />
                    <input
                      id="pb-address"
                      name="address"
                      type="text"
                      value={data.contactSeo.address}
                      onChange={(e) => updateContact("address", e.target.value)}
                      placeholder="e.g. Lisbon, Portugal"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-booking" label="Booking / Calendar link" hint="Optional" />
                    <input
                      id="pb-booking"
                      name="bookingLink"
                      type="text"
                      value={data.contactSeo.bookingLink}
                      onChange={(e) => updateContact("bookingLink", e.target.value)}
                      placeholder="e.g. https://cal.com/yourname"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="pb-form" label="Contact form handling" />
                    <input
                      id="pb-form"
                      name="formHandling"
                      type="text"
                      value={data.contactSeo.formHandling}
                      onChange={(e) => updateContact("formHandling", e.target.value)}
                      placeholder="mailto fallback / Netlify Forms / Formspree ID"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-socials" label="Social links" hint="Comma separated" />
                    <input
                      id="pb-socials"
                      name="socialLinks"
                      type="text"
                      value={data.contactSeo.socialLinks}
                      onChange={(e) => updateContact("socialLinks", e.target.value)}
                      placeholder="LinkedIn, Instagram, X, Dribbble URLs"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border)]">
                  <div>
                    <FieldLabel htmlFor="pb-url" label="Final website address" hint="Optional" />
                    <input
                      id="pb-url"
                      name="websiteAddress"
                      type="text"
                      value={data.contactSeo.websiteAddress}
                      onChange={(e) => updateContact("websiteAddress", e.target.value)}
                      placeholder="https://yourbrand.com"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-keyword" label="Main search keyword" hint="For Google SEO" />
                    <input
                      id="pb-keyword"
                      name="mainKeyword"
                      type="text"
                      value={data.contactSeo.mainKeyword}
                      onChange={(e) => updateContact("mainKeyword", e.target.value)}
                      placeholder="e.g. artisan sourdough bakery Austin"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-seotitle" label="SEO title" hint="Max 60 chars (or DEFAULT)" />
                    <input
                      id="pb-seotitle"
                      name="seoTitle"
                      type="text"
                      value={data.contactSeo.seoTitle}
                      onChange={(e) => updateContact("seoTitle", e.target.value)}
                      placeholder="Leave blank for AI to write"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-seodesc" label="SEO description" hint="Max 155 chars (or DEFAULT)" />
                    <input
                      id="pb-seodesc"
                      name="seoDescription"
                      type="text"
                      value={data.contactSeo.seoDescription}
                      onChange={(e) => updateContact("seoDescription", e.target.value)}
                      placeholder="Leave blank for AI to write"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <FieldLabel htmlFor="pb-schema" label="Business type (Schema)" />
                    <select
                      id="pb-schema"
                      name="schemaType"
                      value={data.contactSeo.schemaType}
                      onChange={(e) =>
                        updateContact(
                          "schemaType",
                          e.target.value as PromptBuilderData["contactSeo"]["schemaType"]
                        )
                      }
                      className={inputCls}
                    >
                      <option value="DEFAULT">Let AI choose</option>
                      <option value="Organization">Organization</option>
                      <option value="LocalBusiness">Local Business</option>
                      <option value="Person">Personal / Freelancer</option>
                      <option value="Product">Product / App</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-lang" label="Language code" />
                    <input
                      id="pb-lang"
                      name="language"
                      type="text"
                      value={data.contactSeo.language}
                      onChange={(e) => updateContact("language", e.target.value)}
                      placeholder="en"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pb-analytics" label="Analytics" />
                    <input
                      id="pb-analytics"
                      name="analytics"
                      type="text"
                      value={data.contactSeo.analytics}
                      onChange={(e) => updateContact("analytics", e.target.value)}
                      placeholder="none / Plausible / GA ID"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: REFERENCES */}
            {activeStep === "references" && (
              <div className="space-y-5">
                <div>
                  <FieldLabel
                    htmlFor="pb-likes"
                    label="Websites or Framer templates you like — and WHAT you like about them"
                  />
                  <textarea
                    id="pb-likes"
                    name="likes"
                    rows={4}
                    value={data.references.likes}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        references: { ...prev.references, likes: e.target.value },
                      }))
                    }
                    placeholder='e.g. "Fabrica: giant wordmark and numbered services. Stripe: crisp grids and clear typography."'
                    className={textareaCls}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="pb-dislikes" label="Things you dislike or want to avoid" />
                  <textarea
                    id="pb-dislikes"
                    name="dislikes"
                    rows={3}
                    value={data.references.dislikes}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        references: { ...prev.references, dislikes: e.target.value },
                      }))
                    }
                    placeholder='e.g. "Purple gradients, cluttered cards, too much animation, stock smiling office photos."'
                    className={textareaCls}
                  />
                </div>
              </div>
            )}

            {/* STEP 7: MOTION */}
            {activeStep === "motion" && (
              <div className="space-y-6">
                <div>
                  <span className="block text-xs font-semibold text-[var(--ink)] mb-2.5">
                    Animation level
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(["none", "subtle (recommended)", "expressive"] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() =>
                          setData((prev) => ({
                            ...prev,
                            motion: { ...prev.motion, amount: level },
                          }))
                        }
                        className={`h-11 px-4 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          data.motion.amount === level
                            ? "bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)]"
                            : "bg-[var(--bg)] border-[var(--border)] text-[var(--ink-secondary)] hover:text-[var(--ink)]"
                        }`}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[var(--ink)] mb-2.5">
                    Allowed motion effects
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {MOTION_TOGGLES.map((item) => {
                      const active = data.motion.allow[item.key];
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() =>
                            setData((prev) => ({
                              ...prev,
                              motion: {
                                ...prev.motion,
                                allow: { ...prev.motion.allow, [item.key]: !active },
                              },
                            }))
                          }
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
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
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[var(--ink)] mb-2.5">
                    Include a Dark / Light theme toggle button on the website?
                  </span>
                  <div className="flex gap-2">
                    {(["yes", "no"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setData((prev) => ({
                            ...prev,
                            motion: { ...prev.motion, darkLightToggle: opt },
                          }))
                        }
                        className={`h-10 px-6 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          data.motion.darkLightToggle === opt
                            ? "bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)]"
                            : "bg-[var(--bg)] border-[var(--border)] text-[var(--ink-secondary)]"
                        }`}
                      >
                        {opt === "yes" ? "Yes, include toggle" : "No toggle"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 8: READY PROMPT OUTPUT */}
            {activeStep === "output" && (
              <div className="space-y-5">
                {/* 3-Step Visual Workflow */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    ["1. Copy Prompt", "Includes the full Framer-level spec + your 7 auto-completed files."],
                    ["2. Paste Into Any AI", "Send to ChatGPT, Claude, Gemini, or Cursor to generate index.html."],
                    ["3. Run in VYVO", "Copy the AI's index.html back into VYVO and press RUN MY WEBSITE."],
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

                {/* Primary Copy & Export Buttons */}
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
                    className="h-12 px-4 rounded-xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-semibold text-[var(--ink)] inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title="Useful when updating an existing website later"
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
                    className="h-12 px-4 rounded-xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-semibold text-[var(--ink)] inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download (.zip)</span>
                  </button>
                </div>

                {/* Preview Toggle & Read-Only Box */}
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

                  <pre className="p-4 max-h-[420px] overflow-auto font-mono text-xs text-[var(--ink-secondary)] whitespace-pre-wrap break-words leading-relaxed">
                    {previewMode === "full" ? fullPromptText : filesOnlyText}
                  </pre>
                </div>

                {/* Direct Jump Back to Runner */}
                <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[var(--ink)]">
                      Already generated your <code className="font-mono text-[var(--accent)]">index.html</code>?
                    </p>
                    <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
                      Head back to VYVO&apos;s runner, paste the code, and see your website live.
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
                    {stepIndex === STEPS.length - 2 ? "Review & Copy Prompt" : "Next Step"}
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

          {/* Right Sticky Live File Preview & Instant Copy Sidebar (Desktop) */}
          <aside className="hidden lg:flex lg:col-span-4 flex-col gap-4 sticky top-[7.5rem]">
            <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
                  Prompt Readiness
                </span>
                <span className="text-xs font-semibold text-[var(--accent)]">
                  {stats.totalFilled} answered · gaps auto-filled
                </span>
              </div>

              <div className="h-1.5 rounded-full bg-[var(--bg)] overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)] transition-all duration-300"
                  style={{
                    width: `${Math.max(12, Math.round((stats.totalFilled / stats.totalQuestions) * 100))}%`,
                  }}
                />
              </div>

              <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
                You can copy your Master Prompt at any time — every skipped answer automatically
                turns into <code className="font-mono text-[var(--ink)]">DEFAULT</code> so the AI
                fills the gaps cleanly.
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

            {/* Live Active File Snippet Preview */}
            {activeFilePreview && currentStepMeta.fileName && (
              <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
                <div className="px-4 py-2.5 border-b border-[var(--border)] flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-[var(--ink)]">
                    {currentStepMeta.fileName}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                    Live Preview
                  </span>
                </div>
                <pre className="p-4 max-h-72 overflow-auto font-mono text-[11px] text-[var(--ink-secondary)] whitespace-pre-wrap break-words leading-relaxed bg-[var(--bg)]">
                  {activeFilePreview}
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
