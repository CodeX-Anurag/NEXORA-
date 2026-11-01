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
    color: "#FAF7F2",
    placeholder: "username or https://github.com/username",
    description: "Official GitHub API: Imports public repositories, stars, languages & contributions."
  },
  leetcode: {
    name: "LeetCode",
    icon: Terminal,
    color: "#E0693B",
    placeholder: "username or https://leetcode.com/u/username",
    description: "Permitted GraphQL query with self-confirmed problem stats fallback."
  },
  codeforces: {
    name: "Codeforces",
    icon: Trophy,
    color: "#3B82F6",
    placeholder: "handle (e.g. tourist)",
    description: "Official Codeforces REST API: Imports rating, rank, and contest participation."
  },
  linkedin: {
    name: "LinkedIn",
    icon: Linkedin,
    color: "#0A66C2",
    placeholder: "https://linkedin.com/in/username",
    description: "User-controlled profile link & verified career headline registration."
  },
  portfolio: {
    name: "Portfolio Website",
    icon: Globe,
    color: "#2EA366",
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
        username: inputVal,
        profileUrl: inputVal,
        isManual: true,
        easy: Number(lcEasy) || 0,
        medium: Number(lcMedium) || 0,
        hard: Number(lcHard) || 0,
        contestRating: lcRating ? Number(lcRating) : null
      };
    } else if (platformKey === "linkedin") {
      payload = {
        profileUrl: inputVal,
        username: inputVal,
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
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#22201D] text-[#9C9384] border border-[#2D2925]">
          Not Connected
        </span>
      );
    }
    if (connection.verificationStatus === "api_verified") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#2EA366]/10 text-[#2EA366] border border-[#2EA366]/30 flex items-center gap-1">
          <CheckCircle2 className="w-2.5 h-2.5" /> API-Verified
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
        <CheckCircle2 className="w-2.5 h-2.5" /> User-Confirmed
      </span>
    );
  };

  const profileHref = getProfileHref();

  return (
    <div className="p-5 rounded-2xl bg-[#191816] border border-[#2D2925] flex flex-col justify-between space-y-4 hover:border-[#38332E] transition-all shadow-md">
      {/* Top Bar: Icon, Name, Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#141312] border border-[#2D2925] text-[#FAF7F2]">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#FAF7F2] font-display">{cfg.name}</h3>
            {isConnected && profileHref ? (
              <a
                href={profileHref}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#9C9384] hover:text-[#E0693B] flex items-center gap-1 underline underline-offset-2"
              >
                <span>@{connection.username || "profile"}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            ) : (
              <p className="text-[11px] text-[#787165]">No profile connected</p>
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
              <span className="text-sm font-bold font-mono text-[#FAF7F2]">
                {connection.summary?.primaryMetric || "Connected"}
              </span>
              {connection.summary?.secondaryMetric && (
                <span className="text-[11px] font-mono text-[#E0693B]">
                  {connection.summary.secondaryMetric}
                </span>
              )}
            </div>
            {connection.summary?.headline && (
              <p className="text-xs text-[#9C9384] line-clamp-1">{connection.summary.headline}</p>
            )}
            <p className="text-[10px] text-[#787165]">
              Last synced: {formattedSyncDate()}
            </p>
          </>
        ) : (
          <p className="text-xs text-[#9C9384] leading-relaxed">{cfg.description}</p>
        )}

        {isError && (
          <p className="text-[11px] text-rose-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" /> {connection?.syncError || "Sync failed. Try refreshing."}
          </p>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="pt-2 border-t border-[#22201D] flex items-center justify-between">
        {isConnected ? (
          <>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRefresh}
                isLoading={isProcessing}
                className="text-xs flex items-center gap-1 py-1"
                title="Sync latest data"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenConnect}
                className="text-xs text-[#9C9384] hover:text-[#FAF7F2] py-1"
              >
                Edit
              </Button>
            </div>

            <button
              type="button"
              onClick={handleDisconnect}
              className="text-[#787165] hover:text-rose-400 p-1.5 rounded-lg hover:bg-[#1E1C19] transition-colors"
              title="Disconnect platform"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenConnect}
            isLoading={isProcessing}
            className="w-full text-xs flex items-center justify-center gap-1.5 py-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Connect {cfg.name}
          </Button>
        )}
      </div>

      {/* Connect Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Connect ${cfg.name}`}>
        <form onSubmit={handleSubmitConnect} className="space-y-4 text-xs">
          <p className="text-[#9C9384] leading-relaxed">{cfg.description}</p>

          <div>
            <label className="block text-[11px] font-medium text-[#CDC5B6] mb-1">
              {platformKey === "portfolio" ? "Portfolio Website URL" : "Username or Profile URL"} *
            </label>
            <input
              type="text"
              required
              placeholder={cfg.placeholder}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full bg-[#141312] border border-[#2D2925] rounded-xl px-3 py-2 text-[#FAF7F2] focus:outline-none focus:border-[#E0693B]"
            />
          </div>

          {/* Special case: LeetCode Manual Toggle */}
          {platformKey === "leetcode" && (
            <div className="space-y-3 p-3.5 rounded-xl bg-[#141312] border border-[#2D2925]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#FAF7F2]">Self-Confirmed Statistics Mode</span>
                <input
                  type="checkbox"
                  id="lc-manual-toggle"
                  checked={isManualLeetCode}
                  onChange={(e) => setIsManualLeetCode(e.target.checked)}
                  className="rounded border-[#2D2925] text-[#E0693B] focus:ring-0"
                />
              </div>
              <p className="text-[11px] text-[#787165]">
                Enable if LeetCode GraphQL is blocked by Cloudflare or if your profile is private.
              </p>

              {isManualLeetCode && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] text-[#9C9384] mb-0.5">Easy</label>
                    <input
                      type="number"
                      min="0"
                      value={lcEasy}
                      onChange={(e) => setLcEasy(e.target.value)}
                      className="w-full bg-[#191816] border border-[#2D2925] rounded p-1.5 text-[#2EA366] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#9C9384] mb-0.5">Medium</label>
                    <input
                      type="number"
                      min="0"
                      value={lcMedium}
                      onChange={(e) => setLcMedium(e.target.value)}
                      className="w-full bg-[#191816] border border-[#2D2925] rounded p-1.5 text-[#E0693B] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#9C9384] mb-0.5">Hard</label>
                    <input
                      type="number"
                      min="0"
                      value={lcHard}
                      onChange={(e) => setLcHard(e.target.value)}
                      className="w-full bg-[#191816] border border-[#2D2925] rounded p-1.5 text-rose-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#9C9384] mb-0.5">Contest Rating</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 1750"
                      value={lcRating}
                      onChange={(e) => setLcRating(e.target.value)}
                      className="w-full bg-[#191816] border border-[#2D2925] rounded p-1.5 text-[#FAF7F2] font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Special case: LinkedIn Headline */}
          {platformKey === "linkedin" && (
            <div>
              <label className="block text-[11px] font-medium text-[#CDC5B6] mb-1">
                Professional Headline (e.g. Software Engineer at Tech Corp)
              </label>
              <input
                type="text"
                placeholder="Software Engineer | Full Stack | Open Source"
                value={linkedinHeadline}
                onChange={(e) => setLinkedinHeadline(e.target.value)}
                className="w-full bg-[#141312] border border-[#2D2925] rounded-xl px-3 py-2 text-[#FAF7F2] focus:outline-none focus:border-[#E0693B]"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#22201D]">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isProcessing}>
              Connect & Verify
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PlatformCard;
