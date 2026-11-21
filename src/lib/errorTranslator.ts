import type { RuntimeError } from "./types";

export function translateError(
  rawMessage: string,
  opts: {
    type?: RuntimeError["type"];
    file?: string;
    line?: number;
    column?: number;
    stack?: string;
  } = {}
): RuntimeError {
  const msg = (rawMessage || "Unknown error").trim();
  const type = opts.type ?? "runtime";

  if (type === "timeout" || /timed out|infinite loop/i.test(msg)) {
    return {
      type: "timeout",
      title: "Your website took too long to respond",
      friendlyMessage:
        "Part of the code got stuck repeating itself forever, so VYVO safely paused it to keep your browser smooth.",
      rawMessage: msg,
      file: opts.file,
      line: opts.line,
      column: opts.column,
      stack: opts.stack,
    };
  }

  if (
    /Failed to fetch|NetworkError|dynamically imported module|ERR_INTERNET_DISCONNECTED|Load failed/i.test(
      msg
    )
  ) {
    return {
      type: "network",
      title: "A required package couldn't be loaded",
      friendlyMessage:
        "This website relies on an external web package that couldn't be reached right now. Check your internet connection, or let VYVO fix the import.",
      rawMessage: msg,
      file: opts.file,
      line: opts.line,
      column: opts.column,
      stack: opts.stack,
    };
  }

  const notDefinedMatch = msg.match(/([A-Za-z_$][\w$]*) is not defined/);
  if (notDefinedMatch) {
    const symbol = notDefinedMatch[1];
    return {
      type,
      title: "Something is missing from the code",
      friendlyMessage: `Your website tried to use "${symbol}", but the AI forgot to include or connect it.`,
      rawMessage: msg,
      file: opts.file,
      line: opts.line,
      column: opts.column,
      stack: opts.stack,
    };
  }

  if (/Unexpected end of input|Unexpected token|Unterminated|Missing semicolon|Adjacent JSX elements/i.test(msg)) {
    return {
      type: "compile",
      title: "The code looks incomplete or has a small typo",
      friendlyMessage:
        "Sometimes AI responses get cut off at the bottom or miss a closing tag or bracket. VYVO can help repair it.",
      rawMessage: msg,
      file: opts.file,
      line: opts.line,
      column: opts.column,
      stack: opts.stack,
    };
  }

  if (/Cannot read propert(y|ies) of (undefined|null)|null is not an object|undefined is not an object/i.test(msg)) {
    return {
      type,
      title: "Part of the page wasn't ready yet",
      friendlyMessage:
        "The code tried to read information from something that doesn't exist yet on the page.",
      rawMessage: msg,
      file: opts.file,
      line: opts.line,
      column: opts.column,
      stack: opts.stack,
    };
  }

  if (/is not a function/i.test(msg)) {
    return {
      type,
      title: "An action couldn't run properly",
      friendlyMessage:
        "The code tried to trigger an action or component that wasn't set up the way it expected.",
      rawMessage: msg,
      file: opts.file,
      line: opts.line,
      column: opts.column,
      stack: opts.stack,
    };
  }

  if (/Invalid hook call|Rendered more hooks|Hooks can only be called/i.test(msg)) {
    return {
      type,
      title: "A React component setup issue happened",
      friendlyMessage:
        "One of the interactive components wasn't structured the way React expects. VYVO can help straighten it out.",
      rawMessage: msg,
      file: opts.file,
      line: opts.line,
      column: opts.column,
      stack: opts.stack,
    };
  }

  if (/Element type is invalid|Objects are not valid as a React child/i.test(msg)) {
    return {
      type,
      title: "A visual component couldn't be drawn",
      friendlyMessage:
        "One of the building blocks in your website wasn't exported or formatted in a way the browser can display.",
      rawMessage: msg,
      file: opts.file,
      line: opts.line,
      column: opts.column,
      stack: opts.stack,
    };
  }

  return {
    type,
    title: "Your website couldn't load",
    friendlyMessage:
      "There's a small problem inside the pasted code that stopped the website from starting cleanly.",
    rawMessage: msg,
    file: opts.file,
    line: opts.line,
    column: opts.column,
    stack: opts.stack,
  };
}
