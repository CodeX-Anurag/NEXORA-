import React, { useState, useMemo } from "react";
import {
  Sun,
  SunMedium,
  Check,
  Clock,
  Play,
  Plus,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Repeat
} from "lucide-react";

/**
 * Format minutes into readable hour/minute string
 */
const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Friendly relative date label
 */
const formatDueDate = (dateString) => {
  if (!dateString) return null;
  const target = new Date(dateString);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 0, 0, 0);

  const diffDays = Math.round((startOfTarget - startOfToday) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { label: "Today", isToday: true, isOverdue: false };
  if (diffDays === 1) return { label: "Tomorrow", isToday: false, isOverdue: false };
  if (diffDays === -1) return { label: "Yesterday", isToday: false, isOverdue: true };
  if (diffDays < -1) return { label: `${Math.abs(diffDays)}d overdue`, isToday: false, isOverdue: true };
  return {
    label: target.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    isToday: false,
    isOverdue: false
  };
};

const priorityStyles = {
  urgent: { badge: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500 animate-pulse" },
  high: { badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  medium: { badge: "bg-[#EEF2FF] text-[#4F7CFF] border-[#4F7CFF]/30", dot: "bg-[#4F7CFF]" },
  low: { badge: "bg-[#F8FAFC] text-[#667085] border-[#E7EAF0]", dot: "bg-slate-400" }
};

export const TaskMyDayView = ({
  allTasks = [],
  onToggleComplete,
  onSelectTask,
  onToggleMyDay,
  onStartFocus,
  onQuickCreateTask
}) => {
  const [quickTitle, setQuickTitle] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Today's formatted greeting
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric"
    });
  }, []);

  // Filter tasks belonging to My Day
  const myDayTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return allTasks.filter((t) => {
      if (t.isMyDay) return true;
      if (t.deadline) {
        const dStr = new Date(t.deadline).toISOString().split("T")[0];
        if (dStr === todayStr) return true;
      }
      return false;
    });
  }, [allTasks]);

  // Suggestions: Overdue tasks not yet in My Day, and upcoming high priority
  const suggestions = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const myDayIds = new Set(myDayTasks.map((t) => t._id));

    return allTasks.filter((t) => {
      if (myDayIds.has(t._id)) return false;
      if (t.status === "completed") return false;

      // Overdue
      if (t.deadline && new Date(t.deadline) < startOfToday) {
        return true;
      }
      // High or urgent priority
      if (t.priority === "urgent" || t.priority === "high") {
        return true;
      }
      return false;
    });
  }, [allTasks, myDayTasks]);

  // Workload calculations
  const totalEstimatedMinutes = useMemo(() => {
    return myDayTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  }, [myDayTasks]);

  const totalActualMinutes = useMemo(() => {
    return myDayTasks.reduce((acc, t) => acc + (t.actualMinutes || 0), 0);
  }, [myDayTasks]);

  const completedCount = useMemo(() => {
    return myDayTasks.filter((t) => t.status === "completed").length;
  }, [myDayTasks]);

  const handleQuickCreate = (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onQuickCreateTask({
      title: quickTitle.trim(),
      isMyDay: true,
      category: "Personal"
    });
    setQuickTitle("");
  };

  return (
    <div className="space-y-6">
      {/* 1. My Day Hero Banner & Workload KPI Card */}
      <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-[#EEF2FF] via-[#F8FAFD] to-white border border-[#E7EAF0] shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-[#4F7CFF]/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[#4F7CFF] text-xs font-semibold font-mono uppercase tracking-wider">
              <SunMedium className="w-4 h-4 text-[#4F7CFF]" />
              <span>Today's Workspace</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] font-display">
              {todayFormatted}
            </h2>
            <p className="text-xs sm:text-sm text-[#667085] max-w-md leading-relaxed">
              Plan your day, tackle key assignments, and track your actual study hours in one focused view.
            </p>
          </div>

          {/* Workload Metric Badges */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Total Estimated Workload */}
            <div className="px-4 py-3 rounded-xl bg-white border border-[#E7EAF0] shadow-xs min-w-[120px]">
              <div className="text-[10px] font-mono uppercase font-bold text-[#667085] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#4F7CFF]" />
                <span>Est. Workload</span>
              </div>
              <div className="text-lg font-bold font-mono text-[#172033] mt-0.5">
                {formatDuration(totalEstimatedMinutes)}
              </div>
            </div>

            {/* Actual Logged Time */}
            <div className="px-4 py-3 rounded-xl bg-white border border-[#E7EAF0] shadow-xs min-w-[120px]">
              <div className="text-[10px] font-mono uppercase font-bold text-[#667085] flex items-center gap-1">
                <Play className="w-3 h-3 text-[#12B76A]" />
                <span>Time Logged</span>
              </div>
              <div className="text-lg font-bold font-mono text-[#12B76A] mt-0.5">
                {formatDuration(totalActualMinutes)}
              </div>
            </div>

            {/* Progress Count */}
            <div className="px-4 py-3 rounded-xl bg-white border border-[#E7EAF0] shadow-xs min-w-[120px]">
              <div className="text-[10px] font-mono uppercase font-bold text-[#667085] flex items-center gap-1">
                <Check className="w-3 h-3 text-[#4F7CFF]" />
                <span>Completed</span>
              </div>
              <div className="text-lg font-bold font-mono text-[#172033] mt-0.5">
                {completedCount}/{myDayTasks.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Add Task to My Day Input */}
      <form onSubmit={handleQuickCreate} className="relative">
        <div className="flex items-center bg-white border border-[#E7EAF0] rounded-xl px-4 py-2.5 shadow-xs focus-within:border-[#4F7CFF] focus-within:ring-2 focus-within:ring-[#4F7CFF]/10 transition-all">
          <Plus className="w-4 h-4 text-[#4F7CFF] shrink-0 mr-3" />
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Add a task to today's plan and press Enter..."
            className="w-full bg-transparent text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!quickTitle.trim()}
            className="px-3.5 py-1.5 rounded-lg bg-[#4F7CFF] hover:bg-[#3D68E5] disabled:opacity-40 text-white text-xs font-semibold shrink-0 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          >
            Add to Today
          </button>
        </div>
      </form>

      {/* 3. My Day Tasks List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085] font-display flex items-center gap-1.5">
            <span>Today's Plan</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#EEF2FF] text-[#4F7CFF] border border-[#4F7CFF]/20">
              {myDayTasks.length}
            </span>
          </h3>
        </div>

        {myDayTasks.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white border border-dashed border-[#E7EAF0] text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#EEF2FF] border border-[#4F7CFF]/20 flex items-center justify-center text-[#4F7CFF] mx-auto">
              <Sun className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#172033] font-display">No tasks in My Day yet</h4>
              <p className="text-xs text-[#667085] max-w-sm mx-auto">
                Add tasks above, carry forward overdue assignments from suggestions below, or toggle tasks into My Day.
              </p>
            </div>
          </div>
        ) : (
          myDayTasks.map((task) => {
            const isCompleted = task.status === "completed";
            const dueInfo = formatDueDate(task.deadline);
            const prioConfig = priorityStyles[task.priority] || priorityStyles.medium;
            const subtasks = task.subtasks || [];
            const completedSubCount = subtasks.filter((s) => s.completed).length;

            return (
              <div
                key={task._id}
                onClick={() => onSelectTask(task)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                  isCompleted
                    ? "border-[#E7EAF0] bg-[#F8FAFC]/75 opacity-75 hover:opacity-100 hover:border-[#D0D5DD]"
                    : "bg-white border-[#E7EAF0] hover:border-[#D0D5DD] hover:shadow-[0_2px_8px_rgba(16,24,40,0.04)]"
                }`}
              >
                {/* Left: Checkbox + Title + Badges */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleComplete(task);
                    }}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                      isCompleted
                        ? "bg-[#12B76A] border-[#12B76A] text-white"
                        : "border-[#D0D5DD] hover:border-[#4F7CFF] bg-white group-hover:border-[#98A2B3]"
                    }`}
                    aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
                  >
                    {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          isCompleted
                            ? "line-through text-[#98A2B3]"
                            : "text-[#172033] group-hover:text-[#4F7CFF] transition-colors"
                        }`}
                      >
                        {task.title}
                      </h4>

                      {/* Priority */}
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono uppercase font-bold rounded-full border flex items-center gap-1 shrink-0 ${prioConfig.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${prioConfig.dot}`} />
                        {task.priority}
                      </span>

                      {/* Recurring */}
                      {task.recurrence && task.recurrence !== "none" && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded font-mono bg-[#F8FAFC] text-[#667085] border border-[#E7EAF0] flex items-center gap-1">
                          <Repeat className="w-2.5 h-2.5 text-[#4F7CFF]" />
                          <span className="capitalize">{task.recurrence}</span>
                        </span>
                      )}
                    </div>

                    {/* Metadata Sub-row */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#667085]">
                      {task.category && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#F8FAFC] text-[#667085] border border-[#E7EAF0]">
                          {task.category}
                        </span>
                      )}

                      {subtasks.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1.5 rounded-full bg-[#EAECF0] overflow-hidden">
                            <div
                              className="h-full bg-[#12B76A]"
                              style={{ width: `${(completedSubCount / subtasks.length) * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px]">
                            {completedSubCount}/{subtasks.length}
                          </span>
                        </div>
                      )}

                      {task.estimatedMinutes > 0 && (
                        <span className="flex items-center gap-1 font-mono text-[10px]">
                          <Clock className="w-3 h-3 text-[#98A2B3]" />
                          <span>{task.estimatedMinutes}m est</span>
                          {task.actualMinutes > 0 && (
                            <span className="text-[#4F7CFF] font-semibold">({task.actualMinutes}m logged)</span>
                          )}
                        </span>
                      )}

                      {dueInfo && (
                        <span
                          className={`flex items-center gap-1 font-mono text-[10px] ${
                            dueInfo.isOverdue && !isCompleted
                              ? "text-rose-600 font-bold"
                              : dueInfo.isToday && !isCompleted
                              ? "text-amber-600 font-bold"
                              : "text-[#667085]"
                          }`}
                        >
                          {dueInfo.isOverdue && !isCompleted && <AlertCircle className="w-3 h-3" />}
                          <span>{dueInfo.label}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Quick Focus & Remove from My Day */}
                <div
                  className="flex items-center gap-1 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!isCompleted && (
                    <button
                      type="button"
                      onClick={() => onStartFocus(task)}
                      title="Start Focus Session"
                      className="p-1.5 rounded-lg bg-white hover:bg-[#EEF2FF] text-[#667085] hover:text-[#4F7CFF] border border-[#E7EAF0] hover:border-[#4F7CFF]/30 transition-all text-xs cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Remove from My Day */}
                  <button
                    type="button"
                    onClick={() => onToggleMyDay(task, false)}
                    title="Remove from My Day (keeps deadline and task intact)"
                    className="p-1.5 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#98A2B3] hover:text-[#172033] border border-[#E7EAF0] transition-all text-xs cursor-pointer shadow-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Suggestions & Carry Forward Collapsible Panel */}
      {suggestions.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E7EAF0] shadow-xs space-y-3">
          <div
            className="flex items-center justify-between cursor-pointer select-none"
            onClick={() => setShowSuggestions((prev) => !prev)}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7C6CFA]" />
              <h4 className="text-xs sm:text-sm font-bold text-[#172033] font-display">
                Suggestions & Carry Forward ({suggestions.length})
              </h4>
              <span className="text-[11px] text-[#667085] hidden sm:inline">
                Overdue and high-priority tasks you can add to today's plan
              </span>
            </div>

            <button
              type="button"
              className="text-[#667085] hover:text-[#172033] p-1 cursor-pointer"
              aria-label="Toggle suggestions"
            >
              {showSuggestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showSuggestions && (
            <div className="divide-y divide-[#F1F4F9] pt-1">
              {suggestions.slice(0, 6).map((task) => {
                const dueInfo = formatDueDate(task.deadline);
                const isOverdue = dueInfo?.isOverdue;

                return (
                  <div
                    key={task._id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {isOverdue && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                          OVERDUE
                        </span>
                      )}
                      <span className="text-[#172033] truncate font-medium">{task.title}</span>
                      {task.category && (
                        <span className="text-[10px] text-[#667085] font-mono hidden sm:inline">
                          • {task.category}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {task.estimatedMinutes > 0 && (
                        <span className="text-[10px] font-mono text-[#667085]">
                          {task.estimatedMinutes}m
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onToggleMyDay(task, true)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#4F7CFF] hover:text-white text-[#172033] border border-[#E7EAF0] hover:border-transparent text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add to My Day</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskMyDayView;
