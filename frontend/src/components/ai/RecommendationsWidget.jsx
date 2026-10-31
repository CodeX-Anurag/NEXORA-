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
      <div className="bg-[#191816] border border-[#2D2925] rounded-2xl p-6">
        <Loader text="Analyzing priority signals & generating recommendation..." size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#191816] border border-[#2D2925] rounded-2xl p-6 text-center text-xs text-rose-400">
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
    <div className="bg-[#191816] border border-[#E0693B]/25 rounded-2xl p-6 space-y-4 shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#2EA366] animate-pulse"></span>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#E0693B] font-display">
            NEXORA AI Recommendation
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#262420] text-[#CDC5B6] border border-[#3A352F] uppercase">
            {recommendation.type}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#2EA366]/15 text-[#2EA366] border border-[#2EA366]/30">
            {recommendation.relevanceScore}% Match
          </span>
        </div>
      </div>

      {msg && (
        <div className="text-xs p-2.5 rounded-xl bg-[#2EA366]/15 border border-[#2EA366]/30 text-[#2EA366] animate-fade-in font-medium">
          {msg}
        </div>
      )}

      <div>
        <h3 className="text-lg font-bold text-[#FAF7F2] font-display">{recommendation.title}</h3>
        <p className="text-xs text-[#CDC5B6] mt-1.5 leading-relaxed">{recommendation.description}</p>
      </div>

      {recommendation.actionableSteps && recommendation.actionableSteps.length > 0 && (
        <div className="bg-[#141312] rounded-xl p-4 border border-[#2D2925] space-y-2">
          <span className="text-[11px] font-bold text-[#9C9384] uppercase tracking-wider block">
            Actionable Next Steps
          </span>
          <ul className="space-y-1.5">
            {recommendation.actionableSteps.map((step, idx) => (
              <li key={idx} className="text-xs text-[#FAF7F2] flex items-start gap-2.5">
                <span className="text-[#E0693B] font-bold text-sm leading-none">•</span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#262420]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleFeedback("helpful")}
            disabled={actionLoading}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              recommendation.feedback === "helpful"
                ? "bg-[#2EA366] text-white shadow-sm"
                : "bg-[#22201D] text-[#CDC5B6] hover:text-[#FAF7F2] hover:bg-[#2A2724] border border-[#332F2A]"
            }`}
          >
            👍 Helpful
          </button>
          <button
            onClick={() => handleFeedback("not_useful")}
            disabled={actionLoading}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              recommendation.feedback === "not_useful"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-[#22201D] text-[#CDC5B6] hover:text-[#FAF7F2] hover:bg-[#2A2724] border border-[#332F2A]"
            }`}
          >
            👎 Not useful
          </button>
          <button
            onClick={() => handleFeedback("accepted")}
            disabled={actionLoading}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              recommendation.feedback === "accepted"
                ? "bg-[#E0693B] text-white shadow-sm"
                : "bg-[#22201D] text-[#E0693B] hover:bg-[#E0693B]/10 border border-[#E0693B]/30"
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
