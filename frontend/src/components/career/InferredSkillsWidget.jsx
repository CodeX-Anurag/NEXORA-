import React from "react";
import { Sparkles, Plus, Check } from "lucide-react";

export const InferredSkillsWidget = ({
  platforms = [],
  userSkills = [],
  onAddSkill
}) => {
  // Aggregate languages and tech from GitHub and LeetCode
  const inferredMap = new Map();

  const safePlatforms = Array.isArray(platforms) ? platforms : [];
  const github = safePlatforms.find((p) => p && p.platform === "github" && p.connectionStatus === "connected");

  if (github?.importedData?.topLanguages && Array.isArray(github.importedData.topLanguages)) {
    github.importedData.topLanguages.forEach((lang) => {
      if (typeof lang === "string" && lang.trim()) {
        const cleanLang = lang.trim();
        inferredMap.set(cleanLang, { source: "GitHub Repositories", name: cleanLang });
      }
    });
  }

  if (github?.importedData?.repos && Array.isArray(github.importedData.repos)) {
    github.importedData.repos.forEach((r) => {
      if (r && Array.isArray(r.techStack)) {
        r.techStack.forEach((t) => {
          if (typeof t === "string" && t.trim() && !inferredMap.has(t.trim())) {
            const cleanT = t.trim();
            inferredMap.set(cleanT, { source: "GitHub Tech Stack", name: cleanT });
          }
        });
      }
    });
  }

  const existingSkillNames = new Set(
    (Array.isArray(userSkills) ? userSkills : [])
      .map((s) => (typeof s === "string" ? s : s?.skillName || s?.name || ""))
      .filter(Boolean)
      .map((n) => String(n).toLowerCase())
  );
  const inferredList = Array.from(inferredMap.values());

  if (inferredList.length === 0) return null;

  return (
    <div className="p-6 rounded-2xl bg-white border border-[#E7EAF0] space-y-4 shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#4F7CFF] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-base text-[#172033] font-display">
            Inferred Technical Competencies
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5F3FF] text-[#7C6CFA] border border-[#7C6CFA]/20">
            AI-Inferred Suggestions
          </span>
        </div>
        <p className="text-[11px] text-[#667085]">
          Never automatically published to resumes without your explicit confirmation.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {inferredList.map((item) => {
          const isAdded = item?.name ? existingSkillNames.has(String(item.name).toLowerCase()) : false;

          return (
            <div
              key={item.name}
              className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E7EAF0] flex items-center gap-2 text-xs shadow-xs"
            >
              <span className="font-semibold text-[#172033]">{item.name}</span>
              <span className="text-[10px] text-[#98A2B3]">({item.source})</span>

              {isAdded ? (
                <span className="text-[10px] text-[#12B76A] font-semibold flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Confirmed
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onAddSkill(item.name)}
                  className="text-[10px] text-[#4F7CFF] hover:text-[#3E6AE1] font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
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
