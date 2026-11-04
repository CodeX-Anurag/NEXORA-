import React, { useState, useEffect } from "react";
import {
  FolderGit2,
  Star,
  GitFork,
  ExternalLink,
  Save,
  Check,
  Edit2,
  Sparkles
} from "lucide-react";
import Button from "../common/Button";

export const GitHubProjectSelector = ({
  githubConnection,
  onSaveSelected,
  onSyncToResume,
  isSaving = false,
  isSyncing = false
}) => {
  const allRepos = Array.isArray(githubConnection?.importedData?.repos)
    ? githubConnection.importedData.repos
    : [];
  const initialSelected = Array.isArray(githubConnection?.selectedItems)
    ? githubConnection.selectedItems
    : [];

  // Map initial selected items by ID
  const [selectedMap, setSelectedMap] = useState(() => {
    const map = {};
    initialSelected.forEach((item) => {
      const id = String(item.id || item._id || item.name || "");
      if (id) {
        map[id] = { ...item };
      }
    });
    return map;
  });

  // Sync selectedMap when githubConnection changes
  useEffect(() => {
    const freshSelected = Array.isArray(githubConnection?.selectedItems)
      ? githubConnection.selectedItems
      : [];
    const map = {};
    freshSelected.forEach((item) => {
      const id = String(item.id || item._id || item.name || "");
      if (id) {
        map[id] = { ...item };
      }
    });
    setSelectedMap(map);
  }, [githubConnection?.selectedItems]);

  const [expandedId, setExpandedId] = useState(null);
  const [saveBanner, setSaveBanner] = useState("");

  if (!githubConnection || githubConnection.connectionStatus !== "connected") {
    return null;
  }

  const toggleSelectRepo = (repo, idx) => {
    if (!repo) return;
    const repoId = String(repo.id || repo._id || repo.name || `repo-${idx}`);

    setSelectedMap((prev) => {
      const next = { ...prev };
      if (next[repoId]) {
        delete next[repoId];
      } else {
        const rawTech = Array.isArray(repo.techStack) ? repo.techStack : [repo.language];
        const techStack = rawTech.filter((t) => typeof t === "string" && t.trim()).map((t) => t.trim());
        const stars = Number(repo.stars) || 0;
        const forks = Number(repo.forks) || 0;

        next[repoId] = {
          id: repoId,
          title: repo.title || repo.name || "Untitled Project",
          description: repo.description || "",
          techStack,
          url: repo.url || repo.html_url || "",
          stars,
          forks,
          bulletPoints: [
            `Engineered software project with ${stars} stars and ${forks} forks.`,
            `Implemented core functionality utilizing ${techStack.length > 0 ? techStack.join(", ") : "modern software engineering practices"}.`
          ],
          selectedForResume: true
        };
      }
      return next;
    });
  };

  const updateItemField = (id, field, value) => {
    const key = String(id);
    setSelectedMap((prev) => {
      if (!prev[key]) return prev;
      return {
        ...prev,
        [key]: {
          ...prev[key],
          [field]: value
        }
      };
    });
  };

  const handleSave = async () => {
    const items = Object.values(selectedMap);
    await onSaveSelected("github", items);
    setSaveBanner("Selected GitHub projects updated!");
    setTimeout(() => setSaveBanner(""), 3000);
  };

  const selectedCount = Object.keys(selectedMap).length;

  return (
    <div className="p-6 rounded-2xl bg-white border border-[#E7EAF0] space-y-5 shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7EAF0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#4F7CFF] flex items-center justify-center">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#172033] font-display">
              GitHub Repositories for Resume & Portfolio
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#EEF2FF] text-[#4F7CFF] border border-[#4F7CFF]/20">
              {selectedCount} Selected
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-1">
            Select verified repositories to showcase on your ATS resume and NEXORA portfolio. You can customize descriptions and achievements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            className="text-xs flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" /> Save Selection
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onSyncToResume}
            isLoading={isSyncing}
            className="text-xs flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Sync to Resume Profile
          </Button>
        </div>
      </div>

      {saveBanner && (
        <div className="p-3 rounded-xl bg-[#ECFDF3] border border-[#A6F4C5] text-[#027A48] text-xs flex items-center gap-2">
          <Check className="w-4 h-4" /> {saveBanner}
        </div>
      )}

      {/* Repositories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allRepos.map((repo, idx) => {
          const repoId = String(repo.id || repo._id || repo.name || `repo-${idx}`);
          const isSelected = !!selectedMap[repoId];
          const itemData = selectedMap[repoId] || repo;
          const isExpanded = expandedId === repoId;
          const safeUrl = repo.url && /^https?:\/\//i.test(repo.url)
            ? repo.url
            : repo.url
            ? `https://github.com/${repo.url.replace(/^\/+/, "")}`
            : "#";

          return (
            <div
              key={repoId}
              className={`p-4 rounded-xl border transition-all ${
                isSelected
                  ? "bg-[#EEF2FF]/30 border-[#4F7CFF]/40 shadow-xs"
                  : "bg-white border-[#E7EAF0] hover:border-[#D0D5DD]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id={`repo-chk-${repoId}`}
                    checked={isSelected}
                    onChange={() => toggleSelectRepo(repo, idx)}
                    className="w-4 h-4 rounded border-[#D0D5DD] text-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 cursor-pointer"
                  />
                  <div>
                    <label
                      htmlFor={`repo-chk-${repoId}`}
                      className="text-sm font-bold text-[#172033] font-display cursor-pointer hover:text-[#4F7CFF] transition-colors"
                    >
                      {itemData.title || repo.name || "Untitled Project"}
                    </label>
                    <div className="flex items-center gap-3 text-[11px] text-[#667085] mt-0.5">
                      {repo.language && (
                        <span className="font-mono text-[#4F7CFF] font-semibold">{repo.language}</span>
                      )}
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-amber-500" /> {Number(repo.stars) || 0}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <GitFork className="w-3 h-3 text-[#98A2B3]" /> {Number(repo.forks) || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {safeUrl !== "#" && (
                    <a
                      href={safeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 text-[#98A2B3] hover:text-[#172033] transition-colors"
                      title="View on GitHub"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {isSelected && (
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : repoId)}
                      className="p-1 text-[#98A2B3] hover:text-[#4F7CFF] transition-colors cursor-pointer"
                      title="Edit project details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Description preview */}
              <p className="text-xs text-[#667085] mt-2 line-clamp-2 leading-relaxed">
                {itemData.description || "No description provided."}
              </p>

              {/* Expanded Inline Editor */}
              {isSelected && isExpanded && (
                <div className="mt-3 pt-3 border-t border-[#E7EAF0] space-y-2.5 text-xs animate-fade-in">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#667085] mb-1">
                      Display Title
                    </label>
                    <input
                      type="text"
                      value={itemData.title || ""}
                      onChange={(e) => updateItemField(repoId, "title", e.target.value)}
                      className="w-full bg-white border border-[#E7EAF0] rounded-lg p-2 text-[#172033]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#667085] mb-1">
                      Tech Stack (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(itemData.techStack) ? itemData.techStack.join(", ") : ""}
                      onChange={(e) =>
                        updateItemField(
                          repoId,
                          "techStack",
                          e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                        )
                      }
                      className="w-full bg-white border border-[#E7EAF0] rounded-lg p-2 text-[#172033]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#667085] mb-1">
                      Resume Bullet Points (1 per line)
                    </label>
                    <textarea
                      rows={2}
                      value={Array.isArray(itemData.bulletPoints) ? itemData.bulletPoints.join("\n") : ""}
                      onChange={(e) =>
                        updateItemField(repoId, "bulletPoints", e.target.value.split("\n"))
                      }
                      className="w-full bg-white border border-[#E7EAF0] rounded-lg p-2 text-[#172033] font-mono text-[11px]"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GitHubProjectSelector;
