import React, { useState } from "react";
import { Plus, Clock, GripVertical } from "lucide-react";

const priorityStyles = {
  urgent: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  high: "bg-rose-950/40 text-rose-300 border-rose-800/40",
  medium: "bg-amber-950/40 text-amber-300 border-amber-800/40",
  low: "bg-[#22201D] text-[#9C9384] border-[#332F2A]"
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
    { id: "todo", label: "To Do", dotColor: "bg-[#787165]" },
    { id: "in_progress", label: "In Progress", dotColor: "bg-[#E0693B]" },
    { id: "completed", label: "Completed", dotColor: "bg-[#2EA366]" }
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
            className={`rounded-2xl bg-[#161513] border transition-all p-3.5 space-y-3 min-h-[500px] flex flex-col ${
              isOver
                ? "border-[#E0693B]/60 bg-[#1A1815] shadow-lg shadow-[#E0693B]/5"
                : "border-[#262420]"
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                <h3 className="text-xs font-bold text-[#FAF7F2] font-display uppercase tracking-wider">
                  {col.label}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#22201D] text-[#9C9384] border border-[#2D2925]">
                  {columnTasks.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onCreateTaskWithStatus(col.id)}
                title={`Add task to ${col.label}`}
                className="p-1 rounded-lg hover:bg-[#25221F] text-[#9C9384] hover:text-[#FAF7F2] transition-colors text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task Cards */}
            <div className="space-y-2.5 flex-1">
              {columnTasks.length === 0 ? (
                <div className="h-40 rounded-xl border border-dashed border-[#262420] flex flex-col items-center justify-center p-4 text-center text-[#787165]">
                  <p className="text-xs">No tasks in {col.label.toLowerCase()}</p>
                  <button
                    type="button"
                    onClick={() => onCreateTaskWithStatus(col.id)}
                    className="text-[11px] text-[#E0693B] hover:underline mt-1 font-medium"
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
                      className="p-3.5 rounded-xl bg-[#191816] border border-[#2D2925] hover:border-[#3E3832] hover:bg-[#1E1C19] shadow-sm transition-all cursor-grab active:cursor-grabbing space-y-2.5 group"
                    >
                      {/* Top: Category + Priority + Grip */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#141312] text-[#CDC5B6] border border-[#2D2925] truncate">
                          {task.category || "General"}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-mono uppercase font-bold rounded-full border ${
                              priorityStyles[task.priority] || priorityStyles.medium
                            }`}
                          >
                            {task.priority}
                          </span>
                          <GripVertical className="w-3.5 h-3.5 text-[#787165] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-semibold text-[#FAF7F2] leading-snug group-hover:text-[#E0693B] transition-colors">
                        {task.title}
                      </h4>

                      {/* Subtasks progress bar */}
                      {subtasks.length > 0 && (
                        <div className="space-y-1">
                          <div className="w-full h-1.5 rounded-full bg-[#141312] border border-[#2D2925] overflow-hidden">
                            <div
                              className="h-full bg-[#2EA366] transition-all"
                              style={{
                                width: `${(completedSubtasksCount / subtasks.length) * 100}%`
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-[#9C9384] font-mono block text-right">
                            {completedSubtasksCount}/{subtasks.length} subtasks
                          </span>
                        </div>
                      )}

                      {/* Footer: Due date & Est. time */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#262420] text-[10px] text-[#9C9384] font-mono">
                        {task.deadline ? (
                          <span className="flex items-center gap-1 text-[#CDC5B6]">
                            <Clock className="w-3 h-3 text-[#787165]" />
                            <span>
                              {new Date(task.deadline).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric"
                              })}
                            </span>
                          </span>
                        ) : (
                          <span className="text-[#686257]">No due date</span>
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
