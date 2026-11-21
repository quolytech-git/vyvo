"use client";

import React, { useRef, useState } from "react";
import {
  ArrowRight,
  ClipboardPaste,
  Eraser,
  FileArchive,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { VYVO_EXAMPLES, type VyvoExample } from "@/lib/examples";

interface HomeViewProps {
  code: string;
  onChangeCode: (value: string) => void;
  onRun: (codeOverride?: string) => void;
  onUploadZip: (file: File) => void;
  onOpenPrompts: () => void;
  onNotify: (message: string) => void;
}

export function HomeView({
  code,
  onChangeCode,
  onRun,
  onUploadZip,
  onOpenPrompts,
  onNotify,
}: HomeViewProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const hasCode = code.trim().length > 0;

  async function handlePasteClipboard() {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        textareaRef.current?.focus();
        onNotify("Tap inside the box and paste your code.");
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        onNotify("Your clipboard looks empty. Copy code from an AI first.");
        return;
      }
      onChangeCode(text);
      onNotify("Code pasted! Press RUN MY WEBSITE to see it live.");
    } catch {
      textareaRef.current?.focus();
      onNotify("Tap inside the box and press Paste (Ctrl+V / ⌘V).");
    }
  }

  function handleSelectExample(example: VyvoExample) {
    setExamplesOpen(false);
    onChangeCode(example.code);
    onRun(example.code);
  }

  function handleClear() {
    onChangeCode("");
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && hasCode) {
      e.preventDefault();
      onRun();
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.name.toLowerCase().endsWith(".zip")) {
      onUploadZip(file);
    } else if (/\.(?:html?|jsx?|tsx?|css|txt)$/i.test(file.name)) {
      file.text().then((text) => {
        onChangeCode(text);
        onNotify(`Loaded ${file.name}`);
      });
    } else {
      onNotify("Drop a .zip project or a website code file (.html, .tsx, .jsx, .js).");
    }
  }

  return (
    <main className="flex-1 flex flex-col justify-center w-full max-w-3xl mx-auto px-4 sm:px-6 pt-3 pb-safe-page sm:py-8 animate-vyvo-in">
      {/* Hero Headline */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-[1.85rem] sm:text-[2.75rem] font-extrabold tracking-[-0.035em] leading-[1.12] text-[var(--ink)]">
          Your AI wrote the code.{" "}
          <span className="text-[var(--accent)]">VYVO</span> brings it to life.
        </h1>
        <p className="mt-3 sm:mt-4 text-sm sm:text-[1.06rem] text-[var(--ink-secondary)] max-w-xl mx-auto leading-relaxed">
          Copy code from any AI, paste it here, and instantly see your website. No coding skills
          required.
        </p>
      </div>

      {/* Dominant Paste Card */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl bg-[var(--surface)] border transition-colors ${
          isDragging
            ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/25"
            : "border-[var(--border)] focus-within:border-[var(--border-strong)]"
        }`}
      >
        {/* Minimal top action bar inside paste card */}
        <div className="flex items-center justify-between gap-2 px-3.5 sm:px-4 py-2.5 border-b border-[var(--border)] flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Try an example */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setExamplesOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Try an example</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${examplesOpen ? "rotate-180" : ""}`}
                />
              </button>

              {examplesOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setExamplesOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 rounded-xl bg-[var(--surface)] border border-[var(--border-strong)] shadow-2xl p-1.5 z-30 animate-vyvo-in">
                    {VYVO_EXAMPLES.map((ex) => (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => handleSelectExample(ex)}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[var(--surface-hover)] transition cursor-pointer group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                            {ex.name}
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--ink-secondary)]">
                            {ex.badge}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--ink-muted)] mt-0.5 line-clamp-2">
                          {ex.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Paste from clipboard */}
            <button
              type="button"
              onClick={handlePasteClipboard}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition cursor-pointer"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Paste from clipboard</span>
            </button>

            {/* Clear code */}
            {hasCode && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--danger)] hover:bg-[var(--surface-hover)] transition cursor-pointer"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Clear code</span>
              </button>
            )}
          </div>

          {/* Upload ZIP for larger multi-file projects */}
          <div>
            <input
              ref={fileInputRef}
              id="vyvo-zip-upload"
              name="zipFile"
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUploadZip(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition cursor-pointer"
              title="Import a ZIP folder containing multiple website files"
            >
              <FileArchive className="w-3.5 h-3.5" />
              <span>Upload ZIP</span>
            </button>
          </div>
        </div>

        {/* Main Code Textarea */}
        <textarea
          ref={textareaRef}
          id="vyvo-code-input"
          name="code"
          value={code}
          onChange={(e) => onChangeCode(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste your AI-generated code here..."
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="Paste your AI-generated code here"
          className="w-full h-56 sm:h-72 p-4 sm:p-5 bg-transparent text-[var(--ink)] placeholder:text-[var(--ink-muted)] font-mono text-[13px] sm:text-sm leading-relaxed resize-none focus:outline-none"
        />

        {isDragging && (
          <div className="absolute inset-0 rounded-2xl bg-[var(--surface)]/95 flex flex-col items-center justify-center gap-2 pointer-events-none">
            <FileArchive className="w-8 h-8 text-[var(--accent)]" />
            <p className="text-sm font-semibold text-[var(--ink)]">
              Drop your ZIP or website code file
            </p>
          </div>
        )}
      </div>

      {/* Prominent Primary Action */}
      <div className="mt-4 sm:mt-5 flex flex-col items-center">
        <button
          type="button"
          onClick={() => {
            if (!hasCode) {
              textareaRef.current?.focus();
              onNotify("Paste code from ChatGPT, Claude, or Gemini first — or click Try an example.");
              return;
            }
            onRun();
          }}
          className="w-full sm:w-auto sm:min-w-[300px] h-14 px-8 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] active:scale-[0.99] text-[var(--accent-ink)] font-bold text-base tracking-[-0.01em] inline-flex items-center justify-center gap-2.5 transition cursor-pointer shadow-sm"
        >
          <span>RUN MY WEBSITE</span>
          <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
        </button>

        <p className="mt-3.5 text-xs sm:text-[13px] text-[var(--ink-muted)] text-center">
          Works with ChatGPT, Claude, Gemini and more.
        </p>

        <button
          type="button"
          onClick={onOpenPrompts}
          className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--accent)] transition cursor-pointer"
        >
          <span>Don&apos;t have code yet? Build a guided AI website prompt</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </main>
  );
}
