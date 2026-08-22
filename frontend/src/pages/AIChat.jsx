import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import aiService from "../services/ai.service";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";

export const AIChat = () => {
  const { accessToken, user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);

  const [inputMessage, setInputMessage] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [error, setError] = useState("");
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const hasStreamStartedRef = useRef(false);

  const activeConv = conversations.find((c) => c._id === activeConversationId);

  // Auto-scroll helper respecting user manual scroll-up
  const scrollToBottom = (force = false) => {
    if (force || !userHasScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  // Clean up streaming on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Load conversations list
  const fetchConversations = useCallback(async () => {
    if (!accessToken) return;
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

  // Load active conversation messages
  const fetchMessages = useCallback(async (convId) => {
    if (!accessToken || !convId) return;

    // Cancel any active stream when switching conversations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsSending(false);
    setIsCancelled(false);

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
  }, [accessToken]);

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

  // Stop Generation handler
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsSending(false);
    setIsCancelled(true);

    // Tag the temporary assistant message as stopped
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

  // Send message flow (Streaming with fallback guard)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const messageText = inputMessage.trim();
    if (!messageText || isSending || isStreaming) return;

    setInputMessage("");
    setIsSending(true);
    setIsStreaming(true);
    setIsCancelled(false);
    setError("");
    hasStreamStartedRef.current = false;

    const tempUserMsg = {
      _id: `user-temp-${Date.now()}`,
      role: "user",
      content: messageText,
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
          message: messageText,
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
            // Reconcile temporary message ID with persisted backend assistantMessageId
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
            setError(event.data.message || "AI stream encountered an error.");
          }
        },
        abortController.signal
      );
    } catch (err) {
      if (err.name === "AbortError" || abortController.signal.aborted) {
        return;
      }

      // SMART FALLBACK GUARD: Fall back to normal JSON /chat ONLY if stream failed BEFORE tokens started arriving
      if (!hasStreamStartedRef.current) {
        try {
          const res = await aiService.sendChatMessage(accessToken, {
            conversationId: targetConvId,
            message: messageText
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
          setError(fallbackErr.message || "Failed to receive AI Coach response.");
        }
      } else {
        setError(err.message || "AI Stream interrupted.");
      }
    } finally {
      setIsStreaming(false);
      setIsSending(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-4 animate-fade-in">
      {/* Sidebar: Conversations List */}
      <div className="w-full md:w-72 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              AI Coach Sessions
            </h3>
            <div className="flex items-center gap-1">
              <Button variant="primary" size="sm" onClick={() => handleCreateNewChat(false)}>
                + New
              </Button>
            </div>
          </div>

          <button
            onClick={() => handleCreateNewChat(true)}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex items-center justify-between"
          >
            <span>+ Start Fresh / Private Chat</span>
            <span className="text-[10px] uppercase tracking-wider font-mono bg-emerald-500/20 px-1.5 py-0.5 rounded">
              No Memory
            </span>
          </button>

          {isLoadingConversations ? (
            <Loader text="Loading sessions..." size="sm" />
          ) : conversations.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No sessions yet. Click + New to begin.</p>
          ) : (
            <div className="space-y-1 overflow-y-auto max-h-[50vh]">
              {conversations.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => setActiveConversationId(conv._id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-colors flex items-center justify-between gap-2 ${
                    activeConversationId === conv._id
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  <span className="truncate">{conv.title}</span>
                  {conv.isFreshChat && (
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950 px-1 rounded border border-emerald-800">
                      Fresh
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Memory & Privacy Control Link */}
        <div className="space-y-2 pt-3 border-t border-slate-800">
          <Link
            to="/memory-settings"
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-between transition-colors"
          >
            <span>Memory & Privacy Settings</span>
            <span>&rarr;</span>
          </Link>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">Phase 8 SSE Streaming & Vector Memory</p>
            <p className="text-slate-500">Progressive token streaming with MongoDB Atlas Vector Search.</p>
          </div>
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden relative">
        {/* Chat Header */}
        <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              AI
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                NEXORA AI Coach
                {activeConv?.isFreshChat && (
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Fresh / Private Mode Active
                  </span>
                )}
              </h2>
              <p className="text-[10px] text-slate-400">Real-time SSE AI Streaming Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isStreaming && (
              <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-full animate-pulse">
                Streaming Active
              </span>
            )}
            <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full">
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
            <div className="p-12 text-center space-y-3 my-auto">
              <div className="w-12 h-12 rounded-full bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400 mx-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-200">Start a Streaming Chat Session</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Ask questions about your study tasks, career skills, or project roadmaps to experience progressive AI token streaming.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={msg._id || idx}
                className={`flex gap-3 max-w-3xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    msg.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-800 text-indigo-400 border border-slate-700"
                  }`}
                >
                  {msg.role === "user" ? (user?.name?.[0] || "U") : "AI"}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed space-y-1 ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">
                    {msg.content || (msg.isStreaming ? "Thinking..." : "")}
                  </p>
                  <p
                    className={`text-[9px] font-mono text-right ${
                      msg.role === "user" ? "text-indigo-200/80" : "text-slate-500"
                    }`}
                  >
                    {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
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
            className="absolute bottom-20 right-6 z-10 px-3 py-1.5 rounded-full bg-indigo-600 text-white text-xs shadow-lg hover:bg-indigo-500 transition-all flex items-center gap-1"
          >
            <span>↓ Jump to latest</span>
          </button>
        )}

        {/* Input Form & Stop Generation Button */}
        <form onSubmit={handleSendMessage} className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center gap-3">
          <Input
            placeholder="Type your message to AI Coach..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isSending || isStreaming}
            className="flex-1 text-xs"
          />

          {isStreaming ? (
            <Button type="button" variant="secondary" onClick={handleStopGeneration} className="border-red-500/50 text-red-300 hover:bg-red-950/50">
              Stop Generation
            </Button>
          ) : (
            <Button type="submit" variant="primary" isLoading={isSending} disabled={!inputMessage.trim()}>
              Send
            </Button>
          )}
        </form>
      </div>
    </div>
  );
};

export default AIChat;
