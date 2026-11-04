import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import vivaService from "../services/viva.service";
import aiService from "../services/ai.service";
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
  BrainCircuit,
  Languages,
  X
} from "lucide-react";

const PRESET_TOPICS = [
  { id: "react", title: "React & Modern Frontend", description: "Hooks, reconciliation, state architecture, SSR" },
  { id: "nodejs", title: "Node.js & Backend Architecture", description: "Event loop, streams, concurrency, clustering" },
  { id: "system-design", title: "System Design & Scalability", description: "Load balancers, caching, sharding, CAP theorem" },
  { id: "sql", title: "SQL & Relational Databases", description: "Indexes, transactions, ACID, query optimization" },
  { id: "dsa", title: "Data Structures & Algorithms", description: "Time/space complexity, graphs, dynamic programming" },
  { id: "cloud-devops", title: "Cloud & DevOps Practices", description: "Docker, Kubernetes, CI/CD, microservices" }
];

const VOICE_LANGUAGES = [
  { code: "en-IN", label: "English (India)", hint: "Indian English pronunciation & technical terms" },
  { code: "hi-IN", label: "Hindi / Hinglish (India)", hint: "Hinglish mixed technical vocabulary" },
  { code: "en-US", label: "English (US)", hint: "General American English" }
];

export const Viva = () => {
  const { accessToken } = useAuth();

  // Mode: "setup" | "active" | "scorecard"
  const [viewMode, setViewMode] = useState("setup");

  // Setup Form State
  const [selectedTopic, setSelectedTopic] = useState(PRESET_TOPICS[0].title);
  const [customTopic, setCustomTopic] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [maxRounds, setMaxRounds] = useState(5);
  const [answerMode, setAnswerMode] = useState("hybrid"); // "hybrid" | "voice" | "text"
  const [selectedLanguage, setSelectedLanguage] = useState("en-IN");

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

  // History & Modal Review State
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [reviewModalSession, setReviewModalSession] = useState(null);
  const [isLoadingReviewSession, setIsLoadingReviewSession] = useState(false);

  // ── Voice & Speech Recognition State ──────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [isConnectingMic, setIsConnectingMic] = useState(false);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceError, setVoiceError] = useState("");
  const [isVoiceSupported, setIsVoiceSupported] = useState(true);
  const [isSpeechMuted, setIsSpeechMuted] = useState(false);
  const [isExaminerSpeaking, setIsExaminerSpeaking] = useState(false);

  // Voice Refs
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const isListeningRef = useRef(false);
  const baseTextBeforeRecordingRef = useRef("");
  const finalAccumulatedTextRef = useRef("");

  // Verify voice support on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasMedia = !!(navigator?.mediaDevices && navigator.mediaDevices.getUserMedia);
      const hasSpeech = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
      setIsVoiceSupported(hasMedia || hasSpeech);
    }
  }, []);

  // Speech Synthesis Helper
  const speakQuestion = useCallback((text) => {
    if (isSpeechMuted || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = selectedLanguage.startsWith("hi") ? "hi-IN" : "en-US";

      utterance.onstart = () => setIsExaminerSpeaking(true);
      utterance.onend = () => setIsExaminerSpeaking(false);
      utterance.onerror = () => setIsExaminerSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis error:", err);
      setIsExaminerSpeaking(false);
    }
  }, [isSpeechMuted, selectedLanguage]);

  // Teardown all audio tracks and recognition processes
  const stopAllAudioCapture = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    setIsConnectingMic(false);
    setInterimTranscript("");

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
      mediaRecorderRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // Full teardown on unmount
  useEffect(() => {
    return () => {
      stopAllAudioCapture();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopAllAudioCapture]);

  // ── Speech Recognition Engine: Start Speaking ─────────────────────────────
  const startListening = async () => {
    setVoiceError("");
    setInterimTranscript("");
    audioChunksRef.current = [];
    baseTextBeforeRecordingRef.current = studentAnswer;
    finalAccumulatedTextRef.current = "";

    // Stop examiner audio if speaking
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsExaminerSpeaking(false);
    }

    if (!navigator?.mediaDevices?.getUserMedia && !window.SpeechRecognition && !window.webkitSpeechRecognition) {
      setVoiceError("Microphone recording is not supported in this browser. Please use Chrome, Edge, or type your answer.");
      return;
    }

    setIsConnectingMic(true);

    try {
      // 1. Request microphone access explicitly on user click
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 2. Setup MediaRecorder for backend audio fallback
      if (typeof window.MediaRecorder !== "undefined") {
        try {
          const recorder = new window.MediaRecorder(stream);
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };
          recorder.start(250);
          mediaRecorderRef.current = recorder;
        } catch (recErr) {
          console.warn("[Viva Voice] MediaRecorder backup warning:", recErr.message);
        }
      }

      // 3. Setup Web Speech API for real-time live preview
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = selectedLanguage;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsConnectingMic(false);
          setIsListening(true);
          isListeningRef.current = true;
          setRecordingDuration(0);

          if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = setInterval(() => {
            setRecordingDuration((prev) => prev + 1);
          }, 1000);
        };

        recognition.onresult = (event) => {
          let currentInterim = "";
          let newlyFinal = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcriptPart = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              newlyFinal += transcriptPart + " ";
            } else {
              currentInterim += transcriptPart;
            }
          }

          if (newlyFinal) {
            finalAccumulatedTextRef.current += newlyFinal;
          }

          setInterimTranscript(currentInterim);

          const base = baseTextBeforeRecordingRef.current ? `${baseTextBeforeRecordingRef.current.trim()} ` : "";
          const combined = (base + finalAccumulatedTextRef.current + currentInterim).trim();
          setStudentAnswer(combined);
        };

        recognition.onerror = (event) => {
          console.warn("[Viva Voice] Recognition error event:", event.error);
          if (event.error === "not-allowed" || event.error === "permission-denied") {
            setVoiceError("Microphone access was denied. Please allow microphone permissions in your browser address bar.");
            stopListening();
          } else if (event.error === "audio-capture") {
            setVoiceError("No microphone found or device is busy. Please check audio settings or switch to typing.");
            stopListening();
          } else if (event.error === "network") {
            setVoiceError("Speech recognition network error. You can continue speaking or type your answer.");
          }
        };

        recognition.onend = () => {
          // If user hasn't explicitly clicked stop, restart recognition automatically
          if (isListeningRef.current) {
            try {
              recognition.start();
            } catch {
              // Ignore restart collision
            }
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } else {
        // Fallback: Web Speech API missing, purely MediaRecorder
        setIsConnectingMic(false);
        setIsListening(true);
        isListeningRef.current = true;
        setRecordingDuration(0);

        if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);
      }
    } catch (err) {
      setIsConnectingMic(false);
      setIsListening(false);
      isListeningRef.current = false;

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setVoiceError("Microphone access was denied. Please allow microphone permissions in your browser address bar.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setVoiceError("No microphone found on your system. Please connect an audio input device or type your defense.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setVoiceError("Microphone is currently in use by another application. Please close other recording apps or type.");
      } else {
        setVoiceError(`Could not access microphone: ${err.message || "Unknown error"}. You can type your answer.`);
      }
    }
  };

  // ── Speech Recognition Engine: Stop Speaking ──────────────────────────────
  const stopListening = async () => {
    isListeningRef.current = false;
    setIsListening(false);
    setIsConnectingMic(false);
    setInterimTranscript("");

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // If Web Speech API produced no text, but audio was recorded by MediaRecorder, transcribe via backend
    if (!finalAccumulatedTextRef.current.trim() && audioChunksRef.current.length > 0 && accessToken) {
      setIsTranscribingAudio(true);
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const langCode = selectedLanguage.startsWith("hi") ? "hinglish" : "en";
        const res = await aiService.transcribeAudio(accessToken, { audioBlob, language: langCode });
        if (res && res.text && res.text.trim()) {
          const base = baseTextBeforeRecordingRef.current ? `${baseTextBeforeRecordingRef.current.trim()} ` : "";
          setStudentAnswer((base + res.text.trim()).trim());
        } else {
          setVoiceError("No audible speech could be recognized. Please speak clearly or type your explanation.");
        }
      } catch (transcribeErr) {
        console.warn("[Viva Voice] Backend transcription fallback error:", transcribeErr.message);
        setVoiceError("Could not transcribe spoken audio. Please type your answer or retry speaking.");
      } finally {
        setIsTranscribingAudio(false);
      }
    }
  };

  const toggleListening = () => {
    if (isListening || isConnectingMic) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Fetch Viva History
  const fetchHistory = useCallback(async () => {
    if (!accessToken) return;
    setIsLoadingHistory(true);
    try {
      const res = await vivaService.getVivaHistory(accessToken);
      const sessionList = res?.sessions || res?.history;
      if (res?.success && Array.isArray(sessionList)) {
        setHistory(sessionList);
      }
    } catch (err) {
      console.error("Failed to load viva history:", err.message);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Open past session review modal
  const handleOpenReviewSession = async (sessionId) => {
    if (!accessToken || !sessionId) return;
    setIsLoadingReviewSession(true);
    try {
      const res = await vivaService.getSessionById(accessToken, sessionId);
      if (res?.session) {
        setReviewModalSession(res.session);
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to load past session details.");
    } finally {
      setIsLoadingReviewSession(false);
    }
  };

  // Start Viva Session
  const handleStartViva = async () => {
    if (!accessToken) return;
    const finalTopic = customTopic.trim() || selectedTopic;
    if (!finalTopic) {
      setErrorMessage("Please select or enter a topic to begin the defense.");
      return;
    }

    stopAllAudioCapture();
    setIsStarting(true);
    setErrorMessage("");
    setVoiceError("");

    try {
      const res = await vivaService.startVivaSession(accessToken, {
        topic: finalTopic,
        difficulty,
        maxRounds: Number(maxRounds),
        focusArea: focusArea.trim(),
        answerMode,
        language: selectedLanguage
      });

      if (res?.success && res.session) {
        const firstRound =
          res.activeRound ||
          (res.session.rounds && res.session.rounds.length > 0 ? res.session.rounds[0] : null);
        setCurrentSession(res.session);
        setActiveRound(firstRound);
        setViewMode("active");
        setStudentAnswer("");
        setLastRoundEvaluation(null);
        setSummaryReport(null);

        // Announce first question via speech
        if (firstRound?.question) {
          speakQuestion(firstRound.question);
        }
      } else {
        throw new Error(res?.message || "Failed to initialize viva session.");
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to start viva chamber.");
    } finally {
      setIsStarting(false);
    }
  };

  // Submit Answer for Current Round
  const handleSubmitAnswer = async () => {
    if (!accessToken || !currentSession || !activeRound) return;
    if (!studentAnswer.trim()) {
      setErrorMessage("Please verbalize or type your answer before submitting.");
      return;
    }

    stopAllAudioCapture();
    setIsSubmitting(true);
    setErrorMessage("");
    setVoiceError("");

    try {
      const res = await vivaService.submitVivaAnswer(accessToken, currentSession._id, {
        roundNumber: activeRound.roundNumber,
        studentAnswer: studentAnswer.trim()
      });

      if (res?.success) {
        const isSessionFinished = Boolean(
          res.isFinished ||
          res.isCompleted ||
          res.session?.status === "completed"
        );

        if (isSessionFinished) {
          setCurrentSession(res.session);
          setSummaryReport(res.summaryReport || res.session?.summaryReport);
          setViewMode("scorecard");
          fetchHistory();
        } else {
          const nextRnd =
            res.nextRound ||
            (res.session?.rounds ? res.session.rounds[res.session.currentRound - 1] : null);

          setCurrentSession(res.session);
          setLastRoundEvaluation(res.evaluation);
          setActiveRound(nextRnd);
          setStudentAnswer("");

          if (nextRnd?.question) {
            speakQuestion(nextRnd.question);
          }
        }
      } else {
        throw new Error(res?.message || "Failed to submit answer.");
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to submit answer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert Revision Topics to NEXORA Study Tasks
  const handleCreateTasks = async () => {
    if (!accessToken || !currentSession || !summaryReport) return;
    setIsCreatingTasks(true);
    try {
      const res = await vivaService.createTasksFromViva(accessToken, currentSession._id);
      if (res?.success) {
        const count = res.tasksCreatedCount ?? (Array.isArray(res.tasks) ? res.tasks.length : 0);
        setTasksCreatedCount(count);
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to create tasks from viva report.");
    } finally {
      setIsCreatingTasks(false);
    }
  };

  const handleExitSession = () => {
    stopAllAudioCapture();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setViewMode("setup");
    setCurrentSession(null);
    setActiveRound(null);
    setLastRoundEvaluation(null);
    setSummaryReport(null);
    setStudentAnswer("");
    setTasksCreatedCount(null);
    setVoiceError("");
    setErrorMessage("");
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-fade-in">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-pink-200/60 dark:border-pink-900/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-violet-500" />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase rounded-full bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/40 flex items-center gap-1.5 font-display">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              Oral Defense Room
            </span>
            <span className="text-xs text-[#667085] dark:text-slate-400 flex items-center gap-1">
              Socratic Technical Defense &amp; Voice Evaluation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#172033] dark:text-slate-100 font-display">
            AI Socratic Viva
          </h1>
          <p className="text-sm text-[#667085] dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Test and sharpen your technical defense skills. The AI examiner questions your reasoning,
            drills into trade-offs, and scores your conceptual mastery using voice or text.
          </p>
        </div>

        {/* Global Sound Control & Exit */}
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
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs ${
              isSpeechMuted
                ? "bg-white dark:bg-slate-800 border-[#E7EAF0] dark:border-slate-700 text-[#667085] dark:text-slate-400"
                : "bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800/40 text-pink-700 dark:text-pink-300"
            }`}
            title={isSpeechMuted ? "Examiner Voice Muted" : "Examiner Voice Active"}
          >
            {isSpeechMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-pink-500" />}
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

      {/* ── VIEW MODE 1: SETUP CHAMBER ──────────────────────────────────────── */}
      {viewMode === "setup" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Setup Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-[#172033] dark:text-slate-100 font-display flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-pink-500" />
                  1. Select or Customize Viva Topic
                </h2>
                <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
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
                      className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-pink-50/70 dark:bg-pink-950/30 border-pink-400 dark:border-pink-600 shadow-sm shadow-pink-500/10"
                          : "bg-[#F8FAFC] dark:bg-slate-900 border-[#E7EAF0] dark:border-slate-800 hover:border-pink-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800/80"
                      }`}
                    >
                      <div className="font-semibold text-sm text-[#172033] dark:text-slate-100">{topic.title}</div>
                      <div className="text-xs text-[#667085] dark:text-slate-400 mt-1 line-clamp-1">{topic.description}</div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Topic Input */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1.5 tracking-normal">
                    Or enter your specific topic:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Distributed Consensus (Raft), GraphQL Federation, PostgreSQL MVCC..."
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 focus:border-pink-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden rounded-xl px-4 py-2.5 text-sm text-[#172033] dark:text-slate-100 placeholder-[#98A2B3] dark:placeholder-slate-500 transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1.5 tracking-normal">
                    Optional Focus Area / Sub-Domain:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Concurrency &amp; Deadlocks, Memory Management, Failure Modes..."
                    value={focusArea}
                    onChange={(e) => setFocusArea(e.target.value)}
                    className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 focus:border-pink-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden rounded-xl px-4 py-2.5 text-sm text-[#172033] dark:text-slate-100 placeholder-[#98A2B3] dark:placeholder-slate-500 transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Config Grid: Difficulty, Rounds, Answer Mode & Language */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#F1F4F9] dark:border-slate-800">
                {/* Rigor Level */}
                <div>
                  <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-2 tracking-normal">
                    Viva Rigor Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { level: "Beginner", color: "bg-emerald-600 border-emerald-600 text-white" },
                      { level: "Intermediate", color: "bg-amber-600 border-amber-600 text-white" },
                      { level: "Advanced", color: "bg-rose-600 border-rose-600 text-white" }
                    ].map(({ level, color }) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setDifficulty(level)}
                        className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                          difficulty === level
                            ? `${color} shadow-xs font-bold`
                            : "bg-[#F8FAFC] dark:bg-slate-900 text-[#667085] dark:text-slate-400 border-[#E7EAF0] dark:border-slate-800 hover:text-[#172033] dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rounds Count */}
                <div>
                  <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-2 tracking-normal">
                    Rounds of Defense
                  </label>
                  <select
                    value={maxRounds}
                    onChange={(e) => setMaxRounds(e.target.value)}
                    className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 focus:border-pink-500 focus:outline-hidden rounded-xl px-3 py-2 text-sm text-[#172033] dark:text-slate-100 cursor-pointer shadow-xs"
                  >
                    <option value={3}>3 Rounds (Sprint • ~5 mins)</option>
                    <option value={5}>5 Rounds (Standard Viva • ~10 mins)</option>
                    <option value={7}>7 Rounds (Comprehensive • ~15 mins)</option>
                    <option value={10}>10 Rounds (Full Board Defense)</option>
                  </select>
                </div>

                {/* Answer Mode */}
                <div>
                  <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-2 tracking-normal">
                    Preferred Answering Mode
                  </label>
                  <select
                    value={answerMode}
                    onChange={(e) => setAnswerMode(e.target.value)}
                    className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 focus:border-pink-500 focus:outline-hidden rounded-xl px-3 py-2 text-sm text-[#172033] dark:text-slate-100 cursor-pointer shadow-xs"
                  >
                    <option value="hybrid">Voice &amp; Text Answering (Recommended)</option>
                    <option value="voice">Voice Answering First</option>
                    <option value="text">Written Defense (Typing)</option>
                  </select>
                </div>

                {/* Speech Recognition Language */}
                <div>
                  <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-2 tracking-normal flex items-center gap-1.5">
                    <Languages size={13} className="text-pink-500" />
                    <span>Voice Language</span>
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 focus:border-pink-500 focus:outline-hidden rounded-xl px-3 py-2 text-sm text-[#172033] dark:text-slate-100 cursor-pointer shadow-xs"
                  >
                    {VOICE_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Start CTA */}
              <div className="pt-2">
                <Button
                  onClick={handleStartViva}
                  isLoading={isStarting}
                  disabled={isStarting}
                  className="w-full py-3.5 text-base font-semibold shadow-sm shadow-pink-500/25 bg-gradient-to-r from-pink-500 via-rose-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white border-none flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Sparkles className="w-5 h-5 text-white" />
                  Enter Viva Room &amp; Begin Defense
                </Button>
                <p className="text-[11px] text-center text-[#667085] dark:text-slate-400 mt-2">
                  Microphone requested only upon speaking • Live audio transcription with typing support
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Past Viva Track Record */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] rounded-3xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100 font-display flex items-center gap-2">
                  <Award className="w-4 h-4 text-pink-500" />
                  Viva Track Record
                </h3>
                <span className="text-xs text-[#667085] dark:text-slate-400 font-medium">
                  {history.length} completed
                </span>
              </div>

              {isLoadingHistory ? (
                <div className="py-8 flex justify-center">
                  <Loader size="sm" />
                </div>
              ) : history.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#667085] dark:text-slate-400 border border-dashed border-[#E7EAF0] dark:border-slate-800 rounded-xl p-4">
                  No previous viva sessions recorded yet. Start your first session to build your technical defense score!
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => !isLoadingReviewSession && handleOpenReviewSession(item._id)}
                      className={`p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 hover:border-pink-300 dark:hover:border-pink-800 transition-all shadow-2xs cursor-pointer group ${
                        isLoadingReviewSession ? "opacity-60 cursor-wait" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#172033] dark:text-slate-100 truncate max-w-[170px] group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                          {item.topic}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            item.averageScore >= 8
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                              : item.averageScore >= 6
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40"
                              : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40"
                          }`}
                        >
                          {item.summaryReport?.overallGrade || `${item.averageScore}/10`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#667085] dark:text-slate-400 mt-2">
                        <span>{item.difficulty} • {item.maxRounds} rounds</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Socratic Tips Card */}
            <div className="bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#E7EAF0] dark:border-slate-800 rounded-3xl p-5 text-xs text-[#667085] dark:text-slate-400 space-y-2.5">
              <div className="font-semibold text-[#172033] dark:text-slate-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                How the Socratic Viva Evaluates You:
              </div>
              <ul className="space-y-1.5 text-[11px] pl-4 list-disc text-[#667085] dark:text-slate-400">
                <li><strong>Accuracy &amp; Nuance:</strong> Demonstrates core comprehension, not memorized jargon.</li>
                <li><strong>Trade-offs &amp; Edge Cases:</strong> Explains when to use a technique versus alternatives.</li>
                <li><strong>Spoken Clarity:</strong> Structured oral delivery with confidence.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW MODE 2: ACTIVE VIVA CHAMBER ────────────────────────────────── */}
      {viewMode === "active" && currentSession && activeRound && (
        <div className="space-y-6">
          {/* Active Status Bar */}
          <div className="bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center text-white shadow-xs">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#172033] dark:text-slate-100 font-display">
                    {currentSession.topic}
                  </h2>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/40">
                    {currentSession.difficulty}
                  </span>
                  {currentSession.focusArea && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/40 hidden sm:inline-block">
                      {currentSession.focusArea}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#667085] dark:text-slate-400">
                  Round {activeRound.roundNumber} of {currentSession.maxRounds}
                </p>
              </div>
            </div>

            {/* Round Stepper Dots */}
            <div className="flex items-center gap-2">
              {Array.from({ length: currentSession.maxRounds }).map((_, idx) => {
                const roundNum = idx + 1;
                const isPassed = roundNum < activeRound.roundNumber;
                const isCurrent = roundNum === activeRound.roundNumber;
                return (
                  <div
                    key={roundNum}
                    className={`h-2.5 rounded-full transition-all ${
                      isPassed
                        ? "w-7 bg-emerald-500"
                        : isCurrent
                        ? "w-9 bg-gradient-to-r from-pink-500 to-violet-500 animate-pulse shadow-sm shadow-pink-500/25"
                        : "w-3 bg-slate-200 dark:bg-slate-700"
                    }`}
                    title={`Round ${roundNum}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Examiner Question Box */}
          <div className="relative bg-white dark:bg-[#111827] border border-pink-200/50 dark:border-pink-900/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-violet-500" />

            <div className="flex items-center justify-between border-b border-[#F1F4F9] dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isExaminerSpeaking
                      ? "bg-pink-500 animate-ping"
                      : "bg-violet-500"
                  }`}
                />
                <span className="text-xs font-bold text-[#172033] dark:text-slate-100 tracking-wide uppercase font-display">
                  AI Examiner (Socratic Lead)
                </span>
                {isExaminerSpeaking && (
                  <span className="text-[11px] text-pink-600 dark:text-pink-400 font-mono animate-pulse font-semibold">
                    Speaking question aloud...
                  </span>
                )}
              </div>

              {/* Re-play voice question */}
              <button
                type="button"
                onClick={() => speakQuestion(activeRound.question)}
                className="flex items-center gap-1.5 text-xs text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-slate-100 transition-colors px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF0] dark:border-slate-700 shadow-xs cursor-pointer font-medium"
                title="Hear question spoken aloud again"
              >
                <Volume2 className="w-3.5 h-3.5 text-pink-500" />
                <span>Repeat Question</span>
              </button>
            </div>

            {/* Question Text */}
            <div className="text-lg sm:text-xl font-medium text-[#172033] dark:text-slate-100 leading-relaxed py-2 font-display">
              "{activeRound.question}"
            </div>

            {/* Previous Round Feedback Strip (if available) */}
            {lastRoundEvaluation && (
              <div className="mt-4 p-4 rounded-2xl bg-pink-50/40 dark:bg-pink-950/20 border border-pink-200/60 dark:border-pink-900/40 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-pink-700 dark:text-pink-300 uppercase tracking-wider text-[10px]">
                    Feedback on Round {lastRoundEvaluation.roundNumber}:
                  </span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                      lastRoundEvaluation.score >= 8
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40"
                    }`}
                  >
                    Score: {lastRoundEvaluation.score}/10
                  </span>
                </div>
                <p className="text-[#172033] dark:text-slate-200 font-medium">{lastRoundEvaluation.feedback}</p>
                {lastRoundEvaluation.keyTakeaway && (
                  <div className="text-[11px] text-[#667085] dark:text-slate-400 italic pt-1 border-t border-pink-200/40 dark:border-pink-900/40">
                    <strong className="text-pink-600 dark:text-pink-400">Gold Standard Takeaway:</strong> {lastRoundEvaluation.keyTakeaway}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Student Defense & Response Box */}
          <div className="bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="text-xs font-bold text-[#172033] dark:text-slate-200 uppercase tracking-wider flex items-center gap-2 font-display">
                <span>Your Verbal or Written Defense</span>
                {isListening && (
                  <span className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-600 dark:text-rose-400 font-mono animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>Recording live microphone ({formatSeconds(recordingDuration)})</span>
                  </span>
                )}
                {isConnectingMic && (
                  <span className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                    <Loader size="xs" />
                    <span>Connecting microphone...</span>
                  </span>
                )}
                {isTranscribingAudio && (
                  <span className="flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                    <Loader size="xs" />
                    <span>Transcribing audio...</span>
                  </span>
                )}
              </label>

              {/* Language Selector & Microphone Toggle Button */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  disabled={isListening}
                  className="text-xs px-2.5 py-1.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-[#E7EAF0] dark:border-slate-700 text-[#172033] dark:text-slate-200 cursor-pointer"
                  title="Spoken Language for Speech Recognition"
                >
                  {VOICE_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>

                {isVoiceSupported && (
                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={isConnectingMic || isTranscribingAudio}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                      isListening
                        ? "bg-rose-500 text-white border border-rose-600 shadow-md shadow-rose-500/25 animate-pulse"
                        : "bg-white dark:bg-slate-800 text-[#172033] dark:text-slate-200 border border-[#E7EAF0] dark:border-slate-700 hover:border-pink-400"
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        <span>Stop Speaking</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 text-pink-500" />
                        <span>Click to Speak Answer</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Voice Error Banner with Switch to Typing action */}
            {voiceError && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                  <span>{voiceError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setVoiceError("")}
                  className="text-[11px] font-bold text-amber-900 dark:text-amber-100 hover:underline shrink-0"
                >
                  Type Answer Instead
                </button>
              </div>
            )}

            {/* Interim Transcript Live Preview Pill */}
            {isListening && interimTranscript && (
              <div className="p-2.5 rounded-xl bg-pink-50/70 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800 text-xs text-pink-900 dark:text-pink-200 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping shrink-0" />
                <span className="font-semibold text-pink-600 dark:text-pink-400 text-[10px] uppercase tracking-wider shrink-0">
                  Hearing:
                </span>
                <span className="italic truncate">{interimTranscript}</span>
              </div>
            )}

            {/* Textarea for spoken/typed answer */}
            <div className="relative">
              <textarea
                rows={5}
                value={studentAnswer}
                onChange={(e) => setStudentAnswer(e.target.value)}
                placeholder="Speak clearly using the microphone button or type your technical explanation here... Be specific about trade-offs and concepts."
                className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 focus:border-pink-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden rounded-2xl p-4 text-sm text-[#172033] dark:text-slate-100 placeholder-[#98A2B3] dark:placeholder-slate-500 transition-all resize-y shadow-xs"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-xs text-[#667085] dark:text-slate-400">
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
                    className="text-xs text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-slate-100 px-2 py-1 cursor-pointer"
                  >
                    Clear
                  </button>
                )}

                <Button
                  onClick={handleSubmitAnswer}
                  isLoading={isSubmitting}
                  disabled={isSubmitting || !studentAnswer.trim()}
                  className="px-6 py-2.5 font-semibold shadow-sm shadow-pink-500/25 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white border-none flex items-center gap-2 active:scale-[0.98]"
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

      {/* ── VIEW MODE 3: FINAL VIVA SCORECARD ───────────────────────────────── */}
      {viewMode === "scorecard" && currentSession && summaryReport && (
        <div className="space-y-8 animate-fade-in">
          {/* Main Grade Header Banner */}
          <div className="relative bg-gradient-to-br from-pink-500/10 via-violet-500/5 to-white dark:from-pink-950/20 dark:via-violet-950/10 dark:to-[#111827] border border-pink-200/60 dark:border-pink-900/40 rounded-3xl p-6 sm:p-10 text-center overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-violet-500" />

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800/40 text-xs font-bold text-pink-700 dark:text-pink-300 mb-4 uppercase tracking-wider font-display">
              AI Technical Defense Scorecard
            </div>

            <h2 className="text-2xl sm:text-4xl font-bold text-[#172033] dark:text-slate-100 font-display">
              {currentSession.topic} Viva Completed
            </h2>
            <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-400 mt-2 max-w-xl mx-auto leading-relaxed">
              {summaryReport.overallFeedback}
            </p>

            {/* Big Grade Box */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 mt-8 pt-6 border-t border-pink-100 dark:border-slate-800">
              <div className="flex flex-col items-center">
                <span className="text-xs text-[#667085] dark:text-slate-400 uppercase tracking-wider font-semibold">Final Grade</span>
                <span className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-pink-600 to-violet-600 bg-clip-text text-transparent font-display mt-1">
                  {summaryReport.overallGrade}
                </span>
              </div>

              <div className="h-12 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />

              <div className="flex flex-col items-center">
                <span className="text-xs text-[#667085] dark:text-slate-400 uppercase tracking-wider font-semibold">Average Score</span>
                <span className="text-4xl sm:text-5xl font-black text-[#172033] dark:text-slate-100 font-display mt-1">
                  {currentSession.averageScore}
                  <span className="text-xl text-[#98A2B3] font-normal">/10</span>
                </span>
              </div>

              <div className="h-12 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />

              <div className="flex flex-col items-center">
                <span className="text-xs text-[#667085] dark:text-slate-400 uppercase tracking-wider font-semibold">Interview Readiness</span>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mt-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
                  {summaryReport.readinessAssessment || "Ready for Technical Round"}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Strengths & Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths Card */}
            <div className="bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] rounded-3xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm font-display">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Demonstrated Technical Strengths</span>
              </div>
              <ul className="space-y-2.5 text-xs text-[#172033] dark:text-slate-200">
                {(summaryReport.strengthsSummary || []).map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Review Topics & Action Bridge */}
            <div className="bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] rounded-3xl p-6 space-y-4 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm font-display">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>Key Concepts To Strengthen</span>
                </div>
                <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
                  Identified knowledge gaps to revise before real-world interviews:
                </p>

                <ul className="space-y-2.5 text-xs text-[#172033] dark:text-slate-200 mt-3">
                  {(summaryReport.recommendedTopics || []).map((topic, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span className="font-medium">{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* NEXORA Bridge Action */}
              <div className="pt-4 border-t border-[#F1F4F9] dark:border-slate-800 space-y-2">
                {tasksCreatedCount !== null ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
                    <span className="flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      {tasksCreatedCount} study tasks added to your Task Planner!
                    </span>
                    <Link to="/tasks" className="underline font-bold hover:text-emerald-900 dark:hover:text-emerald-100">
                      View Tasks
                    </Link>
                  </div>
                ) : (
                  <Button
                    onClick={handleCreateTasks}
                    isLoading={isCreatingTasks}
                    disabled={isCreatingTasks}
                    variant="secondary"
                    className="w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2 border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-950/40"
                  >
                    <PlusCircle className="w-4 h-4 text-pink-500" />
                    Convert Revision Topics to NEXORA Study Tasks
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Transcript Review Accordion / List */}
          <div className="bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] rounded-3xl p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100 font-display flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-pink-500" />
              Round-by-Round Viva Transcript
            </h3>

            <div className="space-y-3">
              {currentSession.rounds.map((round) => (
                <div
                  key={round._id || round.roundNumber}
                  className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-[#E7EAF0] dark:border-slate-800 pb-2">
                    <span className="font-bold text-pink-600 dark:text-pink-400">Round {round.roundNumber}</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                        round.score >= 8
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                          : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {round.score !== null ? `${round.score}/10` : "Unscored"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#667085] dark:text-slate-400 font-medium">Examiner: </span>
                    <span className="text-[#172033] dark:text-slate-100 font-semibold">{round.question}</span>
                  </div>
                  <div>
                    <span className="text-[#667085] dark:text-slate-400 font-medium">Your Answer: </span>
                    <span className="text-[#172033] dark:text-slate-200">{round.studentAnswer || "No answer recorded"}</span>
                  </div>
                  {round.feedback && (
                    <div className="text-[11px] text-[#667085] dark:text-slate-400 pt-1">
                      <strong>Feedback:</strong> {round.feedback}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button
              onClick={handleExitSession}
              className="px-8 py-3 text-sm font-semibold shadow-sm shadow-pink-500/25 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white border-none"
            >
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

      {/* ── PAST SESSION REVIEW MODAL ────────────────────────────────────────── */}
      {reviewModalSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] rounded-3xl p-6 shadow-2xl flex flex-col space-y-4 animate-modal-in overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#F1F4F9] dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-[#172033] dark:text-white font-display">
                  {reviewModalSession.topic}
                </h3>
                <p className="text-xs text-[#667085] dark:text-slate-400">
                  {reviewModalSession.difficulty} • Grade: {reviewModalSession.summaryReport?.overallGrade || "Completed"} • Score: {reviewModalSession.averageScore}/10
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalSession(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {reviewModalSession.summaryReport?.overallFeedback && (
                <div className="p-3.5 rounded-2xl bg-pink-50/60 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/30 text-xs text-[#172033] dark:text-slate-200">
                  <p className="font-semibold text-pink-700 dark:text-pink-300 mb-1">Examiner Assessment:</p>
                  <p>{reviewModalSession.summaryReport.overallFeedback}</p>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400">
                  Defense Rounds
                </h4>
                {reviewModalSession.rounds?.map((rnd) => (
                  <div key={rnd.roundNumber} className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-pink-600 dark:text-pink-400">Round {rnd.roundNumber}</span>
                      <span>Score: {rnd.score !== null ? `${rnd.score}/10` : "N/A"}</span>
                    </div>
                    <p className="text-[#172033] dark:text-slate-100"><strong>Q:</strong> {rnd.question}</p>
                    <p className="text-[#667085] dark:text-slate-300"><strong>A:</strong> {rnd.studentAnswer || "(No answer)"}</p>
                    {rnd.feedback && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-1">
                        {rnd.feedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#F1F4F9] dark:border-slate-800 flex justify-end shrink-0">
              <Button size="sm" variant="secondary" onClick={() => setReviewModalSession(null)}>
                Close Review
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Viva;
