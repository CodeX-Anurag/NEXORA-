import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Check, Plus, CheckCircle2, ListPlus } from "lucide-react";
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
        setConvertedTasksMap((prev) => ({ ...prev, [deduplicationKey]: res.task }));
      }
    } catch (err) {
      setError(err.message || "Failed to convert roadmap action to task.");
    } finally {
      setConvertingKey(null);
    }
  };

  const handleConvertAllInStage = async (stage, stageIdx) => {
    if (!accessToken || !roadmap || isConvertingStage !== null) return;
    setIsConvertingStage(stageIdx);
    setError("");

    try {
      for (let aIdx = 0; aIdx < (stage.actions || []).length; aIdx++) {
        const actionText = stage.actions[aIdx];
        const dedupKey = `roadmap_${roadmap.career}_${stage.title}_${aIdx}`;
        if (convertedKeys.has(dedupKey)) continue;

        const res = await taskService.createTask(accessToken, {
          title: actionText,
          description: `Roadmap Action for ${stage.title} (${roadmap.career}). Focus Skills: ${stage.skills?.join(", ") || "General"}`,
          priority: stageIdx === 0 ? "high" : "medium",
          source: "ai_roadmap",
          roadmapRole: roadmap.career,
          roadmapStage: stage.title,
          deduplicationKey: dedupKey
        });

        if (res?.task) {
          setConvertedKeys((prev) => new Set([...prev, dedupKey]));
          setConvertedTasksMap((prev) => ({ ...prev, [dedupKey]: res.task }));
        }
      }
    } catch (err) {
      setError(err.message || "Failed to convert some stage actions.");
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
    <div className="bg-[#191816] border border-[#2D2925] rounded-2xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E0693B] font-display">
              Actionable Milestones
            </span>
            <Badge variant="primary" size="xs">
              Direct Task Integration
            </Badge>
          </div>
          <h2 className="text-xl font-bold text-[#FAF7F2] font-display">
            Structured AI Career Roadmap
          </h2>
          <p className="text-sm text-[#9C9384]">
            Multi-stage milestone roadmap. Convert actions directly into trackable NEXORA Tasks.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="Target Career Role"
            className="rounded-xl bg-[#141312] border border-[#332F2A] px-3.5 py-2 text-xs text-[#FAF7F2] placeholder-[#787165] focus:outline-none focus:border-[#E0693B] focus:ring-1 focus:ring-[#E0693B] flex-1 sm:w-48 transition-all"
          />
          <Button size="sm" onClick={handleGenerateRoadmap} isLoading={loading}>
            Generate Roadmap
          </Button>
        </div>
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      {loading ? (
        <Loader text="Synthesizing multi-stage career roadmap..." />
      ) : !roadmap ? (
        <div className="text-center py-10 bg-[#141312] rounded-xl border border-[#262420]">
          <p className="text-sm text-[#CDC5B6]">No roadmap generated yet.</p>
          <p className="text-xs text-[#877E71] mt-1">
            Click <strong className="text-[#E0693B]">Generate Roadmap</strong> to synthesize a structured stage-by-stage guide.
          </p>
        </div>
      ) : (
        <div className="space-y-6 pt-2">
          {/* Milestone Overview Banner */}
          <div className="p-4 bg-[#141312] border border-[#2D2925] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#E0693B] font-bold uppercase tracking-wider">
                  Target Role: {roadmap.career}
                </span>
                <span className="text-xs text-[#787165]">•</span>
                <span className="text-xs text-[#9C9384] font-mono">{roadmap.stages?.length || 0} Stages</span>
              </div>
              <p className="text-xs text-[#787165]">
                {overallStats.completed} of {overallStats.total} milestone actions completed ({overallStats.added} added to Tasks)
              </p>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              {/* Progress meter */}
              <div className="flex items-center gap-2.5">
                <div className="w-24 sm:w-32 h-2 rounded-full bg-[#22201D] overflow-hidden">
                  <div
                    className="h-full bg-[#2EA366] transition-all duration-300"
                    style={{ width: `${overallStats.percent}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-[#2EA366]">{overallStats.percent}%</span>
              </div>

              {/* Action Filter */}
              <div className="flex items-center gap-1 bg-[#191816] p-1 rounded-lg border border-[#2D2925]">
                {[
                  { id: "all", label: "All" },
                  { id: "pending", label: "To Add" },
                  { id: "added", label: "In Tasks" }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActionFilter(f.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      actionFilter === f.id
                        ? "bg-[#25221F] text-[#FAF7F2] border border-[#38332E]"
                        : "text-[#787165] hover:text-[#CDC5B6]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roadmap.stages?.map((stage, idx) => {
              // Calculate Substep 12B Milestone Completion Progress
              const totalActions = stage.actions?.length || 0;
              let completedActions = 0;
              let stageAddedCount = 0;

              stage.actions?.forEach((_, aIdx) => {
                const key = `roadmap_${roadmap.career}_${stage.title}_${aIdx}`;
                const t = convertedTasksMap[key];
                if (convertedKeys.has(key)) {
                  stageAddedCount += 1;
                }
                if (t && t.status === "completed") {
                  completedActions += 1;
                }
              });

              const stageProgress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
              const allAdded = stageAddedCount === totalActions && totalActions > 0;

              // Filter actions per view mode
              const visibleActions = (stage.actions || []).filter((_, aIdx) => {
                const key = `roadmap_${roadmap.career}_${stage.title}_${aIdx}`;
                const isConverted = convertedKeys.has(key);
                if (actionFilter === "pending") return !isConverted;
                if (actionFilter === "added") return isConverted;
                return true;
              });

              return (
                <div
                  key={idx}
                  className="bg-[#141312] border border-[#2D2925] rounded-xl p-5 space-y-4 relative flex flex-col justify-between hover:border-[#3D3832] transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#262420] pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold font-mono text-[#E0693B]">STAGE {idx + 1}</span>
                        <Badge
                          variant={stageProgress === 100 ? "success" : stageProgress > 0 ? "warning" : "muted"}
                          size="xs"
                        >
                          {stageProgress === 100 ? "Completed" : stageProgress > 0 ? "In Progress" : "Up Next"}
                        </Badge>
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-[#2EA366]">{stageProgress}% Done</span>
                    </div>

                    {/* Milestone Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-[#22201D] overflow-hidden">
                      <div className="h-full bg-[#2EA366] transition-all duration-300" style={{ width: `${stageProgress}%` }} />
                    </div>

                    <h3 className="text-base font-bold text-[#FAF7F2] font-display">{stage.title}</h3>

                    {/* Skills tags */}
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#9C9384] font-bold block mb-1.5">
                        Focus Skills
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {stage.skills?.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#24221F] text-[#CDC5B6] border border-[#38332D]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Milestone Actions Header & Batch Add */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-[#9C9384] font-bold block">
                          Milestone Actions ({visibleActions.length})
                        </span>
                        {!allAdded && (
                          <button
                            onClick={() => handleConvertAllInStage(stage, idx)}
                            disabled={isConvertingStage === idx}
                            className="text-[10px] text-[#E0693B] hover:text-[#EB784B] font-semibold flex items-center gap-1 disabled:opacity-50"
                          >
                            <ListPlus className="w-3 h-3" />
                            <span>{isConvertingStage === idx ? "Adding All..." : "Add All"}</span>
                          </button>
                        )}
                      </div>

                      <ul className="space-y-2.5">
                        {visibleActions.length === 0 ? (
                          <li className="text-xs text-[#787165] text-center py-4 bg-[#191816] rounded-lg">
                            No actions match current filter.
                          </li>
                        ) : (
                          visibleActions.map((act) => {
                            const originalIdx = stage.actions.indexOf(act);
                            const dedupKey = `roadmap_${roadmap.career}_${stage.title}_${originalIdx}`;
                            const isConverted = convertedKeys.has(dedupKey);
                            const isConverting = convertingKey === dedupKey;
                            const taskObj = convertedTasksMap[dedupKey];
                            const isDone = taskObj?.status === "completed";

                            return (
                              <li
                                key={originalIdx}
                                className={`text-xs flex flex-col gap-1.5 p-2.5 rounded-lg border transition-all ${
                                  isDone
                                    ? "bg-[#161B18] border-[#2EA366]/30 text-[#9C9384]"
                                    : "bg-[#191816] border-[#2D2925] text-[#CDC5B6]"
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  {isDone ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2EA366] shrink-0 mt-0.5" />
                                  ) : (
                                    <span className="text-[#2EA366] font-bold">•</span>
                                  )}
                                  <span className={`flex-1 leading-snug ${isDone ? "line-through text-[#9C9384]" : ""}`}>
                                    {act}
                                  </span>
                                </div>

                                <div className="flex items-center justify-end pt-1">
                                  {isConverted ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2EA366] bg-[#2EA366]/10 px-2 py-0.5 rounded border border-[#2EA366]/25">
                                      <Check className="w-3 h-3" />
                                      {isDone ? "Completed in Tasks" : "Added to Tasks"}
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleConvertToTask(stage, idx, act, originalIdx)}
                                      disabled={isConverting}
                                      className="text-[10px] font-semibold text-[#E0693B] hover:text-[#EB784B] bg-[#E0693B]/10 hover:bg-[#E0693B]/20 px-2.5 py-1 rounded border border-[#E0693B]/25 transition-colors disabled:opacity-50 flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" />
                                      {isConverting ? "Adding..." : "Add to Task Manager"}
                                    </button>
                                  )}
                                </div>
                              </li>
                            );
                          })
                        )}
                      </ul>
                    </div>
                  </div>
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
