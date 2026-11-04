import React, { useState } from "react";
import { Plus, Clock, GripVertical } from "lucide-react";

const priorityStyles = {
  urgent: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40",
  high: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40",
  medium: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40",
  low: "bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
};

export const TaskKanbanBoard = ({
  tasks = [],
  onUpdateStatus,
  onSelectTask,
  onCreateTaskWithStatus
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const columns = [
    {
      id: "todo",
      label: "To Do",
      dotColor: "bg-slate-500",
      topBar: "bg-slate-400",
      badgeColor: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
    },
    {
      id: "in_progress",
      label: "In Progress",
      dotColor: "bg-amber-500 animate-pulse",
      topBar: "bg-amber-500",
      badgeColor: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40"
    },
    {
      id: "completed",
      label: "Completed",
      dotColor: "bg-emerald-500",
      topBar: "bg-emerald-500",
      badgeColor: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40"
    }
  ];

  const handleDragStart = (e, task) => {
    setDraggedTaskId(task._id);
    e.dataTransfer.setData("text/plain", task._id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (columnId) => {
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    setDragOverColumn(null);
    setDraggedTaskId(null);

    if (taskId) {
      const task = tasks.find((t) => t._id === taskId);
      if (task && task.status !== columnId) {
        onUpdateStatus(taskId, columnId);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
      {columns.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.id);
        const isOver = dragOverColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={() => handleDragLeave(col.id)}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`relative rounded-3xl bg-[#F8FAFC] dark:bg-[#161F30] border transition-all p-4 space-y-3 min-h-[500px] flex flex-col overflow-hidden ${
              isOver
                ? "border-amber-500 bg-amber-50/20 shadow-md shadow-amber-500/10"
                : "border-[#E7EAF0] dark:border-[#1F2937]"
            }`}
          >
            {/* Top Bar Accent */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${col.topBar}`} />

            {/* Column Header */}
            <div className="flex items-center justify-between px-1 pt-1">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                <h3 className="text-xs font-bold text-[#172033] dark:text-white font-display uppercase tracking-wider">
                  {col.label}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white dark:bg-[#111827] text-[#667085] dark:text-slate-300 border border-[#E7EAF0] dark:border-slate-700 shadow-2xs">
                  {columnTasks.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onCreateTaskWithStatus(col.id)}
                title={`Add task to ${col.label}`}
                className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white border border-transparent hover:border-[#E7EAF0] dark:hover:border-slate-700 transition-colors text-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task Cards */}
            <div className="space-y-2.5 flex-1">
              {columnTasks.length === 0 ? (
                <div className="h-40 rounded-2xl border border-dashed border-[#E7EAF0] dark:border-slate-800 flex flex-col items-center justify-center p-4 text-center text-[#98A2B3] dark:text-slate-500">
                  <p className="text-xs">No tasks in {col.label.toLowerCase()}</p>
                  <button
                    type="button"
                    onClick={() => onCreateTaskWithStatus(col.id)}
                    className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline mt-1 font-semibold cursor-pointer"
                  >
                    + Add task
                  </button>
                </div>
              ) : (
                columnTasks.map((task) => {
                  const subtasks = task.subtasks || [];
                  const completedSubtasksCount = subtasks.filter((s) => s.completed).length;

                  return (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onClick={() => onSelectTask(task)}
                      className="p-3.5 rounded-2xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] hover:border-amber-400/50 hover:shadow-md shadow-2xs transition-all duration-150 cursor-grab active:cursor-grabbing space-y-2.5 group hover:-translate-y-0.5"
                    >
                      {/* Top: Category + Priority + Grip */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#F8FAFC] dark:bg-slate-800 text-[#667085] dark:text-slate-300 border border-[#E7EAF0] dark:border-slate-700 truncate">
                          {task.category || "General"}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono uppercase font-bold rounded-full border ${
                              priorityStyles[task.priority] || priorityStyles.medium
                            }`}
                          >
                            {task.priority}
                          </span>
                          <GripVertical className="w-3.5 h-3.5 text-[#98A2B3] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-semibold text-[#172033] dark:text-slate-200 leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {task.title}
                      </h4>

                      {/* Subtasks progress bar */}
                      {subtasks.length > 0 && (
                        <div className="space-y-1">
                          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 transition-all"
                              style={{
                                width: `${(completedSubtasksCount / subtasks.length) * 100}%`
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-[#667085] dark:text-slate-400 font-mono block text-right">
                            {completedSubtasksCount}/{subtasks.length} subtasks
                          </span>
                        </div>
                      )}

                      {/* Footer: Due date & Est. time */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#F1F4F9] dark:border-slate-800 text-[10px] text-[#667085] dark:text-slate-400 font-mono">
                        {task.deadline ? (
                          <span className="flex items-center gap-1 text-[#172033]">
                            <Clock className="w-3 h-3 text-[#98A2B3]" />
                            <span>
                              {new Date(task.deadline).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric"
                              })}
                            </span>
                          </span>
                        ) : (
                          <span className="text-[#98A2B3]">No due date</span>
                        )}

                        {task.estimatedMinutes > 0 && (
                          <span>{task.estimatedMinutes}m</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskKanbanBoard;
