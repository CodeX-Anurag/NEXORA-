import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Check, Flame } from "lucide-react";
import Modal from "../common/Modal";
import Button from "../common/Button";

export const TaskFocusModal = ({ isOpen, onClose, task, onFocusComplete }) => {
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [focusNotes, setFocusNotes] = useState("");
  const [isLogging, setIsLogging] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen && task) {
      const defaultMinutes = task.estimatedMinutes && task.estimatedMinutes > 0 ? Math.min(task.estimatedMinutes, 60) : 25;
      setSelectedMinutes(defaultMinutes);
      setSecondsRemaining(defaultMinutes * 60);
      setIsActive(false);
      setIsCompleted(false);
      setFocusNotes("");
    }
  }, [isOpen, task]);

  useEffect(() => {
    if (isActive && secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsActive(false);
            setIsCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isActive, secondsRemaining]);

  if (!isOpen || !task) return null;

  const handleSelectDuration = (minutes) => {
    setSelectedMinutes(minutes);
    setSecondsRemaining(minutes * 60);
    setIsActive(false);
    setIsCompleted(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setSecondsRemaining(selectedMinutes * 60);
    setIsCompleted(false);
  };

  const handleFinishEarly = () => {
    setIsActive(false);
    setIsCompleted(true);
  };

  const handleLogSession = async () => {
    setIsLogging(true);
    try {
      const elapsedMinutes = Math.max(1, Math.round((selectedMinutes * 60 - secondsRemaining) / 60));
      await onFocusComplete(task._id, {
        minutes: elapsedMinutes,
        notes: focusNotes
      });
      onClose();
    } catch {
      // Swallowed safely
    } finally {
      setIsLogging(false);
    }
  };

  const minutesDisplay = String(Math.floor(secondsRemaining / 60)).padStart(2, "0");
  const secondsDisplay = String(secondsRemaining % 60).padStart(2, "0");

  const totalSeconds = selectedMinutes * 60;
  const progressRatio = totalSeconds > 0 ? (totalSeconds - secondsRemaining) / totalSeconds : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="NEXORA Task Focus Mode"
      footer={
        isCompleted ? (
          <>
            <Button variant="secondary" onClick={onClose} disabled={isLogging}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleLogSession} isLoading={isLogging}>
              <Check className="w-4 h-4 mr-1" /> Log Focus Session
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      <div className="space-y-6 text-center">
        {/* Task Title Banner */}
        <div className="p-3.5 rounded-xl bg-[#141312] border border-[#262420] text-left">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[#E0693B] font-bold">
            <Flame className="w-3.5 h-3.5" /> Active Focus Target
          </div>
          <h4 className="text-sm font-bold text-[#FAF7F2] truncate mt-0.5">{task.title}</h4>
          <span className="text-[11px] text-[#9C9384] font-mono">
            {task.category || "General"} • {task.priority} priority
          </span>
        </div>

        {/* Preset Selector */}
        {!isActive && !isCompleted && (
          <div className="flex items-center justify-center gap-2">
            {[15, 25, 45, 60].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleSelectDuration(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  selectedMinutes === m
                    ? "bg-[#E0693B] text-white shadow-md shadow-[#E0693B]/20"
                    : "bg-[#141312] text-[#9C9384] hover:text-[#FAF7F2] border border-[#2D2925]"
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        )}

        {/* Timer Box */}
        <div className="p-8 rounded-2xl bg-[#141312] border border-[#2D2925] space-y-4">
          <div className="text-6xl font-black text-[#FAF7F2] font-mono tracking-wider">
            {minutesDisplay}:{secondsDisplay}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-[#1E1C19] border border-[#2B2723] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#C5572C] to-[#E0693B] transition-all"
              style={{ width: `${Math.round(progressRatio * 100)}%` }}
            />
          </div>

          <p className="text-xs text-[#9C9384]">
            {isActive
              ? "Deep Focus Active — Eliminate distractions and execute this task."
              : isCompleted
              ? "Focus sprint completed! Great execution."
              : "Ready to focus on your deliverable."}
          </p>
        </div>

        {/* Timer Controls */}
        {!isCompleted ? (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsActive((prev) => !prev)}
              className="px-6 py-3 rounded-xl bg-[#E0693B] hover:bg-[#EB784B] text-white font-bold text-sm shadow-lg shadow-[#E0693B]/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isActive ? "Pause Session" : "Start Focus"}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-3 rounded-xl bg-[#25221F] hover:bg-[#2D2925] text-[#CDC5B6] hover:text-[#FAF7F2] border border-[#38332E] transition-colors"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {isActive && (
              <button
                type="button"
                onClick={handleFinishEarly}
                className="px-4 py-3 rounded-xl bg-[#25221F] hover:bg-[#2D2925] text-xs font-semibold text-[#2EA366] border border-[#38332E] transition-colors"
              >
                Finish Early
              </button>
            )}
          </div>
        ) : (
          /* Completed Session Notes */
          <div className="space-y-3 text-left">
            <label className="text-xs font-semibold text-[#CDC5B6] uppercase tracking-wider block">
              Session Takeaway / Notes
            </label>
            <textarea
              rows={2}
              value={focusNotes}
              onChange={(e) => setFocusNotes(e.target.value)}
              placeholder="What did you accomplish during this focus block?..."
              className="w-full text-xs text-[#CDC5B6] bg-[#141312] border border-[#2D2925] rounded-xl p-3 focus:outline-none focus:border-[#E0693B]"
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TaskFocusModal;
