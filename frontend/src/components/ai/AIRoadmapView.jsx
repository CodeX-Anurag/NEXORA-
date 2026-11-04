import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Check, Plus, CheckCircle2, ListPlus, MapPin } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import aiService from "../../services/ai.service";
import taskService from "../../services/task.service";
import Button from "../common/Button";
import Loader from "../common/Loader";
import Badge from "../common/Badge";

export const AIRoadmapView = ({ initialRole = "Full Stack Developer" }) => {
  const { accessToken } = useAuth();
  const [targetRole, setTargetRole] = useState(initialRole);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionFilter, setActionFilter] = useState("all"); // "all" | "pending" | "added"
  const [isConvertingStage, setIsConvertingStage] = useState(null);

  // Substep 12B Task Conversion & Progress State
  const [convertedKeys, setConvertedKeys] = useState(new Set());
  const [convertedTasksMap, setConvertedTasksMap] = useState({}); // key -> task object
  const [convertingKey, setConvertingKey] = useState(null);

  const fetchUserTasks = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await taskService.getTasks(accessToken, { limit: 100 });
      if (data && data.tasks) {
        const keysSet = new Set();
        const tasksObj = {};
        data.tasks.forEach((t) => {
          if (t.deduplicationKey) {
            keysSet.add(t.deduplicationKey);
            tasksObj[t.deduplicationKey] = t;
          }
        });
        setConvertedKeys(keysSet);
        setConvertedTasksMap(tasksObj);
      }
    } catch {
      // Swallowed safely
    }
  }, [accessToken]);

  useEffect(() => {
    fetchUserTasks();
  }, [fetchUserTasks]);

  const handleGenerateRoadmap = async () => {
    if (!accessToken || loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await aiService.generateCareerRoadmap(accessToken, targetRole);
      setRoadmap(res.roadmap);
      fetchUserTasks();
    } catch (err) {
      setError(err.message || "Failed to generate AI career roadmap.");
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToTask = async (stage, stageIdx, actionText, actionIdx) => {
    if (!accessToken || !roadmap) return;
    const deduplicationKey = `roadmap_${roadmap.career}_${stage.title}_${actionIdx}`;
    setConvertingKey(deduplicationKey);

    try {
      const res = await taskService.createTask(accessToken, {
        title: actionText,
        description: `Roadmap Action for ${stage.title} (${roadmap.career}). Focus Skills: ${stage.skills?.join(", ") || "General"}`,
        priority: stageIdx === 0 ? "high" : "medium",
        source: "ai_roadmap",
        roadmapRole: roadmap.career,
        roadmapStage: stage.title,
        deduplicationKey
      });

      if (res && res.task) {
        setConvertedKeys((prev) => new Set([...prev, deduplicationKey]));
        setConvertedTasksMap((prev) => ({
          ...prev,
          [deduplicationKey]: res.task
        }));
      }
    } catch (err) {
      setError(err.message || "Failed to convert action to Task.");
    } finally {
      setConvertingKey(null);
    }
  };

  const handleConvertAllStageActions = async (stage, stageIdx) => {
    if (!accessToken || !roadmap || !stage.actions) return;
    setIsConvertingStage(stageIdx);

    try {
      const promises = stage.actions.map((actionText, aIdx) => {
        const deduplicationKey = `roadmap_${roadmap.career}_${stage.title}_${aIdx}`;
        if (convertedKeys.has(deduplicationKey)) return Promise.resolve(null);

        return taskService.createTask(accessToken, {
          title: actionText,
          description: `Roadmap Action for ${stage.title} (${roadmap.career}). Focus Skills: ${stage.skills?.join(", ") || "General"}`,
          priority: stageIdx === 0 ? "high" : "medium",
          source: "ai_roadmap",
          roadmapRole: roadmap.career,
          roadmapStage: stage.title,
          deduplicationKey
        }).then((res) => ({ key: deduplicationKey, task: res.task }));
      });

      const results = await Promise.all(promises);
      const newKeys = new Set(convertedKeys);
      const newMap = { ...convertedTasksMap };

      results.forEach((r) => {
        if (r && r.key) {
          newKeys.add(r.key);
          newMap[r.key] = r.task;
        }
      });

      setConvertedKeys(newKeys);
      setConvertedTasksMap(newMap);
    } catch (err) {
      setError(err.message || "Failed to batch convert stage actions.");
    } finally {
      setIsConvertingStage(null);
    }
  };

  const overallStats = useMemo(() => {
    if (!roadmap || !roadmap.stages) return { total: 0, completed: 0, added: 0, percent: 0 };
    let total = 0;
    let completed = 0;
    let added = 0;

    roadmap.stages.forEach((stage) => {
      (stage.actions || []).forEach((_, aIdx) => {
        total += 1;
        const key = `roadmap_${roadmap.career}_${stage.title}_${aIdx}`;
        if (convertedKeys.has(key)) {
          added += 1;
          const t = convertedTasksMap[key];
          if (t && t.status === "completed") {
            completed += 1;
          }
        }
      });
    });

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, added, percent };
  }, [roadmap, convertedKeys, convertedTasksMap]);

  return (
    <div className="bg-white border border-[#E7EAF0] rounded-2xl p-6 space-y-6 shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4F7CFF] font-sans flex items-center gap-1">
              <MapPin size={12} /> Actionable Milestones
            </span>
            <Badge variant="primary" size="xs">
              Direct Task Integration
            </Badge>
          </div>
          <h2 className="text-xl font-bold text-[#172033] font-display">
            Structured AI Career Roadmap
          </h2>
          <p className="text-xs sm:text-sm text-[#667085]">
            Multi-stage milestone roadmap. Convert actions directly into trackable NEXORA Tasks.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="Target Career Role"
            className="rounded-xl bg-white border border-[#E7EAF0] px-3.5 py-2 text-xs text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 flex-1 sm:w-48 transition-all shadow-xs"
          />
          <Button size="sm" onClick={handleGenerateRoadmap} isLoading={loading}>
            Generate Roadmap
          </Button>
        </div>
      </div>

      {error && <p className="text-xs text-rose-500">{error}</p>}

      {loading ? (
        <Loader text="Synthesizing multi-stage career roadmap..." />
      ) : !roadmap ? (
        <div className="text-center py-10 bg-[#F8FAFC] rounded-xl border border-[#E7EAF0]">
          <p className="text-sm font-semibold text-[#172033]">No roadmap generated yet.</p>
          <p className="text-xs text-[#667085] mt-1">
            Click <strong className="text-[#4F7CFF]">Generate Roadmap</strong> to synthesize a structured stage-by-stage guide.
          </p>
        </div>
      ) : (
        <div className="space-y-6 pt-2">
          {/* Milestone Overview Banner */}
          <div className="p-4 bg-[#F8FAFC] border border-[#E7EAF0] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#4F7CFF] font-bold uppercase tracking-wider">
                  Target Role: {roadmap.career}
                </span>
                <span className="text-xs text-[#98A2B3]">•</span>
                <span className="text-xs text-[#667085] font-mono">{roadmap.stages?.length || 0} Stages</span>
              </div>
              <p className="text-xs text-[#667085]">
                {overallStats.completed} of {overallStats.total} milestone actions completed ({overallStats.added} added to Tasks)
              </p>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              {/* Progress meter */}
              <div className="flex items-center gap-2.5">
                <div className="w-24 sm:w-32 h-2 rounded-full bg-[#E7EAF0] overflow-hidden">
                  <div
                    className="h-full bg-[#12B76A] transition-all duration-300"
                    style={{ width: `${overallStats.percent}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-[#12B76A]">{overallStats.percent}%</span>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E7EAF0]">
                {["all", "pending", "added"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setActionFilter(f)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                      actionFilter === f
                        ? "bg-[#EEF2FF] text-[#4F7CFF]"
                        : "text-[#667085] hover:text-[#172033]"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stages List */}
          <div className="space-y-4">
            {roadmap.stages?.map((stage, sIdx) => {
              const allAdded = stage.actions?.every((_, aIdx) =>
                convertedKeys.has(`roadmap_${roadmap.career}_${stage.title}_${aIdx}`)
              );

              return (
                <div
                  key={sIdx}
                  className="p-5 rounded-xl bg-white border border-[#E7EAF0] space-y-3.5 shadow-xs hover:border-[#D0D5DD] transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E7EAF0]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4F7CFF] text-xs font-bold font-mono flex items-center justify-center shrink-0">
                        {sIdx + 1}
                      </span>
                      <h4 className="font-bold text-sm text-[#172033] font-display">{stage.title}</h4>
                      {stage.duration && (
                        <span className="text-[11px] font-mono text-[#667085] px-2 py-0.5 rounded-full bg-[#F8FAFC] border border-[#E7EAF0]">
                          {stage.duration}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {stage.skills && stage.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {stage.skills.map((sk, kIdx) => (
                            <span
                              key={kIdx}
                              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F8FAFC] text-[#667085] border border-[#E7EAF0]"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}

                      {!allAdded && (
                        <button
                          type="button"
                          onClick={() => handleConvertAllStageActions(stage, sIdx)}
                          disabled={isConvertingStage === sIdx}
                          className="text-[11px] font-semibold text-[#4F7CFF] hover:text-[#3E6AE1] px-2 py-1 rounded hover:bg-[#EEF2FF] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <ListPlus size={13} />
                          <span>Add All</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions list */}
                  <ul className="space-y-2">
                    {stage.actions?.map((act, aIdx) => {
                      const deduplicationKey = `roadmap_${roadmap.career}_${stage.title}_${aIdx}`;
                      const isAdded = convertedKeys.has(deduplicationKey);
                      const isConverting = convertingKey === deduplicationKey;
                      const taskObj = convertedTasksMap[deduplicationKey];
                      const isCompleted = taskObj && taskObj.status === "completed";

                      if (actionFilter === "pending" && isAdded) return null;
                      if (actionFilter === "added" && !isAdded) return null;

                      return (
                        <li
                          key={aIdx}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                            isCompleted
                              ? "bg-[#ECFDF3]/40 border-[#A6F4C5] text-[#027A48]"
                              : isAdded
                              ? "bg-[#F8FAFC] border-[#E7EAF0] text-[#172033]"
                              : "bg-white border-[#E7EAF0] text-[#172033] hover:border-[#D0D5DD]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4F7CFF] shrink-0" />
                            <span className={`truncate ${isCompleted ? "line-through text-[#667085]" : ""}`}>
                              {act}
                            </span>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {isCompleted ? (
                              <span className="text-[10px] font-semibold text-[#12B76A] flex items-center gap-1">
                                <CheckCircle2 size={13} /> Completed
                              </span>
                            ) : isAdded ? (
                              <span className="text-[10px] font-semibold text-[#4F7CFF] flex items-center gap-1">
                                <Check size={13} /> In Tasks
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleConvertToTask(stage, sIdx, act, aIdx)}
                                isLoading={isConverting}
                                className="text-[10px] py-1 px-2.5 flex items-center gap-1"
                              >
                                <Plus size={11} /> Convert to Task
                              </Button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRoadmapView;
