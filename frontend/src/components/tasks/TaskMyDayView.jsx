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
  urgent: { badge: "bg-rose-500/15 text-rose-300 border-rose-500/30", dot: "bg-rose-500" },
  high: { badge: "bg-rose-950/40 text-rose-300 border-rose-800/40", dot: "bg-rose-400" },
  medium: { badge: "bg-amber-950/40 text-amber-300 border-amber-800/40", dot: "bg-amber-400" },
  low: { badge: "bg-[#22201D] text-[#9C9384] border-[#332F2A]", dot: "bg-[#787165]" }
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
  // A task belongs to My Day if isMyDay === true OR (deadline is today and not completed)
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
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#201B17] via-[#191816] to-[#171614] border border-[#332F2A] shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-[#E0693B]/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[#E0693B] text-xs font-semibold font-mono uppercase tracking-wider">
              <SunMedium className="w-4 h-4 text-[#E0693B]" />
              <span>Today's Workspace</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#FAF7F2] font-display">
              {todayFormatted}
            </h2>
            <p className="text-xs text-[#9C9384] max-w-md leading-relaxed">
              Plan your day, tackle key assignments, and track your actual study hours in one focused view.
            </p>
          </div>

          {/* Workload Metric Badges */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Total Estimated Workload */}
            <div className="px-4 py-3 rounded-xl bg-[#141312] border border-[#2D2925] min-w-[120px]">
              <div className="text-[10px] font-mono uppercase font-bold text-[#9C9384] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#E0693B]" />
                <span>Est. Workload</span>
              </div>
              <div className="text-lg font-bold font-mono text-[#FAF7F2] mt-0.5">
                {formatDuration(totalEstimatedMinutes)}
              </div>
            </div>

            {/* Actual Logged Time */}
            <div className="px-4 py-3 rounded-xl bg-[#141312] border border-[#2D2925] min-w-[120px]">
              <div className="text-[10px] font-mono uppercase font-bold text-[#9C9384] flex items-center gap-1">
                <Play className="w-3 h-3 text-[#2EA366]" />
                <span>Time Logged</span>
              </div>
              <div className="text-lg font-bold font-mono text-[#2EA366] mt-0.5">
                {formatDuration(totalActualMinutes)}
              </div>
            </div>

            {/* Progress Count */}
            <div className="px-4 py-3 rounded-xl bg-[#141312] border border-[#2D2925] min-w-[120px]">
              <div className="text-[10px] font-mono uppercase font-bold text-[#9C9384] flex items-center gap-1">
                <Check className="w-3 h-3 text-[#E0693B]" />
                <span>Completed</span>
              </div>
              <div className="text-lg font-bold font-mono text-[#FAF7F2] mt-0.5">
                {completedCount}/{myDayTasks.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Add Task to My Day Input */}
      <form onSubmit={handleQuickCreate} className="relative">
        <div className="flex items-center bg-[#191816] border border-[#2D2925] rounded-xl px-4 py-2.5 shadow-sm focus-within:border-[#E0693B] focus-within:ring-1 focus-within:ring-[#E0693B] transition-all">
          <Plus className="w-4 h-4 text-[#E0693B] shrink-0 mr-3" />
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Add a task to today's plan and press Enter..."
            className="w-full bg-transparent text-xs text-[#FAF7F2] placeholder-[#787165] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!quickTitle.trim()}
            className="px-3 py-1 rounded-lg bg-[#E0693B] hover:bg-[#EB784B] disabled:opacity-40 text-white text-xs font-semibold shrink-0 transition-colors cursor-pointer"
          >
            Add to Today
          </button>
        </div>
      </form>

      {/* 3. My Day Tasks List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#9C9384] font-display flex items-center gap-1.5">
            <span>Today's Plan</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#22201D] text-[#FAF7F2] border border-[#2D2925]">
              {myDayTasks.length}
            </span>
          </h3>
        </div>

        {myDayTasks.length === 0 ? (
          <div className="p-10 rounded-2xl bg-[#191816] border border-dashed border-[#2D2925] text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#201E1B] border border-[#332F2A] flex items-center justify-center text-[#E0693B] mx-auto">
              <Sun className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#FAF7F2] font-display">No tasks in My Day yet</h4>
              <p className="text-xs text-[#9C9384] max-w-sm mx-auto">
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
                className={`p-3.5 rounded-xl bg-[#191816] border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                  isCompleted
                    ? "border-[#24211D] opacity-75 hover:opacity-100 hover:border-[#332F2A]"
                    : "border-[#2D2925] hover:border-[#3E3832] hover:bg-[#1E1C19]"
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
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                      isCompleted
                        ? "bg-[#2EA366] border-[#2EA366] text-white"
                        : "border-[#3A352F] hover:border-[#E0693B] bg-[#141312]"
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
                            ? "line-through text-[#787165]"
                            : "text-[#FAF7F2] group-hover:text-[#E0693B] transition-colors"
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
                        <span className="px-1.5 py-0.5 text-[10px] rounded font-mono bg-[#1E1C19] text-[#CDC5B6] border border-[#2D2925] flex items-center gap-1">
                          <Repeat className="w-2.5 h-2.5 text-[#E0693B]" />
                          <span className="capitalize">{task.recurrence}</span>
                        </span>
                      )}
                    </div>

                    {/* Metadata Sub-row */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#9C9384]">
                      {task.category && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#141312] text-[#CDC5B6] border border-[#2D2925]">
                          {task.category}
                        </span>
                      )}

                      {subtasks.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1.5 rounded-full bg-[#141312] border border-[#2D2925] overflow-hidden">
                            <div
                              className="h-full bg-[#2EA366]"
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
                          <Clock className="w-3 h-3 text-[#787165]" />
                          <span>{task.estimatedMinutes}m est</span>
                          {task.actualMinutes > 0 && (
                            <span className="text-[#E0693B]">({task.actualMinutes}m logged)</span>
                          )}
                        </span>
                      )}

                      {dueInfo && (
                        <span
                          className={`flex items-center gap-1 font-mono text-[10px] ${
                            dueInfo.isOverdue && !isCompleted
                              ? "text-rose-400 font-bold"
                              : dueInfo.isToday && !isCompleted
                              ? "text-amber-400 font-bold"
                              : "text-[#CDC5B6]"
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
                      className="p-1.5 rounded-lg bg-[#25221F] hover:bg-[#E0693B]/20 text-[#CDC5B6] hover:text-[#E0693B] border border-[#332F2A] hover:border-[#E0693B]/30 transition-all text-xs"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Remove from My Day */}
                  <button
                    type="button"
                    onClick={() => onToggleMyDay(task, false)}
                    title="Remove from My Day (keeps deadline and task intact)"
                    className="p-1.5 rounded-lg bg-[#25221F] hover:bg-[#2D2925] text-[#9C9384] hover:text-[#FAF7F2] border border-[#332F2A] transition-all text-xs"
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
        <div className="p-4 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-3">
          <div
            className="flex items-center justify-between cursor-pointer select-none"
            onClick={() => setShowSuggestions((prev) => !prev)}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E0693B]" />
              <h4 className="text-xs font-bold text-[#FAF7F2] font-display">
                Suggestions & Carry Forward ({suggestions.length})
              </h4>
              <span className="text-[10px] text-[#9C9384] hidden sm:inline">
                Overdue and high-priority tasks you can add to today's plan
              </span>
            </div>

            <button
              type="button"
              className="text-[#9C9384] hover:text-[#FAF7F2] p-1"
              aria-label="Toggle suggestions"
            >
              {showSuggestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showSuggestions && (
            <div className="divide-y divide-[#262420] pt-1">
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
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 shrink-0">
                          OVERDUE
                        </span>
                      )}
                      <span className="text-[#FAF7F2] truncate font-medium">{task.title}</span>
                      {task.category && (
                        <span className="text-[10px] text-[#787165] font-mono hidden sm:inline">
                          • {task.category}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {task.estimatedMinutes > 0 && (
                        <span className="text-[10px] font-mono text-[#9C9384]">
                          {task.estimatedMinutes}m
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onToggleMyDay(task, true)}
                        className="px-2.5 py-1 rounded-lg bg-[#25221F] hover:bg-[#E0693B] hover:text-white text-[#CDC5B6] border border-[#38332E] hover:border-transparent text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
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
