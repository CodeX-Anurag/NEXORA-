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
        <div className="p-3.5 rounded-xl bg-[#EEF2FF] border border-[#4F7CFF]/20 text-left">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[#4F7CFF] font-bold">
            <Flame className="w-3.5 h-3.5 text-[#7C6CFA]" /> Active Focus Target
          </div>
          <h4 className="text-sm font-bold text-[#172033] truncate mt-0.5">{task.title}</h4>
          <span className="text-[11px] text-[#667085] font-mono">
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
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedMinutes === m
                    ? "bg-[#4F7CFF] text-white shadow-sm shadow-[#4F7CFF]/25"
                    : "bg-white text-[#667085] hover:text-[#172033] border border-[#E7EAF0] shadow-2xs"
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        )}

        {/* Timer Box */}
        <div className="p-8 rounded-2xl bg-[#F8FAFC] border border-[#E7EAF0] space-y-4">
          <div className="text-6xl font-black text-[#172033] font-mono tracking-wider">
            {minutesDisplay}:{secondsDisplay}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-[#EAECF0] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#4F7CFF] to-[#7C6CFA] transition-all"
              style={{ width: `${Math.round(progressRatio * 100)}%` }}
            />
          </div>

          <p className="text-xs text-[#667085]">
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
              className="px-6 py-3 rounded-xl bg-[#4F7CFF] hover:bg-[#3D68E5] text-white font-bold text-sm shadow-sm shadow-[#4F7CFF]/25 flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isActive ? "Pause Session" : "Start Focus"}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-3 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#667085] hover:text-[#172033] border border-[#E7EAF0] transition-colors cursor-pointer shadow-xs"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {isActive && (
              <button
                type="button"
                onClick={handleFinishEarly}
                className="px-4 py-3 rounded-xl bg-[#ECFDF3] hover:bg-[#D1FADF] text-xs font-semibold text-[#027A48] border border-[#A6F4C5] transition-colors cursor-pointer"
              >
                Finish Early
              </button>
            )}
          </div>
        ) : (
          /* Completed Session Notes */
          <div className="space-y-3 text-left">
            <label className="text-xs font-semibold text-[#172033] tracking-normal block">
              Session Takeaway / Notes
            </label>
            <textarea
              rows={2}
              value={focusNotes}
              onChange={(e) => setFocusNotes(e.target.value)}
              placeholder="What did you accomplish during this focus block?..."
              className="w-full text-xs text-[#172033] bg-white border border-[#E7EAF0] rounded-xl p-3 focus:outline-none focus:border-[#4F7CFF] placeholder-[#98A2B3]"
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TaskFocusModal;
