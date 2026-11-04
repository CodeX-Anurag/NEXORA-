import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  Tag,
  Check,
  Plus,
  Trash2,
  Play,
  Repeat,
  FileText,
  Save,
  CheckCircle2,
  Sun
} from "lucide-react";

export const TaskDetailDrawer = ({
  task,
  isOpen,
  onClose,
  onUpdateTask,
  onDeleteTask,
  onStartFocus,
  onToggleMyDay,
  categories = []
}) => {
  const [formData, setFormData] = useState(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "todo",
        priority: task.priority || "medium",
        deadline: task.deadline ? new Date(task.deadline).toISOString().split("T")[0] : "",
        category: task.category || "General",
        estimatedMinutes: task.estimatedMinutes || 0,
        actualMinutes: task.actualMinutes || 0,
        subtasks: Array.isArray(task.subtasks) ? [...task.subtasks] : [],
        recurrence: task.recurrence || "none",
        isMyDay: Boolean(task.isMyDay),
        notes: task.notes || ""
      });
      setSaveSuccess(false);
    }
  }, [task]);

  if (!isOpen || !task || !formData) return null;

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleSubtask = (index) => {
    const updated = [...formData.subtasks];
    updated[index] = {
      ...updated[index],
      completed: !updated[index].completed,
      completedAt: !updated[index].completed ? new Date() : null
    };
    setFormData((prev) => ({ ...prev, subtasks: updated }));
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    setFormData((prev) => ({
      ...prev,
      subtasks: [...prev.subtasks, { title: newSubtaskTitle.trim(), completed: false }]
    }));
    setNewSubtaskTitle("");
  };

  const handleDeleteSubtask = (index) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateTask(task._id, formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch {
      // Swallowed safely
    } finally {
      setIsSaving(false);
    }
  };

  const completedSubtasks = formData.subtasks.filter((s) => s.completed).length;
  const subtasksCount = formData.subtasks.length;
  const progressPercent = subtasksCount > 0 ? Math.round((completedSubtasks / subtasksCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="w-full sm:max-w-xl h-full bg-white border-l border-[#E7EAF0] shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-left">
        {/* Drawer Top Navigation Bar */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#E7EAF0] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Selector */}
            <select
              value={formData.status}
              onChange={(e) => handleFieldChange("status", e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#F8FAFC] border border-[#E7EAF0] text-[#172033] focus:outline-none focus:border-[#4F7CFF] cursor-pointer"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="completed">Completed</option>
            </select>

            {/* Priority Selector */}
            <select
              value={formData.priority}
              onChange={(e) => handleFieldChange("priority", e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#F8FAFC] border border-[#E7EAF0] text-[#172033] focus:outline-none focus:border-[#4F7CFF] cursor-pointer"
            >
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* My Day Toggle Pill */}
            <button
              type="button"
              onClick={() => {
                const nextVal = !formData.isMyDay;
                handleFieldChange("isMyDay", nextVal);
                if (onToggleMyDay) onToggleMyDay(task, nextVal);
              }}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                formData.isMyDay
                  ? "bg-[#EEF2FF] text-[#4F7CFF] border-[#4F7CFF]/30"
                  : "bg-[#F8FAFC] text-[#667085] hover:text-[#172033] border-[#E7EAF0]"
              }`}
              title="Add or remove from today's plan"
            >
              <Sun className={`w-3 h-3 ${formData.isMyDay ? "fill-current" : ""}`} />
              <span>{formData.isMyDay ? "In My Day" : "Add to My Day"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onStartFocus(task)}
              className="px-2.5 py-1 rounded-lg bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F7CFF] border border-[#4F7CFF]/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Focus</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#F8FAFC] text-[#667085] hover:text-[#172033] transition-colors cursor-pointer"
              aria-label="Close detail drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#667085] font-mono">
              Task Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              placeholder="Task title..."
              className="w-full text-base sm:text-lg font-bold text-[#172033] bg-transparent border-b border-[#E7EAF0] hover:border-[#D0D5DD] focus:border-[#4F7CFF] focus:outline-none pb-1 transition-colors font-display"
            />
          </div>

          {/* Description Textarea */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#667085] font-mono">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              placeholder="Add key details, specifications, or notes..."
              className="w-full text-xs text-[#172033] bg-[#F8FAFC] border border-[#E7EAF0] rounded-xl p-3 focus:outline-none focus:border-[#4F7CFF] transition-colors leading-relaxed placeholder-[#98A2B3]"
            />
          </div>

          {/* Attributes Grid (Due Date, Category, Estimated Time, Recurrence) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E7EAF0]">
            {/* Due Date */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-[#667085] flex items-center gap-1 font-mono uppercase">
                <Calendar className="w-3 h-3 text-[#4F7CFF]" /> Due Date
              </span>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => handleFieldChange("deadline", e.target.value)}
                className="w-full bg-white border border-[#E7EAF0] rounded-lg px-2.5 py-1 text-xs text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-[#667085] flex items-center gap-1 font-mono uppercase">
                <Tag className="w-3 h-3 text-[#12B76A]" /> Category
              </span>
              <input
                type="text"
                list="drawer-category-options"
                value={formData.category}
                onChange={(e) => handleFieldChange("category", e.target.value)}
                placeholder="Category..."
                className="w-full bg-white border border-[#E7EAF0] rounded-lg px-2.5 py-1 text-xs text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
              />
              <datalist id="drawer-category-options">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* Estimated Duration */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-[#667085] flex items-center gap-1 font-mono uppercase">
                <Clock className="w-3 h-3 text-amber-500" /> Est. Minutes
              </span>
              <input
                type="number"
                min="0"
                step="5"
                value={formData.estimatedMinutes}
                onChange={(e) => handleFieldChange("estimatedMinutes", e.target.value)}
                className="w-full bg-white border border-[#E7EAF0] rounded-lg px-2.5 py-1 text-xs text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
              />
            </div>

            {/* Recurrence */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-[#667085] flex items-center gap-1 font-mono uppercase">
                <Repeat className="w-3 h-3 text-purple-500" /> Recurrence
              </span>
              <select
                value={formData.recurrence}
                onChange={(e) => handleFieldChange("recurrence", e.target.value)}
                className="w-full bg-white border border-[#E7EAF0] rounded-lg px-2.5 py-1 text-xs text-[#172033] focus:outline-none focus:border-[#4F7CFF] cursor-pointer"
              >
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-[#172033] font-display uppercase tracking-wider">
                  Subtasks & Checklist
                </h4>
                {subtasksCount > 0 && (
                  <span className="text-[10px] font-mono text-[#667085]">
                    ({completedSubtasks} of {subtasksCount} completed)
                  </span>
                )}
              </div>

              {subtasksCount > 0 && (
                <span className="text-xs font-bold text-[#12B76A] font-mono">
                  {progressPercent}%
                </span>
              )}
            </div>

            {/* Progress Bar */}
            {subtasksCount > 0 && (
              <div className="w-full h-1.5 rounded-full bg-[#EAECF0] overflow-hidden">
                <div
                  className="h-full bg-[#12B76A] transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            {/* Subtasks List */}
            <div className="space-y-2">
              {formData.subtasks.map((st, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#F8FAFC] border border-[#E7EAF0] group"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleSubtask(idx)}
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                      st.completed
                        ? "bg-[#12B76A] border-[#12B76A] text-white"
                        : "border-[#D0D5DD] hover:border-[#4F7CFF] bg-white"
                    }`}
                  >
                    {st.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  <span
                    className={`text-xs flex-1 truncate ${
                      st.completed ? "line-through text-[#98A2B3]" : "text-[#172033]"
                    }`}
                  >
                    {st.title}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(idx)}
                    className="p-1 rounded text-[#98A2B3] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    aria-label="Delete subtask"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Subtask Input */}
            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input
                type="text"
                placeholder="Add subtask and press Enter..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="flex-1 bg-[#F8FAFC] border border-[#E7EAF0] rounded-xl px-3 py-1.5 text-xs text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:border-[#4F7CFF]"
              />
              <button
                type="submit"
                disabled={!newSubtaskTitle.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F8FAFC] disabled:opacity-40 text-[#172033] border border-[#E7EAF0] text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#667085] font-mono flex items-center gap-1">
              <FileText className="w-3 h-3" /> Additional Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => handleFieldChange("notes", e.target.value)}
              placeholder="Personal study notes, links, or instructions..."
              className="w-full text-xs text-[#172033] bg-[#F8FAFC] border border-[#E7EAF0] rounded-xl p-3 focus:outline-none focus:border-[#4F7CFF] transition-colors leading-relaxed placeholder-[#98A2B3]"
            />
          </div>

          {/* Metadata Footer */}
          <div className="pt-4 border-t border-[#F1F4F9] text-[11px] text-[#667085] space-y-1 font-mono">
            <div>Created: {new Date(task.createdAt).toLocaleString()}</div>
            {task.updatedAt && <div>Last Updated: {new Date(task.updatedAt).toLocaleString()}</div>}
            {task.actualMinutes > 0 && (
              <div className="text-[#4F7CFF] font-semibold">
                Focus Session Time Logged: {task.actualMinutes} minutes
              </div>
            )}
          </div>
        </div>

        {/* Drawer Bottom Actions */}
        <div className="p-4 bg-white border-t border-[#E7EAF0] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this task?")) {
                onDeleteTask(task._id);
                onClose();
              }
            }}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Task</span>
          </button>

          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-xs text-[#12B76A] flex items-center gap-1 font-medium animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-[#667085] hover:bg-[#F8FAFC] border border-[#E7EAF0] transition-colors cursor-pointer shadow-xs"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#4F7CFF] hover:bg-[#3D68E5] shadow-sm shadow-[#4F7CFF]/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailDrawer;
