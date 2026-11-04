import React, { useState, useRef, useEffect } from "react";
import {
  Check,
  Clock,
  CheckCircle2,
  ListTodo,
  Play,
  Edit2,
  Trash2,
  AlertCircle,
  Repeat,
  Sun,
  MoreVertical,
  Eye,
  EyeOff,
  Search
} from "lucide-react";

/**
 * Friendly relative date label with overdue styling
 */
const formatDueDate = (dateString) => {
  if (!dateString) return null;
  const target = new Date(dateString);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 0, 0, 0);

  const diffDays = Math.round((startOfTarget - startOfToday) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { label: "Today", isOverdue: false, isToday: true };
  }
  if (diffDays === 1) {
    return { label: "Tomorrow", isOverdue: false, isToday: false };
  }
  if (diffDays === -1) {
    return { label: "Yesterday", isOverdue: true, isToday: false };
  }
  if (diffDays < -1) {
    return { label: `${Math.abs(diffDays)}d overdue`, isOverdue: true, isToday: false };
  }
  if (diffDays <= 7) {
    return {
      label: target.toLocaleDateString("en-US", { weekday: "short" }),
      isOverdue: false,
      isToday: false
    };
  }
  return {
    label: target.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    isOverdue: false,
    isToday: false
  };
};

const priorityStyles = {
  urgent: {
    badge: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40",
    dot: "bg-rose-500 animate-pulse"
  },
  high: {
    badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40",
    dot: "bg-amber-500"
  },
  medium: {
    badge: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40",
    dot: "bg-blue-500"
  },
  low: {
    badge: "bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400"
  }
};

const statusStyles = {
  todo: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  in_progress: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/40",
  in_review: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/40",
  completed: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40"
};

export const TaskListView = ({
  tasks = [],
  totalAllTasks = 0,
  onToggleComplete,
  onSelectTask,
  onEditTask,
  onDeleteTask,
  onStartFocus,
  onResetFilters,
  onCreateTask,
  onToggleMyDay,
  showCompleted = true,
  onToggleShowCompleted,
  searchQuery = ""
}) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Filter tasks based on showCompleted toggle
  const displayedTasks = tasks.filter((t) => {
    if (!showCompleted && t.status === "completed") return false;
    return true;
  });

  const completedCount = tasks.filter((t) => t.status === "completed").length;

  // Empty state handling
  if (displayedTasks.length === 0) {
    if (totalAllTasks === 0) {
      return (
        <div className="p-8 sm:p-10 rounded-2xl bg-white border border-dashed border-[#E7EAF0] text-center space-y-3.5 shadow-xs animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-[#ECFDF3] border border-[#A6F4C5] flex items-center justify-center text-[#12B76A] mx-auto">
            <CheckCircle2 className="w-6 h-6 text-[#12B76A]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#172033] font-display">No tasks created yet</h3>
            <p className="text-xs text-[#667085] max-w-sm mx-auto">
              Get started by creating your first task or using the AI Assistant to break down your goals.
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateTask}
            className="px-4 py-2 rounded-xl bg-[#4F7CFF] hover:bg-[#3D68E5] text-white text-xs font-semibold shadow-sm shadow-[#4F7CFF]/25 transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-[0.98]"
          >
            <span>+ Create Task</span>
          </button>
        </div>
      );
    }

    if (searchQuery) {
      return (
        <div className="p-8 sm:p-10 rounded-2xl bg-white border border-dashed border-[#E7EAF0] text-center space-y-3.5 shadow-xs animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-[#F8FAFC] border border-[#E7EAF0] flex items-center justify-center text-[#98A2B3] mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#172033] font-display">No matching search results</h3>
            <p className="text-xs text-[#667085] max-w-sm mx-auto">
              No tasks matched <span className="text-[#172033] font-semibold font-mono">"{searchQuery}"</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={onResetFilters}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#172033] border border-[#E7EAF0] text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            Clear Search & Filters
          </button>
        </div>
      );
    }

    if (!showCompleted && completedCount > 0 && tasks.length === completedCount) {
      return (
        <div className="p-8 sm:p-10 rounded-2xl bg-white border border-dashed border-[#E7EAF0] text-center space-y-3.5 shadow-xs animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-[#ECFDF3] border border-[#A6F4C5] flex items-center justify-center text-[#12B76A] mx-auto">
            <CheckCircle2 className="w-6 h-6 text-[#12B76A]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#172033] font-display">All tasks completed!</h3>
            <p className="text-xs text-[#667085] max-w-sm mx-auto">
              You have completed all {completedCount} tasks in this view.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={onToggleShowCompleted}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#172033] border border-[#E7EAF0] text-xs font-semibold transition-all cursor-pointer shadow-xs"
            >
              Show Completed ({completedCount})
            </button>
            <button
              type="button"
              onClick={onCreateTask}
              className="px-3.5 py-1.5 rounded-xl bg-[#4F7CFF] hover:bg-[#3D68E5] text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
            >
              + Create New Task
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-8 sm:p-10 rounded-2xl bg-white border border-dashed border-[#E7EAF0] text-center space-y-3.5 shadow-xs animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-[#F8FAFC] border border-[#E7EAF0] flex items-center justify-center text-[#98A2B3] mx-auto">
          <ListTodo className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-[#172033] font-display">No tasks match current filters</h3>
          <p className="text-xs text-[#667085] max-w-sm mx-auto">
            Try adjusting your status, priority, category, or due date filters.
          </p>
        </div>
        <button
          type="button"
          onClick={onResetFilters}
          className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#172033] border border-[#E7EAF0] text-xs font-semibold transition-all cursor-pointer shadow-xs"
        >
          Reset Filters
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Sub-header: Count & Show/Hide Completed Toggle */}
      <div className="flex items-center justify-between px-1 pb-1 text-xs">
        <span className="text-[#667085] font-mono text-[11px]">
          Showing {displayedTasks.length} {displayedTasks.length === 1 ? "task" : "tasks"}
        </span>

        {completedCount > 0 && onToggleShowCompleted && (
          <button
            type="button"
            onClick={onToggleShowCompleted}
            className="flex items-center gap-1.5 text-[11px] font-medium text-[#667085] hover:text-[#172033] transition-colors cursor-pointer select-none"
          >
            {showCompleted ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-[#98A2B3]" />
                <span>Hide completed ({completedCount})</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-[#4F7CFF]" />
                <span>Show completed ({completedCount})</span>
              </>
            )}
          </button>
        )}
      </div>

      {displayedTasks.map((task) => {
        const isCompleted = task.status === "completed";
        const dueInfo = formatDueDate(task.deadline);
        const prioConfig = priorityStyles[task.priority] || priorityStyles.medium;
        const subtasks = task.subtasks || [];
        const completedSubtasksCount = subtasks.filter((s) => s.completed).length;
        const isMenuOpen = openMenuId === task._id;

        return (
          <div
            key={task._id}
            onClick={() => onSelectTask(task)}
            className={`p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group relative ${
              isCompleted
                ? "border-[#E7EAF0] bg-[#F8FAFC]/75 opacity-75 hover:opacity-100 hover:border-[#D0D5DD]"
                : "bg-white border-[#E7EAF0] hover:border-[#D0D5DD] hover:shadow-[0_2px_8px_rgba(16,24,40,0.04)]"
            }`}
          >
            {/* Left Section: Checkbox + Title + Attributes */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Completion Checkbox */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleComplete(task);
                }}
                className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                  isCompleted
                    ? "bg-[#12B76A] border-[#12B76A] text-white shadow-xs"
                    : "border-[#D0D5DD] hover:border-[#4F7CFF] bg-white group-hover:border-[#98A2B3]"
                }`}
                aria-label={isCompleted ? "Mark task as incomplete" : "Mark task as complete"}
              >
                {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>

              <div className="space-y-1.5 min-w-0 flex-1">
                {/* Title & Badges */}
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

                  {/* Priority Indicator */}
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono uppercase font-bold rounded-full border flex items-center gap-1 shrink-0 ${prioConfig.badge}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${prioConfig.dot}`} />
                    {task.priority}
                  </span>

                  {/* Status Indicator */}
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono uppercase font-bold rounded-full border shrink-0 ${
                      statusStyles[task.status] || statusStyles.todo
                    }`}
                  >
                    {task.status.replace("_", " ")}
                  </span>

                  {/* Recurring Indicator */}
                  {task.recurrence && task.recurrence !== "none" && (
                    <span
                      title={`Recurring: ${task.recurrence}`}
                      className="px-1.5 py-0.5 text-[10px] rounded font-mono bg-[#F8FAFC] text-[#667085] border border-[#E7EAF0] flex items-center gap-1"
                    >
                      <Repeat className="w-2.5 h-2.5 text-[#4F7CFF]" />
                      <span className="capitalize">{task.recurrence}</span>
                    </span>
                  )}
                </div>

                {/* Sub-row: Category, Subtasks, Due Date, Est. Minutes (Only displayed when fields exist) */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#667085]">
                  {task.category && task.category.trim() && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#F8FAFC] text-[#667085] border border-[#E7EAF0]">
                      {task.category}
                    </span>
                  )}

                  {/* Subtask Progress (Shown ONLY if task has subtasks) */}
                  {subtasks.length > 0 && (
                    <div className="flex items-center gap-1.5" title={`${completedSubtasksCount} of ${subtasks.length} subtasks completed`}>
                      <div className="w-12 h-1.5 rounded-full bg-[#EAECF0] overflow-hidden">
                        <div
                          className="h-full bg-[#12B76A] transition-all"
                          style={{ width: `${(completedSubtasksCount / subtasks.length) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px]">
                        {completedSubtasksCount}/{subtasks.length}
                      </span>
                    </div>
                  )}

                  {/* Estimated / Actual Duration (Shown ONLY if > 0) */}
                  {task.estimatedMinutes > 0 && (
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      <Clock className="w-3 h-3 text-[#98A2B3]" />
                      <span>{task.estimatedMinutes}m est</span>
                      {task.actualMinutes > 0 && (
                        <span className="text-[#4F7CFF] font-semibold">({task.actualMinutes}m logged)</span>
                      )}
                    </span>
                  )}

                  {/* Due Date Indicator (Shown ONLY if set) */}
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

            {/* Right Section: My Day, Quick Focus & More Actions Menu */}
            <div
              className="flex items-center gap-1 shrink-0 self-end sm:self-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* My Day Toggle */}
              {onToggleMyDay && (
                <button
                  type="button"
                  onClick={() => onToggleMyDay(task, !task.isMyDay)}
                  title={task.isMyDay ? "Remove from My Day" : "Add to My Day"}
                  className={`p-1.5 rounded-lg border transition-all text-xs cursor-pointer ${
                    task.isMyDay
                      ? "bg-[#EEF2FF] text-[#4F7CFF] border-[#4F7CFF]/30"
                      : "bg-white hover:bg-[#F8FAFC] text-[#98A2B3] hover:text-[#172033] border-[#E7EAF0] opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <Sun className={`w-3.5 h-3.5 ${task.isMyDay ? "fill-current" : ""}`} />
                </button>
              )}

              {/* Quick Focus Button */}
              {!isCompleted && (
                <button
                  type="button"
                  onClick={() => onStartFocus(task)}
                  title="Start Focus Session"
                  className="p-1.5 rounded-lg bg-white hover:bg-[#EEF2FF] text-[#667085] hover:text-[#4F7CFF] border border-[#E7EAF0] hover:border-[#4F7CFF]/30 transition-all text-xs cursor-pointer opacity-0 group-hover:opacity-100"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              )}

              {/* More Actions Dropdown */}
              <div className="relative" ref={isMenuOpen ? menuRef : null}>
                <button
                  type="button"
                  onClick={() => setOpenMenuId(isMenuOpen ? null : task._id)}
                  title="Task options"
                  className="p-1.5 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#667085] hover:text-[#172033] border border-[#E7EAF0] transition-all text-xs cursor-pointer shadow-xs"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl bg-white border border-[#E7EAF0] shadow-xl py-1 z-30 animate-fade-in text-xs">
                    {onToggleMyDay && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onToggleMyDay(task, !task.isMyDay);
                        }}
                        className="w-full text-left px-3 py-2 text-[#172033] hover:bg-[#F8FAFC] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Sun className="w-3.5 h-3.5 text-[#4F7CFF]" />
                        <span>{task.isMyDay ? "Remove from My Day" : "Add to My Day"}</span>
                      </button>
                    )}

                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onStartFocus(task);
                        }}
                        className="w-full text-left px-3 py-2 text-[#172033] hover:bg-[#F8FAFC] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 text-[#12B76A]" />
                        <span>Launch Focus</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenuId(null);
                        onEditTask(task);
                      }}
                      className="w-full text-left px-3 py-2 text-[#172033] hover:bg-[#F8FAFC] flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#667085]" />
                      <span>Edit Details</span>
                    </button>

                    <div className="my-1 border-t border-[#E7EAF0]" />

                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenuId(null);
                        onDeleteTask(task._id);
                      }}
                      className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Task</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskListView;
