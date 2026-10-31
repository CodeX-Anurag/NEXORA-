import React, { useState } from "react";
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
  const allRepos = githubConnection?.importedData?.repos || [];
  const initialSelected = githubConnection?.selectedItems || [];

  // Map initial selected items by ID
  const [selectedMap, setSelectedMap] = useState(() => {
    const map = {};
    initialSelected.forEach((item) => {
      map[item.id] = { ...item };
    });
    return map;
  });

  const [expandedId, setExpandedId] = useState(null);
  const [saveBanner, setSaveBanner] = useState("");

  if (!githubConnection || githubConnection.connectionStatus !== "connected") {
    return null;
  }

  const toggleSelectRepo = (repo) => {
    setSelectedMap((prev) => {
      const next = { ...prev };
      if (next[repo.id]) {
        delete next[repo.id];
      } else {
        next[repo.id] = {
          id: repo.id,
          title: repo.title || repo.name,
          description: repo.description || "",
          techStack: repo.techStack || [repo.language].filter(Boolean),
          url: repo.url,
          stars: repo.stars || 0,
          forks: repo.forks || 0,
          bulletPoints: [
            `Engineered open-source software project with ${repo.stars} stars and ${repo.forks} forks.`,
            `Implemented core functionality utilizing ${(repo.techStack || [repo.language]).join(", ")}.`
          ],
          selectedForResume: true
        };
      }
      return next;
    });
  };

  const updateItemField = (id, field, value) => {
    setSelectedMap((prev) => {
      if (!prev[id]) return prev;
      return {
        ...prev,
        [id]: {
          ...prev[id],
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
    <div className="p-6 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2D2925] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-[#E0693B]" />
            <h3 className="text-base font-bold text-[#FAF7F2] font-display">
              GitHub Repositories for Resume & Portfolio
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E0693B]/10 text-[#E0693B] border border-[#E0693B]/25">
              {selectedCount} Selected
            </span>
          </div>
          <p className="text-xs text-[#9C9384] mt-1">
            Select verified repositories to showcase on your ATS resume and NEXORA portfolio. You can customize descriptions and achievements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            className="text-xs flex items-center gap-1"
          >
            <Save className="w-3.5 h-3.5" /> Save Selection
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onSyncToResume}
            isLoading={isSyncing}
            className="text-xs flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" /> Sync to Resume Profile
          </Button>
        </div>
      </div>

      {saveBanner && (
        <div className="p-3 rounded-xl bg-[#2EA366]/10 border border-[#2EA366]/20 text-[#2EA366] text-xs flex items-center gap-2">
          <Check className="w-4 h-4" /> {saveBanner}
        </div>
      )}

      {/* Repositories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allRepos.map((repo) => {
          const isSelected = !!selectedMap[repo.id];
          const itemData = selectedMap[repo.id] || repo;
          const isExpanded = expandedId === repo.id;

          return (
            <div
              key={repo.id}
              className={`p-4 rounded-xl border transition-all ${
                isSelected
                  ? "bg-[#1C1A17] border-[#E0693B]/40 shadow-sm"
                  : "bg-[#141312] border-[#2D2925] opacity-75 hover:opacity-100"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id={`repo-chk-${repo.id}`}
                    checked={isSelected}
                    onChange={() => toggleSelectRepo(repo)}
                    className="w-4 h-4 rounded border-[#2D2925] text-[#E0693B] focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <label
                      htmlFor={`repo-chk-${repo.id}`}
                      className="text-sm font-bold text-[#FAF7F2] font-display cursor-pointer hover:text-[#E0693B]"
                    >
                      {itemData.title || repo.name}
                    </label>
                    <div className="flex items-center gap-3 text-[11px] text-[#9C9384] mt-0.5">
                      {repo.language && (
                        <span className="font-mono text-[#E0693B] font-medium">{repo.language}</span>
                      )}
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-amber-400" /> {repo.stars}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <GitFork className="w-3 h-3 text-[#9C9384]" /> {repo.forks}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-[#787165] hover:text-[#FAF7F2]"
                    title="View on GitHub"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  {isSelected && (
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : repo.id)}
                      className="p-1 text-[#787165] hover:text-[#E0693B]"
                      title="Edit project details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Description preview */}
              <p className="text-xs text-[#9C9384] mt-2 line-clamp-2 leading-relaxed">
                {itemData.description || "No description provided."}
              </p>

              {/* Expanded Inline Editor (When Selected & Expanded) */}
              {isSelected && isExpanded && (
                <div className="mt-3 pt-3 border-t border-[#2D2925] space-y-2.5 text-xs animate-fade-in">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#787165] mb-1">
                      Display Title
                    </label>
                    <input
                      type="text"
                      value={itemData.title || ""}
                      onChange={(e) => updateItemField(repo.id, "title", e.target.value)}
                      className="w-full bg-[#141312] border border-[#2D2925] rounded p-1.5 text-[#FAF7F2]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#787165] mb-1">
                      Tech Stack (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(itemData.techStack) ? itemData.techStack.join(", ") : ""}
                      onChange={(e) =>
                        updateItemField(
                          repo.id,
                          "techStack",
                          e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                        )
                      }
                      className="w-full bg-[#141312] border border-[#2D2925] rounded p-1.5 text-[#FAF7F2]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#787165] mb-1">
                      Resume Bullet Points (1 per line)
                    </label>
                    <textarea
                      rows={2}
                      value={Array.isArray(itemData.bulletPoints) ? itemData.bulletPoints.join("\n") : ""}
                      onChange={(e) =>
                        updateItemField(repo.id, "bulletPoints", e.target.value.split("\n"))
                      }
                      className="w-full bg-[#141312] border border-[#2D2925] rounded p-1.5 text-[#FAF7F2] font-mono text-[11px]"
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
