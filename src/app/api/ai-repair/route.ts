import { NextRequest, NextResponse } from "next/server";

type SupportedProvider = "gemini" | "openai" | "anthropic";

interface RepairRequestBody {
  files: Record<string, string>;
  entryFile: string;
  errorMessage: string;
  errorStack?: string;
  provider?: "auto" | SupportedProvider;
  userApiKey?: string;
}

interface ParsedRepair {
  explanation: string;
  fixedFiles: Record<string, string>;
}

const MAX_PAYLOAD_CHARS = 150_000;

function getServerConfiguredProviders(): SupportedProvider[] {
  const list: SupportedProvider[] = [];
  if (process.env.GEMINI_API_KEY) list.push("gemini");
  if (process.env.OPENAI_API_KEY) list.push("openai");
  if (process.env.ANTHROPIC_API_KEY) list.push("anthropic");
  return list;
}

function resolveProviderAndKey(
  requestedProvider: RepairRequestBody["provider"],
  userApiKey?: string
): { provider: SupportedProvider; apiKey: string } | null {
  const cleanUserKey = typeof userApiKey === "string" ? userApiKey.trim() : "";

  if (cleanUserKey) {
    if (requestedProvider && requestedProvider !== "auto") {
      return { provider: requestedProvider, apiKey: cleanUserKey };
    }
    // Auto-detect provider from key prefix when user provides a key with "auto"
    if (cleanUserKey.startsWith("sk-ant-")) return { provider: "anthropic", apiKey: cleanUserKey };
    if (cleanUserKey.startsWith("sk-")) return { provider: "openai", apiKey: cleanUserKey };
    return { provider: "gemini", apiKey: cleanUserKey };
  }

  // Fallback to server-side environment keys (never exposed to browser)
  const preferred = (requestedProvider && requestedProvider !== "auto"
    ? requestedProvider
    : (process.env.VYVO_AI_PROVIDER as SupportedProvider | undefined)) as
    | SupportedProvider
    | undefined;

  const envMap: Record<SupportedProvider, string | undefined> = {
    gemini: process.env.GEMINI_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
  };

  if (preferred && envMap[preferred]) {
    return { provider: preferred, apiKey: envMap[preferred]! };
  }

  for (const p of ["gemini", "openai", "anthropic"] as SupportedProvider[]) {
    if (envMap[p]) return { provider: p, apiKey: envMap[p]! };
  }

  return null;
}

function buildRepairPrompt(body: RepairRequestBody): { system: string; user: string } {
  const system = `You are VYVO's website repair assistant. Your user has NO programming knowledge.
Fix the broken frontend website code so it runs cleanly inside a browser sandbox.

STRICT RULES:
1. Respond with ONLY valid JSON matching this exact shape (no markdown fences, no extra text):
   {"explanation":"1-2 short, warm, plain-English sentences explaining what went wrong and how you fixed it without coding jargon.","fixedFiles":{"<exact filename>":"<complete repaired file contents>"}}
2. Return COMPLETE file contents for every file you fix (never use "..." or placeholders).
3. Keep the website's original design, text, and features intact — only fix what caused the error.
4. Ensure all imports, closing tags, brackets, and browser APIs work cleanly inside a standalone web browser.`;

  const fileSections = Object.entries(body.files)
    .map(([name, content]) => `--- FILE: ${name} ---\n${content}`)
    .join("\n\n");

  const user = `Entry file: ${body.entryFile}
Error observed: ${body.errorMessage}
${body.errorStack ? `Stack hint: ${body.errorStack.slice(0, 600)}` : ""}

Current project files:
${fileSections}

Return ONLY the JSON object with "explanation" and "fixedFiles".`;

  return { system, user };
}

function extractJsonResponse(rawText: string): ParsedRepair {
  const cleaned = rawText
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) {
      throw new Error("The AI returned an unexpected response format.");
    }
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  }

  const obj = parsed as Partial<ParsedRepair>;
  if (
    !obj ||
    typeof obj.explanation !== "string" ||
    !obj.fixedFiles ||
    typeof obj.fixedFiles !== "object"
  ) {
    throw new Error("The AI response did not include repaired files.");
  }

  const sanitizedFiles: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj.fixedFiles)) {
    if (typeof v === "string" && k.trim()) {
      sanitizedFiles[k.trim()] = v;
    }
  }
  if (Object.keys(sanitizedFiles).length === 0) {
    throw new Error("The AI returned no updated files.");
  }

  return {
    explanation: obj.explanation.trim(),
    fixedFiles: sanitizedFiles,
  };
}

async function callGemini(apiKey: string, system: string, user: string): Promise<string> {
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini request failed (${res.status}): ${errText.slice(0, 180)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned an empty response.");
  return text;
}

async function callOpenAI(apiKey: string, system: string, user: string): Promise<string> {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI request failed (${res.status}): ${errText.slice(0, 180)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned an empty response.");
  return text;
}

async function callAnthropic(apiKey: string, system: string, user: string): Promise<string> {
  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: 0.2,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Anthropic request failed (${res.status}): ${errText.slice(0, 180)}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = data.content?.find((c) => c.type === "text")?.text;
  if (!text) throw new Error("Anthropic returned an empty response.");
  return text;
}

export async function GET() {
  const providers = getServerConfiguredProviders();
  return NextResponse.json({
    serverConfigured: providers.length > 0,
    availableProviders: providers,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<RepairRequestBody>;
    if (!body || !body.files || typeof body.files !== "object" || !body.entryFile || !body.errorMessage) {
      return NextResponse.json(
        { error: "Missing website code or error information." },
        { status: 400 }
      );
    }

    const totalSize = Object.values(body.files).reduce(
      (sum, v) => sum + (typeof v === "string" ? v.length : 0),
      0
    );
    if (totalSize > MAX_PAYLOAD_CHARS) {
      return NextResponse.json(
        { error: "This website project is too large for automatic AI repair." },
        { status: 413 }
      );
    }

    const resolved = resolveProviderAndKey(body.provider, body.userApiKey);
    if (!resolved) {
      return NextResponse.json(
        {
          needsApiKey: true,
          error:
            "No AI provider key is configured yet. Add a Gemini, OpenAI, or Anthropic API key in AI Settings to enable full AI repairs.",
        },
        { status: 400 }
      );
    }

    const { system, user } = buildRepairPrompt(body as RepairRequestBody);
    let rawOutput = "";

    if (resolved.provider === "gemini") {
      rawOutput = await callGemini(resolved.apiKey, system, user);
    } else if (resolved.provider === "openai") {
      rawOutput = await callOpenAI(resolved.apiKey, system, user);
    } else {
      rawOutput = await callAnthropic(resolved.apiKey, system, user);
    }

    const parsed = extractJsonResponse(rawOutput);
    return NextResponse.json({
      explanation: parsed.explanation,
      fixedFiles: parsed.fixedFiles,
      provider: resolved.provider,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not complete AI repair.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
