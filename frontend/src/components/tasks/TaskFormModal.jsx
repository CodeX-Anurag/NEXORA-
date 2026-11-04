import React, { useState, useEffect } from "react";
import { Plus, X, Calendar, Clock, Tag, Repeat, Sun } from "lucide-react";
import Modal from "../common/Modal";
import Button from "../common/Button";

export const TaskFormModal = ({
  isOpen,
  onClose,
  onSave,
  taskToEdit = null,
  initialStatus = "todo",
  initialDate = "",
  categories = []
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState("General");
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [recurrence, setRecurrence] = useState("none");
  const [isMyDay, setIsMyDay] = useState(false);
  const [subtasks, setSubtasks] = useState([]);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || "");
      setDescription(taskToEdit.description || "");
      setStatus(taskToEdit.status || "todo");
      setPriority(taskToEdit.priority || "medium");
      setDeadline(
        taskToEdit.deadline ? new Date(taskToEdit.deadline).toISOString().split("T")[0] : ""
      );
      setCategory(taskToEdit.category || "General");
      setEstimatedMinutes(taskToEdit.estimatedMinutes || 30);
      setRecurrence(taskToEdit.recurrence || "none");
      setIsMyDay(Boolean(taskToEdit.isMyDay));
      setSubtasks(
        Array.isArray(taskToEdit.subtasks)
          ? taskToEdit.subtasks.map((st) => (typeof st === "string" ? { title: st } : st))
          : []
      );
    } else {
      setTitle("");
      setDescription("");
      setStatus(initialStatus || "todo");
      setPriority("medium");
      setDeadline(initialDate || "");
      setCategory("General");
      setEstimatedMinutes(30);
      setRecurrence("none");
      setIsMyDay(false);
      setSubtasks([]);
    }
    setSubtaskInput("");
    setFormError("");
  }, [taskToEdit, initialStatus, initialDate, isOpen]);

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!subtaskInput.trim()) return;
    setSubtasks((prev) => [...prev, { title: subtaskInput.trim(), completed: false }]);
    setSubtaskInput("");
  };

  const handleRemoveSubtask = (idx) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError("Task title is required.");
      return;
    }

    setIsSaving(true);
    setFormError("");

    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        deadline: deadline || null,
        category: category.trim() || "General",
        estimatedMinutes: Number(estimatedMinutes) || 0,
        recurrence,
        isMyDay,
        subtasks
      });
      onClose();
    } catch (err) {
      setFormError(err.message || "Failed to save task.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? "Edit Task Details" : "Create New Task"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isSaving}>
            {taskToEdit ? "Update Task" : "Create Task"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-xl bg-[#FEF3F2] border border-[#FECDCA] text-[#B42318] text-xs">
            {formError}
          </div>
        )}

        {/* Title */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#172033] tracking-normal">
            Task Title <span className="text-[#4F7CFF]">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Implement Dijkstra Algorithm in C++"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E7EAF0] hover:border-[#D0D5DD] rounded-xl text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 transition-all shadow-2xs"
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#172033] tracking-normal">
            Description
          </label>
          <textarea
            rows={2}
            placeholder="Key deliverables, lecture notes, or milestones..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-white border border-[#E7EAF0] hover:border-[#D0D5DD] rounded-xl text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 transition-all shadow-2xs"
          />
        </div>

        {/* Status & Priority Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#172033] tracking-normal">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E7EAF0] rounded-xl text-[#172033] focus:outline-none focus:border-[#4F7CFF] cursor-pointer"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#172033] tracking-normal">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E7EAF0] rounded-xl text-[#172033] focus:outline-none focus:border-[#4F7CFF] cursor-pointer"
            >
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Due Date & Category Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#172033] tracking-normal flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#4F7CFF]" /> Due Date
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E7EAF0] rounded-xl text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#172033] tracking-normal flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-[#12B76A]" /> Category
            </label>
            <input
              type="text"
              list="modal-categories"
              placeholder="e.g. Academics"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E7EAF0] rounded-xl text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
            />
            <datalist id="modal-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Estimated Duration & Recurrence */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#172033] tracking-normal flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" /> Est. Minutes
            </label>
            <input
              type="number"
              min="0"
              step="5"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E7EAF0] rounded-xl text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#172033] tracking-normal flex items-center gap-1">
              <Repeat className="w-3.5 h-3.5 text-purple-500" /> Recurrence
            </label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E7EAF0] rounded-xl text-[#172033] focus:outline-none focus:border-[#4F7CFF] cursor-pointer"
            >
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        {/* My Day Checkbox Option */}
        <label className="flex items-center gap-2 text-xs text-[#172033] cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={isMyDay}
            onChange={(e) => setIsMyDay(e.target.checked)}
            className="w-4 h-4 rounded border-[#E7EAF0] bg-white text-[#4F7CFF] focus:ring-[#4F7CFF] focus:ring-1 cursor-pointer"
          />
          <span className="flex items-center gap-1.5 font-medium">
            <Sun className="w-3.5 h-3.5 text-[#4F7CFF]" />
            <span>Add to My Day (Today's Plan)</span>
          </span>
        </label>

        {/* Subtasks Section */}
        <div className="space-y-2 pt-2 border-t border-[#F1F4F9]">
          <label className="text-xs font-semibold text-[#172033] tracking-normal block">
            Subtasks
          </label>

          {subtasks.length > 0 && (
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {subtasks.map((st, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E7EAF0]"
                >
                  <span className="text-xs text-[#172033] truncate">{st.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(i)}
                    className="text-[#98A2B3] hover:text-rose-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add subtask..."
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#E7EAF0] rounded-xl text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:border-[#4F7CFF]"
            />
            <button
              type="button"
              onClick={handleAddSubtask}
              disabled={!subtaskInput.trim()}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F8FAFC] disabled:opacity-40 text-[#172033] border border-[#E7EAF0] text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default TaskFormModal;
