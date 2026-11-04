import React, { useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, RotateCw, CheckCircle2, BookmarkCheck } from "lucide-react";

export const InteractiveFlashcards = ({ spec }) => {
  let deckData = null;
  try {
    deckData = typeof spec === "string" ? JSON.parse(spec) : spec;
  } catch {
    return null;
  }

  const { deckTitle = "Revision Flashcards", cards = [] } = deckData || {};
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState(new Set());

  if (!cards || cards.length === 0) return null;

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const toggleMastered = () => {
    setMasteredCards((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }
      return next;
    });
  };

  const isCurrentMastered = masteredCards.has(currentIndex);

  return (
    <div className="my-4 rounded-3xl bg-white dark:bg-[#111827] border border-indigo-200/80 dark:border-indigo-900/40 p-5 sm:p-6 shadow-sm space-y-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F1F4F9] dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40 flex items-center justify-center">
            <BookOpen size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#172033] dark:text-white font-display">
              {deckTitle}
            </h4>
            <span className="text-[10px] text-[#667085] dark:text-slate-400 font-mono">
              Card {currentIndex + 1} of {cards.length} • {masteredCards.size} Mastered
            </span>
          </div>
        </div>

        <button
          onClick={toggleMastered}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
            isCurrentMastered
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/40"
              : "bg-white dark:bg-slate-900 text-[#667085] dark:text-slate-400 border-[#E7EAF0] dark:border-slate-800 hover:text-[#172033] dark:hover:text-white"
          }`}
        >
          {isCurrentMastered ? <CheckCircle2 size={13} /> : <BookmarkCheck size={13} />}
          <span>{isCurrentMastered ? "Mastered" : "Mark Mastered"}</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-indigo-600 h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* 3D Flip Card */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full min-h-[170px] p-6 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/60 dark:from-indigo-950/20 dark:via-[#161F30] dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/30 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md select-none relative group"
      >
        <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          <span>{isFlipped ? "Answer / Explanation" : "Question / Concept"}</span>
          <span className="flex items-center gap-1 opacity-70 group-hover:opacity-100">
            <RotateCw size={11} /> Click to Flip
          </span>
        </div>

        <div className="py-4 text-center">
          <p className="text-sm sm:text-base font-semibold text-[#172033] dark:text-white leading-relaxed">
            {isFlipped ? currentCard.back : currentCard.front}
          </p>
        </div>

        <div className="text-center">
          <span className="text-[10px] text-[#98A2B3] dark:text-slate-500 font-sans">
            {isFlipped ? "Click anywhere to see question" : "Click anywhere to flip and check answer"}
          </span>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={handlePrev}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F8FAFC] dark:bg-slate-800 hover:bg-[#F1F4F9] dark:hover:bg-slate-700 text-[#172033] dark:text-slate-200 border border-[#E7EAF0] dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft size={14} />
          <span>Previous</span>
        </button>

        <span className="text-xs font-mono text-[#667085] dark:text-slate-400">
          {currentIndex + 1} / {cards.length}
        </span>

        <button
          onClick={handleNext}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F8FAFC] dark:bg-slate-800 hover:bg-[#F1F4F9] dark:hover:bg-slate-700 text-[#172033] dark:text-slate-200 border border-[#E7EAF0] dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default InteractiveFlashcards;