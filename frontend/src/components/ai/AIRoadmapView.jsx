import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import aiService from "../../services/ai.service";
import taskService from "../../services/task.service";
import Button from "../common/Button";
import Loader from "../common/Loader";

export const AIRoadmapView = ({ initialRole = "Full Stack Developer" }) => {
  const { accessToken } = useAuth();
  const [targetRole, setTargetRole] = useState(initialRole);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Structured AI Career Roadmap
          </h2>
          <p className="text-sm text-slate-400">
            Multi-stage milestone roadmap. Convert actions directly into trackable NEXORA Tasks.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="Target Career Role"
            className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 flex-1 sm:w-48"
          />
          <Button size="sm" onClick={handleGenerateRoadmap} isLoading={loading}>
            Generate Roadmap
          </Button>
        </div>
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      {loading ? (
        <Loader message="Synthesizing multi-stage career roadmap..." />
      ) : !roadmap ? (
        <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-slate-800">
          <p className="text-sm text-slate-400">No roadmap generated yet.</p>
          <p className="text-xs text-slate-500 mt-1">
            Click <strong>Generate Roadmap</strong> to synthesize a structured stage-by-stage guide.
          </p>
        </div>
      ) : (
        <div className="space-y-6 pt-2">
          <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-lg flex items-center justify-between">
            <span className="text-xs font-mono text-indigo-300 font-bold uppercase tracking-wider">
              Target Role: {roadmap.career}
            </span>
            <span className="text-xs text-slate-400 font-mono">{roadmap.stages?.length || 0} Stages</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roadmap.stages?.map((stage, idx) => {
              // Calculate Substep 12B Milestone Completion Progress
              const totalActions = stage.actions?.length || 0;
              let completedActions = 0;

              stage.actions?.forEach((_, aIdx) => {
                const key = `roadmap_${roadmap.career}_${stage.title}_${aIdx}`;
                const t = convertedTasksMap[key];
                if (t && t.status === "completed") {
                  completedActions += 1;
                }
              });

              const stageProgress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

              return (
                <div
                  key={idx}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4 relative flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold font-mono text-indigo-400">STAGE {idx + 1}</span>
                      <span className="text-[10px] font-mono font-semibold text-emerald-400">{stageProgress}% Done</span>
                    </div>

                    {/* Milestone Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${stageProgress}%` }} />
                    </div>

                    <h3 className="text-base font-bold text-slate-100">{stage.title}</h3>

                    {/* Skills tags */}
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1.5">
                        Focus Skills
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {stage.skills?.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Milestone Actions with Substep 12B "Add to Task Manager" Conversion */}
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1.5">
                        Milestone Actions
                      </span>
                      <ul className="space-y-2.5">
                        {stage.actions?.map((act, aIdx) => {
                          const dedupKey = `roadmap_${roadmap.career}_${stage.title}_${aIdx}`;
                          const isConverted = convertedKeys.has(dedupKey);
                          const isConverting = convertingKey === dedupKey;

                          return (
                            <li key={aIdx} className="text-xs text-slate-300 flex flex-col gap-1 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                              <div className="flex items-start gap-2">
                                <span className="text-emerald-400 font-bold">•</span>
                                <span className="flex-1 leading-snug">{act}</span>
                              </div>

                              <div className="flex items-center justify-end pt-1">
                                {isConverted ? (
                                  <span className="inline-flex items-center text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                    Added to Tasks ✓
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleConvertToTask(stage, idx, act, aIdx)}
                                    disabled={isConverting}
                                    className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/20 transition-colors disabled:opacity-50"
                                  >
                                    {isConverting ? "Adding..." : "+ Add to Task Manager"}
                                  </button>
                                )}
                              </div>
                            </li>
                          );
                        })}
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
