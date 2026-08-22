import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import aiService from "../../services/ai.service";
import Button from "../common/Button";
import Loader from "../common/Loader";

export const RecommendationsWidget = () => {
  const { accessToken } = useAuth();
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const fetchOrGenerateRecommendation = useCallback(async () => {
    if (!accessToken) return;
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <Loader message="Analyzing priority signals & generating recommendation..." size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-xs text-rose-400">
        {error}
        <div className="mt-2">
          <Button variant="secondary" size="sm" onClick={fetchOrGenerateRecommendation}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!recommendation) return null;

  return (
    <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-6 space-y-4 shadow-lg shadow-indigo-950/20 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold">
            NEXORA AI Recommendation
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
            {recommendation.type}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {recommendation.relevanceScore}% Match
          </span>
        </div>
      </div>

      {msg && (
        <div className="text-xs p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 animate-fade-in">
          {msg}
        </div>
      )}

      <div>
        <h3 className="text-lg font-bold text-slate-100">{recommendation.title}</h3>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{recommendation.description}</p>
      </div>

      {recommendation.actionableSteps && recommendation.actionableSteps.length > 0 && (
        <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Actionable Next Steps
          </span>
          <ul className="space-y-1">
            {recommendation.actionableSteps.map((step, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleFeedback("helpful")}
            disabled={actionLoading}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              recommendation.feedback === "helpful"
                ? "bg-emerald-600 text-white font-bold"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            👍 Helpful
          </button>
          <button
            onClick={() => handleFeedback("not_useful")}
            disabled={actionLoading}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              recommendation.feedback === "not_useful"
                ? "bg-rose-600 text-white font-bold"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            👎 Not useful
          </button>
          <button
            onClick={() => handleFeedback("accepted")}
            disabled={actionLoading}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              recommendation.feedback === "accepted"
                ? "bg-indigo-600 text-white font-bold"
                : "bg-slate-800 text-indigo-300 hover:bg-slate-700"
            }`}
          >
            ✓ Accept
          </button>
        </div>

        <Button variant="secondary" size="sm" onClick={handleGiveAnother} isLoading={actionLoading}>
          🔄 Give Another
        </Button>
      </div>
    </div>
  );
};

export default RecommendationsWidget;
