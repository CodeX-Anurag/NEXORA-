import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  Flame,
  Timer,
  Sparkles,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Plus,
  Clock,
  BookOpen,
  X
} from "lucide-react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import Input from "../common/Input";
import { getSubjectTheme } from "../../utils/colorSystem";

const PRESET_SUBJECTS = [
  "DSA & Algorithms",
  "DBMS & SQL",
  "Web Development",
  "Mathematics",
  "Operating Systems",
  "System Design"
];

const PRESET_DURATIONS = [
  { label: "15m Sprint", minutes: 15 },
  { label: "25m Pomodoro", minutes: 25 },
  { label: "45m Deep Work", minutes: 45 },
  { label: "60m Mastery", minutes: 60 },
  { label: "90m Flow", minutes: 90 }
];

export const StudyFocusModal = ({
  isOpen,
  onClose,
  initialSubject = "DSA & Algorithms",
  onFocusComplete,
  streakCount = 0
}) => {
  const [subject, setSubject] = useState(initialSubject);
  const [customSubject, setCustomSubject] = useState("");
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [customMinutes, setCustomMinutes] = useState("");
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [notes, setNotes] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  const timerRef = useRef(null);

  // Play celebration audio chime using Web Audio API
  const playCompletionChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.6);
      });
    } catch {
      // Audio context blocked or unsupported
    }
  }, [soundEnabled]);

  // Synchronize on modal open
  useEffect(() => {
    if (isOpen) {
      if (initialSubject) {
        setSubject(initialSubject);
      }
      setIsCompleted(false);
    }
  }, [isOpen, initialSubject]);

  // Countdown timer effect
  useEffect(() => {
    if (isActive && secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsActive(false);
            setIsCompleted(true);
            playCompletionChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isActive, secondsRemaining, playCompletionChime]);

  if (!isOpen) return null;

  const currentSubject = customSubject.trim() || subject;
  const theme = getSubjectTheme(currentSubject);

  const totalSeconds = selectedMinutes * 60;
  const elapsedSeconds = totalSeconds - secondsRemaining;
  const progressRatio = totalSeconds > 0 ? elapsedSeconds / totalSeconds : 0;

  const minutesDisplay = String(Math.floor(secondsRemaining / 60)).padStart(2, "0");
  const secondsDisplay = String(secondsRemaining % 60).padStart(2, "0");

  const handleSelectDuration = (mins) => {
    setSelectedMinutes(mins);
    setSecondsRemaining(mins * 60);
    setIsActive(false);
    setIsCompleted(false);
  };

  const handleApplyCustomMinutes = () => {
    const parsed = parseInt(customMinutes, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 360) {
      handleSelectDuration(parsed);
      setCustomMinutes("");
    }
  };

  const handleToggleTimer = () => {
    if (secondsRemaining <= 0) {
      handleReset();
      setIsActive(true);
    } else {
      setIsActive((prev) => !prev);
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setSecondsRemaining(selectedMinutes * 60);
    setIsCompleted(false);
  };

  const handleAddFiveMinutes = () => {
    setSecondsRemaining((prev) => prev + 300);
    setSelectedMinutes((prev) => prev + 5);
  };

  const handleFinishEarly = () => {
    setIsActive(false);
    setIsCompleted(true);
    playCompletionChime();
  };

  const handleLogSession = async () => {
    if (!onFocusComplete) return;
    setIsLogging(true);
    try {
      const elapsedMinutes = Math.max(1, Math.round((totalSeconds - secondsRemaining) / 60));
      await onFocusComplete({
        subject: currentSubject,
        duration: elapsedMinutes,
        notes: notes.trim() || `Completed ${elapsedMinutes}m focused study session on ${currentSubject}.`,
        date: new Date().toISOString()
      });
      setIsActive(false);
      setIsCompleted(false);
      setNotes("");
      onClose();
    } catch {
      // Handled by parent notification
    } finally {
      setIsLogging(false);
    }
  };

  // Circular progress calculations (Radius = 100, Circumference = 2 * PI * 100 ≈ 628.3)
  const RADIUS = 100;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDashoffset = CIRCUMFERENCE - progressRatio * CIRCUMFERENCE;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${
        isFullScreen ? "bg-[#090D16] text-white" : "bg-black/60 backdrop-blur-sm"
      }`}
    >
      <div
        className={`relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isFullScreen ? "h-full max-w-4xl border-none" : "max-h-[92vh]"
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F4F9] dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#161F30]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Timer size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#172033] dark:text-white font-display">
                  Study Focus Session
                </h3>
                {isActive && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 animate-pulse font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    LIVE FOCUS
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#667085] dark:text-slate-400">
                Single-task concentration block with real-time logging
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 text-slate-400 hover:text-[#172033] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={soundEnabled ? "Mute chime" : "Enable chime"}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 text-slate-400 hover:text-[#172033] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isFullScreen ? "Exit full view" : "Full focus mode"}
            >
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLogging}
              className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
          {/* 1. Subject Picker (if not active or completed) */}
          {!isActive && !isCompleted && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#172033] dark:text-slate-200 uppercase tracking-wider">
                1. Focus Subject / Topic
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SUBJECTS.map((sub) => {
                  const sTheme = getSubjectTheme(sub);
                  const isSel = subject === sub && !customSubject;
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => {
                        setSubject(sub);
                        setCustomSubject("");
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                        isSel
                          ? `${sTheme.lightBg} ${sTheme.text} ${sTheme.border} shadow-2xs font-bold ring-2 ring-violet-500/20`
                          : "bg-[#F8FAFC] dark:bg-slate-800 text-[#667085] dark:text-slate-300 border-[#E7EAF0] dark:border-slate-700 hover:border-slate-400"
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1 max-w-sm">
                <input
                  type="text"
                  placeholder="Or enter custom topic (e.g. Graph Algorithms)..."
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-[#F8FAFC] dark:bg-slate-800/80 border border-[#E7EAF0] dark:border-slate-700 text-[#172033] dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          )}

          {/* 2. Duration Presets (if not active or completed) */}
          {!isActive && !isCompleted && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#172033] dark:text-slate-200 uppercase tracking-wider">
                2. Target Focus Duration
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_DURATIONS.map((dur) => (
                  <button
                    key={dur.minutes}
                    type="button"
                    onClick={() => handleSelectDuration(dur.minutes)}
                    className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                      selectedMinutes === dur.minutes
                        ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20"
                        : "bg-[#F8FAFC] dark:bg-slate-800 text-[#172033] dark:text-slate-200 border-[#E7EAF0] dark:border-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1 max-w-xs">
                <input
                  type="number"
                  min="1"
                  max="360"
                  placeholder="Custom mins (e.g. 50)"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="w-32 px-3 py-1.5 rounded-xl text-xs bg-[#F8FAFC] dark:bg-slate-800/80 border border-[#E7EAF0] dark:border-slate-700 text-[#172033] dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomMinutes}
                  disabled={!customMinutes}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#172033] dark:text-white disabled:opacity-50 cursor-pointer"
                >
                  Set
                </button>
              </div>
            </div>
          )}

          {/* 3. Circular Live Focus Ring & Timer Display */}
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* SVG Circular Progress Ring */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 240 240">
                {/* Track */}
                <circle
                  cx="120"
                  cy="120"
                  r={RADIUS}
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  className="text-slate-100 dark:text-slate-800"
                />
                {/* Animated Progress Indicator */}
                <circle
                  cx="120"
                  cy="120"
                  r={RADIUS}
                  stroke={theme.hex || "#7C6CFA"}
                  strokeWidth="10"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>

              {/* Central Clock Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${theme.lightBg} ${theme.text} ${theme.border} max-w-[190px] truncate`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.hex }} />
                  <span className="truncate">{currentSubject}</span>
                </span>

                <div className="font-mono text-5xl font-black tracking-tight text-[#172033] dark:text-white">
                  {minutesDisplay}:{secondsDisplay}
                </div>

                <div className="text-[11px] font-medium text-[#667085] dark:text-slate-400">
                  {isCompleted ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <Check size={12} /> Target Met!
                    </span>
                  ) : isActive ? (
                    <span className="text-violet-600 dark:text-violet-400 font-semibold animate-pulse">
                      In the Flow • {Math.round(progressRatio * 100)}%
                    </span>
                  ) : secondsRemaining < totalSeconds ? (
                    <span>Session Paused</span>
                  ) : (
                    <span>Ready for Deep Focus</span>
                  )}
                </div>
              </div>
            </div>

            {/* Timer Command Controls */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="p-3 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800 text-slate-500 hover:text-[#172033] dark:hover:text-white border border-[#E7EAF0] dark:border-slate-700 hover:border-slate-400 transition-all cursor-pointer shadow-2xs"
                title="Reset timer"
              >
                <RotateCcw size={18} />
              </button>

              <button
                type="button"
                onClick={handleToggleTimer}
                className={`px-7 py-3 rounded-2xl text-sm font-bold text-white transition-all flex items-center gap-2 shadow-lg cursor-pointer ${
                  isActive
                    ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/25"
                    : "bg-violet-600 hover:bg-violet-700 shadow-violet-500/30 active:scale-95"
                }`}
              >
                {isActive ? (
                  <>
                    <Pause size={18} />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play size={18} fill="currentColor" />
                    <span>{secondsRemaining < totalSeconds ? "Resume" : "Start Focus"}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleAddFiveMinutes}
                className="px-3.5 py-3 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#172033] dark:hover:text-white border border-[#E7EAF0] dark:border-slate-700 hover:border-slate-400 transition-all cursor-pointer font-mono font-bold text-xs shadow-2xs"
                title="Add 5 minutes"
              >
                +5m
              </button>

              {(isActive || secondsRemaining < totalSeconds) && !isCompleted && (
                <button
                  type="button"
                  onClick={handleFinishEarly}
                  className="px-3.5 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 transition-all cursor-pointer text-xs font-bold"
                  title="Finish session and save focus time"
                >
                  Finish
                </button>
              )}
            </div>
          </div>

          {/* 4. Completion & Reflection Notes */}
          {isCompleted && (
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/40 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <Sparkles size={18} />
                <h4 className="text-sm font-bold">
                  Focus Block Accomplished!
                </h4>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
                You focused on <span className="font-bold">{currentSubject}</span> for{" "}
                <span className="font-bold font-mono">
                  {Math.max(1, Math.round((totalSeconds - secondsRemaining) / 60))} minutes
                </span>
                . Add optional accomplishment notes to permanently archive this to your telemetry.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-200 mb-1 uppercase tracking-wider">
                  Session Takeaways / Accomplishments
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Mastered binary search on answer space, solved 3 hard problems..."
                  className="w-full px-3.5 py-2 bg-white dark:bg-[#111827] border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-[#172033] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={onClose} disabled={isLogging}>
                  Dismiss
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleLogSession}
                  isLoading={isLogging}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                >
                  <Check size={14} className="mr-1" />
                  Save & Log to Study History
                </Button>
              </div>
            </div>
          )}

          {/* Encouraging Pedagogy Quote / Streak */}
          {streakCount > 0 && (
            <div className="flex items-center justify-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
              <Flame size={15} className="animate-pulse" />
              <span>Current Study Streak: {streakCount} {streakCount === 1 ? "day" : "days"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyFocusModal;
