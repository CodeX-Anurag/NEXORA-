import React, { useState } from "react";
import { HelpCircle, CheckCircle2, XCircle, RefreshCw, Award } from "lucide-react";

export const InteractiveQuiz = ({ spec }) => {
  let quizData = null;
  try {
    quizData = typeof spec === "string" ? JSON.parse(spec) : spec;
  } catch {
    return null;
  }

  const { topic = "Knowledge Check", questions = [] } = quizData || {};
  const [selectedAnswers, setSelectedAnswers] = useState({});

  if (!questions || questions.length === 0) return null;

  const handleSelect = (qIdx, optIdx) => {
    if (selectedAnswers[qIdx] !== undefined) return; // Locked once answered
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = questions.reduce((acc, q, idx) => {
    return acc + (selectedAnswers[idx] === q.answerIndex ? 1 : 0);
  }, 0);

  return (
    <div className="my-4 rounded-3xl bg-white dark:bg-[#111827] border border-violet-200/80 dark:border-violet-900/40 p-5 sm:p-6 shadow-sm space-y-5 overflow-hidden">
      {/* Quiz Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F4F9] dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/40 flex items-center justify-center shadow-2xs">
            <HelpCircle size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#172033] dark:text-white font-display">
              {topic}
            </h4>
            <span className="text-[10px] text-[#667085] dark:text-slate-400 font-mono">
              {questions.length} Multiple Choice Questions
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {answeredCount > 0 && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/40 flex items-center gap-1">
              <Award size={12} />
              <span>Score: {correctCount} / {answeredCount}</span>
            </span>
          )}

          {answeredCount === questions.length && (
            <button
              onClick={resetQuiz}
              className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#F8FAFC] dark:bg-slate-800 text-[#667085] dark:text-slate-300 hover:text-[#172033] dark:hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {questions.map((q, qIdx) => {
          const userChoice = selectedAnswers[qIdx];
          const hasAnswered = userChoice !== undefined;
          const isCorrect = userChoice === q.answerIndex;

          return (
            <div key={qIdx} className="space-y-3 pt-1">
              <p className="text-xs sm:text-sm font-semibold text-[#172033] dark:text-slate-100 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                  {qIdx + 1}
                </span>
                <span>{q.question}</span>
              </p>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7">
                {q.options.map((opt, optIdx) => {
                  let optStyle = "bg-[#F8FAFC] dark:bg-slate-900 border-[#E7EAF0] dark:border-slate-800 text-[#172033] dark:text-slate-200 hover:border-violet-300 dark:hover:border-violet-700";

                  if (hasAnswered) {
                    if (optIdx === q.answerIndex) {
                      optStyle = "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold";
                    } else if (optIdx === userChoice) {
                      optStyle = "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300";
                    } else {
                      optStyle = "opacity-50 bg-[#F8FAFC] dark:bg-slate-900 border-[#E7EAF0] dark:border-slate-800 text-slate-400";
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={hasAnswered}
                      onClick={() => handleSelect(qIdx, optIdx)}
                      className={`p-3 rounded-2xl border text-xs text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${optStyle}`}
                    >
                      <span className="leading-snug">{opt}</span>
                      {hasAnswered && optIdx === q.answerIndex && (
                        <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                      {hasAnswered && optIdx === userChoice && optIdx !== q.answerIndex && (
                        <XCircle size={14} className="text-rose-600 dark:text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Reveal */}
              {hasAnswered && q.explanation && (
                <div className="ml-7 p-3 rounded-xl bg-violet-50/60 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/30 text-[11px] text-[#667085] dark:text-slate-300 space-y-1 animate-fade-in">
                  <span className="font-bold text-violet-700 dark:text-violet-400 block">
                    {isCorrect ? "Correct!" : "Explanation:"}
                  </span>
                  <p className="leading-relaxed">{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InteractiveQuiz;