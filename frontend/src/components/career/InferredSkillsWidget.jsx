import React from "react";
import { Sparkles, Plus, Check } from "lucide-react";

export const InferredSkillsWidget = ({
  platforms = [],
  userSkills = [],
  onAddSkill
}) => {
  // Aggregate languages and tech from GitHub and LeetCode
  const inferredMap = new Map();

  const github = platforms.find((p) => p.platform === "github" && p.connectionStatus === "connected");
  if (github?.importedData?.topLanguages) {
    github.importedData.topLanguages.forEach((lang) => {
      inferredMap.set(lang, { source: "GitHub Repositories", name: lang });
    });
  }

  if (github?.importedData?.repos) {
    github.importedData.repos.forEach((r) => {
      if (Array.isArray(r.techStack)) {
        r.techStack.forEach((t) => {
          if (!inferredMap.has(t)) {
            inferredMap.set(t, { source: "GitHub Tech Stack", name: t });
          }
        });
      }
    });
  }

  const existingSkillNames = new Set(userSkills.map((s) => s.skillName.toLowerCase()));
  const inferredList = Array.from(inferredMap.values());

  if (inferredList.length === 0) return null;

  return (
    <div className="p-6 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#E0693B]" />
          <h3 className="font-bold text-base text-[#FAF7F2] font-display">
            Inferred Technical Competencies
          </h3>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            AI-Inferred Suggestions
          </span>
        </div>
        <p className="text-[11px] text-[#787165]">
          Never automatically published to resumes without your explicit confirmation.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {inferredList.map((item) => {
          const isAdded = existingSkillNames.has(item.name.toLowerCase());

          return (
            <div
              key={item.name}
              className="px-3 py-1.5 rounded-xl bg-[#141312] border border-[#2D2925] flex items-center gap-2 text-xs"
            >
              <span className="font-medium text-[#FAF7F2]">{item.name}</span>
              <span className="text-[10px] text-[#787165]">({item.source})</span>

              {isAdded ? (
                <span className="text-[10px] text-[#2EA366] font-semibold flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Confirmed
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onAddSkill(item.name)}
                  className="text-[10px] text-[#E0693B] hover:text-[#EB784B] font-semibold flex items-center gap-0.5 hover:underline"
                >
                  <Plus className="w-3 h-3" /> Add to Profile
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InferredSkillsWidget;
