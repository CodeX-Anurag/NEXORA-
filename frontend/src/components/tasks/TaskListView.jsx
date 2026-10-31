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
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    dot: "bg-rose-500 animate-pulse"
  },
  high: {
    badge: "bg-rose-950/40 text-rose-300 border-rose-800/40",
    dot: "bg-rose-400"
  },
  medium: {
    badge: "bg-amber-950/40 text-amber-300 border-amber-800/40",
    dot: "bg-amber-400"
  },
  low: {
    badge: "bg-[#22201D] text-[#9C9384] border-[#332F2A]",
    dot: "bg-[#787165]"
  }
};

const statusStyles = {
  todo: "bg-[#22201D] text-[#9C9384] border-[#332F2A]",
  in_progress: "bg-[#E0693B]/10 text-[#E0693B] border-[#E0693B]/30",
  in_review: "bg-purple-500/10 text-purple-300 border-purple-500/30",
  completed: "bg-[#2EA366]/10 text-[#2EA366] border-[#2EA366]/30"
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
        <div className="p-8 sm:p-10 rounded-2xl bg-[#191816] border border-dashed border-[#2D2925] text-center space-y-3.5 animate-fade-in">
          <div className="w-11 h-11 rounded-full bg-[#201E1B] border border-[#332F2A] flex items-center justify-center text-[#9C9384] mx-auto">
            <CheckCircle2 className="w-5 h-5 text-[#2EA366]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#FAF7F2] font-display">No tasks created yet</h3>
            <p className="text-xs text-[#9C9384] max-w-sm mx-auto">
              Get started by creating your first task or using the AI Assistant to break down your goals.
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateTask}
            className="px-4 py-2 rounded-xl bg-[#E0693B] hover:bg-[#EB784B] text-white text-xs font-semibold shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>+ Create Task</span>
          </button>
        </div>
      );
    }

    if (searchQuery) {
      return (
        <div className="p-8 sm:p-10 rounded-2xl bg-[#191816] border border-dashed border-[#2D2925] text-center space-y-3.5 animate-fade-in">
          <div className="w-11 h-11 rounded-full bg-[#201E1B] border border-[#332F2A] flex items-center justify-center text-[#787165] mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#FAF7F2] font-display">No matching search results</h3>
            <p className="text-xs text-[#9C9384] max-w-sm mx-auto">
              No tasks matched <span className="text-[#FAF7F2] font-semibold font-mono">"{searchQuery}"</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={onResetFilters}
            className="px-3.5 py-1.5 rounded-xl bg-[#25221F] hover:bg-[#2D2925] text-[#FAF7F2] border border-[#38332E] text-xs font-semibold transition-all cursor-pointer"
          >
            Clear Search & Filters
          </button>
        </div>
      );
    }

    if (!showCompleted && completedCount > 0 && tasks.length === completedCount) {
      return (
        <div className="p-8 sm:p-10 rounded-2xl bg-[#191816] border border-dashed border-[#2D2925] text-center space-y-3.5 animate-fade-in">
          <div className="w-11 h-11 rounded-full bg-[#2EA366]/10 border border-[#2EA366]/20 flex items-center justify-center text-[#2EA366] mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#FAF7F2] font-display">All tasks completed!</h3>
            <p className="text-xs text-[#9C9384] max-w-sm mx-auto">
              You have completed all {completedCount} tasks in this view.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={onToggleShowCompleted}
              className="px-3.5 py-1.5 rounded-xl bg-[#25221F] hover:bg-[#2D2925] text-[#FAF7F2] border border-[#38332E] text-xs font-semibold transition-all cursor-pointer"
            >
              Show Completed ({completedCount})
            </button>
            <button
              type="button"
              onClick={onCreateTask}
              className="px-3.5 py-1.5 rounded-xl bg-[#E0693B] hover:bg-[#EB784B] text-white text-xs font-semibold transition-all cursor-pointer"
            >
              + Create New Task
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-8 sm:p-10 rounded-2xl bg-[#191816] border border-dashed border-[#2D2925] text-center space-y-3.5 animate-fade-in">
        <div className="w-11 h-11 rounded-full bg-[#201E1B] border border-[#332F2A] flex items-center justify-center text-[#787165] mx-auto">
          <ListTodo className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-[#FAF7F2] font-display">No tasks match current filters</h3>
          <p className="text-xs text-[#9C9384] max-w-sm mx-auto">
            Try adjusting your status, priority, category, or due date filters.
          </p>
        </div>
        <button
          type="button"
          onClick={onResetFilters}
          className="px-3.5 py-1.5 rounded-xl bg-[#25221F] hover:bg-[#2D2925] text-[#FAF7F2] border border-[#38332E] text-xs font-semibold transition-all cursor-pointer"
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
        <span className="text-[#9C9384] font-mono text-[11px]">
          Showing {displayedTasks.length} {displayedTasks.length === 1 ? "task" : "tasks"}
        </span>

        {completedCount > 0 && onToggleShowCompleted && (
          <button
            type="button"
            onClick={onToggleShowCompleted}
            className="flex items-center gap-1.5 text-[11px] font-medium text-[#9C9384] hover:text-[#FAF7F2] transition-colors cursor-pointer select-none"
          >
            {showCompleted ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-[#787165]" />
                <span>Hide completed ({completedCount})</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-[#E0693B]" />
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
            className={`p-3 sm:p-3.5 rounded-xl bg-[#191816] border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group relative ${
              isCompleted
                ? "border-[#24211D] bg-[#161513]/60 opacity-75 hover:opacity-100 hover:border-[#332F2A]"
                : "border-[#2D2925] hover:border-[#3E3832] hover:bg-[#1E1C19]"
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
                    ? "bg-[#2EA366] border-[#2EA366] text-white shadow-xs"
                    : "border-[#3A352F] hover:border-[#E0693B] bg-[#141312] group-hover:border-[#4D463F]"
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
                        ? "line-through text-[#787165]"
                        : "text-[#FAF7F2] group-hover:text-[#E0693B] transition-colors"
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
                      className="px-1.5 py-0.5 text-[10px] rounded font-mono bg-[#1E1C19] text-[#CDC5B6] border border-[#2D2925] flex items-center gap-1"
                    >
                      <Repeat className="w-2.5 h-2.5 text-[#E0693B]" />
                      <span className="capitalize">{task.recurrence}</span>
                    </span>
                  )}
                </div>

                {/* Sub-row: Category, Subtasks, Due Date, Est. Minutes (Only displayed when fields exist) */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#9C9384]">
                  {task.category && task.category.trim() && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#141312] text-[#CDC5B6] border border-[#2D2925]">
                      {task.category}
                    </span>
                  )}

                  {/* Subtask Progress (Shown ONLY if task has subtasks) */}
                  {subtasks.length > 0 && (
                    <div className="flex items-center gap-1.5" title={`${completedSubtasksCount} of ${subtasks.length} subtasks completed`}>
                      <div className="w-12 h-1.5 rounded-full bg-[#141312] border border-[#2D2925] overflow-hidden">
                        <div
                          className="h-full bg-[#2EA366] transition-all"
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
                      <Clock className="w-3 h-3 text-[#787165]" />
                      <span>{task.estimatedMinutes}m est</span>
                      {task.actualMinutes > 0 && (
                        <span className="text-[#E0693B]">({task.actualMinutes}m logged)</span>
                      )}
                    </span>
                  )}

                  {/* Due Date Indicator (Shown ONLY if set) */}
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
                      ? "bg-[#E0693B]/20 text-[#E0693B] border-[#E0693B]/40"
                      : "bg-[#25221F] hover:bg-[#2D2925] text-[#787165] hover:text-[#CDC5B6] border-[#332F2A] opacity-0 group-hover:opacity-100"
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
                  className="p-1.5 rounded-lg bg-[#25221F] hover:bg-[#E0693B]/20 text-[#CDC5B6] hover:text-[#E0693B] border border-[#332F2A] hover:border-[#E0693B]/30 transition-all text-xs cursor-pointer opacity-0 group-hover:opacity-100"
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
                  className="p-1.5 rounded-lg bg-[#25221F] hover:bg-[#2D2925] text-[#CDC5B6] hover:text-[#FAF7F2] border border-[#332F2A] transition-all text-xs cursor-pointer"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl bg-[#1C1A17] border border-[#332F2A] shadow-2xl py-1 z-30 animate-fade-in text-xs">
                    {onToggleMyDay && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onToggleMyDay(task, !task.isMyDay);
                        }}
                        className="w-full text-left px-3 py-2 text-[#CDC5B6] hover:text-[#FAF7F2] hover:bg-[#25221F] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Sun className="w-3.5 h-3.5 text-[#E0693B]" />
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
                        className="w-full text-left px-3 py-2 text-[#CDC5B6] hover:text-[#FAF7F2] hover:bg-[#25221F] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 text-[#2EA366]" />
                        <span>Launch Focus</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenuId(null);
                        onEditTask(task);
                      }}
                      className="w-full text-left px-3 py-2 text-[#CDC5B6] hover:text-[#FAF7F2] hover:bg-[#25221F] flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Details</span>
                    </button>

                    <div className="my-1 border-t border-[#2D2925]" />

                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenuId(null);
                        onDeleteTask(task._id);
                      }}
                      className="w-full text-left px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 flex items-center gap-2 transition-colors cursor-pointer"
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
