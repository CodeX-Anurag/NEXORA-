import React, { useState } from "react";
import {
  Sparkles,
  Layers,
  Calendar,
  Check,
  Plus,
  ArrowRight,
  ShieldAlert,
  Lightbulb
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
  const [activeTab, setActiveTab] = useState("breakdown");

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
          <span className="text-[10px] text-[#667085] font-mono">
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
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F1F4F9] border border-[#E7EAF0] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("breakdown")}
            className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "breakdown"
                ? "bg-white text-[#4F7CFF] border border-[#E7EAF0] shadow-xs"
                : "text-[#667085] hover:text-[#172033]"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#4F7CFF]" />
            <span>Goal Breakdown</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("planner");
              if (!dailyPlan) handleRunDailyPlan();
            }}
            className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "planner"
                ? "bg-white text-[#4F7CFF] border border-[#E7EAF0] shadow-xs"
                : "text-[#667085] hover:text-[#172033]"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#12B76A]" />
            <span>Daily Planner</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("risks");
              if (!riskData) handleRunRiskDetection();
            }}
            className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "risks"
                ? "bg-white text-[#4F7CFF] border border-[#E7EAF0] shadow-xs"
                : "text-[#667085] hover:text-[#172033]"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Deadline Risks</span>
          </button>
        </div>

        {/* TAB 1: GOAL BREAKDOWN */}
        {activeTab === "breakdown" && (
          <div className="space-y-4">
            <form onSubmit={handleRunBreakdown} className="space-y-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E7EAF0]">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#172033] tracking-normal">
                  Target Academic or Project Goal
                </label>
                <input
                  type="text"
                  placeholder="e.g. Prepare for my Database Management Systems exam"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-[#E7EAF0] rounded-xl text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:border-[#4F7CFF]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#172033] tracking-normal">
                  Additional Details (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Exam is in 5 days, focus on SQL queries and normalization"
                  value={contextInput}
                  onChange={(e) => setContextInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-[#E7EAF0] rounded-xl text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:border-[#4F7CFF]"
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
                  <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider font-display">
                    Suggested Action Items ({breakdownResults.suggestedTasks.length})
                  </h4>
                  <span className="text-[10px] text-[#667085]">Review & approve before creation</span>
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
                            ? "bg-white border-[#4F7CFF]/50 shadow-xs"
                            : "bg-[#F8FAFC] border-[#E7EAF0] opacity-60"
                        }`}
                      >
                        <button
                          type="button"
                          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer ${
                            isSelected ? "bg-[#4F7CFF] border-[#4F7CFF] text-white" : "border-[#D0D5DD] bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>

                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#172033] truncate">
                              {task.title}
                            </span>
                            <span className="text-[10px] font-mono text-[#4F7CFF] shrink-0 font-bold">
                              {task.estimatedMinutes}m
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-[11px] text-[#667085] line-clamp-1">{task.description}</p>
                          )}
                          {task.subtasks?.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {task.subtasks.map((st, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#F8FAFC] text-[#667085] border border-[#E7EAF0]"
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
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E7EAF0] flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-[#172033] block">Available Focus Hours Today</span>
                <span className="text-[11px] text-[#667085]">Calculates realistic task schedule</span>
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                      availableHours === h
                        ? "bg-[#12B76A] text-white shadow-2xs"
                        : "bg-white text-[#667085] hover:text-[#172033] border border-[#E7EAF0]"
                    }`}
                  >
                    {h} hrs
                  </button>
                ))}
              </div>
            </div>

            {isPlanning ? (
              <div className="p-8 text-center text-xs text-[#667085]">
                Formulating optimal daily schedule...
              </div>
            ) : dailyPlan?.plan ? (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#ECFDF3] border border-[#A6F4C5] text-[#027A48] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#027A48] font-bold">
                    Target Focus Strategy
                  </span>
                  <p className="text-xs font-semibold">{dailyPlan.plan.summary}</p>
                </div>

                {/* Time Blocks */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {dailyPlan.plan.timeBlocks?.map((block, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E7EAF0] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#4F7CFF] font-mono">{block.timeSlot}</span>
                        <span className="text-[10px] text-[#667085]">{block.focus}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {block.taskTitles?.map((title, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[11px] bg-white text-[#172033] border border-[#E7EAF0] shadow-2xs"
                          >
                            {title}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {dailyPlan.plan.productivityTip && (
                  <p className="text-[11px] text-[#667085] italic pt-1 text-center flex items-center justify-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Tip: {dailyPlan.plan.productivityTip}</span>
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
              <div className="p-8 text-center text-xs text-[#667085]">Evaluating task workloads and deadlines...</div>
            ) : riskData?.atRiskTasks?.length === 0 ? (
              <div className="p-8 rounded-xl bg-white border border-[#E7EAF0] text-center space-y-2 shadow-xs">
                <div className="w-10 h-10 rounded-full bg-[#ECFDF3] text-[#12B76A] flex items-center justify-center mx-auto">
                  <Check className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-[#172033]">No Critical Deadline Risks</h4>
                <p className="text-xs text-[#667085] max-w-sm mx-auto">
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
                        ? "bg-rose-50 border-rose-200"
                        : "bg-amber-50 border-amber-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#172033] truncate">{risk.title}</span>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold rounded-full border ${
                          risk.riskLevel === "critical"
                            ? "bg-rose-100 text-rose-800 border-rose-200"
                            : "bg-amber-100 text-amber-800 border-amber-200"
                        }`}
                      >
                        {risk.riskLevel}
                      </span>
                    </div>

                    <p className="text-xs text-[#667085]">{risk.reason}</p>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-[#667085] italic">Action: {risk.suggestedAction}</span>
                      <button
                        type="button"
                        onClick={() => {
                          onRescheduleTask(risk.taskId);
                          onClose();
                        }}
                        className="text-[#4F7CFF] hover:underline font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
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
