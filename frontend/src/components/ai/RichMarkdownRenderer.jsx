import React, { useState } from "react";
import { Check, Copy, Code2, HelpCircle } from "lucide-react";
import InteractiveChart from "./InteractiveChart";
import MermaidDiagram from "./MermaidDiagram";
import InteractiveQuiz from "./InteractiveQuiz";
import InteractiveFlashcards from "./InteractiveFlashcards";

/**
 * Extract balanced curly braces { ... } starting at index startIdx
 */
function extractBalancedBraces(str, startIdx) {
  if (str[startIdx] !== "{") return null;
  let depth = 0;
  for (let i = startIdx; i < str.length; i++) {
    if (str[i] === "{") depth++;
    else if (str[i] === "}") {
      depth--;
      if (depth === 0) {
        return { content: str.slice(startIdx + 1, i), endIdx: i };
      }
    }
  }
  return null;
}

/**
 * Format superscripts (^{...} or ^X) and subscripts (_{...} or _X)
 */
function formatSubscriptsAndSuperscripts(text, keyPrefix) {
  if (!text) return null;
  const tokens = text.split(/(\^\{[^{}]+\}|\^[0-9a-zA-Z]|_\{[^{}]+\}|_[0-9a-zA-Z])/g);
  return tokens.map((tok, tIdx) => {
    if (tok.startsWith("^")) {
      const val = tok.startsWith("^{") ? tok.slice(2, -1) : tok.slice(1);
      return (
        <sup
          key={`${keyPrefix}-sup-${tIdx}`}
          className="text-[0.75em] text-violet-600 dark:text-violet-400 font-semibold align-super"
        >
          {val}
        </sup>
      );
    }
    if (tok.startsWith("_")) {
      const val = tok.startsWith("_{") ? tok.slice(2, -1) : tok.slice(1);
      return (
        <sub
          key={`${keyPrefix}-sub-${tIdx}`}
          className="text-[0.75em] text-violet-600 dark:text-violet-400 font-semibold align-sub"
        >
          {val}
        </sub>
      );
    }
    return tok;
  });
}

/**
 * Recursive parser for fractions, square roots, and math tokens
 */
function parseMathTokens(str, keyPrefix = "m") {
  const elements = [];
  let idx = 0;
  let partIdx = 0;

  while (idx < str.length) {
    // Check for \frac, \dfrac, \tfrac
    const fracMatch = str.slice(idx).match(/^\\(?:frac|dfrac|tfrac)\s*\{/);
    if (fracMatch) {
      const openBrace1 = idx + fracMatch[0].length - 1;
      const numRes = extractBalancedBraces(str, openBrace1);
      if (numRes) {
        const afterNum = str.slice(numRes.endIdx + 1);
        const secondBraceMatch = afterNum.match(/^\s*\{/);
        if (secondBraceMatch) {
          const openBrace2 = numRes.endIdx + 1 + secondBraceMatch[0].length - 1;
          const denRes = extractBalancedBraces(str, openBrace2);
          if (denRes) {
            elements.push(
              <span
                key={`${keyPrefix}-frac-${partIdx++}`}
                className="inline-flex flex-col items-center align-middle mx-1 font-serif text-[0.9em]"
              >
                <span className="border-b border-current px-1 text-center leading-none pb-0.5">
                  {parseMathTokens(numRes.content, `${keyPrefix}-fn-${partIdx}`)}
                </span>
                <span className="px-1 text-center leading-none pt-0.5">
                  {parseMathTokens(denRes.content, `${keyPrefix}-fd-${partIdx}`)}
                </span>
              </span>
            );
            idx = denRes.endIdx + 1;
            continue;
          }
        }
      }
    }

    // Check for \sqrt{...}
    const sqrtMatch = str.slice(idx).match(/^\\sqrt\s*\{/);
    if (sqrtMatch) {
      const openBrace = idx + sqrtMatch[0].length - 1;
      const sqrtRes = extractBalancedBraces(str, openBrace);
      if (sqrtRes) {
        elements.push(
          <span
            key={`${keyPrefix}-sqrt-${partIdx++}`}
            className="inline-flex items-center mx-1 font-serif text-[0.95em]"
          >
            <span className="text-[1.1em] font-normal mr-0.5">√</span>
            <span className="border-t border-current px-1 text-center leading-none">
              {parseMathTokens(sqrtRes.content, `${keyPrefix}-sq-${partIdx}`)}
            </span>
          </span>
        );
        idx = sqrtRes.endIdx + 1;
        continue;
      }
    }

    // Find next special token (\frac or \sqrt)
    const nextSpecial = str.slice(idx).search(/\\(?:frac|dfrac|tfrac|sqrt)\s*\{/);
    const chunk = nextSpecial === -1 ? str.slice(idx) : str.slice(idx, idx + nextSpecial);

    elements.push(
      <React.Fragment key={`${keyPrefix}-ss-${partIdx++}`}>
        {formatSubscriptsAndSuperscripts(chunk, `${keyPrefix}-p-${partIdx}`)}
      </React.Fragment>
    );

    idx = nextSpecial === -1 ? str.length : idx + nextSpecial;
  }

  return elements;
}

/**
 * LaTeX / KaTeX Lightweight Math Formatter
 * Formats fractions, square roots, superscripts, subscripts, and greek symbols cleanly in React
 */
function renderMathFormula(mathStr, isBlock = false) {
  let cleaned = (mathStr || "").trim();
  if (!cleaned) return null;

  // 1. Strip sizing parentheses/brackets: \left(, \right), \left[, \right], etc.
  cleaned = cleaned
    .replace(/\\left\s*([()[\]{}|.\\])/g, "$1")
    .replace(/\\right\s*([()[\]{}|.\\])/g, "$1")
    .replace(/\\left\b/g, "")
    .replace(/\\right\b/g, "");

  // 2. Unwrap text/font directives: \text{...}, \mathrm{...}, \textbf{...}, etc.
  let prevCleaned = "";
  while (
    prevCleaned !== cleaned &&
    /\\(?:text|mathrm|textbf|textit|mathbf|mathit|operatorname)\{([^{}]+)\}/.test(cleaned)
  ) {
    prevCleaned = cleaned;
    cleaned = cleaned.replace(
      /\\(?:text|mathrm|textbf|textit|mathbf|mathit|operatorname)\{([^{}]+)\}/g,
      "$1"
    );
  }

  // 3. Spacing commands
  cleaned = cleaned
    .replace(/\\qquad/g, "   ")
    .replace(/\\quad/g, "  ")
    .replace(/\\,/g, " ")
    .replace(/\\;/g, " ")
    .replace(/\\:/g, " ")
    .replace(/\\!/g, "");

  // 4. Extended LaTeX math symbols
  const symbolMap = {
    "\\times": "×",
    "\\cdot": "·",
    "\\div": "÷",
    "\\pm": "±",
    "\\mp": "∓",
    "\\neq": "≠",
    "\\le": "≤",
    "\\leq": "≤",
    "\\ge": "≥",
    "\\geq": "≥",
    "\\approx": "≈",
    "\\equiv": "≡",
    "\\sim": "∼",
    "\\propto": "∝",
    "\\sum": "∑",
    "\\prod": "∏",
    "\\int": "∫",
    "\\oint": "∮",
    "\\partial": "∂",
    "\\nabla": "∇",
    "\\infty": "∞",
    "\\in": "∈",
    "\\notin": "∉",
    "\\subset": "⊂",
    "\\subseteq": "⊆",
    "\\supset": "⊃",
    "\\supseteq": "⊇",
    "\\cup": "∪",
    "\\cap": "∩",
    "\\emptyset": "∅",
    "\\forall": "∀",
    "\\exists": "∃",
    "\\nexists": "∄",
    "\\rightarrow": "→",
    "\\to": "→",
    "\\leftarrow": "←",
    "\\Rightarrow": "⇒",
    "\\Leftarrow": "⇐",
    "\\Leftrightarrow": "⇔",
    "\\iff": "⇔",
    "\\therefore": "∴",
    "\\because": "∵",
    "\\alpha": "α",
    "\\beta": "β",
    "\\gamma": "γ",
    "\\delta": "δ",
    "\\epsilon": "ε",
    "\\varepsilon": "ε",
    "\\zeta": "ζ",
    "\\eta": "η",
    "\\theta": "θ",
    "\\vartheta": "θ",
    "\\iota": "ι",
    "\\kappa": "κ",
    "\\lambda": "λ",
    "\\mu": "μ",
    "\\nu": "ν",
    "\\xi": "ξ",
    "\\pi": "π",
    "\\rho": "ρ",
    "\\sigma": "σ",
    "\\tau": "τ",
    "\\upsilon": "υ",
    "\\phi": "φ",
    "\\varphi": "φ",
    "\\chi": "χ",
    "\\psi": "ψ",
    "\\omega": "ω",
    "\\Gamma": "Γ",
    "\\Delta": "Δ",
    "\\Theta": "Θ",
    "\\Lambda": "Λ",
    "\\Xi": "Ξ",
    "\\Pi": "Π",
    "\\Sigma": "Σ",
    "\\Upsilon": "Υ",
    "\\Phi": "Φ",
    "\\Psi": "Ψ",
    "\\Omega": "Ω"
  };

  Object.entries(symbolMap).forEach(([latex, unicode]) => {
    cleaned = cleaned.replaceAll(latex, unicode);
  });

  const parsedElements = parseMathTokens(cleaned);

  if (isBlock) {
    return (
      <div className="my-3 py-3 px-5 bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200/80 dark:border-violet-900/40 rounded-2xl text-center font-serif text-sm sm:text-base font-medium shadow-2xs text-violet-950 dark:text-violet-100 overflow-x-auto select-all">
        {parsedElements}
      </div>
    );
  }

  return (
    <span className="inline-block px-1.5 py-0.5 mx-0.5 font-serif italic text-xs sm:text-sm font-semibold rounded bg-violet-100/70 dark:bg-violet-950/50 text-violet-900 dark:text-violet-200 border border-violet-200/60 dark:border-violet-800/40 select-all">
      {parsedElements}
    </span>
  );
}

/**
 * Inline text token parser for bold, italic, code, and inline math
 */
function renderInlineTokens(text) {
  if (!text) return "";

  // Split on:
  // 1. Math formulas ($...$)
  // 2. Bold (**...** or __...__)
  // 3. Strikethrough (~~...~~)
  // 4. Inline code (`...`)
  // 5. Italic (*...* or _..._)
  // 6. Links ([text](url))
  const tokenRegex = /(\$[^$]+\$|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|`[^`]+`|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  let keyIdx = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${keyIdx++}`}>{text.substring(lastIndex, match.index)}</span>);
    }

    const token = match[0];

    // Math: $formula$
    if (token.startsWith("$") && token.endsWith("$") && token.length > 2) {
      parts.push(
        <React.Fragment key={`math-${keyIdx++}`}>
          {renderMathFormula(token.slice(1, -1), false)}
        </React.Fragment>
      );
    }
    // Bold: **text** or __text__
    else if ((token.startsWith("**") && token.endsWith("**")) || (token.startsWith("__") && token.endsWith("__"))) {
      parts.push(
        <strong key={`bold-${keyIdx++}`} className="font-semibold text-[#172033] dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    // Strikethrough: ~~text~~
    else if (token.startsWith("~~") && token.endsWith("~~")) {
      parts.push(
        <span key={`strike-${keyIdx++}`} className="line-through text-slate-400">
          {token.slice(2, -2)}
        </span>
      );
    }
    // Inline Code: `code`
    else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={`code-${keyIdx++}`}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-mono text-[11px] border border-violet-200/60 dark:border-violet-800/40"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    // Italic: *text* or _text_
    else if ((token.startsWith("*") && token.endsWith("*")) || (token.startsWith("_") && token.endsWith("_"))) {
      parts.push(
        <em key={`italic-${keyIdx++}`} className="italic text-[#172033] dark:text-slate-200">
          {token.slice(1, -1)}
        </em>
      );
    }
    // Link: [label](url)
    else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
      const linkMatch = token.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        parts.push(
          <a
            key={`link-${keyIdx++}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        parts.push(token);
      }
    } else {
      parts.push(token);
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`text-end-${keyIdx++}`}>{text.substring(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Syntax-colored Code Block Component
 */
const CodeBlock = ({ code, lang = "code" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple, safe keyword highlighting
  const renderHighlightedCode = (rawCode) => {
    const lines = rawCode.split("\n");
    return lines.map((line, lIdx) => {
      return (
        <div key={lIdx} className="table-row font-mono text-[11px] leading-relaxed">
          <span className="table-cell select-none pr-4 text-right text-slate-600 text-[10px]">
            {lIdx + 1}
          </span>
          <span className="table-cell whitespace-pre text-slate-200">
            {line}
          </span>
        </div>
      );
    });
  };

  return (
    <div className="relative my-3 rounded-2xl overflow-hidden border border-slate-800 bg-[#0A0E17] text-slate-100 shadow-md">
      <div className="flex items-center justify-between px-4 py-2 bg-[#121826] border-b border-slate-800/80">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-violet-400">
          <Code2 size={13} />
          <span>{lang || "code"}</span>
        </div>
        <button
          onClick={handleCopy}
          className="text-[10px] font-mono text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded hover:bg-slate-800"
        >
          {copied ? (
            <span className="text-emerald-400 flex items-center gap-1">
              <Check size={11} /> Copied!
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Copy size={11} /> Copy Code
            </span>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto max-h-[460px]">
        <div className="table w-full">{renderHighlightedCode(code)}</div>
      </div>
    </div>
  );
};

/**
 * Markdown Table Renderer
 */
const MarkdownTable = ({ rawRows }) => {
  if (!rawRows || rawRows.length < 2) return null;

  const parseRow = (row) =>
    row
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());

  const headerCells = parseRow(rawRows[0]);
  // row 1 is separator | --- | --- |
  const bodyRows = rawRows.slice(2).map(parseRow);

  return (
    <div className="my-3 overflow-x-auto rounded-2xl border border-[#E7EAF0] dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-[#F8FAFC] dark:bg-slate-900 border-b border-[#E7EAF0] dark:border-slate-800 text-[#172033] dark:text-slate-100 font-bold">
            {headerCells.map((h, i) => (
              <th key={i} className="p-3 font-semibold text-xs tracking-tight">
                {renderInlineTokens(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F1F4F9] dark:divide-slate-800 text-[#172033] dark:text-slate-200">
          {bodyRows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-[#F8FAFC] dark:hover:bg-slate-800/40 transition-colors">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="p-3 leading-relaxed">
                  {renderInlineTokens(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Main Rich Content Markdown Renderer
 */
export const RichMarkdownRenderer = ({ content = "", isStreaming = false }) => {
  if (!content) {
    if (isStreaming) {
      return (
        <div className="flex items-center gap-2.5 py-1.5 text-[#667085] dark:text-slate-400">
          <div className="flex gap-1.5 items-center">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse [animation-delay:200ms]" />
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse [animation-delay:400ms]" />
          </div>
          <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
            NEXORA AI Coach is formulating structured response...
          </span>
        </div>
      );
    }
    return null;
  }

  // 1. Extract Display Math blocks ($$...$$) and Fenced Code blocks (```lang ... ```)
  // Safely handles open fences during SSE streaming
  const segments = [];
  const blockRegex = /(```(\w*)\n?([\s\S]*?)```|\$\$([\s\S]*?)\$\$)/g;
  let lastIdx = 0;
  let match;

  while ((match = blockRegex.exec(content)) !== null) {
    if (match.index > lastIdx) {
      segments.push({ type: "text", value: content.slice(lastIdx, match.index) });
    }

    if (match[1]?.startsWith("```")) {
      segments.push({
        type: "fence",
        lang: (match[2] || "code").toLowerCase(),
        value: match[3] || ""
      });
    } else if (match[4]) {
      // Display math
      segments.push({
        type: "math_block",
        value: match[4]
      });
    }

    lastIdx = blockRegex.lastIndex;
  }

  // If there's an unclosed code block during active streaming (e.g. ``` without closing ```)
  if (lastIdx < content.length) {
    const remaining = content.slice(lastIdx);
    const unclosedFence = remaining.match(/```(\w*)\n?([\s\S]*)$/);
    if (unclosedFence) {
      const beforeFence = remaining.slice(0, unclosedFence.index);
      if (beforeFence) {
        segments.push({ type: "text", value: beforeFence });
      }
      segments.push({
        type: "fence",
        lang: (unclosedFence[1] || "code").toLowerCase(),
        value: unclosedFence[2] || ""
      });
    } else {
      segments.push({ type: "text", value: remaining });
    }
  }

  let keyCounter = 0;

  const renderTextSegment = (text) => {
    const lines = text.split("\n");
    const elements = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();
      const k = keyCounter++;

      if (!trimmed) {
        elements.push(<div key={k} className="h-1.5" />);
        i++;
        continue;
      }

      // Check for Markdown Table (starts with |)
      if (trimmed.startsWith("|") && trimmed.endsWith("|") && i + 1 < lines.length && lines[i + 1].trim().includes("---")) {
        const tableLines = [line];
        i++;
        while (i < lines.length && lines[i].trim().startsWith("|")) {
          tableLines.push(lines[i]);
          i++;
        }
        elements.push(<MarkdownTable key={k} rawRows={tableLines} />);
        continue;
      }

      // Horizontal Rule
      if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
        elements.push(<hr key={k} className="border-[#E7EAF0] dark:border-slate-800 my-3" />);
        i++;
        continue;
      }

      // Headings
      if (trimmed.startsWith("### ")) {
        elements.push(
          <h3 key={k} className="text-sm sm:text-base font-bold text-[#172033] dark:text-white font-display mt-3 mb-1">
            {renderInlineTokens(trimmed.slice(4))}
          </h3>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith("## ")) {
        elements.push(
          <h2 key={k} className="text-base sm:text-lg font-bold text-[#172033] dark:text-white font-display mt-3.5 mb-1.5">
            {renderInlineTokens(trimmed.slice(3))}
          </h2>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith("# ")) {
        elements.push(
          <h1 key={k} className="text-lg sm:text-xl font-bold text-[#172033] dark:text-white font-display mt-4 mb-2">
            {renderInlineTokens(trimmed.slice(2))}
          </h1>
        );
        i++;
        continue;
      }

      // Blockquote
      if (trimmed.startsWith("> ")) {
        elements.push(
          <div key={k} className="flex gap-2.5 pl-1 my-2">
            <div className="w-1 bg-violet-500 rounded-full shrink-0" />
            <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-300 italic leading-relaxed">
              {renderInlineTokens(trimmed.slice(2))}
            </p>
          </div>
        );
        i++;
        continue;
      }

      // Task List
      const leadingSpaces = (line.match(/^\s*/)[0] || "").length;
      const indentClass = leadingSpaces >= 4 ? "pl-7" : leadingSpaces >= 2 ? "pl-4" : "pl-1";

      if (trimmed.startsWith("- [ ] ")) {
        elements.push(
          <div key={k} className={`flex items-start gap-2.5 ${indentClass} py-1`}>
            <span className="w-4 h-4 mt-0.5 rounded border border-[#D0D5DD] dark:border-slate-700 shrink-0 bg-white dark:bg-slate-900" />
            <span className="text-xs sm:text-sm text-[#172033] dark:text-slate-200">{renderInlineTokens(trimmed.slice(6))}</span>
          </div>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith("- [x] ") || trimmed.startsWith("- [X] ")) {
        elements.push(
          <div key={k} className={`flex items-start gap-2.5 ${indentClass} py-1`}>
            <span className="w-4 h-4 mt-0.5 rounded bg-emerald-500 border border-emerald-500 shrink-0 flex items-center justify-center text-white">
              <Check size={11} />
            </span>
            <span className="text-xs sm:text-sm text-[#98A2B3] line-through">{renderInlineTokens(trimmed.slice(6))}</span>
          </div>
        );
        i++;
        continue;
      }

      // Bullet List
      const isBullet = trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ");
      if (isBullet) {
        const bulletText = trimmed.replace(/^[•\-*]\s*/, "");
        elements.push(
          <div key={k} className={`flex items-start gap-2.5 ${indentClass} py-0.5`}>
            <span className="text-violet-500 font-bold text-sm leading-none mt-1 shrink-0">•</span>
            <span className="flex-1 text-xs sm:text-sm text-[#172033] dark:text-slate-200 leading-relaxed">
              {renderInlineTokens(bulletText)}
            </span>
          </div>
        );
        i++;
        continue;
      }

      // Numbered List
      const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numberedMatch) {
        elements.push(
          <div key={k} className={`flex items-start gap-2.5 ${indentClass} py-0.5`}>
            <span className="w-5 text-right font-mono text-cyan-600 dark:text-cyan-400 font-bold text-xs shrink-0 mt-0.5">
              {numberedMatch[1]}.
            </span>
            <span className="flex-1 text-xs sm:text-sm text-[#172033] dark:text-slate-200 leading-relaxed">
              {renderInlineTokens(numberedMatch[2])}
            </span>
          </div>
        );
        i++;
        continue;
      }

      // Quick Question Callout
      if (trimmed.endsWith("?") && trimmed.length < 120 && !trimmed.includes("\n")) {
        elements.push(
          <div
            key={k}
            className="p-3.5 rounded-2xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200/80 dark:border-violet-900/40 text-[#172033] dark:text-slate-100 font-medium my-2 shadow-2xs"
          >
            <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">
              <HelpCircle size={12} />
              <span>Diagnostic Question</span>
            </div>
            <div className="text-xs sm:text-sm text-[#172033] dark:text-slate-200">{renderInlineTokens(trimmed)}</div>
          </div>
        );
        i++;
        continue;
      }

      // Standard Paragraph
      elements.push(
        <p key={k} className="text-xs sm:text-sm text-[#172033] dark:text-slate-200 leading-relaxed my-1">
          {renderInlineTokens(trimmed)}
        </p>
      );
      i++;
    }

    return elements;
  };

  return (
    <div className="space-y-1.5 leading-relaxed text-xs sm:text-sm">
      {segments.map((seg, idx) => {
        if (seg.type === "fence") {
          const l = seg.lang;
          if (l === "chart" || l === "recharts") {
            return <InteractiveChart key={idx} spec={seg.value} />;
          }
          if (l === "mermaid") {
            return <MermaidDiagram key={idx} code={seg.value} />;
          }
          if (l === "quiz") {
            return <InteractiveQuiz key={idx} spec={seg.value} />;
          }
          if (l === "flashcards" || l === "flashcard") {
            return <InteractiveFlashcards key={idx} spec={seg.value} />;
          }
          return <CodeBlock key={idx} code={seg.value} lang={seg.lang} />;
        }

        if (seg.type === "math_block") {
          return <React.Fragment key={idx}>{renderMathFormula(seg.value, true)}</React.Fragment>;
        }

        return <React.Fragment key={idx}>{renderTextSegment(seg.value)}</React.Fragment>;
      })}

      {/* Streaming Blinking Cursor */}
      {isStreaming && (
        <span
          className="inline-block w-1.5 h-3.5 bg-violet-600 dark:bg-violet-400 animate-pulse ml-0.5 align-middle rounded-full"
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default RichMarkdownRenderer;