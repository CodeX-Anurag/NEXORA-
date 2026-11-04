import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

export const StartupSplash = ({ onFinish }) => {
  const [phase, setPhase] = useState("enter"); // "enter" | "active" | "exit" | "done"
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // If running in test environment (jsdom/vitest), bypass immediately
    const isTest =
      typeof navigator !== "undefined" &&
      (navigator.userAgent?.includes("jsdom") || import.meta.env?.MODE === "test");
    if (isTest) {
      setPhase("done");
      if (onFinish) onFinish();
      return;
    }

    // Sequence the YouTube-style startup animation
    const enterTimer = setTimeout(() => {
      setPhase("active");
    }, 100);

    // Progress bar fill
    const progressTimer = setTimeout(() => {
      setProgress(100);
    }, 200);

    // Start exit dissolve
    const exitTimer = setTimeout(() => {
      setPhase("exit");
    }, 1200);

    // Completely unmount
    const doneTimer = setTimeout(() => {
      setPhase("done");
      if (onFinish) onFinish();
    }, 1650);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(progressTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  if (phase === "done") return null;

  const handleSkip = () => {
    setPhase("done");
    if (onFinish) onFinish();
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-500 ease-out ${
        phase === "exit"
          ? "opacity-0 scale-105 pointer-events-none"
          : "opacity-100 scale-100"
      } bg-[#F7F8FC] dark:bg-[#0B0F19]`}
      aria-label="Application Loading Splash"
    >
      {/* Background ambient radial glow */}
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-[#4F7CFF]/20 to-[#7C6CFA]/20 blur-3xl pointer-events-none animate-pulse" />

      {/* Main Animated YouTube-style Emblem & Wordmark Container */}
      <div
        className={`flex flex-col items-center space-y-5 relative z-10 transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${
          phase === "enter"
            ? "scale-75 opacity-0 translate-y-3"
            : "scale-100 opacity-100 translate-y-0"
        }`}
      >
        {/* Logo Icon with glowing drop-shadow & subtle pulse */}
        <div className="relative group">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-[#4F7CFF] to-[#7C6CFA] rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition duration-1000 animate-tilt" />
          <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#4F7CFF] via-[#5F75FF] to-[#7C6CFA] flex items-center justify-center text-white shadow-2xl shadow-[#4F7CFF]/40 transform transition-transform duration-500 hover:scale-105">
            <Sparkles className="w-9 h-9 sm:w-10 sm:h-10 text-white animate-spin-slow" />
          </div>
        </div>

        {/* Wordmark Branding */}
        <div className="text-center space-y-1">
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-[#172033] dark:text-[#F8FAFC] flex items-center justify-center gap-1.5">
            <span>NEXORA</span>
          </h1>
          <p className="text-[11px] font-sans font-semibold uppercase tracking-widest text-[#4F7CFF]">
            Student Platform
          </p>
        </div>

        {/* YouTube-style Sleek Progress Bar */}
        <div className="w-36 sm:w-44 h-1 bg-[#E7EAF0] dark:bg-[#1F2937] rounded-full overflow-hidden mt-3 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#4F7CFF] to-[#7C6CFA] rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default StartupSplash;
