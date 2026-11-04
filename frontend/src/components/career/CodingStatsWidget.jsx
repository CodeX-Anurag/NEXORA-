import React from "react";
import { Terminal, Trophy, CheckCircle2 } from "lucide-react";

export const CodingStatsWidget = ({ leetcodeConnection, codeforcesConnection }) => {
  const hasLeetcode = leetcodeConnection?.connectionStatus === "connected";
  const hasCodeforces = codeforcesConnection?.connectionStatus === "connected";

  if (!hasLeetcode && !hasCodeforces) return null;

  const lcData = leetcodeConnection?.importedData || {};
  const cfData = codeforcesConnection?.importedData || {};

  const easy = Math.max(0, Number(lcData.easy) || 0);
  const medium = Math.max(0, Number(lcData.medium) || 0);
  const hard = Math.max(0, Number(lcData.hard) || 0);
  const totalSolved = Math.max(0, Number(lcData.totalSolved) || 0);
  const totalLc = totalSolved || (easy + medium + hard) || 0;

  const easyPct = totalLc > 0 ? Math.min(100, Math.round((easy / totalLc) * 100)) : 0;
  const medPct = totalLc > 0 ? Math.min(100, Math.round((medium / totalLc) * 100)) : 0;
  const hardPct = totalLc > 0 ? Math.min(100, Math.round((hard / totalLc) * 100)) : 0;

  const contestRating = Number(lcData.contestRating);
  const hasContestRating = Number.isFinite(contestRating) && contestRating > 0;

  const cfRating = Math.max(0, Number(cfData.rating) || 0);
  const cfMaxRating = Math.max(0, Number(cfData.maxRating) || 0);
  const cfContestCount = Math.max(0, Number(cfData.contestCount) || 0);
  const cfRank = typeof cfData.rank === "string" ? cfData.rank : "Unrated";
  const cfContribution = Number(cfData.contribution) || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* 1. LeetCode Card */}
      {hasLeetcode && (
        <div className="p-6 rounded-2xl bg-white border border-[#E7EAF0] space-y-4 shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Terminal className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-[#172033] font-display">LeetCode Practice</h3>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                leetcodeConnection.verificationStatus === "api_verified"
                  ? "bg-[#ECFDF3] text-[#12B76A] border border-[#A6F4C5]"
                  : "bg-[#FFFAEB] text-[#F79009] border border-[#FEDF89]"
              }`}
            >
              <CheckCircle2 className="w-2.5 h-2.5" />
              {leetcodeConnection.verificationStatus === "api_verified" ? "API-Verified" : "User-Confirmed"}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold font-mono text-[#172033]">{totalLc}</span>
              <span className="text-xs text-[#667085] ml-2 font-medium">Problems Solved</span>
            </div>
            {hasContestRating && (
              <div className="text-right">
                <span className="text-sm font-bold font-mono text-[#4F7CFF]">{Math.round(contestRating)}</span>
                <p className="text-[10px] text-[#667085]">Contest Rating</p>
              </div>
            )}
          </div>

          {/* Difficulty Progress Stack */}
          <div className="w-full h-2 rounded-full bg-[#F1F4F9] overflow-hidden flex border border-[#E7EAF0]">
            <div style={{ width: `${easyPct}%` }} className="bg-[#12B76A] h-full" title={`Easy: ${easy}`} />
            <div style={{ width: `${medPct}%` }} className="bg-[#F79009] h-full" title={`Medium: ${medium}`} />
            <div style={{ width: `${hardPct}%` }} className="bg-[#F04438] h-full" title={`Hard: ${hard}`} />
          </div>

          {/* Detail Counters */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E7EAF0]">
              <span className="text-[10px] text-[#12B76A] font-semibold block">Easy</span>
              <span className="font-mono font-bold text-[#172033]">{easy}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E7EAF0]">
              <span className="text-[10px] text-[#F79009] font-semibold block">Medium</span>
              <span className="font-mono font-bold text-[#172033]">{medium}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E7EAF0]">
              <span className="text-[10px] text-[#F04438] font-semibold block">Hard</span>
              <span className="font-mono font-bold text-[#172033]">{hard}</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Codeforces Card */}
      {hasCodeforces && (
        <div className="p-6 rounded-2xl bg-white border border-[#E7EAF0] space-y-4 shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#4F7CFF] flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-[#172033] font-display">Codeforces Rating</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ECFDF3] text-[#12B76A] border border-[#A6F4C5] flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" /> API-Verified
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold font-mono text-[#4F7CFF]">{cfRating}</span>
              <span className="text-xs text-[#667085] font-semibold ml-2 capitalize">({cfRank})</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-[#172033] font-medium">Peak: {cfMaxRating}</span>
              <p className="text-[10px] text-[#667085]">{cfContestCount} Contests</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E7EAF0] space-y-1.5 text-xs">
            <div className="flex justify-between text-[#667085]">
              <span>Rank Tier:</span>
              <span className="font-semibold text-[#172033] capitalize">{cfRank}</span>
            </div>
            <div className="flex justify-between text-[#667085]">
              <span>Community Contribution:</span>
              <span className="font-mono text-[#12B76A] font-semibold">{cfContribution}</span>
            </div>
          </div>

          <p className="text-[11px] text-[#98A2B3]">
            Live telemetry synchronized from the official Codeforces REST API.
          </p>
        </div>
      )}
    </div>
  );
};

export default CodingStatsWidget;
