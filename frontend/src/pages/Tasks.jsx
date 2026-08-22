import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import taskService from "../services/task.service";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";

export const Tasks = () => {
  const { accessToken } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    deadline: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError("");
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const data = await taskService.getTasks(accessToken, params);
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err.message || "Failed to load tasks.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setFormData({
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      deadline: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      deadline: task.deadline ? task.deadline.split("T")[0] : ""
    });
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSaving(true);
    setError("");

    try {
      if (editingTask) {
        await taskService.updateTask(accessToken, editingTask._id, formData);
      } else {
        await taskService.createTask(accessToken, formData);
      }
      setIsModalOpen(false);
      fetchTasks();
    } catch (err) {
      setError(err.message || "Failed to save task.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleComplete = async (task) => {
    const nextStatus = task.status === "completed" ? "todo" : "completed";
    try {
      await taskService.updateTask(accessToken, task._id, { status: nextStatus });
      fetchTasks();
    } catch (err) {
      setError(err.message || "Failed to update task status.");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await taskService.deleteTask(accessToken, taskId);
      fetchTasks();
    } catch (err) {
      setError(err.message || "Failed to delete task.");
    }
  };

  const priorityBadges = {
    low: "bg-slate-800 text-slate-300 border-slate-700",
    medium: "bg-amber-950/60 text-amber-300 border-amber-800/60",
    high: "bg-rose-950/60 text-rose-300 border-rose-800/60"
  };

  const statusBadges = {
    todo: "bg-slate-800 text-slate-300",
    in_progress: "bg-indigo-950 text-indigo-300 border-indigo-800",
    completed: "bg-emerald-950 text-emerald-300 border-emerald-800"
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Tasks Management</h1>
          <p className="text-xs text-slate-400 mt-1">Organize your academic goals, deadlines, and priorities</p>
        </div>
        <Button variant="primary" onClick={handleOpenCreateModal}>
          + Create Task
        </Button>
      </div>

      {error && <ErrorMessage title="Task Operation Error" message={error} onRetry={fetchTasks} />}

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { label: "All Tasks", value: "" },
            { label: "To Do", value: "todo" },
            { label: "In Progress", value: "in_progress" },
            { label: "Completed", value: "completed" }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
                statusFilter === tab.value
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Tasks List Container */}
      {isLoading ? (
        <Loader text="Loading task items..." />
      ) : tasks.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-200">No tasks found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {statusFilter || priorityFilter
              ? "No tasks match your current filter parameters."
              : "Get started by creating your first task."}
          </p>
          <Button variant="primary" size="sm" onClick={handleOpenCreateModal}>
            + Add Task Now
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task._id}
              className={`p-4 rounded-xl bg-slate-900 border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                task.status === "completed" ? "border-slate-800/50 opacity-75" : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Complete Toggle Checkbox */}
                <button
                  onClick={() => handleToggleComplete(task)}
                  className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                    task.status === "completed"
                      ? "bg-emerald-600 border-emerald-500 text-white"
                      : "border-slate-700 hover:border-indigo-500"
                  }`}
                  aria-label="Toggle task status"
                >
                  {task.status === "completed" && (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`text-sm font-semibold ${task.status === "completed" ? "line-through text-slate-400" : "text-slate-100"}`}>
                      {task.title}
                    </h3>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border uppercase ${priorityBadges[task.priority]}`}>
                      {task.priority}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border uppercase ${statusBadges[task.status]}`}>
                      {task.status.replace("_", " ")}
                    </span>
                  </div>
                  {task.description && <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>}
                  {task.deadline && (
                    <p className="text-[11px] text-indigo-400 font-mono">
                      Deadline: {new Date(task.deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="secondary" size="sm" onClick={() => handleOpenEditModal(task)}>
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDeleteTask(task._id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Modal (Create & Edit) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? "Edit Task" : "Create New Task"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveTask} isLoading={isSaving}>
              {editingTask ? "Update Task" : "Create Task"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          <Input
            label="Task Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Read Operating Systems Chapter 4"
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Task details and sub-steps..."
              className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <Input
            label="Deadline Date (Optional)"
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
};

export default Tasks;
