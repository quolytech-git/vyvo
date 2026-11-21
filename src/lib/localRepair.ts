import type { ProjectFile, RepairProposal, RuntimeError } from "./types";

/**
 * Deterministic local repair engine that fixes common copy-paste and AI-truncation
 * issues immediately — even offline or without any AI API key configured!
 */
export function attemptLocalRepair(
  files: Record<string, ProjectFile>,
  entryFile: string,
  error: RuntimeError
): RepairProposal | null {
  const file = files[entryFile];
  if (!file || file.isBinary) return null;

  let code = file.content;
  const changes: string[] = [];

  // 1. Strip stray markdown backticks or AI prose that slipped into the file
  if (/^```[\w-]*\r?\n/.test(code.trim()) || /\r?\n```\s*$/.test(code.trim())) {
    code = code
      .trim()
      .replace(/^```[\w-]*\r?\n/, "")
      .replace(/\r?\n```\s*$/, "")
      .trim();
    changes.push("Removed leftover markdown code fences copied from the AI chat.");
  }

  // 2. Fix missing React/hook imports mentioned in ReferenceError ("useState is not defined", etc.)
  const notDefined = error.rawMessage.match(/([A-Za-z_$][\w$]*) is not defined/);
  if (notDefined) {
    const sym = notDefined[1];
    const knownReactHooks = new Set([
      "useState",
      "useEffect",
      "useRef",
      "useMemo",
      "useCallback",
      "useReducer",
      "useContext",
      "Fragment",
      "createContext",
    ]);
    if (sym === "React" && !/import\s+React\b/.test(code)) {
      code = `import React from "react";\n${code}`;
      changes.push('Added missing "React" import at the top of the file.');
    } else if (knownReactHooks.has(sym)) {
      code = `import { ${sym} } from "react";\n${code}`;
      changes.push(`Connected the missing React feature "${sym}".`);
    }
  }

  // 3. Fix missing export default for React components
  if (/Could not find a React component to display/i.test(error.rawMessage)) {
    const match = code.match(/(?:function|const)\s+([A-Z][A-Za-z0-9_]*)\b/);
    if (match && !/\bexport\s+default\b/.test(code)) {
      code += `\n\nexport default ${match[1]};\n`;
      changes.push(`Set "${match[1]}" as the main component to display.`);
    }
  }

  // 4. Balance truncated braces/parentheses at end of JS/TSX file (common when AI output stops early)
  if (/Unexpected end of input|Unexpected token|Unterminated/i.test(error.rawMessage)) {
    if (/\.html?$/i.test(entryFile)) {
      if (/<script[^>]*>/i.test(code) && !/<\/script>/i.test(code)) {
        code += "\n</script>";
        changes.push("Closed an unclosed <script> tag.");
      }
      if (/<style[^>]*>/i.test(code) && !/<\/style>/i.test(code)) {
        code += "\n</style>";
        changes.push("Closed an unclosed <style> tag.");
      }
      if (/<body[^>]*>/i.test(code) && !/<\/body>/i.test(code)) {
        code += "\n</body>";
        changes.push("Closed the unfinished <body> section.");
      }
      if (/<html[^>]*>/i.test(code) && !/<\/html>/i.test(code)) {
        code += "\n</html>";
        changes.push("Closed the unfinished <html> document.");
      }
    } else {
      // Fix missing closing braces / parens if clearly slightly unbalanced (1-3 missing)
      const openCurly = (code.match(/\{/g) || []).length;
      const closeCurly = (code.match(/\}/g) || []).length;
      const openParen = (code.match(/\(/g) || []).length;
      const closeParen = (code.match(/\)/g) || []).length;

      if (openParen > closeParen && openParen - closeParen <= 2) {
        code += ")".repeat(openParen - closeParen);
        changes.push("Added missing closing parenthesis.");
      }
      if (openCurly > closeCurly && openCurly - closeCurly <= 3) {
        code += "\n" + "}".repeat(openCurly - closeCurly);
        changes.push("Added missing closing brace.");
      }
    }
  }

  // 5. Fix common class= inside JSX -> className=
  if (/\.(?:jsx|tsx)$/i.test(entryFile) && /\sclass="/.test(code)) {
    code = code.replace(/\sclass="/g, ' className="');
    changes.push('Updated HTML "class" attributes to React "className".');
  }

  // 6. Fix broken infinite loop if timeout occurred
  if (error.type === "timeout" && /while\s*\(\s*true\s*\)/.test(code)) {
    code = code.replace(
      /while\s*\(\s*true\s*\)\s*\{/g,
      "for (let __safe = 0; __safe < 1000; __safe++) {"
    );
    changes.push("Replaced an endless 'while (true)' loop with a safe bounded loop.");
  }

  if (changes.length === 0 || code === file.content) {
    return null;
  }

  return {
    explanation: changes.join(" "),
    fixedFiles: { [entryFile]: code },
    source: "local",
    changesSummary: changes,
  };
}
