import React, { useState } from "react";
import {
  Github,
  Linkedin,
  Globe,
  Terminal,
  Trophy,
  RefreshCw,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Plus
} from "lucide-react";
import Button from "../common/Button";
import Modal from "../common/Modal";

const PLATFORM_CONFIG = {
  github: {
    name: "GitHub",
    icon: Github,
    color: "#24292F",
    accentBg: "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700",
    topBar: "bg-slate-800 dark:bg-slate-300",
    placeholder: "username or https://github.com/username",
    description: "Official GitHub API: Imports public repositories, stars, languages & contributions."
  },
  leetcode: {
    name: "LeetCode",
    icon: Terminal,
    color: "#F59E0B",
    accentBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40",
    topBar: "bg-amber-500",
    placeholder: "username or https://leetcode.com/u/username",
    description: "Permitted GraphQL query with self-confirmed problem stats fallback."
  },
  codeforces: {
    name: "Codeforces",
    icon: Trophy,
    color: "#06B6D4",
    accentBg: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/40",
    topBar: "bg-cyan-500",
    placeholder: "handle (e.g. tourist)",
    description: "Official Codeforces REST API: Imports rating, rank, and contest participation."
  },
  linkedin: {
    name: "LinkedIn",
    icon: Linkedin,
    color: "#0A66C2",
    accentBg: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/40",
    topBar: "bg-blue-600",
    placeholder: "https://linkedin.com/in/username",
    description: "User-controlled profile link & verified career headline registration."
  },
  portfolio: {
    name: "Portfolio Website",
    icon: Globe,
    color: "#10B981",
    accentBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40",
    topBar: "bg-emerald-500",
    placeholder: "https://myportfolio.dev",
    description: "Safe SSRF-guarded site validation & meta tech extraction."
  }
};

export const PlatformCard = ({
  platformKey,
  connection,
  onConnect,
  onRefresh,
  onDisconnect,
  isProcessing = false
}) => {
  const cfg = PLATFORM_CONFIG[platformKey] || {
    name: platformKey,
    icon: Globe,
    placeholder: "Username or URL",
    description: "External platform"
  };

  const Icon = cfg.icon;
  const isConnected = connection?.connectionStatus === "connected";
  const isError = connection?.connectionStatus === "error" || !!connection?.syncError;

  // Modal State for Connecting
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputVal, setInputVal] = useState(connection?.username || connection?.profileUrl || "");

  // Manual LeetCode Form Fields
  const [isManualLeetCode, setIsManualLeetCode] = useState(false);
  const [lcEasy, setLcEasy] = useState(connection?.importedData?.easy || 0);
  const [lcMedium, setLcMedium] = useState(connection?.importedData?.medium || 0);
  const [lcHard, setLcHard] = useState(connection?.importedData?.hard || 0);
  const [lcRating, setLcRating] = useState(connection?.importedData?.contestRating || "");

  // LinkedIn Headline Field
  const [linkedinHeadline, setLinkedinHeadline] = useState(connection?.summary?.headline || "");

  const handleOpenConnect = () => {
    setInputVal(connection?.username || connection?.profileUrl || "");
    setIsModalOpen(true);
  };

  const handleSubmitConnect = async (e) => {
    e.preventDefault();
    if (!inputVal) return;

    let payload = { username: inputVal, profileUrl: inputVal };

    if (platformKey === "leetcode" && isManualLeetCode) {
      payload = {
        ...payload,
        isManual: true,
        easy: Number(lcEasy) || 0,
        medium: Number(lcMedium) || 0,
        hard: Number(lcHard) || 0,
        contestRating: lcRating ? Number(lcRating) : undefined
      };
    } else if (platformKey === "linkedin") {
      payload = {
        ...payload,
        headline: linkedinHeadline
      };
    }

    await onConnect(platformKey, payload);
    setIsModalOpen(false);
  };

  const handleRefresh = async () => {
    if (!connection) return;
    await onRefresh(platformKey, {
      username: connection.username,
      profileUrl: connection.profileUrl,
      isManual: connection.retrievalMethod === "user_input"
    });
  };

  const handleDisconnect = async () => {
    if (confirm(`Disconnect ${cfg.name} and remove imported data?`)) {
      await onDisconnect(platformKey);
    }
  };

  const getProfileHref = () => {
    if (!connection) return null;
    const rawUrl = connection.profileUrl || connection.username;
    if (!rawUrl) return null;
    if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
    if (platformKey === "github") return `https://github.com/${connection.username || rawUrl}`;
    if (platformKey === "leetcode") return `https://leetcode.com/u/${connection.username || rawUrl}`;
    if (platformKey === "codeforces") return `https://codeforces.com/profile/${connection.username || rawUrl}`;
    if (platformKey === "linkedin") return `https://linkedin.com/in/${connection.username || rawUrl}`;
    return `https://${rawUrl}`;
  };

  const formattedSyncDate = () => {
    if (!connection?.lastSyncedAt) return "Never";
    try {
      const d = new Date(connection.lastSyncedAt);
      return isNaN(d.getTime()) ? "Recently" : d.toLocaleString();
    } catch {
      return "Recently";
    }
  };

  // Status Badge
  const getBadge = () => {
    if (!isConnected || !connection) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F8FAFC] text-[#98A2B3] border border-[#E7EAF0]">
          Not Connected
        </span>
      );
    }
    if (connection.verificationStatus === "api_verified") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ECFDF3] text-[#12B76A] border border-[#A6F4C5] flex items-center gap-1">
          <CheckCircle2 className="w-2.5 h-2.5" /> API-Verified
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFFAEB] text-[#F79009] border border-[#FEDF89] flex items-center gap-1">
        <CheckCircle2 className="w-2.5 h-2.5" /> User-Confirmed
      </span>
    );
  };

  const profileHref = getProfileHref();

  return (
    <div className="relative p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg transition-all shadow-sm overflow-hidden group hover:-translate-y-1">
      {/* Top accent highlight */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${cfg.topBar}`} />

      {/* Top Bar: Icon, Name, Status */}
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl border ${cfg.accentBg} shadow-2xs`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#172033] dark:text-white font-display">{cfg.name}</h3>
            {isConnected && profileHref ? (
              <a
                href={profileHref}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#667085] dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 underline underline-offset-2"
              >
                <span>@{connection.username || "profile"}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            ) : (
              <p className="text-[11px] text-[#98A2B3] dark:text-slate-500">No profile connected</p>
            )}
          </div>
        </div>

        {getBadge()}
      </div>

      {/* Middle: Metrics / Summary */}
      <div className="space-y-1.5 min-h-[48px]">
        {isConnected && connection ? (
          <>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold font-mono text-[#172033]">
                {connection.summary?.primaryMetric || "Connected"}
              </span>
              <span className="text-[11px] text-[#667085]">
                {connection.summary?.secondaryMetric || ""}
              </span>
            </div>
            <p className="text-[11px] text-[#98A2B3] flex items-center justify-between">
              <span>Synced: {formattedSyncDate()}</span>
              {connection.retrievalMethod === "user_input" && (
                <span className="text-amber-500 font-mono text-[10px]">Manual Entry</span>
              )}
            </p>
          </>
        ) : (
          <p className="text-xs text-[#667085] leading-relaxed">{cfg.description}</p>
        )}

        {isError && (
          <div className="flex items-center gap-1.5 text-xs text-rose-500 pt-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{connection?.syncError || "Sync failed. Retry below."}</span>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="pt-3 border-t border-[#E7EAF0] flex items-center justify-between gap-2">
        {isConnected ? (
          <>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRefresh}
                isLoading={isProcessing}
                className="text-xs flex items-center gap-1.5"
                title="Fetch latest data from platform"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenConnect}
                className="text-xs"
              >
                Edit
              </Button>
            </div>

            <button
              onClick={handleDisconnect}
              className="p-1.5 text-[#98A2B3] hover:text-rose-500 rounded-lg hover:bg-[#FEF3F2] transition-colors cursor-pointer"
              title="Disconnect platform"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenConnect}
            className="w-full text-xs flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Connect {cfg.name}
          </Button>
        )}
      </div>

      {/* Connect / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${isConnected ? "Update" : "Connect"} ${cfg.name}`}
      >
        <form onSubmit={handleSubmitConnect} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1.5">
              {platformKey === "github" ? "GitHub Username or URL" : cfg.placeholder}
            </label>
            <input
              type="text"
              required
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={cfg.placeholder}
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#E7EAF0] focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 rounded-xl text-[#172033] placeholder-[#98A2B3] focus:outline-none transition-all"
            />
          </div>

          {platformKey === "leetcode" && (
            <div className="space-y-3 pt-2 border-t border-[#E7EAF0]">
              <label className="flex items-center gap-2 text-xs text-[#667085] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isManualLeetCode}
                  onChange={(e) => setIsManualLeetCode(e.target.checked)}
                  className="rounded border-[#D0D5DD] text-[#4F7CFF] focus:ring-0"
                />
                <span>API rate-limited? Input stats manually (User-Confirmed)</span>
              </label>

              {isManualLeetCode && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] text-[#667085] block mb-1">Easy Solved</label>
                    <input
                      type="number"
                      value={lcEasy}
                      onChange={(e) => setLcEasy(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E7EAF0] rounded-lg text-[#172033]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#667085] block mb-1">Medium Solved</label>
                    <input
                      type="number"
                      value={lcMedium}
                      onChange={(e) => setLcMedium(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E7EAF0] rounded-lg text-[#172033]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#667085] block mb-1">Hard Solved</label>
                    <input
                      type="number"
                      value={lcHard}
                      onChange={(e) => setLcHard(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E7EAF0] rounded-lg text-[#172033]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#667085] block mb-1">Contest Rating</label>
                    <input
                      type="number"
                      value={lcRating}
                      onChange={(e) => setLcRating(e.target.value)}
                      placeholder="e.g. 1850"
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E7EAF0] rounded-lg text-[#172033]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {platformKey === "linkedin" && (
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                Current Headline / Role
              </label>
              <input
                type="text"
                value={linkedinHeadline}
                onChange={(e) => setLinkedinHeadline(e.target.value)}
                placeholder="e.g. Computer Science Student at Stanford"
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#E7EAF0] rounded-xl text-[#172033] placeholder-[#98A2B3]"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isProcessing}>
              {isConnected ? "Update & Sync" : "Connect Platform"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PlatformCard;
