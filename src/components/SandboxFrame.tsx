"use client";

import React, { useEffect, useRef, useState } from "react";
import type { RuntimeError, RuntimeLog } from "@/lib/types";
import { translateError } from "@/lib/errorTranslator";

interface SandboxFrameProps {
  html: string;
  runId: string;
  requiresNetwork?: boolean;
  onReady: (pageTitle?: string) => void;
  onError: (error: RuntimeError) => void;
  onConsole: (log: RuntimeLog) => void;
  onNavigatePage: (href: string) => void;
}

export function SandboxFrame({
  html,
  runId,
  requiresNetwork = false,
  onReady,
  onError,
  onConsole,
  onNavigatePage,
}: SandboxFrameProps) {
  const [loaded, setLoaded] = useState(false);
  const readyRef = useRef(false);

  // Store latest callbacks in refs so the message listener stays rock-solid
  const callbacksRef = useRef({ onReady, onError, onConsole, onNavigatePage });
  callbacksRef.current = { onReady, onError, onConsole, onNavigatePage };

  useEffect(() => {
    readyRef.current = false;
    setLoaded(false);

    // Boot watchdog timeout (protects against hangs or unreachable CDN packages)
    const timeoutMs = requiresNetwork ? 14000 : 8000;
    const watchdog = window.setTimeout(() => {
      if (!readyRef.current) {
        const offline = typeof navigator !== "undefined" && !navigator.onLine;
        if (offline && requiresNetwork) {
          callbacksRef.current.onError(
            translateError("Failed to fetch dynamically imported module (offline)", {
              type: "network",
            })
          );
        } else {
          callbacksRef.current.onError(
            translateError("Execution timed out while starting your website.", {
              type: "timeout",
            })
          );
        }
      }
    }, timeoutMs);

    function handleMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || typeof data !== "object" || data.source !== "vyvo-sandbox") return;
      if (data.runId !== runId) return;

      if (data.type === "ready") {
        readyRef.current = true;
        setLoaded(true);
        window.clearTimeout(watchdog);
        callbacksRef.current.onReady(typeof data.title === "string" ? data.title : undefined);
      } else if (data.type === "error") {
        readyRef.current = true;
        setLoaded(true);
        window.clearTimeout(watchdog);
        const translated = translateError(String(data.message || "Runtime error"), {
          type: /timed out|infinite loop/i.test(String(data.message || "")) ? "timeout" : "runtime",
          line: typeof data.line === "number" ? data.line : undefined,
          column: typeof data.column === "number" ? data.column : undefined,
          stack: typeof data.stack === "string" ? data.stack : undefined,
        });
        callbacksRef.current.onError(translated);
      } else if (data.type === "console") {
        callbacksRef.current.onConsole({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          level: data.level || "log",
          message: String(data.message ?? ""),
          timestamp: Date.now(),
        });
      } else if (data.type === "navigate" && typeof data.href === "string") {
        callbacksRef.current.onNavigatePage(data.href);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => {
      window.clearTimeout(watchdog);
      window.removeEventListener("message", handleMessage);
    };
  }, [runId, html, requiresNetwork]);

  return (
    <div className="relative w-full h-full bg-white">
      {!loaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[var(--bg)] text-[var(--ink-secondary)]">
          <div className="w-6 h-6 rounded-full border-2 border-[var(--border-strong)] border-t-[var(--accent)] animate-spin" />
          <p className="text-xs font-medium tracking-wide">Starting your website…</p>
        </div>
      )}
      <iframe
        key={runId}
        title="VYVO Live Website Preview"
        srcDoc={html}
        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads allow-pointer-lock"
        referrerPolicy="no-referrer"
        className="w-full h-full border-0 block bg-white"
        onLoad={() => {
          // If an HTML document had no script execution blocking, mark loaded gently after iframe load
          setTimeout(() => {
            if (!readyRef.current) {
              readyRef.current = true;
              setLoaded(true);
              callbacksRef.current.onReady();
            }
          }, 350);
        }}
      />
    </div>
  );
}
