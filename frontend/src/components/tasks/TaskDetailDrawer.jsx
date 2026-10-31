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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="w-full sm:max-w-xl h-full bg-[#161513] border-l border-[#2D2925] shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-left">
        {/* Drawer Top Navigation Bar */}
        <div className="p-4 sm:p-5 bg-[#191816] border-b border-[#2D2925] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Selector */}
            <select
              value={formData.status}
              onChange={(e) => handleFieldChange("status", e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#22201D] border border-[#332F2A] text-[#FAF7F2] focus:outline-none focus:border-[#E0693B] cursor-pointer"
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
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#22201D] border border-[#332F2A] text-[#FAF7F2] focus:outline-none focus:border-[#E0693B] cursor-pointer"
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
                  ? "bg-[#E0693B]/20 text-[#E0693B] border-[#E0693B]/40"
                  : "bg-[#22201D] text-[#9C9384] hover:text-[#FAF7F2] border-[#332F2A]"
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
              className="px-2.5 py-1 rounded-lg bg-[#E0693B]/10 hover:bg-[#E0693B]/20 text-[#E0693B] border border-[#E0693B]/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Focus</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#25221F] text-[#9C9384] hover:text-[#FAF7F2] transition-colors"
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
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#9C9384] font-mono">
              Task Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              placeholder="Task title..."
              className="w-full text-base sm:text-lg font-bold text-[#FAF7F2] bg-transparent border-b border-transparent hover:border-[#38332E] focus:border-[#E0693B] focus:outline-none pb-1 transition-colors font-display"
            />
          </div>

          {/* Description Textarea */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#9C9384] font-mono">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              placeholder="Add key details, specifications, or notes..."
              className="w-full text-xs text-[#CDC5B6] bg-[#141312] border border-[#2D2925] rounded-xl p-3 focus:outline-none focus:border-[#E0693B] transition-colors leading-relaxed"
            />
          </div>

          {/* Attributes Grid (Due Date, Category, Estimated Time, Recurrence) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 p-4 rounded-xl bg-[#191816] border border-[#2D2925]">
            {/* Due Date */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-[#9C9384] flex items-center gap-1 font-mono uppercase">
                <Calendar className="w-3 h-3 text-[#E0693B]" /> Due Date
              </span>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => handleFieldChange("deadline", e.target.value)}
                className="w-full bg-[#141312] border border-[#2D2925] rounded-lg px-2.5 py-1 text-xs text-[#FAF7F2] focus:outline-none focus:border-[#E0693B]"
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-[#9C9384] flex items-center gap-1 font-mono uppercase">
                <Tag className="w-3 h-3 text-[#2EA366]" /> Category
              </span>
              <input
                type="text"
                list="drawer-category-options"
                value={formData.category}
                onChange={(e) => handleFieldChange("category", e.target.value)}
                placeholder="Category..."
                className="w-full bg-[#141312] border border-[#2D2925] rounded-lg px-2.5 py-1 text-xs text-[#FAF7F2] focus:outline-none focus:border-[#E0693B]"
              />
              <datalist id="drawer-category-options">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* Estimated Duration */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-[#9C9384] flex items-center gap-1 font-mono uppercase">
                <Clock className="w-3 h-3 text-amber-400" /> Est. Minutes
              </span>
              <input
                type="number"
                min="0"
                step="5"
                value={formData.estimatedMinutes}
                onChange={(e) => handleFieldChange("estimatedMinutes", e.target.value)}
                className="w-full bg-[#141312] border border-[#2D2925] rounded-lg px-2.5 py-1 text-xs text-[#FAF7F2] focus:outline-none focus:border-[#E0693B]"
              />
            </div>

            {/* Recurrence */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-[#9C9384] flex items-center gap-1 font-mono uppercase">
                <Repeat className="w-3 h-3 text-purple-400" /> Recurrence
              </span>
              <select
                value={formData.recurrence}
                onChange={(e) => handleFieldChange("recurrence", e.target.value)}
                className="w-full bg-[#141312] border border-[#2D2925] rounded-lg px-2.5 py-1 text-xs text-[#FAF7F2] focus:outline-none focus:border-[#E0693B] cursor-pointer"
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
                <h4 className="text-xs font-bold text-[#FAF7F2] font-display uppercase tracking-wider">
                  Subtasks & Checklist
                </h4>
                {subtasksCount > 0 && (
                  <span className="text-[10px] font-mono text-[#9C9384]">
                    ({completedSubtasks} of {subtasksCount} completed)
                  </span>
                )}
              </div>

              {subtasksCount > 0 && (
                <span className="text-xs font-bold text-[#2EA366] font-mono">
                  {progressPercent}%
                </span>
              )}
            </div>

            {/* Progress Bar */}
            {subtasksCount > 0 && (
              <div className="w-full h-1.5 rounded-full bg-[#141312] border border-[#2D2925] overflow-hidden">
                <div
                  className="h-full bg-[#2EA366] transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            {/* Subtasks List */}
            <div className="space-y-2">
              {formData.subtasks.map((st, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#141312] border border-[#262420] group"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleSubtask(idx)}
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      st.completed
                        ? "bg-[#2EA366] border-[#2EA366] text-white"
                        : "border-[#3A352F] hover:border-[#E0693B] bg-[#191816]"
                    }`}
                  >
                    {st.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  <span
                    className={`text-xs flex-1 truncate ${
                      st.completed ? "line-through text-[#787165]" : "text-[#FAF7F2]"
                    }`}
                  >
                    {st.title}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(idx)}
                    className="p-1 rounded text-[#787165] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
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
                className="flex-1 bg-[#141312] border border-[#2D2925] rounded-xl px-3 py-1.5 text-xs text-[#FAF7F2] placeholder-[#787165] focus:outline-none focus:border-[#E0693B]"
              />
              <button
                type="submit"
                disabled={!newSubtaskTitle.trim()}
                className="px-3 py-1.5 rounded-xl bg-[#25221F] hover:bg-[#2D2925] disabled:opacity-40 text-[#FAF7F2] border border-[#38332E] text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#9C9384] font-mono flex items-center gap-1">
              <FileText className="w-3 h-3" /> Additional Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => handleFieldChange("notes", e.target.value)}
              placeholder="Personal study notes, links, or instructions..."
              className="w-full text-xs text-[#CDC5B6] bg-[#141312] border border-[#2D2925] rounded-xl p-3 focus:outline-none focus:border-[#E0693B] transition-colors leading-relaxed"
            />
          </div>

          {/* Metadata Footer */}
          <div className="pt-4 border-t border-[#262420] text-[11px] text-[#787165] space-y-1 font-mono">
            <div>Created: {new Date(task.createdAt).toLocaleString()}</div>
            {task.updatedAt && <div>Last Updated: {new Date(task.updatedAt).toLocaleString()}</div>}
            {task.actualMinutes > 0 && (
              <div className="text-[#E0693B]">
                Focus Session Time Logged: {task.actualMinutes} minutes
              </div>
            )}
          </div>
        </div>

        {/* Drawer Bottom Actions */}
        <div className="p-4 bg-[#191816] border-t border-[#2D2925] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this task?")) {
                onDeleteTask(task._id);
                onClose();
              }
            }}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/40 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Task</span>
          </button>

          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-xs text-[#2EA366] flex items-center gap-1 font-medium animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-[#CDC5B6] hover:bg-[#25221F] border border-[#332F2A] transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#E0693B] hover:bg-[#EB784B] shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
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
