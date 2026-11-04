import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, ThumbsUp, ThumbsDown, Check, RefreshCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import aiService from "../../services/ai.service";
import Button from "../common/Button";
import Loader from "../common/Loader";

/**
 * Parse inline Markdown (bold, code, italics) into clean React elements
 * to prevent raw markdown characters (e.g. **bold**) from being displayed.
 */
function renderFormattedMarkdown(text) {
  if (!text || typeof text !== "string") return text;

  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={index} className="font-semibold text-[#172033] dark:text-slate-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={index}
          className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/40"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={index} className="italic text-[#172033] dark:text-slate-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

export const RecommendationsWidget = () => {
  const { accessToken } = useAuth();
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const fetchOrGenerateRecommendation = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");

    try {
      const getRes = await aiService.getRecommendations(accessToken);
      const list = getRes.recommendations || [];
      const activeItem = list.find((r) => r.status === "active" || r.status === "pending");

      if (activeItem) {
        setRecommendation(activeItem);
      } else {
        const genRes = await aiService.generateRecommendations(accessToken);
        setRecommendation(genRes.recommendation);
      }
    } catch (err) {
      setError(err.message || "Failed to load AI recommendation.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchOrGenerateRecommendation();
  }, [fetchOrGenerateRecommendation]);

  const handleFeedback = async (feedbackType) => {
    if (!recommendation || actionLoading) return;
    setActionLoading(true);
    setMsg("");
    setError("");

    try {
      const res = await aiService.submitRecommendationFeedback(accessToken, recommendation._id, {
        feedback: feedbackType,
        status: feedbackType === "accepted" ? "accepted" : feedbackType === "rejected" ? "rejected" : "active"
      });
      setRecommendation(res.recommendation);
      setMsg(`Feedback recorded: ${feedbackType.replace("_", " ")}`);
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to save feedback.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGiveAnother = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    setMsg("");
    setError("");

    try {
      const res = await aiService.giveAnotherRecommendation(accessToken);
      setRecommendation(res.recommendation);
      setMsg("Fresh recommendation generated!");
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to generate new recommendation.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] rounded-3xl p-6 shadow-sm">
        <Loader text="Analyzing priority signals & synthesizing recommendations..." size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] rounded-3xl p-6 text-center text-xs text-rose-500 shadow-sm">
        {error}
        <div className="mt-3">
          <Button variant="secondary" size="sm" onClick={fetchOrGenerateRecommendation}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!recommendation) return null;

  return (
    <div className="bg-white dark:bg-[#111827] border border-violet-200/70 dark:border-violet-900/40 rounded-3xl p-6 sm:p-7 space-y-4 shadow-sm relative overflow-hidden transition-all">
      {/* Top accent highlight */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500" />

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/40 flex items-center justify-center shadow-2xs">
            <Sparkles size={15} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 font-sans">
            AI Smart Productivity Insight
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-[#667085] dark:text-slate-300 border border-[#E7EAF0] dark:border-slate-700 uppercase tracking-wider font-mono">
            {recommendation.type}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 shadow-2xs">
            {recommendation.relevanceScore}% Match
          </span>
        </div>
      </div>

      {msg && (
        <div className="text-xs p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 animate-fade-in font-medium">
          {msg}
        </div>
      )}

      <div>
        <h3 className="text-base sm:text-lg font-bold text-[#172033] dark:text-white font-display">
          {renderFormattedMarkdown(recommendation.title)}
        </h3>
        <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-400 mt-1 leading-relaxed">
          {renderFormattedMarkdown(recommendation.description)}
        </p>
      </div>

      {recommendation.actionableSteps && recommendation.actionableSteps.length > 0 && (
        <div className="bg-[#F8FAFC] dark:bg-[#161F30] rounded-2xl p-4 border border-[#E7EAF0] dark:border-[#1F2937] space-y-2">
          <span className="text-[10px] font-bold text-[#667085] dark:text-slate-400 uppercase tracking-wider block">
            Actionable Next Steps
          </span>
          <ul className="space-y-1.5">
            {recommendation.actionableSteps.map((step, idx) => (
              <li key={idx} className="text-xs sm:text-sm text-[#172033] dark:text-slate-200 flex items-start gap-2.5">
                <span className="text-violet-500 font-bold text-sm leading-none">•</span>
                <span className="leading-relaxed">{renderFormattedMarkdown(step)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E7EAF0] dark:border-[#1F2937]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleFeedback("helpful")}
            disabled={actionLoading}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-[0.98] flex items-center gap-1.5 cursor-pointer ${
              recommendation.feedback === "helpful"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white dark:bg-[#111827] text-[#667085] dark:text-slate-300 hover:text-[#172033] dark:hover:text-white hover:bg-[#F8FAFC] dark:hover:bg-slate-800 border border-[#E7EAF0] dark:border-slate-700"
            }`}
          >
            <ThumbsUp size={13} />
            <span>Helpful</span>
          </button>
          <button
            type="button"
            onClick={() => handleFeedback("not_useful")}
            disabled={actionLoading}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-[0.98] flex items-center gap-1.5 cursor-pointer ${
              recommendation.feedback === "not_useful"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-white dark:bg-[#111827] text-[#667085] dark:text-slate-300 hover:text-[#172033] dark:hover:text-white hover:bg-[#F8FAFC] dark:hover:bg-slate-800 border border-[#E7EAF0] dark:border-slate-700"
            }`}
          >
            <ThumbsDown size={13} />
            <span>Not useful</span>
          </button>
          <button
            type="button"
            onClick={() => handleFeedback("accepted")}
            disabled={actionLoading}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-[0.98] flex items-center gap-1.5 cursor-pointer ${
              recommendation.feedback === "accepted"
                ? "bg-violet-600 text-white shadow-xs"
                : "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 hover:bg-violet-100 border border-violet-200 dark:border-violet-800/40"
            }`}
          >
            <Check size={13} />
            <span>Accept</span>
          </button>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleGiveAnother}
          isLoading={actionLoading}
          className="flex items-center gap-1.5 text-xs"
        >
          <RefreshCw size={13} />
          <span>Give Another</span>
        </Button>
      </div>
    </div>
  );
};

export default RecommendationsWidget;
