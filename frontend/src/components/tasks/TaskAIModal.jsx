import React, { useState } from "react";
import {
  Sparkles,
  Layers,
  Calendar,
  Check,
  Plus,
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import Modal from "../common/Modal";
import Button from "../common/Button";

export const TaskAIModal = ({
  isOpen,
  onClose,
  onAddBreakdownTasks,
  onRescheduleTask,
  _tasks = [],
  apiBreakdown,
  apiDailyPlan,
  apiRiskDetection
}) => {
  const [activeTab, setActiveTab] = useState("breakdown"); // 'breakdown' | 'planner' | 'risks'

  // Tab 1: Breakdown State
  const [goalInput, setGoalInput] = useState("");
  const [contextInput, setContextInput] = useState("");
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [breakdownResults, setBreakdownResults] = useState(null);
  const [selectedTaskIndices, setSelectedTaskIndices] = useState({});
  const [isAddingTasks, setIsAddingTasks] = useState(false);

  // Tab 2: Planner State
  const [availableHours, setAvailableHours] = useState(6);
  const [isPlanning, setIsPlanning] = useState(false);
  const [dailyPlan, setDailyPlan] = useState(null);

  // Tab 3: Risks State
  const [isLoadingRisks, setIsLoadingRisks] = useState(false);
  const [riskData, setRiskData] = useState(null);

  if (!isOpen) return null;

  // Handle Breakdown Execution
  const handleRunBreakdown = async (e) => {
    e.preventDefault();
    if (!goalInput.trim()) return;
    setIsBreakingDown(true);

    try {
      const res = await apiBreakdown({
        goal: goalInput.trim(),
        context: contextInput.trim()
      });
      if (res && res.suggestedTasks) {
        setBreakdownResults(res);
        // Default all to selected
        const initialSelected = {};
        res.suggestedTasks.forEach((_, idx) => {
          initialSelected[idx] = true;
        });
        setSelectedTaskIndices(initialSelected);
      }
    } catch {
      // Swallowed safely
    } finally {
      setIsBreakingDown(false);
    }
  };

  const handleToggleSelectTask = (idx) => {
    setSelectedTaskIndices((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleConfirmAddTasks = async () => {
    if (!breakdownResults?.suggestedTasks) return;
    const selected = breakdownResults.suggestedTasks.filter((_, idx) => selectedTaskIndices[idx]);
    if (selected.length === 0) return;

    setIsAddingTasks(true);
    try {
      await onAddBreakdownTasks(selected);
      onClose();
    } catch {
      // Swallowed safely
    } finally {
      setIsAddingTasks(false);
    }
  };

  // Handle Daily Planner Execution
  const handleRunDailyPlan = async () => {
    setIsPlanning(true);
    try {
      const res = await apiDailyPlan({ availableHours });
      setDailyPlan(res);
    } catch {
      // Swallowed safely
    } finally {
      setIsPlanning(false);
    }
  };

  // Handle Risk Detection
  const handleRunRiskDetection = async () => {
    setIsLoadingRisks(true);
    try {
      const res = await apiRiskDetection();
      setRiskData(res);
    } catch {
      // Swallowed safely
    } finally {
      setIsLoadingRisks(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="NEXORA Task Intelligence & AI"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] text-[#787165] font-mono">
            Powered by NEXORA AI Engine • Strict User Confirmation
          </span>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#141312] border border-[#2D2925] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("breakdown")}
            className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "breakdown"
                ? "bg-[#25221F] text-[#FAF7F2] border border-[#38332E] shadow-sm"
                : "text-[#9C9384] hover:text-[#FAF7F2]"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#E0693B]" />
            <span>Goal Breakdown</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("planner");
              if (!dailyPlan) handleRunDailyPlan();
            }}
            className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "planner"
                ? "bg-[#25221F] text-[#FAF7F2] border border-[#38332E] shadow-sm"
                : "text-[#9C9384] hover:text-[#FAF7F2]"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#2EA366]" />
            <span>Daily Planner</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("risks");
              if (!riskData) handleRunRiskDetection();
            }}
            className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "risks"
                ? "bg-[#25221F] text-[#FAF7F2] border border-[#38332E] shadow-sm"
                : "text-[#9C9384] hover:text-[#FAF7F2]"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Deadline Risks</span>
          </button>
        </div>

        {/* TAB 1: GOAL BREAKDOWN */}
        {activeTab === "breakdown" && (
          <div className="space-y-4">
            <form onSubmit={handleRunBreakdown} className="space-y-3 p-4 rounded-xl bg-[#141312] border border-[#2D2925]">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#CDC5B6] uppercase tracking-wider">
                  Target Academic or Project Goal
                </label>
                <input
                  type="text"
                  placeholder="e.g. Prepare for my Database Management Systems exam"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#191816] border border-[#302C28] rounded-xl text-[#FAF7F2] placeholder-[#787165] focus:outline-none focus:border-[#E0693B]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#CDC5B6] uppercase tracking-wider">
                  Additional Details (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Exam is in 5 days, focus on SQL queries and normalization"
                  value={contextInput}
                  onChange={(e) => setContextInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#191816] border border-[#302C28] rounded-xl text-[#FAF7F2] placeholder-[#787165] focus:outline-none focus:border-[#E0693B]"
                />
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRunBreakdown}
                  disabled={!goalInput.trim() || isBreakingDown}
                  isLoading={isBreakingDown}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> Break Down Goal
                </Button>
              </div>
            </form>

            {/* Breakdown Results */}
            {breakdownResults?.suggestedTasks && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#FAF7F2] uppercase tracking-wider font-display">
                    Suggested Action Items ({breakdownResults.suggestedTasks.length})
                  </h4>
                  <span className="text-[10px] text-[#9C9384]">Review & approve before creation</span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {breakdownResults.suggestedTasks.map((task, idx) => {
                    const isSelected = !!selectedTaskIndices[idx];

                    return (
                      <div
                        key={idx}
                        onClick={() => handleToggleSelectTask(idx)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? "bg-[#191816] border-[#E0693B]/40"
                            : "bg-[#141312] border-[#262420] opacity-50"
                        }`}
                      >
                        <button
                          type="button"
                          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-[#E0693B] border-[#E0693B] text-white" : "border-[#3A352F]"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>

                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#FAF7F2] truncate">
                              {task.title}
                            </span>
                            <span className="text-[10px] font-mono text-[#E0693B] shrink-0 font-bold">
                              {task.estimatedMinutes}m
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-[11px] text-[#9C9384] line-clamp-1">{task.description}</p>
                          )}
                          {task.subtasks?.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {task.subtasks.map((st, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#141312] text-[#CDC5B6] border border-[#2D2925]"
                                >
                                  • {st}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleConfirmAddTasks}
                    isLoading={isAddingTasks}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Selected Tasks to Workspace
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DAILY PLANNER */}
        {activeTab === "planner" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#141312] border border-[#2D2925] flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-[#FAF7F2] block">Available Focus Hours Today</span>
                <span className="text-[11px] text-[#9C9384]">Calculates realistic task schedule</span>
              </div>
              <div className="flex items-center gap-2">
                {[4, 6, 8].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      setAvailableHours(h);
                      handleRunDailyPlan();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                      availableHours === h
                        ? "bg-[#2EA366] text-white"
                        : "bg-[#1E1C19] text-[#9C9384] hover:text-[#FAF7F2]"
                    }`}
                  >
                    {h} hrs
                  </button>
                ))}
              </div>
            </div>

            {isPlanning ? (
              <div className="p-8 text-center text-xs text-[#9C9384]">
                Formulating optimal daily schedule...
              </div>
            ) : dailyPlan?.plan ? (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#2EA366]/10 border border-[#2EA366]/25 text-[#FAF7F2] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#2EA366] font-bold">
                    Target Focus Strategy
                  </span>
                  <p className="text-xs font-semibold">{dailyPlan.plan.summary}</p>
                </div>

                {/* Time Blocks */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {dailyPlan.plan.timeBlocks?.map((block, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#141312] border border-[#262420] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#E0693B] font-mono">{block.timeSlot}</span>
                        <span className="text-[10px] text-[#9C9384]">{block.focus}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {block.taskTitles?.map((title, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[11px] bg-[#1E1C19] text-[#FAF7F2] border border-[#302C28]"
                          >
                            {title}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {dailyPlan.plan.productivityTip && (
                  <p className="text-[11px] text-[#9C9384] italic pt-1 text-center">
                    💡 Tip: {dailyPlan.plan.productivityTip}
                  </p>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 3: DEADLINE RISKS */}
        {activeTab === "risks" && (
          <div className="space-y-4">
            {isLoadingRisks ? (
              <div className="p-8 text-center text-xs text-[#9C9384]">Evaluating task workloads and deadlines...</div>
            ) : riskData?.atRiskTasks?.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#141312] border border-[#262420] text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#2EA366]/10 text-[#2EA366] flex items-center justify-center mx-auto">
                  <Check className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-[#FAF7F2]">No Critical Deadline Risks</h4>
                <p className="text-xs text-[#9C9384] max-w-sm mx-auto">
                  All active tasks have healthy runway or are within manageable parameters.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {riskData?.atRiskTasks?.map((risk) => (
                  <div
                    key={risk.taskId}
                    className={`p-3.5 rounded-xl border space-y-2 ${
                      risk.riskLevel === "critical"
                        ? "bg-rose-950/20 border-rose-800/40"
                        : "bg-amber-950/20 border-amber-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#FAF7F2] truncate">{risk.title}</span>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold rounded-full border ${
                          risk.riskLevel === "critical"
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {risk.riskLevel}
                      </span>
                    </div>

                    <p className="text-xs text-[#CDC5B6]">{risk.reason}</p>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-[#9C9384] italic">Action: {risk.suggestedAction}</span>
                      <button
                        type="button"
                        onClick={() => {
                          onRescheduleTask(risk.taskId);
                          onClose();
                        }}
                        className="text-[#E0693B] hover:underline font-semibold flex items-center gap-1 shrink-0"
                      >
                        <span>Smart Reschedule</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TaskAIModal;
