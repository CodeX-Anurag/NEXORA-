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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 1. LeetCode Card */}
      {hasLeetcode && (
        <div className="p-6 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-[#E0693B]" />
              <h3 className="font-bold text-base text-[#FAF7F2] font-display">LeetCode Practice</h3>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                leetcodeConnection.verificationStatus === "api_verified"
                  ? "bg-[#2EA366]/10 text-[#2EA366] border border-[#2EA366]/20"
                  : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
              }`}
            >
              <CheckCircle2 className="w-2.5 h-2.5" />
              {leetcodeConnection.verificationStatus === "api_verified" ? "API-Verified" : "User-Confirmed"}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold font-mono text-[#FAF7F2]">{totalLc}</span>
              <span className="text-xs text-[#9C9384] ml-2">Problems Solved</span>
            </div>
            {hasContestRating && (
              <div className="text-right">
                <span className="text-sm font-bold font-mono text-[#E0693B]">{Math.round(contestRating)}</span>
                <p className="text-[10px] text-[#787165]">Contest Rating</p>
              </div>
            )}
          </div>

          {/* Difficulty Progress Stack */}
          <div className="w-full h-2.5 rounded-full bg-[#141312] overflow-hidden flex border border-[#2D2925]">
            <div style={{ width: `${easyPct}%` }} className="bg-[#2EA366] h-full" title={`Easy: ${easy}`} />
            <div style={{ width: `${medPct}%` }} className="bg-[#E0693B] h-full" title={`Medium: ${medium}`} />
            <div style={{ width: `${hardPct}%` }} className="bg-rose-500 h-full" title={`Hard: ${hard}`} />
          </div>

          {/* Detail Counters */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
            <div className="p-2 rounded-lg bg-[#141312] border border-[#2D2925]">
              <span className="text-[10px] text-[#2EA366] font-semibold block">Easy</span>
              <span className="font-mono font-bold text-[#FAF7F2]">{easy}</span>
            </div>
            <div className="p-2 rounded-lg bg-[#141312] border border-[#2D2925]">
              <span className="text-[10px] text-[#E0693B] font-semibold block">Medium</span>
              <span className="font-mono font-bold text-[#FAF7F2]">{medium}</span>
            </div>
            <div className="p-2 rounded-lg bg-[#141312] border border-[#2D2925]">
              <span className="text-[10px] text-rose-400 font-semibold block">Hard</span>
              <span className="font-mono font-bold text-[#FAF7F2]">{hard}</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Codeforces Card */}
      {hasCodeforces && (
        <div className="p-6 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#3B82F6]" />
              <h3 className="font-bold text-base text-[#FAF7F2] font-display">Codeforces Rating</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#2EA366]/10 text-[#2EA366] border border-[#2EA366]/20 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" /> API-Verified
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold font-mono text-[#3B82F6]">{cfRating}</span>
              <span className="text-xs text-[#CDC5B6] font-semibold ml-2 capitalize">({cfRank})</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-[#9C9384]">Peak: {cfMaxRating}</span>
              <p className="text-[10px] text-[#787165]">{cfContestCount} Contests</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#141312] border border-[#2D2925] space-y-1 text-xs">
            <div className="flex justify-between text-[#9C9384]">
              <span>Rank Tier:</span>
              <span className="font-semibold text-[#FAF7F2] capitalize">{cfRank}</span>
            </div>
            <div className="flex justify-between text-[#9C9384]">
              <span>Community Contribution:</span>
              <span className="font-mono text-[#2EA366] font-medium">{cfContribution}</span>
            </div>
          </div>

          <p className="text-[11px] text-[#787165]">
            Live data synchronized directly from the official Codeforces REST API.
          </p>
        </div>
      )}
    </div>
  );
};

export default CodingStatsWidget;
