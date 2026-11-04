import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  BookOpen,
  Briefcase,
  Lock,
  MessageSquare,
  Check,
  Copy,
  Trash2,
  GraduationCap,
  Square,
  Send,
  Paperclip,
  Mic,
  Image as ImageIcon,
  Wand2,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Download,
  Search,
  Edit2,
  RotateCcw,
  FileText,
  X,
  Languages,
  SlidersHorizontal,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import aiService from "../services/ai.service";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";

// Multimodal 2.0 Components
import { RichMarkdownRenderer } from "../components/ai/RichMarkdownRenderer";
import { GeneratedImageCard } from "../components/ai/GeneratedImageCard";
import { AudioPlayer } from "../components/ai/AudioPlayer";
import { VoiceInputModal } from "../components/ai/VoiceInputModal";
import { DocumentAttachModal } from "../components/ai/DocumentAttachModal";
import { ImageGeneratorModal } from "../components/ai/ImageGeneratorModal";
import { EducationalToolsModal } from "../components/ai/EducationalToolsModal";

// ─── Constants ──────────────────────────────────────────────────────────────
const COACHING_MODES = [
  "General",
  "Study Help",
  "Career Advice",
  "Code Review",
  "Project Planning"
];

const MODE_PREFIXES = {
  "Study Help": "[Study Coach Mode] ",
  "Career Advice": "[Career Advisor Mode] ",
  "Code Review": "[Code Review Mode] ",
  "Project Planning": "[Project Planner Mode] "
};

const MODE_COLORS = {
  General: "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100",
  "Study Help": "bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-500/25",
  "Career Advice": "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/25",
  "Code Review": "bg-cyan-600 text-white border-cyan-600 shadow-sm shadow-cyan-500/25",
  "Project Planning": "bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-500/25"
};

const RESPONSE_STYLES = [
  { id: "detailed", label: "Detailed" },
  { id: "quick", label: "Quick" },
  { id: "step_by_step", label: "Step-by-Step" },
  { id: "beginner", label: "Beginner" },
  { id: "exam", label: "Exam Prep" },
  { id: "viva", label: "Viva" },
  { id: "code_review", label: "Code Analysis" }
];

const LANGUAGES = [
  { id: "auto", label: "English / Auto" },
  { id: "en", label: "English" },
  { id: "hi-en", label: "Hinglish (Hindi-English)" }
];

const MODE_PROMPTS = {
  General: [
    "What is the time complexity of QuickSort vs MergeSort?",
    "How do React 19 server actions work compared to standard hooks?",
    "Help me design a study schedule for my upcoming semester finals"
  ],
  "Study Help": [
    "Explain the 7 layers of the OSI reference model with diagrams",
    "Create a 3-question quiz on Binary Search Trees with explanations",
    "Break down Database Indexing (B-Trees vs Hash Index) with a comparison table"
  ],
  "Career Advice": [
    "What are top interview questions asked for Full Stack Engineers in 2026?",
    "How can I structure my portfolio projects to stand out to recruiters?",
    "Conduct a mock technical interview for a junior frontend role"
  ],
  "Code Review": [
    "Review this code pattern for memory leaks: [paste code]",
    "Explain SOLID principles with clean TypeScript examples",
    "How can I optimize high-frequency re-renders in a complex React dashboard?"
  ],
  "Project Planning": [
    "Create an agile sprint breakdown for a full-stack SaaS app",
    "Design the schema for an e-commerce order processing microservice",
    "What is the best architectural pattern for real-time collaborative editing?"
  ]
};

// Relative time formatter
const formatRelativeTime = (dateStr) => {
  const date = new Date(dateStr || Date.now());
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

// Conversation icon prefix
const getConvIcon = (title = "") => {
  const lower = title.toLowerCase();
  if (lower.includes("fresh") || lower.includes("private")) {
    return <Lock size={13} className="text-emerald-500 shrink-0" />;
  }
  if (lower.includes("career")) {
    return <Briefcase size={13} className="text-amber-500 shrink-0" />;
  }
  if (lower.includes("study") || lower.includes("quiz") || lower.includes("flashcard")) {
    return <BookOpen size={13} className="text-violet-500 shrink-0" />;
  }
  return <MessageSquare size={13} className="text-blue-500 shrink-0" />;
};

export const AIChat = () => {
  const { accessToken, user } = useAuth();

  // State
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSavedOnly, setFilterSavedOnly] = useState(false);

  // Configuration settings (persisted across sessions)
  const [coachingMode, setCoachingMode] = useState(() => {
    try {
      return localStorage.getItem("nexora_coach_mode") || "General";
    } catch {
      return "General";
    }
  });
  const [responseMode, setResponseMode] = useState(() => {
    try {
      return localStorage.getItem("nexora_response_mode") || "detailed";
    } catch {
      return "detailed";
    }
  });
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem("nexora_ai_language") || "auto";
    } catch {
      return "auto";
    }
  });

  // Persist session preferences
  useEffect(() => {
    try {
      localStorage.setItem("nexora_coach_mode", coachingMode);
    } catch {
      // ignore storage error
    }
  }, [coachingMode]);

  useEffect(() => {
    try {
      localStorage.setItem("nexora_response_mode", responseMode);
    } catch {
      // ignore storage error
    }
  }, [responseMode]);

  useEffect(() => {
    try {
      localStorage.setItem("nexora_ai_language", language);
    } catch {
      // ignore storage error
    }
  }, [language]);

  // Attachments & Multimodal State
  const [attachments, setAttachments] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editInputText, setEditInputText] = useState("");

  // Loading & Stream States
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Modals
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [renamingConvId, setRenamingConvId] = useState(null);
  const [renameTitleInput, setRenameTitleInput] = useState("");
  const [deleteConfirmConvId, setDeleteConfirmConvId] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const hasStreamStartedRef = useRef(false);
  const textareaRef = useRef(null);

  const activeConv = useMemo(
    () => conversations.find((c) => c._id === activeConversationId),
    [conversations, activeConversationId]
  );

  // Auto-scroll handler
  const scrollToBottom = useCallback((smooth = true) => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }
  }, []);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    setUserHasScrolledUp(!isNearBottom);
  };

  useEffect(() => {
    if (!userHasScrolledUp) {
      scrollToBottom(false);
    }
  }, [messages, isStreaming, userHasScrolledUp, scrollToBottom]);

  // Copy helper
  const handleCopyMessage = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export full chat to Markdown
  const handleExportChatMarkdown = () => {
    if (messages.length === 0) return;
    const title = activeConv?.title || "NEXORA_AI_Coach_Chat";
    const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_");
    const dateStr = new Date().toISOString().split("T")[0];

    let md = `# ${title}\n*Exported from NEXORA AI Coach on ${new Date().toLocaleString()}*\n\n---\n\n`;
    messages.forEach((m) => {
      const sender = m.role === "user" ? `### 👤 ${user?.name || "User"}` : "### 🤖 NEXORA AI Coach";
      md += `${sender} (${new Date(m.createdAt || Date.now()).toLocaleTimeString()})\n\n${m.content}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${cleanTitle}_${dateStr}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Fetch Conversations
  const fetchConversations = useCallback(async () => {
    if (!accessToken) return;
    setIsLoadingConversations(true);
    try {
      const data = await aiService.getConversations(accessToken);
      const convList = data.conversations || [];
      setConversations(convList);

      if (!activeConversationId && convList.length > 0) {
        setActiveConversationId(convList[0]._id);
      }
    } catch (err) {
      setError(err.message || "Failed to load conversations.");
    } finally {
      setIsLoadingConversations(false);
    }
  }, [accessToken, activeConversationId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch Messages for active conversation
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

  // Create New Conversation
  const handleCreateNewChat = async (isFresh = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsSending(false);
    setError("");

    try {
      const title = isFresh ? "Fresh / Private Session" : "New AI Coach Session";
      const data = await aiService.createConversation(accessToken, title, isFresh);
      const newConv = data.conversation;
      setConversations([newConv, ...conversations]);
      setActiveConversationId(newConv._id);
      setMessages([]);
    } catch (err) {
      setError(err.message || "Failed to create new conversation.");
    }
  };

  // Rename Conversation
  const handleRenameConversation = async (convId) => {
    if (!renameTitleInput.trim() || !accessToken) return;
    try {
      await aiService.renameConversation(accessToken, convId, renameTitleInput.trim());
      setConversations((prev) =>
        prev.map((c) => (c._id === convId ? { ...c, title: renameTitleInput.trim() } : c))
      );
      setRenamingConvId(null);
      setRenameTitleInput("");
    } catch (err) {
      setError(err.message || "Failed to rename conversation.");
    }
  };

  // Delete Conversation
  const handleDeleteConversation = async (convId, e) => {
    if (e) e.stopPropagation();
    if (!accessToken || !convId) return;

    try {
      await aiService.deleteConversation(accessToken, convId);
      const remaining = conversations.filter((c) => c._id !== convId);
      setConversations(remaining);
      setDeleteConfirmConvId(null);

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

  // Message Feedback (Helpful / Not Useful)
  const handleMessageFeedback = async (msgId, feedbackVal) => {
    if (!accessToken || !msgId || msgId.startsWith("assistant-temp-")) return;
    try {
      await aiService.submitMessageFeedback(accessToken, msgId, feedbackVal);
      setMessages((prev) =>
        prev.map((m) => (m._id === msgId ? { ...m, feedback: feedbackVal } : m))
      );
    } catch (err) {
      console.warn("Feedback failed:", err.message);
    }
  };

  // Toggle Message Save/Bookmark
  const handleToggleSaveMessage = async (msgId) => {
    if (!accessToken || !msgId || msgId.startsWith("assistant-temp-")) return;
    try {
      const res = await aiService.toggleSaveMessage(accessToken, msgId);
      setMessages((prev) =>
        prev.map((m) => (m._id === msgId ? { ...m, saved: res.saved } : m))
      );
    } catch (err) {
      console.warn("Toggle save failed:", err.message);
    }
  };

  // Stop Generation
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
              content: msg.content ? `${msg.content}\n\n*[Generation stopped by student]*` : "[Generation stopped]",
              isStreaming: false
            }
          : msg
      )
    );
  };

  // Primary Send Message Action
  const handleSendMessage = async (e, customPrompt = null) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    const rawText = (customPrompt || inputMessage).trim();
    if (!rawText || isSending || isStreaming) return;

    const displayText = rawText;
    const modePrefix = coachingMode !== "General" ? (MODE_PREFIXES[coachingMode] || "") : "";
    const apiText = modePrefix + rawText;

    // Build document context if any files attached
    let documentContext = "";
    if (attachments.length > 0) {
      documentContext = attachments
        .map((a) => `[DOCUMENT ATTACHMENT: ${a.originalName || a.filename}]\n${a.extractedText || ""}`)
        .join("\n\n");
    }

    setInputMessage("");
    setIsSending(true);
    setIsStreaming(true);
    setError("");
    hasStreamStartedRef.current = false;

    const tempUserMsg = {
      _id: `user-temp-${Date.now()}`,
      role: "user",
      content: displayText,
      _mode: coachingMode !== "General" ? coachingMode : null,
      attachments: [...attachments],
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
      if (!targetConvId) {
        const title =
          coachingMode !== "General"
            ? `${coachingMode}: ${rawText.slice(0, 30)}`
            : rawText.slice(0, 35);
        const newConvRes = await aiService.createConversation(accessToken, title);
        targetConvId = newConvRes.conversation._id;
        setActiveConversationId(targetConvId);
        setConversations((prev) => [newConvRes.conversation, ...prev]);
      }

      await aiService.streamChatMessage(
        accessToken,
        {
          conversationId: targetConvId,
          message: apiText,
          isFreshChat: activeConv?.isFreshChat || false,
          responseMode,
          language,
          documentContext,
          attachments: attachments.map((a) => ({
            originalName: a.originalName || a.filename,
            fileType: a.fileType,
            extractedLength: a.extractedLength
          }))
        },
        (event) => {
          if (typeof event === "string") {
            hasStreamStartedRef.current = true;
            setMessages((prev) =>
              prev.map((msg) =>
                msg._id === tempAssistantId ? { ...msg, content: (msg.content || "") + event } : msg
              )
            );
          } else if (event?.type === "token") {
            hasStreamStartedRef.current = true;
            const token = event.data?.token || event.data?.content || event.data?.text || "";
            if (token) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg._id === tempAssistantId ? { ...msg, content: (msg.content || "") + token } : msg
                )
              );
            }
          } else if (event?.type === "complete" || event?.type === "done") {
            const assistantId = event.data?.assistantMessageId || event.data?.messageId;
            const fullContent = event.data?.completeContent || event.data?.content;
            setMessages((prev) =>
              prev.map((msg) =>
                msg._id === tempAssistantId
                  ? {
                      ...msg,
                      _id: assistantId || msg._id,
                      content: fullContent || msg.content,
                      metadata: event.data?.metadata || msg.metadata,
                      isStreaming: false
                    }
                  : msg
              )
            );
          } else if (event?.type === "error") {
            const errMsg = event.data?.message || "AI Stream interrupted.";
            setError(errMsg);
            setMessages((prev) =>
              prev.map((msg) =>
                msg._id === tempAssistantId
                  ? {
                      ...msg,
                      isStreaming: false,
                      isError: true,
                      content: errMsg
                    }
                  : msg
              )
            );
          }
        },
        abortController.signal
      );

      // Clear attachments on success
      setAttachments([]);
    } catch (err) {
      if (err.name === "AbortError" || abortController.signal.aborted) {
        return;
      }

      // Fallback: non-streaming POST
      if (!hasStreamStartedRef.current) {
        try {
          const res = await aiService.sendChatMessage(accessToken, {
            conversationId: targetConvId,
            message: apiText,
            isFreshChat: activeConv?.isFreshChat || false,
            responseMode,
            language,
            documentContext,
            attachments
          });

          if (!activeConversationId) {
            setActiveConversationId(res.conversationId);
          }

          setMessages((prev) => [
            ...prev.filter((m) => m._id !== tempAssistantId && m._id !== tempUserMsg._id),
            res.userMessage,
            res.assistantMessage
          ]);
          setAttachments([]);
          fetchConversations();
        } catch (fallbackErr) {
          const errMsg = fallbackErr.message || "Failed to receive AI Coach response.";
          setError(errMsg);
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === tempAssistantId
                ? {
                    ...msg,
                    content: msg.content || errMsg,
                    isError: !msg.content,
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
                  isStreaming: false,
                  isError: !msg.content,
                  content: msg.content || errMsg
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
        prev.map((msg) => {
          if (msg._id === tempAssistantId && msg.isStreaming) {
            if (!msg.content || !msg.content.trim()) {
              return {
                ...msg,
                isStreaming: false,
                isError: true,
                content: "Unable to generate an AI response. Please verify your connection or click Retry to attempt again."
              };
            }
            return { ...msg, isStreaming: false };
          }
          return msg;
        })
      );
    }
  };

  // Regenerate Response for a specific assistant turn
  const handleRegenerate = (assistantIndex) => {
    // Find preceding user message
    for (let i = assistantIndex - 1; i >= 0; i--) {
      if (messages[i]?.role === "user") {
        handleSendMessage(null, messages[i].content);
        break;
      }
    }
  };

  // Edit and Resend a user turn
  const handleEditAndResend = (msgId, content) => {
    setEditingMessageId(msgId);
    setEditInputText(content);
  };

  const handleConfirmEditResend = (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (!editInputText.trim()) return;
    const newText = editInputText.trim();
    setEditingMessageId(null);
    setEditInputText("");
    handleSendMessage(null, newText);
  };

  // Filter conversations by search term
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const term = searchQuery.toLowerCase();
    return conversations.filter((c) => c.title?.toLowerCase().includes(term));
  }, [conversations, searchQuery]);

  // Filter messages by saved toggle if active
  const displayedMessages = useMemo(() => {
    if (!filterSavedOnly) return messages;
    return messages.filter((m) => m.saved);
  }, [messages, filterSavedOnly]);

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-4 animate-fade-in">
      {/* ── Left Sidebar: Conversations ─────────────────────────────────────── */}
      <div className="w-full md:w-80 bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] shadow-xs rounded-2xl p-4 flex flex-col justify-between shrink-0 overflow-hidden">
        <div className="flex flex-col h-full space-y-3 min-h-0">
          {/* Header & New Chat button */}
          <div className="flex items-center justify-between pb-2 border-b border-[#F1F4F9] dark:border-slate-800 shrink-0">
            <h3 className="text-xs font-bold text-[#172033] dark:text-slate-100 uppercase tracking-wider font-display flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-600 shadow-xs shadow-violet-500/30" />
              Chat History
            </h3>
            <button
              onClick={() => handleCreateNewChat(false)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 transition-all shadow-xs cursor-pointer active:scale-[0.98] flex items-center gap-1"
            >
              <Sparkles size={12} />
              + New
            </button>
          </div>

          {/* Fresh / Private Chat Mode Button */}
          <button
            onClick={() => handleCreateNewChat(true)}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-colors flex items-center justify-between cursor-pointer shrink-0"
          >
            <div className="flex items-center gap-2">
              <Lock size={12} className="text-emerald-600 dark:text-emerald-400" />
              <span>+ Private / Fresh Chat</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-mono bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded">
              Zero Memory
            </span>
          </button>

          {/* Search Conversations Input */}
          <div className="relative shrink-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#E7EAF0] dark:border-slate-800 text-[#172033] dark:text-slate-100 placeholder-[#98A2B3] focus:outline-hidden focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Saved Messages Filter Pill */}
          <div className="flex items-center justify-between shrink-0 px-1">
            <span className="text-[10px] font-semibold text-[#667085] dark:text-slate-400 uppercase tracking-wider">
              {filteredConversations.length} Sessions
            </span>
            <button
              onClick={() => setFilterSavedOnly(!filterSavedOnly)}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
                filterSavedOnly
                  ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300"
                  : "text-[#667085] dark:text-slate-400 hover:text-amber-600"
              }`}
            >
              <Bookmark size={11} className={filterSavedOnly ? "fill-amber-500" : ""} />
              Saved Only
            </button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0">
            {isLoadingConversations ? (
              <Loader text="Loading sessions..." size="sm" />
            ) : filteredConversations.length === 0 ? (
              <p className="text-xs text-[#667085] dark:text-slate-400 text-center py-6">
                {searchQuery ? "No matching conversations found." : "No sessions yet. Click + New to begin."}
              </p>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = activeConversationId === conv._id;
                const isEditingThis = renamingConvId === conv._id;

                return (
                  <div key={conv._id} className="group relative rounded-xl transition-all">
                    {isEditingThis ? (
                      <div className="p-2 bg-violet-50 dark:bg-violet-950/50 rounded-xl border border-violet-300 flex items-center gap-1">
                        <input
                          type="text"
                          value={renameTitleInput}
                          onChange={(e) => setRenameTitleInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameConversation(conv._id);
                            if (e.key === "Escape") setRenamingConvId(null);
                          }}
                          className="flex-1 text-xs bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 text-[#172033] dark:text-slate-100"
                          autoFocus
                        />
                        <button
                          onClick={() => handleRenameConversation(conv._id)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={() => setRenamingConvId(null)}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveConversationId(conv._id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between gap-2 cursor-pointer ${
                          isActive
                            ? "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/40 font-semibold shadow-2xs"
                            : "text-[#667085] dark:text-slate-400 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60 hover:text-[#172033] dark:hover:text-slate-100 border border-transparent"
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate min-w-0 pr-12">
                          {getConvIcon(conv.title)}
                          <span className="truncate">{conv.title}</span>
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {conv.isFreshChat && (
                            <span className="text-[9px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                              Fresh
                            </span>
                          )}
                          {conv.messageCount > 0 && (
                            <span className="text-[9px] font-mono bg-[#F1F4F9] dark:bg-slate-800 text-[#667085] dark:text-slate-400 px-1.5 py-0.5 rounded-full">
                              {conv.messageCount}
                            </span>
                          )}
                        </div>
                      </button>
                    )}

                    {/* Quick action icons on hover */}
                    {!isEditingThis && (
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-1 rounded-lg">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingConvId(conv._id);
                            setRenameTitleInput(conv.title);
                          }}
                          className="p-1 text-slate-400 hover:text-violet-600 rounded transition-colors"
                          title="Rename title"
                        >
                          <Edit2 size={12} />
                        </button>
                        {deleteConfirmConvId === conv._id ? (
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={(e) => handleDeleteConversation(conv._id, e)}
                              className="px-1 py-0.5 text-[9px] bg-rose-600 text-white rounded font-bold"
                            >
                              Del
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmConvId(null);
                              }}
                              className="p-0.5 text-slate-400"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmConvId(conv._id);
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                            title="Delete conversation"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer: Memory Settings Link */}
        <div className="pt-3 border-t border-[#F1F4F9] dark:border-slate-800 shrink-0">
          <Link
            to="/memory-settings"
            className="w-full py-2 px-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/50 hover:bg-[#F1F4F9] dark:hover:bg-slate-800 text-[#172033] dark:text-slate-200 text-xs font-medium flex items-center justify-between transition-colors border border-[#E7EAF0] dark:border-slate-700"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={13} className="text-violet-600 dark:text-violet-400" />
              <span>Memory &amp; Privacy</span>
            </div>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>

      {/* ── Main Chat Panel ────────────────────────────────────────────────── */}
      <div className="flex-1 bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] rounded-2xl flex flex-col overflow-hidden relative shadow-xs">
        {/* Chat Header */}
        <div className="p-3.5 bg-white dark:bg-[#111827] border-b border-[#E7EAF0] dark:border-[#1F2937] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-xs font-display">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#172033] dark:text-slate-100 flex items-center gap-2 font-display">
                NEXORA AI Coach 2.0
                {activeConv?.isFreshChat && (
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1">
                    <Lock size={10} /> Fresh Mode
                  </span>
                )}
              </h2>
              <p className="text-[10px] text-[#667085] dark:text-slate-400">
                Multimodal STEM &amp; Career Learning Assistant with Active Streaming
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export Markdown Button */}
            {messages.length > 0 && (
              <button
                onClick={handleExportChatMarkdown}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#F8FAFC] dark:bg-slate-800 text-[#172033] dark:text-slate-200 border border-[#E7EAF0] dark:border-slate-700 hover:bg-[#F1F4F9] dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                title="Export this conversation to a Markdown (.md) note"
              >
                <Download size={12} className="text-violet-600 dark:text-violet-400" />
                <span>Export Notes</span>
              </button>
            )}

            {isStreaming && (
              <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/40 rounded-full animate-pulse flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                Streaming Realtime
              </span>
            )}

            <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Gemini LLM Active
            </span>
          </div>
        </div>

        {error && <ErrorMessage title="AI Coach Error" message={error} />}

        {/* Message Thread */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5 relative bg-[#F8FAFC]/50 dark:bg-slate-950/40"
        >
          {isLoadingMessages ? (
            <Loader text="Retrieving conversation history..." />
          ) : displayedMessages.length === 0 ? (
            /* ── Empty State Hero ────────────────────────────────────────── */
            <div className="flex flex-col items-center justify-center h-full py-8 space-y-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-100 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/40 border border-violet-200/60 dark:border-violet-800/40 flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-sm">
                  <GraduationCap size={32} />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white border-2 border-white dark:border-slate-900 shadow-xs">
                  <Check size={11} />
                </div>
              </div>

              <div className="text-center space-y-2 max-w-md">
                <h3 className="text-lg font-bold text-[#172033] dark:text-slate-100 font-display">
                  {coachingMode === "General"
                    ? "Welcome to NEXORA AI Coach 2.0"
                    : `${coachingMode} Mode Active`}
                </h3>
                <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
                  I can generate structured explanations, interactive Recharts graphs, Mermaid flowcharts,
                  LaTeX formulas, quizzes, flashcards, concept diagrams, and code reviews.
                </p>
              </div>

              {/* Mode-aware Quick Prompt Chips */}
              <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(MODE_PROMPTS[coachingMode] || MODE_PROMPTS.General).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(null, prompt)}
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 text-[#172033] dark:text-slate-200 text-xs font-medium border border-[#E7EAF0] dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 transition-all text-left shadow-2xs flex items-start gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    <Sparkles size={14} className="text-violet-500 shrink-0 mt-0.5" />
                    <span className="leading-snug">{prompt}</span>
                  </button>
                ))}
              </div>

              {/* Quick Multimodal Action Suggestions */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setIsToolsModalOpen(true)}
                  className="px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/40 text-[11px] font-semibold flex items-center gap-1.5 hover:bg-violet-100 transition-colors"
                >
                  <Wand2 size={12} />
                  <span>Interactive Study Tools</span>
                </button>
                <button
                  onClick={() => setIsImageModalOpen(true)}
                  className="px-3 py-1.5 rounded-full bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/40 text-[11px] font-semibold flex items-center gap-1.5 hover:bg-cyan-100 transition-colors"
                >
                  <ImageIcon size={12} />
                  <span>Generate Diagram / Image</span>
                </button>
                <button
                  onClick={() => setIsDocModalOpen(true)}
                  className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-[11px] font-semibold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
                >
                  <Paperclip size={12} />
                  <span>Upload Document Context</span>
                </button>
              </div>
            </div>
          ) : (
            displayedMessages.map((msg, idx) => {
              const isUser = msg.role === "user";
              const isEditing = editingMessageId === msg._id;

              return (
                <div
                  key={msg._id || idx}
                  className={`group flex gap-3 max-w-4xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs ${
                      isUser
                        ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white"
                        : "bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/40"
                    }`}
                  >
                    {isUser ? (user?.name?.[0] || "U") : <Sparkles size={14} />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`relative p-4 rounded-2xl leading-relaxed space-y-2 shadow-2xs transition-all ${
                      isUser
                        ? "bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white rounded-tr-none shadow-md shadow-violet-500/20 max-w-2xl"
                        : "bg-white dark:bg-[#111827] border border-violet-100 dark:border-violet-900/30 text-[#172033] dark:text-slate-100 rounded-tl-none w-full shadow-sm"
                    }`}
                  >
                    {/* User Edit Mode */}
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editInputText}
                          onChange={(e) => setEditInputText(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg bg-white text-[#172033] border border-slate-300 focus:outline-hidden"
                          rows={3}
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingMessageId(null)}
                            className="text-[10px] px-2 py-1 rounded bg-white/20 text-white hover:bg-white/30"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleConfirmEditResend}
                            className="text-[10px] px-2.5 py-1 rounded bg-white text-violet-700 font-bold hover:bg-white/90"
                          >
                            Resend
                          </button>
                        </div>
                      </div>
                    ) : isUser ? (
                      <div>
                        {/* Attachments if any */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {msg.attachments.map((att, ai) => (
                              <span
                                key={ai}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-mono border border-white/30"
                              >
                                <FileText size={10} />
                                <span className="truncate max-w-[120px]">{att.originalName || att.filename}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="whitespace-pre-wrap text-xs">{msg.content}</p>
                        {msg._mode && (
                          <span className="mt-1.5 inline-block text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                            {msg._mode}
                          </span>
                        )}
                      </div>
                    ) : msg.isError ? (
                      <div className="space-y-2.5 p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={15} className="text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
                          <div className="space-y-1">
                            <p className="text-xs font-semibold">Response Generation Failed</p>
                            <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-300">
                              {msg.content}
                            </p>
                          </div>
                        </div>
                        <div className="pt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRegenerate(idx)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold transition-colors cursor-pointer shadow-xs"
                          >
                            <RotateCcw size={12} />
                            Retry Question
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* If this is an AI image generation turn */}
                        {msg.metadata?.imageUrl && (
                          <GeneratedImageCard
                            imageUrl={msg.metadata.imageUrl}
                            prompt={msg.metadata.imagePrompt || "Concept visualization"}
                          />
                        )}

                        {/* Rich Markdown & Interactive Tools */}
                        <RichMarkdownRenderer content={msg.content} isStreaming={msg.isStreaming} />

                        {/* Read Aloud Text-to-Speech Player */}
                        {msg.content && !msg.isStreaming && (
                          <div className="pt-2">
                            <AudioPlayer text={msg.content} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions row */}
                    <div
                      className={`flex items-center justify-between pt-1 border-t text-[10px] ${
                        isUser ? "border-white/10 text-white/80" : "border-[#F1F4F9] dark:border-slate-800 text-[#98A2B3] dark:text-slate-500"
                      }`}
                    >
                      {/* Left Actions */}
                      <div className="flex items-center gap-2">
                        {/* Copy button */}
                        {msg.content && (
                          <button
                            onClick={() => handleCopyMessage(msg._id || idx, msg.content)}
                            className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Copy answer"
                          >
                            {copiedId === (msg._id || idx) ? (
                              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                                <Check size={11} /> Copied!
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Copy size={11} /> Copy
                              </span>
                            )}
                          </button>
                        )}

                        {/* Assistant Feedback: Thumbs Up / Down */}
                        {!isUser && msg.content && (
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              onClick={() => handleMessageFeedback(msg._id, "helpful")}
                              className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                                msg.feedback === "helpful" ? "text-emerald-600 font-bold" : "text-slate-400"
                              }`}
                              title="Helpful response"
                            >
                              <ThumbsUp size={11} className={msg.feedback === "helpful" ? "fill-emerald-500" : ""} />
                            </button>
                            <button
                              onClick={() => handleMessageFeedback(msg._id, "not_useful")}
                              className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                                msg.feedback === "not_useful" ? "text-rose-600 font-bold" : "text-slate-400"
                              }`}
                              title="Not useful"
                            >
                              <ThumbsDown size={11} className={msg.feedback === "not_useful" ? "fill-rose-500" : ""} />
                            </button>
                          </div>
                        )}

                        {/* Save / Bookmark Message */}
                        {!isUser && msg.content && (
                          <button
                            onClick={() => handleToggleSaveMessage(msg._id)}
                            className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 ${
                              msg.saved ? "text-amber-500 font-bold" : "text-slate-400"
                            }`}
                            title={msg.saved ? "Remove from bookmarks" : "Save / Bookmark answer"}
                          >
                            <Bookmark size={11} className={msg.saved ? "fill-amber-500" : ""} />
                            <span>{msg.saved ? "Saved" : "Save"}</span>
                          </button>
                        )}

                        {/* Regenerate Assistant Response */}
                        {!isUser && !msg.isStreaming && (
                          <button
                            onClick={() => handleRegenerate(idx)}
                            className="p-1 rounded hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center gap-1 text-slate-400"
                            title="Regenerate this response"
                          >
                            <RotateCcw size={11} />
                            <span>Regenerate</span>
                          </button>
                        )}

                        {/* Edit User Message */}
                        {isUser && !isEditing && (
                          <button
                            onClick={() => handleEditAndResend(msg._id, msg.content)}
                            className="p-1 rounded hover:text-white transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                            title="Edit and resend"
                          >
                            <Edit2 size={11} />
                            <span>Edit</span>
                          </button>
                        )}
                      </div>

                      {/* Right: Timestamp */}
                      <span className="font-mono ml-auto">
                        {formatRelativeTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating "Jump to Latest" Button */}
        {userHasScrolledUp && (
          <button
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-28 right-6 z-10 px-3 py-1.5 rounded-full bg-violet-600 text-white text-xs shadow-md shadow-violet-500/25 hover:bg-violet-700 transition-all flex items-center gap-1 font-semibold cursor-pointer"
          >
            <span>&darr; Jump to latest</span>
          </button>
        )}

        {/* ── Multimodal Controls & Style Strip ───────────────────────────── */}
        <div className="px-4 py-2 bg-[#F8FAFC] dark:bg-slate-900 border-t border-[#E7EAF0] dark:border-[#1F2937] flex items-center justify-between gap-3 overflow-x-auto">
          {/* Coaching Mode Selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-semibold text-[#667085] dark:text-slate-400 uppercase tracking-wider">
              Focus:
            </span>
            {COACHING_MODES.map((mode) => {
              const isSelected = coachingMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setCoachingMode(mode)}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? MODE_COLORS[mode] || "bg-violet-600 text-white border-violet-600"
                      : "text-[#667085] dark:text-slate-400 border-[#E7EAF0] dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:text-[#172033] dark:hover:text-slate-100"
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>

          {/* Response Style & Language dropdowns */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Style Selector */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-[#E7EAF0] dark:border-slate-700 rounded-lg px-2 py-0.5">
              <span className="text-[10px] text-[#667085] dark:text-slate-400 font-medium">Style:</span>
              <select
                value={responseMode}
                onChange={(e) => setResponseMode(e.target.value)}
                className="text-[10px] font-semibold bg-transparent text-[#172033] dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                {RESPONSE_STYLES.map((st) => (
                  <option key={st.id} value={st.id} className="dark:bg-slate-900">
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-[#E7EAF0] dark:border-slate-700 rounded-lg px-2 py-0.5">
              <Languages size={11} className="text-violet-600 dark:text-violet-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-[10px] font-semibold bg-transparent text-[#172033] dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id} className="dark:bg-slate-900">
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Document Attachments Bar (if any uploaded) */}
        {attachments.length > 0 && (
          <div className="px-4 py-2 bg-violet-50/50 dark:bg-violet-950/20 border-t border-violet-100 dark:border-violet-900/30 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider shrink-0">
              Attached Context:
            </span>
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-800 text-[11px] text-[#172033] dark:text-slate-200 shadow-2xs shrink-0"
              >
                <FileText size={12} className="text-violet-600" />
                <span className="font-medium truncate max-w-[150px]">{att.originalName || att.filename}</span>
                <button
                  type="button"
                  onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-rose-500 rounded p-0.5"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Multimodal Composer Input ────────────────────────────────────── */}
        <div className="p-3 bg-white dark:bg-[#111827] border-t border-[#E7EAF0] dark:border-[#1F2937]">
          <form onSubmit={handleSendMessage} className="space-y-2">
            <div className="flex items-center gap-2">
              {/* Tool shortcuts */}
              <div className="flex items-center gap-1 bg-[#F8FAFC] dark:bg-slate-900 p-1 rounded-xl border border-[#E7EAF0] dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(true)}
                  className="p-1.5 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
                  title="Upload Document Context (PDF, DOCX, TXT)"
                >
                  <Paperclip size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="p-1.5 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
                  title="Voice Input (Speech-to-Text)"
                >
                  <Mic size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(true)}
                  className="p-1.5 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
                  title="Generate Concept Diagram / Illustration"
                >
                  <ImageIcon size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsToolsModalOpen(true)}
                  className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
                  title="Study Tools (Quiz, Flashcards, Viva, Complexity)"
                >
                  <Wand2 size={15} />
                </button>
              </div>

              {/* Text Input */}
              <input
                ref={textareaRef}
                type="text"
                placeholder={
                  coachingMode === "General"
                    ? "Ask a doubt, concept, or paste code (e.g. 'Explain QuickSort with charts')..."
                    : `Ask your ${coachingMode} question...`
                }
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isSending || isStreaming}
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 text-[#172033] dark:text-slate-100 placeholder-[#98A2B3] focus:outline-hidden focus:border-violet-500 transition-colors"
              />

              {/* Send / Stop Generation */}
              {isStreaming ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleStopGeneration}
                  className="border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 shrink-0 flex items-center gap-1.5"
                >
                  <Square size={13} className="fill-rose-500" />
                  <span>Stop</span>
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSending}
                  disabled={!inputMessage.trim() && attachments.length === 0}
                  className="shrink-0 shadow-sm shadow-violet-500/25 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 border-none text-white font-semibold flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>Send</span>
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* ── Multimodal Modals ──────────────────────────────────────────────── */}
      {/* 1. Voice Speech-to-Text Modal */}
      <VoiceInputModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        accessToken={accessToken}
        onTranscriptReady={(text) => {
          setInputMessage((prev) => (prev ? `${prev} ${text}` : text));
          setIsVoiceModalOpen(false);
        }}
      />

      {/* 2. Document Attachment Modal */}
      <DocumentAttachModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        accessToken={accessToken}
        onDocumentAttached={(docData) => {
          setAttachments((prev) => [...prev, docData]);
          setIsDocModalOpen(false);
        }}
      />

      {/* 3. AI Image & Diagram Generator Modal */}
      <ImageGeneratorModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        accessToken={accessToken}
        activeConversationId={activeConversationId}
        onImageGenerated={(_imgData, userMsg, assistantMsg, newConvId) => {
          if (newConvId && newConvId !== activeConversationId) {
            setActiveConversationId(newConvId);
          }
          if (userMsg && assistantMsg) {
            setMessages((prev) => [...prev, userMsg, assistantMsg]);
          } else if (assistantMsg) {
            setMessages((prev) => [...prev, assistantMsg]);
          }
          setIsImageModalOpen(false);
          fetchConversations();
        }}
      />

      {/* 4. Educational Study Tools Modal */}
      <EducationalToolsModal
        isOpen={isToolsModalOpen}
        onClose={() => setIsToolsModalOpen(false)}
        accessToken={accessToken}
        onInsertIntoChat={(chatContent) => {
          setIsToolsModalOpen(false);
          handleSendMessage(null, chatContent);
        }}
      />
    </div>
  );
};

export default AIChat;
