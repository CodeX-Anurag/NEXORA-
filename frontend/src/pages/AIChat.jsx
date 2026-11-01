import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import aiService from "../services/ai.service";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";

// ─── Coaching Modes ────────────────────────────────────────────────────────────
const COACHING_MODES = ["General", "Study Help", "Career Advice", "Code Review", "Project Planning"];

const MODE_PREFIXES = {
  "Study Help": "[Study Coach Mode] ",
  "Career Advice": "[Career Advisor Mode] ",
  "Code Review": "[Code Review Mode] ",
  "Project Planning": "[Project Planner Mode] ",
};

const MODE_BADGES = {
  "Study Help": "📚 Study",
  "Career Advice": "💼 Career",
  "Code Review": "🔍 Code",
  "Project Planning": "📋 Plan",
};

const MODE_PROMPTS = {
  General: [
    "What is SQL and why do we use it?",
    "How do React components and useState work?",
    "Help me plan my study schedule for this week",
  ],
  "Study Help": [
    "Break down Operating Systems into a 2-week plan",
    "Explain TCP/IP stack with an analogy",
    "Create a 10-question quiz on Data Structures",
  ],
  "Career Advice": [
    "What skills should a Full Stack Developer have?",
    "Review my resume summary and suggest improvements",
    "How do I prepare for a system design interview?",
  ],
  "Code Review": [
    "What are common React performance pitfalls?",
    "Explain SOLID principles with examples",
    "Review this code pattern: [paste your code]",
  ],
  "Project Planning": [
    "Help me break down a CRUD app into daily tasks",
    "What's a good Git branching strategy for solo projects?",
    "Create a project milestone plan for a REST API",
  ],
};

// ─── Relative time helper ─────────────────────────────────────────────────────
const formatRelativeTime = (dateStr) => {
  const date = new Date(dateStr || Date.now());
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// ─── Conversation emoji prefix ────────────────────────────────────────────────
const getConvEmoji = (title = "") => {
  const lower = title.toLowerCase();
  if (lower.includes("fresh") || lower.includes("private")) return "🔒";
  if (lower.includes("career")) return "💼";
  if (lower.includes("study")) return "📚";
  return "💬";
};

// ─── Inline Markdown (bold + inline code) ────────────────────────────────────
const renderInlineMarkdown = (text) => {
  if (!text) return "";
  const tokens = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;
  let keyIdx = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(<span key={keyIdx++}>{text.substring(lastIndex, match.index)}</span>);
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      tokens.push(
        <strong key={keyIdx++} className="font-semibold text-amber-200">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      tokens.push(
        <code
          key={keyIdx++}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-[#27231F] text-amber-300 font-mono text-[11px] border border-[#3E372F]"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(<span key={keyIdx++}>{text.substring(lastIndex)}</span>);
  }

  return tokens.length > 0 ? tokens : text;
};

// ─── Code fence copy button ───────────────────────────────────────────────────
const CodeBlock = ({ code, lang }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-[#2D2925] shadow-md">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0D0C0B] border-b border-[#2D2925]">
        <span className="text-[10px] font-mono text-[#9C9384] uppercase tracking-wider">
          {lang || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="text-[10px] font-mono text-[#9C9384] hover:text-[#FAF7F2] transition-colors flex items-center gap-1"
        >
          {copied ? (
            <span className="text-[#2EA366]">✓ Copied!</span>
          ) : (
            <span>📋 Copy code</span>
          )}
        </button>
      </div>
      <pre className="bg-[#0D0C0B] p-4 overflow-x-auto">
        <code className="font-mono text-[11px] text-[#E6E1D8] whitespace-pre leading-relaxed">
          {code}
        </code>
      </pre>
    </div>
  );
};

// ─── Enhanced Markdown Renderer ───────────────────────────────────────────────
/**
 * Replaces FormattedMessage with full markdown support:
 * headings, code fences, blockquotes, hr, task lists, bullets, numbered lists,
 * inline bold/code, and the "Quick Question" callout.
 */
const FormattedMessage = ({ content, isStreaming }) => {
  if (!content) {
    if (isStreaming) {
      return (
        <div className="flex items-center gap-2.5 py-1.5 text-[#C4BCAD]">
          <div className="flex gap-1 items-center">
            <span className="w-2 h-2 rounded-full bg-[#E0693B] animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 rounded-full bg-[#E0693B] animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 rounded-full bg-[#E0693B] animate-bounce"></span>
          </div>
          <span className="text-xs font-medium text-[#A69E90]">AI Coach is crafting your response...</span>
        </div>
      );
    }
    return null;
  }

  // Split into segments: code fences vs normal lines
  const segments = [];
  const codeFenceRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIdx = 0;
  let fMatch;

  while ((fMatch = codeFenceRegex.exec(content)) !== null) {
    if (fMatch.index > lastIdx) {
      segments.push({ type: "text", value: content.slice(lastIdx, fMatch.index) });
    }
    segments.push({ type: "code", lang: fMatch[1] || "", value: fMatch[2] });
    lastIdx = codeFenceRegex.lastIndex;
  }
  if (lastIdx < content.length) {
    segments.push({ type: "text", value: content.slice(lastIdx) });
  }

  let keyCounter = 0;
  const renderTextSegment = (text) => {
    const lines = text.split("\n");
    return lines.map((line) => {
      const k = keyCounter++;
      const trimmed = line.trim();

      if (!trimmed) {
        return <div key={k} className="h-1.5" />;
      }

      // Horizontal rule
      if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
        return <hr key={k} className="border-[#2D2925] my-3" />;
      }

      // Headings
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={k} className="text-sm font-bold text-[#FAF7F2] font-display mt-3 mb-1">
            {renderInlineMarkdown(trimmed.slice(4))}
          </h3>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={k} className="text-base font-bold text-[#FAF7F2] font-display mt-3 mb-1">
            {renderInlineMarkdown(trimmed.slice(3))}
          </h2>
        );
      }
      if (trimmed.startsWith("# ")) {
        return (
          <h1 key={k} className="text-lg font-bold text-[#FAF7F2] font-display mt-3 mb-1.5">
            {renderInlineMarkdown(trimmed.slice(2))}
          </h1>
        );
      }

      // Blockquote
      if (trimmed.startsWith("> ")) {
        return (
          <div key={k} className="flex gap-2.5 pl-1 my-1.5">
            <div className="w-0.5 bg-[#E0693B] rounded-full shrink-0" />
            <p className="text-xs text-[#CDC5B6] italic leading-relaxed">
              {renderInlineMarkdown(trimmed.slice(2))}
            </p>
          </div>
        );
      }

      // Task list items
      if (trimmed.startsWith("- [ ] ")) {
        return (
          <div key={k} className="flex items-start gap-2 pl-1 py-0.5">
            <span className="w-3.5 h-3.5 mt-0.5 rounded border border-[#9C9384] shrink-0 flex items-center justify-center" />
            <span className="flex-1 text-xs text-[#E6E1D8]">{renderInlineMarkdown(trimmed.slice(6))}</span>
          </div>
        );
      }
      if (trimmed.startsWith("- [x] ") || trimmed.startsWith("- [X] ")) {
        return (
          <div key={k} className="flex items-start gap-2 pl-1 py-0.5">
            <span className="w-3.5 h-3.5 mt-0.5 rounded bg-[#2EA366]/20 border border-[#2EA366] shrink-0 flex items-center justify-center text-[#2EA366] text-[9px]">
              ✓
            </span>
            <span className="flex-1 text-xs text-[#9C9384] line-through">{renderInlineMarkdown(trimmed.slice(6))}</span>
          </div>
        );
      }

      // Bullet list
      const isBullet = trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ");
      if (isBullet) {
        const bulletText = trimmed.replace(/^[•\-*]\s*/, "");
        return (
          <div key={k} className="flex items-start gap-2 pl-1 py-0.5">
            <span className="text-[#E0693B] font-bold text-sm leading-none mt-0.5 shrink-0">•</span>
            <span className="flex-1 text-xs text-[#E6E1D8]">{renderInlineMarkdown(bulletText)}</span>
          </div>
        );
      }

      // Numbered list
      const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numberedMatch) {
        return (
          <div key={k} className="flex items-start gap-2 pl-1 py-0.5">
            <span className="w-4 text-right font-mono text-[#E0693B] font-semibold text-[11px] shrink-0 mt-0.5">
              {numberedMatch[1]}.
            </span>
            <span className="flex-1 text-xs text-[#E6E1D8]">{renderInlineMarkdown(numberedMatch[2])}</span>
          </div>
        );
      }

      // Quick Question callout
      if (trimmed.endsWith("?")) {
        return (
          <div
            key={k}
            className="p-2.5 rounded-xl bg-[#E0693B]/10 border border-[#E0693B]/30 text-[#FAF7F2] font-medium my-1.5 shadow-sm"
          >
            <div className="flex items-center gap-1.5 text-[#E0693B] text-[10px] font-bold uppercase tracking-wider mb-0.5">
              <span>💬 Quick Question</span>
            </div>
            <div className="text-xs text-[#FAF7F2]">{renderInlineMarkdown(trimmed)}</div>
          </div>
        );
      }

      return (
        <p key={k} className="text-xs text-[#E6E1D8] leading-relaxed">
          {renderInlineMarkdown(line)}
        </p>
      );
    });
  };

  return (
    <div className="space-y-1.5 text-xs leading-relaxed text-[#E6E1D8]">
      {segments.map((seg, si) =>
        seg.type === "code" ? (
          <CodeBlock key={`code-${si}`} code={seg.value} lang={seg.lang} />
        ) : (
          <React.Fragment key={`text-${si}`}>{renderTextSegment(seg.value)}</React.Fragment>
        )
      )}
    </div>
  );
};

// ─── Main AIChat Page ─────────────────────────────────────────────────────────
export const AIChat = () => {
  const { accessToken, user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [coachingMode, setCoachingMode] = useState("General");

  const [inputMessage, setInputMessage] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const hasStreamStartedRef = useRef(false);

  const activeConv = conversations.find((c) => c._id === activeConversationId);

  const scrollToBottom = (force = false) => {
    if (force || !userHasScrolledUp) {
      if (typeof messagesEndRef.current?.scrollIntoView === "function") {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setUserHasScrolledUp(!isNearBottom);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleCopyMessage = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchConversations = useCallback(async () => {
    if (!accessToken) {
      setIsLoadingConversations(false);
      return;
    }
    setIsLoadingConversations(true);
    setError("");

    try {
      const data = await aiService.getConversations(accessToken);
      const list = data.conversations || [];
      setConversations(list);
      if (list.length > 0 && !activeConversationId) {
        setActiveConversationId(list[0]._id);
      }
    } catch (err) {
      setError(err.message || "Failed to load chat conversations.");
    } finally {
      setIsLoadingConversations(false);
    }
  }, [accessToken, activeConversationId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const fetchMessages = useCallback(
    async (convId) => {
      if (!accessToken || !convId) {
        setIsLoadingMessages(false);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsStreaming(false);
      setIsSending(false);

      setIsLoadingMessages(true);
      setError("");

      try {
        const data = await aiService.getMessages(accessToken, convId);
        setMessages(data.messages || []);
      } catch (err) {
        setError(err.message || "Failed to load chat messages.");
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    }
  }, [activeConversationId, fetchMessages]);

  const handleCreateNewChat = async (isFresh = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsSending(false);
    setError("");

    try {
      const title = isFresh ? "Fresh / Private Chat Session" : "New AI Coach Session";
      const data = await aiService.createConversation(accessToken, title, isFresh);
      const newConv = data.conversation;
      setConversations([newConv, ...conversations]);
      setActiveConversationId(newConv._id);
      setMessages([]);
    } catch (err) {
      setError(err.message || "Failed to create new conversation.");
    }
  };

  const handleDeleteConversation = async (convId, e) => {
    if (e) e.stopPropagation();
    if (!accessToken || !convId) return;

    try {
      await aiService.deleteConversation(accessToken, convId);
      const remaining = conversations.filter((c) => c._id !== convId);
      setConversations(remaining);
      if (activeConversationId === convId) {
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0]._id);
        } else {
          setActiveConversationId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to delete conversation.");
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsSending(false);

    setMessages((prev) =>
      prev.map((msg) =>
        msg._id?.startsWith("assistant-temp-")
          ? {
              ...msg,
              content: msg.content ? `${msg.content} [Stopped by user]` : "[Generation stopped by user]",
              isStreaming: false
            }
          : msg
      )
    );
  };

  /**
   * handleSendMessage
   * - Separates displayText (shown in UI) from apiText (sent to AI with mode prefix).
   * - If mode !== "General", prepends the mode prefix to apiText only.
   */
  const handleSendMessage = async (e, customPrompt = null) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    const rawText = (customPrompt || inputMessage).trim();
    if (!rawText || isSending || isStreaming) return;

    // Display text: exactly what the user typed / clicked
    const displayText = rawText;
    // API text: with coaching mode prefix if applicable
    const modePrefix = coachingMode !== "General" ? (MODE_PREFIXES[coachingMode] || "") : "";
    const apiText = modePrefix + rawText;

    setInputMessage("");
    setIsSending(true);
    setIsStreaming(true);
    setError("");
    hasStreamStartedRef.current = false;

    const tempUserMsg = {
      _id: `user-temp-${Date.now()}`,
      role: "user",
      content: displayText, // render the clean text
      _mode: coachingMode !== "General" ? coachingMode : null,
      createdAt: new Date().toISOString()
    };

    const tempAssistantId = `assistant-temp-${Date.now()}`;
    const tempAssistantMsg = {
      _id: tempAssistantId,
      role: "assistant",
      content: "",
      isStreaming: true,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let targetConvId = activeConversationId;

    try {
      await aiService.streamChatMessage(
        accessToken,
        {
          conversationId: activeConversationId,
          message: apiText,
          isFreshChat: activeConv?.isFreshChat || false
        },
        (event) => {
          if (abortController.signal.aborted) return;

          if (event.type === "start") {
            hasStreamStartedRef.current = true;
            if (event.data.conversationId) {
              targetConvId = event.data.conversationId;
              if (!activeConversationId) {
                setActiveConversationId(event.data.conversationId);
              }
            }
          } else if (event.type === "token") {
            hasStreamStartedRef.current = true;
            const tokenContent = event.data.content || "";
            setMessages((prev) =>
              prev.map((msg) =>
                msg._id === tempAssistantId
                  ? { ...msg, content: msg.content + tokenContent }
                  : msg
              )
            );
          } else if (event.type === "complete") {
            setIsStreaming(false);
            setIsSending(false);
            setMessages((prev) =>
              prev.map((msg) =>
                msg._id === tempAssistantId
                  ? {
                      ...msg,
                      _id: event.data.assistantMessageId || msg._id,
                      isStreaming: false
                    }
                  : msg
              )
            );
            fetchConversations();
          } else if (event.type === "error") {
            setIsStreaming(false);
            setIsSending(false);
            const errMsg = event.data?.message || "AI stream encountered an error.";
            setError(errMsg);
            setMessages((prev) =>
              prev.map((msg) =>
                msg._id === tempAssistantId
                  ? {
                      ...msg,
                      content: msg.content || `⚠️ ${errMsg}`,
                      isStreaming: false
                    }
                  : msg
              )
            );
          }
        },
        abortController.signal
      );
    } catch (err) {
      if (err.name === "AbortError" || abortController.signal.aborted) {
        return;
      }

      if (!hasStreamStartedRef.current) {
        try {
          const res = await aiService.sendChatMessage(accessToken, {
            conversationId: targetConvId,
            message: apiText
          });

          if (!activeConversationId) {
            setActiveConversationId(res.conversationId);
          }

          setMessages((prev) => [
            ...prev.filter((m) => m._id !== tempAssistantId && m._id !== tempUserMsg._id),
            res.userMessage,
            res.assistantMessage
          ]);

          fetchConversations();
        } catch (fallbackErr) {
          const errMsg = fallbackErr.message || "Failed to receive AI Coach response.";
          setError(errMsg);
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === tempAssistantId
                ? {
                    ...msg,
                    content: msg.content || `⚠️ ${errMsg}`,
                    isStreaming: false
                  }
                : msg
            )
          );
        }
      } else {
        const errMsg = err.message || "AI Stream interrupted.";
        setError(errMsg);
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === tempAssistantId
              ? {
                  ...msg,
                  content: msg.content || `⚠️ ${errMsg}`,
                  isStreaming: false
                }
              : msg
          )
        );
      }
    } finally {
      setIsStreaming(false);
      setIsSending(false);
      abortControllerRef.current = null;
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempAssistantId && msg.isStreaming
            ? { ...msg, isStreaming: false, content: msg.content || "Response completed." }
            : msg
        )
      );
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-4 animate-fade-in">

      {/* ── Sidebar: Conversations List ────────────────────────────────────── */}
      <div className="w-full md:w-72 bg-[#191816] border border-[#2D2925] rounded-2xl p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#262420]">
            <h3 className="text-xs font-bold text-[#FAF7F2] uppercase tracking-wider font-display">
              Chat Sessions
            </h3>
            <button
              onClick={() => handleCreateNewChat(false)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#E0693B] text-white hover:bg-[#EB784B] transition-colors shadow-sm"
            >
              + New
            </button>
          </div>

          <button
            onClick={() => handleCreateNewChat(true)}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold bg-[#2EA366]/10 text-[#2EA366] border border-[#2EA366]/25 hover:bg-[#2EA366]/20 transition-colors flex items-center justify-between"
          >
            <span>+ Start Fresh / Private Chat</span>
            <span className="text-[10px] uppercase tracking-wider font-mono bg-[#2EA366]/20 px-1.5 py-0.5 rounded">
              No Memory
            </span>
          </button>

          {isLoadingConversations ? (
            <Loader text="Loading sessions..." size="sm" />
          ) : conversations.length === 0 ? (
            <p className="text-xs text-[#787165] text-center py-4">No sessions yet. Click + New to begin.</p>
          ) : (
            <div className="space-y-1 overflow-y-auto max-h-[50vh]">
              {conversations.map((conv) => (
                /* Conversation item — group wrapper for hover delete */
                <div key={conv._id} className="group relative">
                  <button
                    onClick={() => setActiveConversationId(conv._id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-colors flex items-center justify-between gap-2 ${
                      activeConversationId === conv._id
                        ? "bg-[#E0693B]/10 text-[#FAF7F2] border border-[#E0693B]/30 font-semibold shadow-sm"
                        : "text-[#9C9384] hover:bg-[#22201D] hover:text-[#FAF7F2] border border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate min-w-0">
                      <span className="shrink-0">{getConvEmoji(conv.title)}</span>
                      <span className="truncate">{conv.title}</span>
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {conv.messageCount > 0 && (
                        <span className="text-[9px] font-mono bg-[#2D2925] text-[#9C9384] px-1.5 py-0.5 rounded-full">
                          {conv.messageCount}
                        </span>
                      )}
                      {conv.isFreshChat && (
                        <span className="text-[9px] font-mono text-[#2EA366] bg-[#2EA366]/10 px-1.5 py-0.5 rounded border border-[#2EA366]/25">
                          Fresh
                        </span>
                      )}
                    </div>
                  </button>

                  {/* 🗑 Delete button on hover */}
                  <button
                    onClick={(e) => handleDeleteConversation(conv._id, e)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-1 rounded-lg text-[10px] text-rose-400 hover:bg-rose-900/20"
                    title="Delete conversation"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Memory & Privacy Control Link */}
        <div className="space-y-2 pt-3 border-t border-[#262420]">
          <Link
            to="/memory-settings"
            className="w-full py-2 px-3 rounded-xl bg-[#22201D] hover:bg-[#2A2724] text-[#CDC5B6] text-xs font-medium flex items-center justify-between transition-colors border border-[#302C28]"
          >
            <span>Memory &amp; Privacy Settings</span>
            <span>&rarr;</span>
          </Link>
          <div className="p-3 rounded-xl bg-[#141312] border border-[#2D2925] text-[11px] text-[#9C9384] space-y-1">
            <p className="font-semibold text-[#CDC5B6]">AI Streaming &amp; Vector Memory</p>
            <p className="text-[#787165]">Line-by-line structured coaching with student context.</p>
          </div>
        </div>
      </div>

      {/* ── Main Chat Panel ────────────────────────────────────────────────── */}
      <div className="flex-1 bg-[#191816] border border-[#2D2925] rounded-2xl flex flex-col overflow-hidden relative shadow-xl">
        {/* Chat Header */}
        <div className="p-4 bg-[#1E1C19] border-b border-[#2D2925] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E0693B]/15 border border-[#E0693B]/40 flex items-center justify-center text-[#E0693B] font-bold text-sm shadow-sm font-display">
              ✨
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#FAF7F2] flex items-center gap-2 font-display">
                NEXORA AI Coach
                {activeConv?.isFreshChat && (
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-[#2EA366]/15 text-[#2EA366] border border-[#2EA366]/30">
                    Fresh / Private Mode Active
                  </span>
                )}
              </h2>
              <p className="text-[10px] text-[#9C9384]">Structured, Line-by-Line Academic &amp; Career Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isStreaming && (
              <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-[#E0693B]/10 text-[#E0693B] border border-[#E0693B]/30 rounded-full animate-pulse">
                Streaming Active
              </span>
            )}
            <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-[#2EA366]/10 text-[#2EA366] border border-[#2EA366]/30 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2EA366] animate-pulse"></span>
              LLM Connected
            </span>
          </div>
        </div>

        {error && <ErrorMessage title="AI Coach Error" message={error} />}

        {/* Message Thread */}
        <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 p-6 overflow-y-auto space-y-4 relative">
          {isLoadingMessages ? (
            <Loader text="Retrieving conversation history..." />
          ) : messages.length === 0 ? (
            /* ── Empty State Hero ────────────────────────────────────────── */
            <div className="flex flex-col items-center justify-center h-full py-8 space-y-6">
              {/* Gradient icon */}
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#E0693B]/30 to-[#E0693B]/5 border border-[#E0693B]/25 flex items-center justify-center text-4xl shadow-lg shadow-[#E0693B]/10">
                  🎓
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#2EA366] flex items-center justify-center text-[10px] border-2 border-[#191816]">
                  ✓
                </div>
              </div>

              <div className="text-center space-y-2 max-w-sm">
                <h3 className="text-lg font-bold text-[#FAF7F2] font-display">
                  {coachingMode === "General"
                    ? "How can I help you today?"
                    : `${coachingMode} mode — ready to assist!`}
                </h3>
                <p className="text-xs text-[#9C9384] leading-relaxed">
                  {coachingMode === "Study Help" && "I'll break down complex topics into digestible study plans."}
                  {coachingMode === "Career Advice" && "Get tailored career guidance, resume tips, and interview prep."}
                  {coachingMode === "Code Review" && "Share your code or patterns and I'll provide expert feedback."}
                  {coachingMode === "Project Planning" && "I'll help you break down projects into actionable tasks."}
                  {coachingMode === "General" && "Ask any technical doubt, study concept, or task planning question. I'll break it down line-by-line."}
                </p>
              </div>

              {/* Mode-aware Quick Prompt Chips — 2-col on mobile, wrap on desktop */}
              <div className="w-full max-w-lg grid grid-cols-2 sm:flex sm:flex-wrap gap-2 justify-center">
                {(MODE_PROMPTS[coachingMode] || MODE_PROMPTS.General).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(null, prompt)}
                    className="col-span-1 px-3 py-1.5 rounded-xl bg-[#201E1B] hover:bg-[#2A2723] text-[#CDC5B6] hover:text-[#FAF7F2] text-[11px] font-medium border border-[#332F2A] transition-all text-left shadow-sm flex items-center gap-1.5"
                  >
                    <span className="text-[#E0693B] shrink-0">💡</span>
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={msg._id || idx}
                className={`group flex gap-3 max-w-3xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-[#E0693B] to-[#C85A2A] text-white"
                      : "bg-[#22201D] text-[#E0693B] border border-[#3A352F]"
                  }`}
                >
                  {msg.role === "user" ? (user?.name?.[0] || "U") : "AI"}
                </div>

                {/* Message Bubble */}
                <div
                  className={`relative p-4 rounded-2xl leading-relaxed space-y-1.5 shadow-sm transition-all ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-[#E0693B] to-[#C85A2A] text-white rounded-tr-none"
                      : "bg-gradient-to-b from-[#1A1816] to-[#141312] border border-[#2D2925] text-[#FAF7F2] rounded-tl-none w-full"
                  }`}
                >
                  {msg.role === "user" ? (
                    <div>
                      <p className="whitespace-pre-wrap text-xs">{msg.content}</p>
                      {/* Mode badge on user bubble */}
                      {msg._mode && (
                        <span className="mt-1.5 inline-block text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-white/15 text-white/80 border border-white/20">
                          {MODE_BADGES[msg._mode] || msg._mode}
                        </span>
                      )}
                    </div>
                  ) : (
                    <FormattedMessage content={msg.content} isStreaming={msg.isStreaming} />
                  )}

                  {/* Actions row — always visible on hover */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    {msg.role === "assistant" && msg.content && (
                      <button
                        onClick={() => handleCopyMessage(msg._id || idx, msg.content)}
                        className="text-[10px] text-[#787165] hover:text-[#FAF7F2] transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy answer"
                      >
                        {copiedId === (msg._id || idx) ? (
                          <span className="text-[#2EA366]">✓ Copied!</span>
                        ) : (
                          <span>📋 Copy</span>
                        )}
                      </button>
                    )}
                    <span
                      className={`text-[9px] font-mono ml-auto ${
                        msg.role === "user" ? "text-white/70" : "text-[#787165]"
                      }`}
                    >
                      {formatRelativeTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating "Jump to Latest" Button */}
        {userHasScrolledUp && (
          <button
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-20 right-6 z-10 px-3 py-1.5 rounded-full bg-[#E0693B] text-white text-xs shadow-lg hover:bg-[#EB784B] transition-all flex items-center gap-1 font-semibold"
          >
            <span>↓ Jump to latest</span>
          </button>
        )}

        {/* ── Coaching Mode Selector ──────────────────────────────────────── */}
        <div className="px-4 pt-3 pb-0 bg-[#141312] border-t border-[#2D2925] flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-semibold text-[#787165] shrink-0 uppercase tracking-wider">Mode:</span>
          {COACHING_MODES.map((mode) => (
            <button
              key={mode}
              onClick={() => setCoachingMode(mode)}
              className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                coachingMode === mode
                  ? "bg-[#E0693B]/10 text-[#E0693B] border-[#E0693B]/30"
                  : "text-[#9C9384] border-[#2D2925] hover:text-[#FAF7F2] hover:border-[#3E372F]"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Input Form & Action Controls */}
        <form onSubmit={handleSendMessage} className="p-4 bg-[#141312] flex items-center gap-3">
          <Input
            placeholder={
              coachingMode === "General"
                ? "Ask any doubt or topic (e.g. 'What is SQL?', 'Help me study React')..."
                : `Ask your ${coachingMode} question...`
            }
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isSending || isStreaming}
            className="flex-1 text-xs"
          />

          {isStreaming ? (
            <Button
              type="button"
              variant="secondary"
              onClick={handleStopGeneration}
              className="border-rose-500/50 text-rose-300 hover:bg-rose-950/50 shrink-0"
            >
              Stop Generation
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              isLoading={isSending}
              disabled={!inputMessage.trim()}
              className="shrink-0"
            >
              Send
            </Button>
          )}
        </form>
      </div>
    </div>
  );
};

export default AIChat;
