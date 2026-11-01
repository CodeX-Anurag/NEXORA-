import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import vivaService from "../services/viva.service";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  PlusCircle,
  BrainCircuit
} from "lucide-react";

const PRESET_TOPICS = [
  { id: "react", title: "React & Modern Frontend", description: "Hooks, reconciliation, state architecture, SSR" },
  { id: "nodejs", title: "Node.js & Backend Architecture", description: "Event loop, streams, concurrency, clustering" },
  { id: "system-design", title: "System Design & Scalability", description: "Load balancers, caching, sharding, CAP theorem" },
  { id: "sql", title: "SQL & Relational Databases", description: "Indexes, transactions, ACID, query optimization" },
  { id: "dsa", title: "Data Structures & Algorithms", description: "Time/space complexity, graphs, dynamic programming" },
  { id: "cloud-devops", title: "Cloud & DevOps Practices", description: "Docker, Kubernetes, CI/CD, microservices" }
];

export const Viva = () => {
  const { accessToken } = useAuth();

  // Mode: "setup" | "active" | "scorecard"
  const [viewMode, setViewMode] = useState("setup");

  // Setup Form State
  const [selectedTopic, setSelectedTopic] = useState(PRESET_TOPICS[0].title);
  const [customTopic, setCustomTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [maxRounds, setMaxRounds] = useState(5);

  // Active Session State
  const [currentSession, setCurrentSession] = useState(null);
  const [activeRound, setActiveRound] = useState(null);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [lastRoundEvaluation, setLastRoundEvaluation] = useState(null);
  const [summaryReport, setSummaryReport] = useState(null);

  // Loading & Error States
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);
  const [tasksCreatedCount, setTasksCreatedCount] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // History State
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Voice & Speech Recognition
  const [isListening, setIsListening] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(true);
  const [isSpeechMuted, setIsSpeechMuted] = useState(false);
  const [isExaminerSpeaking, setIsExaminerSpeaking] = useState(false);
  const recognitionRef = useRef(null);

  // Speech Synthesis Helper
  const speakQuestion = useCallback((text) => {
    if (isSpeechMuted || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";

      utterance.onstart = () => setIsExaminerSpeaking(true);
      utterance.onend = () => setIsExaminerSpeaking(false);
      utterance.onerror = () => setIsExaminerSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis error:", err);
      setIsExaminerSpeaking(false);
    }
  }, [isSpeechMuted]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsVoiceSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          }
        }
        if (finalTranscript) {
          setStudentAnswer((prev) => (prev ? `${prev.trim()} ${finalTranscript.trim()}` : finalTranscript.trim()));
        }
      };

      recognition.onerror = (e) => {
        console.warn("Speech recognition error:", e.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch {
      setIsVoiceSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup errors
        }
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Fetch Viva History
  const loadHistory = useCallback(async () => {
    if (!accessToken) {
      setIsLoadingHistory(false);
      return;
    }
    setIsLoadingHistory(true);
    try {
      const res = await vivaService.getHistory(accessToken);
      setHistory(res?.history || []);
    } catch (err) {
      console.warn("Failed to load viva history:", err.message);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Toggle Voice Input
  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        // Stop audio playback if examiner was speaking
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          setIsExaminerSpeaking(false);
        }
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Error starting speech recognition:", err);
      }
    }
  };

  // Start Session
  const handleStartViva = async () => {
    const finalTopic = (customTopic.trim() || selectedTopic).trim();
    if (!finalTopic) {
      setErrorMessage("Please select or enter a topic for your technical viva.");
      return;
    }

    setIsStarting(true);
    setErrorMessage("");
    setLastRoundEvaluation(null);
    setTasksCreatedCount(null);

    try {
      const res = await vivaService.startSession(accessToken, {
        topic: finalTopic,
        difficulty,
        maxRounds: Number(maxRounds)
      });

      const session = res.session;
      setCurrentSession(session);
      const q1 = session.rounds[0]?.question;
      setActiveRound({
        roundNumber: 1,
        question: q1
      });
      setViewMode("active");
      setStudentAnswer("");

      // Voice read-out question
      setTimeout(() => {
        speakQuestion(q1);
      }, 400);
    } catch (err) {
      setErrorMessage(err.message || "Failed to start viva session. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  // Submit Answer
  const handleSubmitAnswer = async () => {
    if (!currentSession || !activeRound) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await vivaService.submitAnswer(
        accessToken,
        currentSession._id,
        studentAnswer
      );

      setLastRoundEvaluation(res.evaluation);

      if (res.isCompleted) {
        // Session complete
        setSummaryReport(res.summaryReport);
        setCurrentSession(res.session);
        setViewMode("scorecard");
        loadHistory();
      } else {
        // Proceed to next round
        const nextRoundNum = res.session.currentRound;
        setActiveRound({
          roundNumber: nextRoundNum,
          question: res.nextQuestion
        });
        setCurrentSession(res.session);
        setStudentAnswer("");

        // Speak the follow-up question
        setTimeout(() => {
          speakQuestion(res.nextQuestion);
        }, 500);
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to submit answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert recommended topics into study tasks
  const handleCreateTasks = async () => {
    if (!currentSession?._id) return;
    setIsCreatingTasks(true);
    setErrorMessage("");

    try {
      const res = await vivaService.convertRecommendationsToTasks(accessToken, currentSession._id);
      setTasksCreatedCount(res.count);
    } catch (err) {
      setErrorMessage(err.message || "Failed to create study tasks.");
    } finally {
      setIsCreatingTasks(false);
    }
  };

  // Reset to setup
  const handleExitSession = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setViewMode("setup");
    setCurrentSession(null);
    setActiveRound(null);
    setLastRoundEvaluation(null);
    setSummaryReport(null);
    setStudentAnswer("");
    setTasksCreatedCount(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2B2723] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase rounded-full bg-[#E0693B]/10 text-[#E0693B] border border-[#E0693B]/20">
              Interactive AI Examiner
            </span>
            <span className="text-xs text-[#9C9384] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#E0693B]" /> Socratic Method & Voice Evaluation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#FAF7F2] font-display">
            AI Socratic Viva
          </h1>
          <p className="text-sm text-[#9C9384] mt-1 max-w-2xl">
            Test and sharpen your technical defense skills. The AI examiner questions your reasoning,
            drills into trade-offs, and scores your conceptual mastery.
          </p>
        </div>

        {/* Global Sound Control */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const nextMuted = !isSpeechMuted;
              setIsSpeechMuted(nextMuted);
              if (nextMuted && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
                setIsExaminerSpeaking(false);
              }
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isSpeechMuted
                ? "bg-[#1C1A17] border-[#2B2723] text-[#9C9384]"
                : "bg-[#25221E] border-[#E0693B]/40 text-[#E0693B]"
            }`}
            title={isSpeechMuted ? "Examiner Voice Muted" : "Examiner Voice Active"}
          >
            {isSpeechMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isSpeechMuted ? "Voice Muted" : "Voice Active"}</span>
          </button>

          {viewMode !== "setup" && (
            <Button variant="secondary" size="sm" onClick={handleExitSession}>
              Exit Room
            </Button>
          )}
        </div>
      </div>

      {errorMessage && (
        <ErrorMessage
          message={errorMessage}
          onRetry={() => setErrorMessage("")}
        />
      )}

      {/* VIEW MODE 1: SETUP CHAMBER */}
      {viewMode === "setup" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Setup Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#1C1A17] border border-[#2B2723] rounded-2xl p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#FAF7F2] flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-[#E0693B]" />
                  1. Select or Customize Viva Topic
                </h2>
                <p className="text-xs text-[#9C9384] mt-1">
                  Choose a high-impact technical domain or type your own custom topic.
                </p>
              </div>

              {/* Preset Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_TOPICS.map((topic) => {
                  const isSelected = selectedTopic === topic.title && !customTopic.trim();
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => {
                        setSelectedTopic(topic.title);
                        setCustomTopic("");
                      }}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-[#25221E] border-[#E0693B] shadow-sm shadow-[#E0693B]/20"
                          : "bg-[#161513] border-[#2B2723] hover:border-[#3D3833]"
                      }`}
                    >
                      <div className="font-semibold text-sm text-[#FAF7F2]">{topic.title}</div>
                      <div className="text-xs text-[#9C9384] mt-1 line-clamp-1">{topic.description}</div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Topic Input */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-[#9C9384] mb-2 uppercase tracking-wider">
                  Or enter your specific focus area / topic:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Consensus (Raft), GraphQL Fed, PostgreSQL MVCC..."
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="w-full bg-[#161513] border border-[#2B2723] focus:border-[#E0693B] focus:outline-none rounded-xl px-4 py-3 text-sm text-[#FAF7F2] placeholder-[#665F55] transition-all"
                />
              </div>

              {/* Config Row: Difficulty & Rounds */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#2B2723]">
                <div>
                  <label className="block text-xs font-semibold text-[#9C9384] mb-2 uppercase tracking-wider">
                    Viva Rigor Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Beginner", "Intermediate", "Advanced"].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setDifficulty(level)}
                        className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                          difficulty === level
                            ? "bg-[#E0693B] text-white border-[#E0693B]"
                            : "bg-[#161513] text-[#9C9384] border-[#2B2723] hover:text-[#FAF7F2]"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#9C9384] mb-2 uppercase tracking-wider">
                    Rounds of Defense
                  </label>
                  <select
                    value={maxRounds}
                    onChange={(e) => setMaxRounds(e.target.value)}
                    className="w-full bg-[#161513] border border-[#2B2723] focus:border-[#E0693B] focus:outline-none rounded-lg px-3 py-2 text-sm text-[#FAF7F2]"
                  >
                    <option value={3}>3 Rounds (Quick Sprint - 5 mins)</option>
                    <option value={5}>5 Rounds (Standard Viva - 10 mins)</option>
                    <option value={7}>7 Rounds (Deep Technical Defense)</option>
                  </select>
                </div>
              </div>

              {/* Start CTA */}
              <div className="pt-2">
                <Button
                  onClick={handleStartViva}
                  isLoading={isStarting}
                  disabled={isStarting}
                  className="w-full py-3.5 text-base font-semibold shadow-lg shadow-[#E0693B]/20 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Enter Viva Room & Begin Defense
                </Button>
                <p className="text-[11px] text-center text-[#7A7265] mt-2">
                  Microphone access enabled for voice answering • Audio responses narrated live
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Past Viva History */}
          <div className="space-y-6">
            <div className="bg-[#1C1A17] border border-[#2B2723] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#FAF7F2] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#E0693B]" />
                  Viva Track Record
                </h3>
                <span className="text-xs text-[#9C9384]">{history.length} completed</span>
              </div>

              {isLoadingHistory ? (
                <div className="py-8 flex justify-center">
                  <Loader size="sm" />
                </div>
              ) : history.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#7A7265] border border-dashed border-[#2B2723] rounded-xl p-4">
                  No previous viva sessions recorded yet. Start your first session to build your technical defense score!
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div
                      key={item._id}
                      className="p-3 rounded-xl bg-[#161513] border border-[#2B2723] hover:border-[#3D3833] transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#FAF7F2] truncate max-w-[170px]">
                          {item.topic}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            item.averageScore >= 8
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : item.averageScore >= 6
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {item.summaryReport?.overallGrade || `${item.averageScore}/10`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#7A7265] mt-2">
                        <span>{item.difficulty} • {item.maxRounds} rounds</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Socratic Tips Card */}
            <div className="bg-[#1C1A17]/60 border border-[#2B2723] rounded-2xl p-5 text-xs text-[#9C9384] space-y-2.5">
              <div className="font-semibold text-[#FAF7F2] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#E0693B]" />
                How the Viva Evaluates You:
              </div>
              <ul className="space-y-1.5 text-[11px] pl-4 list-disc text-[#9C9384]">
                <li><strong>Accuracy & Nuance:</strong> Core understanding without buzzwords.</li>
                <li><strong>Edge Cases & Trade-offs:</strong> When to use vs when NOT to use.</li>
                <li><strong>Conciseness:</strong> Structured, crisp oral delivery.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: ACTIVE VIVA CHAMBER */}
      {viewMode === "active" && currentSession && activeRound && (
        <div className="space-y-6">
          {/* Active Status Bar */}
          <div className="bg-[#1C1A17] border border-[#2B2723] rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E0693B]/10 border border-[#E0693B]/20 flex items-center justify-center text-[#E0693B]">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#FAF7F2]">{currentSession.topic}</h2>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#25221E] text-[#E0693B] border border-[#2B2723]">
                    {currentSession.difficulty}
                  </span>
                </div>
                <p className="text-xs text-[#9C9384]">
                  Round {activeRound.roundNumber} of {currentSession.maxRounds}
                </p>
              </div>
            </div>

            {/* Round Stepper Dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: currentSession.maxRounds }).map((_, idx) => {
                const roundNum = idx + 1;
                const isPassed = roundNum < activeRound.roundNumber;
                const isCurrent = roundNum === activeRound.roundNumber;
                return (
                  <div
                    key={roundNum}
                    className={`h-2 rounded-full transition-all ${
                      isPassed
                        ? "w-6 bg-emerald-500"
                        : isCurrent
                        ? "w-8 bg-[#E0693B] animate-pulse"
                        : "w-3 bg-[#2B2723]"
                    }`}
                    title={`Round ${roundNum}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Examiner Question Box */}
          <div className="bg-[#1C1A17] border border-[#2B2723] rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl shadow-black/40 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#2B2723] pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isExaminerSpeaking
                      ? "bg-emerald-400 animate-ping"
                      : "bg-[#E0693B]"
                  }`}
                />
                <span className="text-xs font-semibold text-[#FAF7F2] tracking-wide uppercase">
                  AI Examiner (Socratic Lead)
                </span>
                {isExaminerSpeaking && (
                  <span className="text-[11px] text-emerald-400 font-mono animate-pulse">
                    Speaking question...
                  </span>
                )}
              </div>

              {/* Re-play voice question */}
              <button
                type="button"
                onClick={() => speakQuestion(activeRound.question)}
                className="flex items-center gap-1.5 text-xs text-[#9C9384] hover:text-[#FAF7F2] transition-colors px-2.5 py-1 rounded-lg bg-[#161513] border border-[#2B2723]"
                title="Hear question again"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Repeat Question</span>
              </button>
            </div>

            {/* Question Text */}
            <div className="text-lg sm:text-xl font-medium text-[#FAF7F2] leading-relaxed py-2 font-display">
              "{activeRound.question}"
            </div>

            {/* Previous Round Feedback Strip (if available) */}
            {lastRoundEvaluation && (
              <div className="mt-4 p-4 rounded-xl bg-[#161513] border border-[#2B2723] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#9C9384] uppercase tracking-wider text-[10px]">
                    Feedback on Round {lastRoundEvaluation.roundNumber}:
                  </span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      lastRoundEvaluation.score >= 8
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    Score: {lastRoundEvaluation.score}/10
                  </span>
                </div>
                <p className="text-[#FAF7F2]">{lastRoundEvaluation.feedback}</p>
                {lastRoundEvaluation.keyTakeaway && (
                  <div className="text-[11px] text-[#9C9384] italic pt-1 border-t border-[#25221E]">
                    <strong>Gold Standard Takeaway:</strong> {lastRoundEvaluation.keyTakeaway}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Student Defense & Response Box */}
          <div className="bg-[#1C1A17] border border-[#2B2723] rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#FAF7F2] uppercase tracking-wider flex items-center gap-2">
                <span>Your Verbal or Written Defense</span>
                {isListening && (
                  <span className="flex items-center gap-1 text-[11px] text-rose-400 font-mono animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Recording live audio...
                  </span>
                )}
              </label>

              {isVoiceSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isListening
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
                      : "bg-[#25221E] text-[#FAF7F2] border border-[#3D3833] hover:border-[#E0693B]"
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#E0693B]" />}
                  <span>{isListening ? "Stop Speaking" : "Click to Speak Answer"}</span>
                </button>
              )}
            </div>

            {/* Textarea for spoken/typed answer */}
            <div className="relative">
              <textarea
                rows={5}
                value={studentAnswer}
                onChange={(e) => setStudentAnswer(e.target.value)}
                placeholder="Speak clearly using the microphone button or type your technical explanation here... Be specific about trade-offs and concepts."
                className="w-full bg-[#161513] border border-[#2B2723] focus:border-[#E0693B] focus:outline-none rounded-xl p-4 text-sm text-[#FAF7F2] placeholder-[#665F55] transition-all resize-y"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-xs text-[#7A7265]">
                {studentAnswer.trim() ? (
                  <span>{studentAnswer.trim().split(/\s+/).length} words spoken/typed</span>
                ) : (
                  <span>Answer can be spoken aloud or typed.</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {studentAnswer.trim() && (
                  <button
                    type="button"
                    onClick={() => setStudentAnswer("")}
                    className="text-xs text-[#9C9384] hover:text-[#FAF7F2] px-2 py-1"
                  >
                    Clear
                  </button>
                )}

                <Button
                  onClick={handleSubmitAnswer}
                  isLoading={isSubmitting}
                  disabled={isSubmitting || !studentAnswer.trim()}
                  className="px-6 py-2.5 font-semibold shadow-md shadow-[#E0693B]/20 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {activeRound.roundNumber >= currentSession.maxRounds
                      ? "Submit Final Defense & Get Scorecard"
                      : "Submit Answer & Next Question"}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: FINAL VIVA SCORECARD */}
      {viewMode === "scorecard" && currentSession && summaryReport && (
        <div className="space-y-8 animate-fadeIn">
          {/* Main Grade Header Banner */}
          <div className="bg-gradient-to-r from-[#1C1A17] via-[#241F1A] to-[#1C1A17] border border-[#E0693B]/30 rounded-2xl p-6 sm:p-10 text-center relative overflow-hidden shadow-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0693B]/10 border border-[#E0693B]/20 text-xs font-semibold text-[#E0693B] mb-4 uppercase tracking-wider">
              AI Technical Defense Scorecard
            </div>

            <h2 className="text-2xl sm:text-4xl font-bold text-[#FAF7F2] font-display">
              {currentSession.topic} Viva Completed
            </h2>
            <p className="text-xs sm:text-sm text-[#9C9384] mt-2 max-w-xl mx-auto">
              {summaryReport.overallFeedback}
            </p>

            {/* Big Grade Box */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 mt-8 pt-6 border-t border-[#2B2723]/60">
              <div className="flex flex-col items-center">
                <span className="text-xs text-[#9C9384] uppercase tracking-wider">Final Grade</span>
                <span className="text-4xl sm:text-5xl font-black text-[#E0693B] font-display mt-1">
                  {summaryReport.overallGrade}
                </span>
              </div>

              <div className="h-12 w-[1px] bg-[#2B2723] hidden sm:block" />

              <div className="flex flex-col items-center">
                <span className="text-xs text-[#9C9384] uppercase tracking-wider">Average Score</span>
                <span className="text-4xl sm:text-5xl font-black text-[#FAF7F2] font-display mt-1">
                  {currentSession.averageScore}
                  <span className="text-xl text-[#7A7265] font-normal">/10</span>
                </span>
              </div>

              <div className="h-12 w-[1px] bg-[#2B2723] hidden sm:block" />

              <div className="flex flex-col items-center">
                <span className="text-xs text-[#9C9384] uppercase tracking-wider">Interview Readiness</span>
                <span className="text-lg font-bold text-emerald-400 mt-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  {summaryReport.readinessAssessment || "Ready for Technical Round"}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Strengths & Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths Card */}
            <div className="bg-[#1C1A17] border border-[#2B2723] rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Demonstrated Technical Strengths</span>
              </div>
              <ul className="space-y-2.5 text-xs text-[#FAF7F2]">
                {(summaryReport.strengthsSummary || []).map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-[#161513] p-3 rounded-xl border border-[#2B2723]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Review Topics & Action Bridge */}
            <div className="bg-[#1C1A17] border border-[#2B2723] rounded-2xl p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#E0693B] font-semibold text-sm">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Key Concepts To Strengthen</span>
                </div>
                <p className="text-xs text-[#9C9384] mt-1">
                  Identified knowledge gaps to revise before real-world interviews:
                </p>

                <ul className="space-y-2.5 text-xs text-[#FAF7F2] mt-3">
                  {(summaryReport.recommendedTopics || []).map((topic, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-[#161513] p-3 rounded-xl border border-[#2B2723]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E0693B] mt-1.5 shrink-0" />
                      <span className="font-medium">{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* NEXORA Bridge Action */}
              <div className="pt-4 border-t border-[#2B2723] space-y-2">
                {tasksCreatedCount !== null ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {tasksCreatedCount} study tasks added to your Task Planner!
                    </span>
                    <Link to="/tasks" className="underline font-semibold hover:text-emerald-300">
                      View Tasks
                    </Link>
                  </div>
                ) : (
                  <Button
                    onClick={handleCreateTasks}
                    isLoading={isCreatingTasks}
                    disabled={isCreatingTasks}
                    variant="secondary"
                    className="w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2 border-[#E0693B]/40 hover:border-[#E0693B]"
                  >
                    <PlusCircle className="w-4 h-4 text-[#E0693B]" />
                    Convert Revision Topics to NEXORA Study Tasks
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Transcript Review Accordion / List */}
          <div className="bg-[#1C1A17] border border-[#2B2723] rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#FAF7F2] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#E0693B]" />
              Round-by-Round Viva Transcript
            </h3>

            <div className="space-y-3">
              {currentSession.rounds.map((round) => (
                <div
                  key={round._id || round.roundNumber}
                  className="p-4 rounded-xl bg-[#161513] border border-[#2B2723] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-[#25221E] pb-2">
                    <span className="font-semibold text-[#E0693B]">Round {round.roundNumber}</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        round.score >= 8
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {round.score !== null ? `${round.score}/10` : "Unscored"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#9C9384] font-medium">Examiner: </span>
                    <span className="text-[#FAF7F2] font-semibold">{round.question}</span>
                  </div>
                  <div>
                    <span className="text-[#9C9384] font-medium">Your Answer: </span>
                    <span className="text-[#FAF7F2]">{round.studentAnswer || "No answer recorded"}</span>
                  </div>
                  {round.feedback && (
                    <div className="text-[11px] text-[#9C9384] pt-1">
                      <strong>Feedback:</strong> {round.feedback}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button onClick={handleExitSession} className="px-8 py-3 text-sm font-semibold">
              Start Another Viva Exam
            </Button>
            <Link to="/dashboard">
              <Button variant="secondary" className="px-6 py-3 text-sm">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Viva;
