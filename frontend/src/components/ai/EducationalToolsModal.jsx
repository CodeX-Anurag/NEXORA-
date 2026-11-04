import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  HelpCircle,
  BookOpen,
  BrainCircuit,
  Code2,
  X,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Award,
  Sparkles,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  Send,
  Flame
} from "lucide-react";
import aiService from "../../services/ai.service";
import { vivaService } from "../../services/viva.service";
import Button from "../common/Button";

const PROGRAMMING_LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "cpp",
  "c",
  "go",
  "rust",
  "sql"
];

export const EducationalToolsModal = ({ isOpen, onClose, onInsertIntoChat, accessToken }) => {
  const [activeTab, setActiveTab] = useState("menu"); // "menu" | "quiz" | "flashcards" | "viva" | "code_review"

  // ─── Tool 1: Quiz Generator State ──────────────────────────────────────────
  const [quizTopic, setQuizTopic] = useState("Binary Search Trees & Big-O");
  const [quizCount, setQuizCount] = useState(3);
  const [quizDifficulty, setQuizDifficulty] = useState("Medium");
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [quizSelectedAnswers, setQuizSelectedAnswers] = useState({});
  const [quizError, setQuizError] = useState("");

  // ─── Tool 2: Flashcards Deck State ─────────────────────────────────────────
  const [flashTopic, setFlashTopic] = useState("TCP/IP & Networking Protocols");
  const [flashCount, setFlashCount] = useState(5);
  const [flashDifficulty, setFlashDifficulty] = useState("Medium");
  const [isGeneratingFlash, setIsGeneratingFlash] = useState(false);
  const [flashDeck, setFlashDeck] = useState(null);
  const [currentFlashIdx, setCurrentFlashIdx] = useState(0);
  const [isFlashFlipped, setIsFlashFlipped] = useState(false);
  const [knownFlashcards, setKnownFlashcards] = useState(new Set());
  const [flashError, setFlashError] = useState("");

  // ─── Tool 3: Socratic Viva State ───────────────────────────────────────────
  const [vivaTopic, setVivaTopic] = useState("System Design & Database Scaling");
  const [vivaDifficulty, setVivaDifficulty] = useState("Medium");
  const [vivaRounds, setVivaRounds] = useState(3);
  const [isStartingViva, setIsStartingViva] = useState(false);
  const [vivaSession, setVivaSession] = useState(null);
  const [vivaActiveRound, setVivaActiveRound] = useState(null);
  const [vivaUserAnswer, setVivaUserAnswer] = useState("");
  const [isSubmittingVivaAnswer, setIsSubmittingVivaAnswer] = useState(false);
  const [vivaFeedback, setVivaFeedback] = useState(null);
  const [vivaError, setVivaError] = useState("");

  // ─── Tool 4: Code Complexity & Review State ────────────────────────────────
  const [codeLang, setCodeLang] = useState("javascript");
  const [codeSnippet, setCodeSnippet] = useState(
`function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`
  );
  const [isReviewingCode, setIsReviewingCode] = useState(false);
  const [codeReviewData, setCodeReviewData] = useState(null);
  const [codeError, setCodeError] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  // ─── Action: Generate Quiz ─────────────────────────────────────────────────
  const handleGenerateQuiz = async () => {
    if (!quizTopic.trim()) return;
    setIsGeneratingQuiz(true);
    setQuizError("");
    setQuizSelectedAnswers({});

    try {
      const res = await aiService.generateQuiz(accessToken, {
        topic: quizTopic.trim(),
        count: Number(quizCount) || 3,
        difficulty: quizDifficulty
      });

      if (res.quiz && res.quiz.questions?.length > 0) {
        setQuizData(res.quiz);
      } else {
        setQuizError("Could not generate quiz questions for this topic. Please try another topic.");
      }
    } catch (err) {
      setQuizError(err.message || "Failed to generate interactive quiz.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // ─── Action: Generate Flashcards ───────────────────────────────────────────
  const handleGenerateFlashcards = async () => {
    if (!flashTopic.trim()) return;
    setIsGeneratingFlash(true);
    setFlashError("");
    setCurrentFlashIdx(0);
    setIsFlashFlipped(false);
    setKnownFlashcards(new Set());

    try {
      const res = await aiService.generateFlashcards(accessToken, {
        topic: flashTopic.trim(),
        count: Number(flashCount) || 5,
        difficulty: flashDifficulty
      });

      if (res.deck && res.deck.cards?.length > 0) {
        setFlashDeck(res.deck);
      } else {
        setFlashError("Could not generate flashcards for this topic.");
      }
    } catch (err) {
      setFlashError(err.message || "Failed to generate flashcards.");
    } finally {
      setIsGeneratingFlash(false);
    }
  };

  // ─── Action: Start Socratic Viva ───────────────────────────────────────────
  const handleStartViva = async () => {
    if (!vivaTopic.trim()) return;
    setIsStartingViva(true);
    setVivaError("");
    setVivaFeedback(null);
    setVivaUserAnswer("");

    try {
      const res = await vivaService.startVivaSession(accessToken, {
        topic: vivaTopic.trim(),
        difficulty: vivaDifficulty.toLowerCase(),
        maxRounds: Number(vivaRounds) || 3
      });

      setVivaSession(res.session);
      setVivaActiveRound(res.activeRound);
    } catch (err) {
      setVivaError(err.message || "Failed to start viva examination session.");
    } finally {
      setIsStartingViva(false);
    }
  };

  const handleSubmitVivaAnswer = async () => {
    if (!vivaUserAnswer.trim() || !vivaSession) return;
    setIsSubmittingVivaAnswer(true);
    setVivaError("");

    try {
      const res = await vivaService.submitVivaAnswer(accessToken, vivaSession._id, {
        answer: vivaUserAnswer.trim()
      });

      setVivaFeedback(res.feedback || res.evaluation || res);
      setVivaUserAnswer("");

      if (res.nextRound) {
        setVivaActiveRound(res.nextRound);
      } else if (res.isFinished || res.isCompleted) {
        setVivaActiveRound(null);
      }
    } catch (err) {
      setVivaError(err.message || "Failed to submit viva answer.");
    } finally {
      setIsSubmittingVivaAnswer(false);
    }
  };

  // ─── Action: Review Code ───────────────────────────────────────────────────
  const handleReviewCode = async () => {
    if (!codeSnippet.trim()) return;
    setIsReviewingCode(true);
    setCodeError("");

    try {
      const res = await aiService.reviewCode(accessToken, {
        code: codeSnippet.trim(),
        language: codeLang
      });

      if (res.review) {
        setCodeReviewData(res.review);
      } else {
        setCodeError("Could not generate code analysis. Please check your snippet.");
      }
    } catch (err) {
      setCodeError(err.message || "Failed to perform code review.");
    } finally {
      setIsReviewingCode(false);
    }
  };

  // ─── Action: Insert Into Chat ──────────────────────────────────────────────
  const handleInsertQuizToChat = () => {
    if (!quizData) return;
    const fence = `\`\`\`quiz\n${JSON.stringify(quizData, null, 2)}\n\`\`\``;
    onInsertIntoChat(fence);
    onClose();
  };

  const handleInsertFlashcardsToChat = () => {
    if (!flashDeck) return;
    const fence = `\`\`\`flashcards\n${JSON.stringify(flashDeck, null, 2)}\n\`\`\``;
    onInsertIntoChat(fence);
    onClose();
  };

  const handleInsertCodeAnalysisToChat = () => {
    if (!codeReviewData) return;
    let md = `### Code Review & Big-O Complexity (${codeLang})\n\n`;
    md += `• **Time Complexity:** \`${codeReviewData.timeComplexity}\` — ${codeReviewData.timeExplanation}\n`;
    md += `• **Auxiliary Space Complexity:** \`${codeReviewData.spaceComplexity}\` — ${codeReviewData.spaceExplanation}\n\n`;
    if (codeReviewData.bugsAndEdgeCases?.length > 0) {
      md += `**Bugs & Edge Cases Identified:**\n`;
      codeReviewData.bugsAndEdgeCases.forEach((b) => (md += `- ${b}\n`));
      md += `\n`;
    }
    if (codeReviewData.refactoredCode) {
      md += `**Optimized Refactored Solution:**\n\`\`\`${codeLang}\n${codeReviewData.refactoredCode}\n\`\`\`\n`;
    }
    onInsertIntoChat(md);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col space-y-4 animate-modal-in overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#F1F4F9] dark:border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-xs">
              <BrainCircuit size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#172033] dark:text-white font-display flex items-center gap-2">
                Smart Educational AI Tools
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                  Pedagogical Engine
                </span>
              </h3>
              <p className="text-[10px] sm:text-xs text-[#667085] dark:text-slate-400">
                Interactive learning scaffolds, practice quizzes, flashcard recall, viva &amp; code analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#F1F4F9] dark:border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab("menu")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "menu"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white"
            }`}
          >
            All Tools
          </button>
          <button
            onClick={() => setActiveTab("quiz")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "quiz"
                ? "bg-violet-600 text-white shadow-xs shadow-violet-500/25"
                : "text-[#667085] dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400"
            }`}
          >
            <HelpCircle size={13} />
            <span>Interactive Quiz</span>
          </button>
          <button
            onClick={() => setActiveTab("flashcards")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "flashcards"
                ? "bg-indigo-600 text-white shadow-xs shadow-indigo-500/25"
                : "text-[#667085] dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
            }`}
          >
            <BookOpen size={13} />
            <span>Flashcards</span>
          </button>
          <button
            onClick={() => setActiveTab("viva")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "viva"
                ? "bg-rose-600 text-white shadow-xs shadow-rose-500/25"
                : "text-[#667085] dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
            }`}
          >
            <Flame size={13} />
            <span>Socratic Viva</span>
          </button>
          <button
            onClick={() => setActiveTab("code_review")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "code_review"
                ? "bg-cyan-600 text-white shadow-xs shadow-cyan-500/25"
                : "text-[#667085] dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400"
            }`}
          >
            <Code2 size={13} />
            <span>Code &amp; Complexity</span>
          </button>
        </div>

        {/* Modal Body Container with Scroll */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* ══════════════════════════════════════════════════════════════════
              VIEW 0: MENU OVERVIEW
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "menu" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
              <div
                onClick={() => setActiveTab("quiz")}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 hover:border-violet-500 transition-all cursor-pointer group shadow-2xs hover:shadow-md space-y-2"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <HelpCircle size={20} />
                </div>
                <h4 className="text-sm font-bold text-[#172033] dark:text-white group-hover:text-violet-600 transition-colors">
                  Interactive Quiz Generator
                </h4>
                <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
                  Generate instant multiple-choice questions with real-time scoring, live validation, and comprehensive explanations.
                </p>
              </div>

              <div
                onClick={() => setActiveTab("flashcards")}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 hover:border-indigo-500 transition-all cursor-pointer group shadow-2xs hover:shadow-md space-y-2"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
                <h4 className="text-sm font-bold text-[#172033] dark:text-white group-hover:text-indigo-600 transition-colors">
                  Revision Flashcard Deck
                </h4>
                <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
                  Active-recall cards with 3D flip animation, shuffle, mastery tracking (Known vs Needs Revision), and study metrics.
                </p>
              </div>

              <div
                onClick={() => setActiveTab("viva")}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 hover:border-rose-500 transition-all cursor-pointer group shadow-2xs hover:shadow-md space-y-2"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Flame size={20} />
                </div>
                <h4 className="text-sm font-bold text-[#172033] dark:text-white group-hover:text-rose-600 transition-colors">
                  Socratic Viva Practice
                </h4>
                <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
                  Real Socratic oral examination with NEXORA viva engine. Answers evaluated one round at a time with feedback.
                </p>
              </div>

              <div
                onClick={() => setActiveTab("code_review")}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 hover:border-cyan-500 transition-all cursor-pointer group shadow-2xs hover:shadow-md space-y-2"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <Code2 size={20} />
                </div>
                <h4 className="text-sm font-bold text-[#172033] dark:text-white group-hover:text-cyan-600 transition-colors">
                  Code Complexity &amp; Review
                </h4>
                <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
                  Rigorous Big-O time and space complexity derivation, bug/edge case discovery, and refactored code generation.
                </p>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 1: INTERACTIVE QUIZ GENERATOR
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "quiz" && (
            <div className="space-y-4">
              {/* Configuration Strip */}
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 block mb-1">
                      Quiz Topic:
                    </label>
                    <input
                      type="text"
                      value={quizTopic}
                      onChange={(e) => setQuizTopic(e.target.value)}
                      placeholder="e.g. Binary Search Trees, React Hooks, TCP/IP..."
                      className="w-full text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-slate-700 text-[#172033] dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 block mb-1">
                      Count:
                    </label>
                    <select
                      value={quizCount}
                      onChange={(e) => setQuizCount(Number(e.target.value))}
                      className="text-xs px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-slate-700 text-[#172033] dark:text-slate-100 cursor-pointer"
                    >
                      <option value={3}>3 Questions</option>
                      <option value={5}>5 Questions</option>
                      <option value={8}>8 Questions</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 block mb-1">
                      Difficulty:
                    </label>
                    <select
                      value={quizDifficulty}
                      onChange={(e) => setQuizDifficulty(e.target.value)}
                      className="text-xs px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-slate-700 text-[#172033] dark:text-slate-100 cursor-pointer"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div className="self-end">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleGenerateQuiz}
                      isLoading={isGeneratingQuiz}
                      disabled={!quizTopic.trim() || isGeneratingQuiz}
                      className="bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-1.5"
                    >
                      <Sparkles size={13} />
                      <span>Generate Quiz</span>
                    </Button>
                  </div>
                </div>
              </div>

              {quizError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs">
                  {quizError}
                </div>
              )}

              {/* Render Active Quiz */}
              {quizData && quizData.questions?.length > 0 && (
                <div className="space-y-4 pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#172033] dark:text-white font-display">
                        {quizData.topic}
                      </h4>
                      <span className="text-[10px] text-[#667085] dark:text-slate-400">
                        Difficulty: {quizData.difficulty || quizDifficulty} &bull; {quizData.questions.length} Questions
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleInsertQuizToChat}
                        className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 hover:bg-violet-100 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Send size={11} />
                        <span>Insert in Chat</span>
                      </button>
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-5">
                    {quizData.questions.map((q, qIdx) => {
                      const userChoice = quizSelectedAnswers[qIdx];
                      const hasAnswered = userChoice !== undefined;
                      const isCorrect = userChoice === q.answerIndex;

                      return (
                        <div key={qIdx} className="p-4 rounded-2xl bg-[#F8FAFC]/70 dark:bg-slate-900/60 border border-[#E7EAF0] dark:border-slate-800 space-y-3">
                          <p className="text-xs sm:text-sm font-semibold text-[#172033] dark:text-slate-100 flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                              {qIdx + 1}
                            </span>
                            <span>{q.question}</span>
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7">
                            {q.options.map((opt, optIdx) => {
                              let optStyle = "bg-white dark:bg-slate-800 border-[#E7EAF0] dark:border-slate-700 text-[#172033] dark:text-slate-200 hover:border-violet-300";

                              if (hasAnswered) {
                                if (optIdx === q.answerIndex) {
                                  optStyle = "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold";
                                } else if (optIdx === userChoice) {
                                  optStyle = "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300";
                                } else {
                                  optStyle = "opacity-50 bg-white dark:bg-slate-800 border-[#E7EAF0] dark:border-slate-700 text-slate-400";
                                }
                              }

                              return (
                                <button
                                  key={optIdx}
                                  disabled={hasAnswered}
                                  onClick={() => setQuizSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))}
                                  className={`p-2.5 rounded-xl border text-xs text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${optStyle}`}
                                >
                                  <span>{opt}</span>
                                  {hasAnswered && optIdx === q.answerIndex && (
                                    <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  )}
                                  {hasAnswered && optIdx === userChoice && optIdx !== q.answerIndex && (
                                    <XCircle size={13} className="text-rose-600 dark:text-rose-400 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Explanation */}
                          {hasAnswered && q.explanation && (
                            <div className="ml-7 p-3 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 text-[11px] text-[#667085] dark:text-slate-300 space-y-0.5">
                              <span className="font-bold text-violet-700 dark:text-violet-400 block">
                                {isCorrect ? "Correct!" : "Explanation:"}
                              </span>
                              <p>{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 2: REVISION FLASHCARDS
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "flashcards" && (
            <div className="space-y-4">
              {/* Configuration Strip */}
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 block mb-1">
                      Deck Topic:
                    </label>
                    <input
                      type="text"
                      value={flashTopic}
                      onChange={(e) => setFlashTopic(e.target.value)}
                      placeholder="e.g. Operating Systems, System Design, React..."
                      className="w-full text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-slate-700 text-[#172033] dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 block mb-1">
                      Count:
                    </label>
                    <select
                      value={flashCount}
                      onChange={(e) => setFlashCount(Number(e.target.value))}
                      className="text-xs px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-slate-700 text-[#172033] dark:text-slate-100 cursor-pointer"
                    >
                      <option value={5}>5 Cards</option>
                      <option value={8}>8 Cards</option>
                      <option value={10}>10 Cards</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 block mb-1">
                      Difficulty:
                    </label>
                    <select
                      value={flashDifficulty}
                      onChange={(e) => setFlashDifficulty(e.target.value)}
                      className="text-xs px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-slate-700 text-[#172033] dark:text-slate-100 cursor-pointer"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Medium">Medium</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div className="self-end">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleGenerateFlashcards}
                      isLoading={isGeneratingFlash}
                      disabled={!flashTopic.trim() || isGeneratingFlash}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
                    >
                      <Sparkles size={13} />
                      <span>Generate Deck</span>
                    </Button>
                  </div>
                </div>
              </div>

              {flashError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs">
                  {flashError}
                </div>
              )}

              {/* Render Active Flashcards Deck */}
              {flashDeck && flashDeck.cards?.length > 0 && (
                <div className="space-y-4 pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#172033] dark:text-white font-display">
                        {flashDeck.deckTitle}
                      </h4>
                      <span className="text-[10px] text-[#667085] dark:text-slate-400">
                        Card {currentFlashIdx + 1} of {flashDeck.cards.length} &bull; Known: {knownFlashcards.size} / {flashDeck.cards.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const shuffled = [...flashDeck.cards].sort(() => Math.random() - 0.5);
                          setFlashDeck({ ...flashDeck, cards: shuffled });
                          setCurrentFlashIdx(0);
                          setIsFlashFlipped(false);
                        }}
                        className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#F8FAFC] dark:bg-slate-800 text-[#667085] dark:text-slate-300 hover:text-[#172033] dark:hover:text-white flex items-center gap-1 cursor-pointer"
                        title="Shuffle Deck"
                      >
                        <Shuffle size={12} />
                        <span>Shuffle</span>
                      </button>
                      <button
                        onClick={handleInsertFlashcardsToChat}
                        className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Send size={11} />
                        <span>Insert in Chat</span>
                      </button>
                    </div>
                  </div>

                  {/* 3D Flip Flashcard */}
                  <div
                    onClick={() => setIsFlashFlipped(!isFlashFlipped)}
                    className="relative w-full min-h-[200px] p-6 rounded-3xl bg-gradient-to-tr from-[#1E1B4B]/90 via-[#312E81]/80 to-[#1E293B] text-white border border-indigo-500/30 flex flex-col items-center justify-center text-center cursor-pointer shadow-lg transition-transform hover:scale-[1.01]"
                  >
                    <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 mb-2">
                      {isFlashFlipped ? "Answer / Explanation (Click to flip)" : "Question / Concept (Click to reveal)"}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold leading-relaxed max-w-lg">
                      {isFlashFlipped
                        ? flashDeck.cards[currentFlashIdx]?.back
                        : flashDeck.cards[currentFlashIdx]?.front}
                    </h3>
                    {flashDeck.cards[currentFlashIdx]?.hint && !isFlashFlipped && (
                      <span className="text-[11px] text-indigo-200/80 mt-3 italic">
                        Tip: {flashDeck.cards[currentFlashIdx].hint}
                      </span>
                    )}
                  </div>

                  {/* Card Controls */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIsFlashFlipped(false);
                          setCurrentFlashIdx((prev) => (prev - 1 + flashDeck.cards.length) % flashDeck.cards.length);
                        }}
                        className="p-2 rounded-xl border border-[#E7EAF0] dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setIsFlashFlipped(false);
                          setCurrentFlashIdx((prev) => (prev + 1) % flashDeck.cards.length);
                        }}
                        className="p-2 rounded-xl border border-[#E7EAF0] dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setKnownFlashcards((prev) => {
                            const next = new Set(prev);
                            if (next.has(currentFlashIdx)) next.delete(currentFlashIdx);
                            else next.add(currentFlashIdx);
                            return next;
                          });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          knownFlashcards.has(currentFlashIdx)
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300"
                            : "bg-white dark:bg-slate-800 text-[#667085] dark:text-slate-300 border-[#E7EAF0] dark:border-slate-700"
                        }`}
                      >
                        <CheckCircle2 size={13} className={knownFlashcards.has(currentFlashIdx) ? "text-emerald-600" : ""} />
                        <span>{knownFlashcards.has(currentFlashIdx) ? "Mastered" : "Mark as Known"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 3: SOCRATIC VIVA PRACTICE
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "viva" && (
            <div className="space-y-4">
              {!vivaSession ? (
                <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E7EAF0] dark:border-slate-800 pb-2.5">
                    <div>
                      <h4 className="text-sm font-bold text-[#172033] dark:text-white">
                        Start Socratic Viva Oral Exam
                      </h4>
                      <p className="text-xs text-[#667085] dark:text-slate-400">
                        The AI examiner presents diagnostic questions one at a time and evaluates oral understanding.
                      </p>
                    </div>
                    <Link
                      to="/viva"
                      className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <span>Full Viva Lab</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400">
                        Viva Examination Topic:
                      </label>
                      <input
                        type="text"
                        value={vivaTopic}
                        onChange={(e) => setVivaTopic(e.target.value)}
                        placeholder="e.g. Distributed Consensus (Raft), Operating System Scheduling..."
                        className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-slate-700 text-[#172033] dark:text-slate-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400">
                        Difficulty:
                      </label>
                      <select
                        value={vivaDifficulty}
                        onChange={(e) => setVivaDifficulty(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-slate-700 text-[#172033] dark:text-slate-100 cursor-pointer"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400">
                        Rounds:
                      </label>
                      <select
                        value={vivaRounds}
                        onChange={(e) => setVivaRounds(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-slate-700 text-[#172033] dark:text-slate-100 cursor-pointer"
                      >
                        <option value={3}>3 Rounds</option>
                        <option value={5}>5 Rounds</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    onClick={handleStartViva}
                    isLoading={isStartingViva}
                    disabled={!vivaTopic.trim() || isStartingViva}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                  >
                    Start Viva Examination Session
                  </Button>
                </div>
              ) : (
                /* Active Viva Session */
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F1F4F9] dark:border-slate-800 pb-2">
                    <div>
                      <h4 className="text-sm font-bold text-[#172033] dark:text-white">
                        {vivaSession.topic}
                      </h4>
                      <span className="text-[10px] text-[#667085] dark:text-slate-400">
                        Status: {vivaSession.status || "Active"} &bull; Round {vivaSession.currentRound || 1}
                      </span>
                    </div>

                    <button
                      onClick={() => setVivaSession(null)}
                      className="text-xs text-slate-400 hover:text-rose-500 font-semibold"
                    >
                      Exit Session
                    </button>
                  </div>

                  {/* Active Examiner Question */}
                  {vivaActiveRound && (
                    <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 space-y-2">
                      <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 text-[10px] font-bold uppercase tracking-wider font-mono">
                        <Flame size={12} />
                        <span>Examiner Question (Round {vivaActiveRound.roundNumber || 1})</span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-[#172033] dark:text-slate-100 leading-relaxed">
                        {vivaActiveRound.questionText || vivaActiveRound.question}
                      </p>
                    </div>
                  )}

                  {/* Previous Feedback */}
                  {vivaFeedback && (
                    <div className="p-3.5 rounded-2xl bg-violet-50/70 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-xs text-[#172033] dark:text-slate-200 space-y-1.5">
                      <span className="font-bold text-violet-700 dark:text-violet-300 block">
                        Examiner Evaluation &amp; Feedback:
                      </span>
                      <p className="leading-relaxed">
                        {vivaFeedback.evaluationText || vivaFeedback.critique || vivaFeedback.feedbackText || "Answer recorded."}
                      </p>
                    </div>
                  )}

                  {/* Student Answer Input */}
                  {vivaActiveRound ? (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-[#172033] dark:text-slate-200">
                        Your Technical Answer / Defense:
                      </label>
                      <textarea
                        rows={3}
                        value={vivaUserAnswer}
                        onChange={(e) => setVivaUserAnswer(e.target.value)}
                        placeholder="State your reasoning, architectural trade-offs, and invariants clearly..."
                        className="w-full text-xs p-3 rounded-2xl bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 text-[#172033] dark:text-slate-100 placeholder-[#98A2B3] focus:outline-hidden focus:border-rose-500"
                      />
                      <div className="flex justify-end">
                        <Button
                          variant="primary"
                          onClick={handleSubmitVivaAnswer}
                          isLoading={isSubmittingVivaAnswer}
                          disabled={!vivaUserAnswer.trim() || isSubmittingVivaAnswer}
                          className="bg-rose-600 hover:bg-rose-700 text-white"
                        >
                          Submit Defense
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-center space-y-2">
                      <Award size={24} className="text-emerald-600 mx-auto" />
                      <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                        Viva Examination Completed!
                      </h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">
                        You have successfully defended all rounds in this session.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {vivaError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs">
                  {vivaError}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 4: CODE COMPLEXITY & REVIEW
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "code_review" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400">
                      Language:
                    </span>
                    <select
                      value={codeLang}
                      onChange={(e) => setCodeLang(e.target.value)}
                      className="text-xs px-2.5 py-1 rounded-xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-slate-700 text-[#172033] dark:text-slate-100 uppercase font-mono cursor-pointer"
                    >
                      {PROGRAMMING_LANGUAGES.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleReviewCode}
                    isLoading={isReviewingCode}
                    disabled={!codeSnippet.trim() || isReviewingCode}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-1.5"
                  >
                    <Sparkles size={13} />
                    <span>Analyze Code</span>
                  </Button>
                </div>

                <textarea
                  rows={6}
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  placeholder="Paste your source code or algorithm here..."
                  className="w-full text-xs font-mono p-3 rounded-2xl bg-[#0A0E17] text-slate-100 border border-slate-800 focus:outline-hidden focus:border-cyan-500 leading-relaxed"
                />
              </div>

              {codeError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs">
                  {codeError}
                </div>
              )}

              {/* Render Code Analysis Results */}
              {codeReviewData && (
                <div className="space-y-3.5 p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-[#E7EAF0] dark:border-slate-800 pb-2">
                    <h4 className="text-sm font-bold text-[#172033] dark:text-white font-display">
                      Big-O Analysis &amp; Quality Report
                    </h4>
                    <button
                      onClick={handleInsertCodeAnalysisToChat}
                      className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Send size={11} />
                      <span>Insert in Chat</span>
                    </button>
                  </div>

                  {/* Metrics Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 font-mono">
                        Time Complexity:
                      </span>
                      <div className="text-base font-bold font-mono text-[#172033] dark:text-white">
                        {codeReviewData.timeComplexity}
                      </div>
                      <p className="text-[11px] text-[#667085] dark:text-slate-400 leading-snug">
                        {codeReviewData.timeExplanation}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-mono">
                        Auxiliary Space Complexity:
                      </span>
                      <div className="text-base font-bold font-mono text-[#172033] dark:text-white">
                        {codeReviewData.spaceComplexity}
                      </div>
                      <p className="text-[11px] text-[#667085] dark:text-slate-400 leading-snug">
                        {codeReviewData.spaceExplanation}
                      </p>
                    </div>
                  </div>

                  {/* Potential Bugs & Edge Cases */}
                  {codeReviewData.bugsAndEdgeCases?.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-[#172033] dark:text-white">
                        Potential Bugs &amp; Edge Cases:
                      </span>
                      <ul className="list-disc list-inside text-xs text-[#667085] dark:text-slate-300 space-y-0.5">
                        {codeReviewData.bugsAndEdgeCases.map((b, bi) => (
                          <li key={bi}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Refactored Clean Code */}
                  {codeReviewData.refactoredCode && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#172033] dark:text-white">
                          Optimized / Refactored Code:
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(codeReviewData.refactoredCode);
                            setCopiedCode(true);
                            setTimeout(() => setCopiedCode(false), 2000);
                          }}
                          className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-mono cursor-pointer"
                        >
                          {copiedCode ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                          <span>{copiedCode ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <pre className="p-3 rounded-xl bg-[#0A0E17] text-slate-200 text-xs font-mono overflow-x-auto border border-slate-800">
                        {codeReviewData.refactoredCode}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-[#F1F4F9] dark:border-slate-800 shrink-0">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EducationalToolsModal;
