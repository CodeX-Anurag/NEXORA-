import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Sparkles,
  Check,
  X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import taskService from "../services/task.service";
import ErrorMessage from "../components/common/ErrorMessage";
import Button from "../components/common/Button";

// Modular Task Workspace Components
import TaskOverviewCards from "../components/tasks/TaskOverviewCards";
import TaskFiltersBar from "../components/tasks/TaskFiltersBar";
import TaskListView from "../components/tasks/TaskListView";
import TaskMyDayView from "../components/tasks/TaskMyDayView";
import TaskKanbanBoard from "../components/tasks/TaskKanbanBoard";
import TaskCalendarView from "../components/tasks/TaskCalendarView";
import TaskAnalyticsPanel from "../components/tasks/TaskAnalyticsPanel";
import TaskDetailDrawer from "../components/tasks/TaskDetailDrawer";
import TaskFormModal from "../components/tasks/TaskFormModal";
import TaskFocusModal from "../components/tasks/TaskFocusModal";
import TaskAIModal from "../components/tasks/TaskAIModal";
import TaskListSkeleton from "../components/tasks/TaskSkeletons";

export const Tasks = () => {
  const { accessToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Task Data & Analytics State
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // View & Filtering State
  const [activeView, setActiveView] = useState("list"); // 'list' | 'my_day' | 'kanban' | 'calendar' | 'analytics'
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState("dueDate_asc");
  const [activeQuickFilter, setActiveQuickFilter] = useState(""); // 'today' | 'overdue' | 'upcoming' | 'this_week'
  const [showCompleted, setShowCompleted] = useState(true);

  // Modals & Drawers State
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [initialStatusForCreate, setInitialStatusForCreate] = useState("todo");
  const [initialDateForCreate, setInitialDateForCreate] = useState("");

  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [focusTask, setFocusTask] = useState(null);

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  /**
   * Fetch tasks and analytics from backend
   */
  const fetchData = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (search) params.search = search;
      if (sortBy) params.sortBy = sortBy;
      if (activeQuickFilter) params.dueRange = activeQuickFilter;

      const [taskRes, analyticsRes] = await Promise.all([
        taskService.getTasks(accessToken, params),
        taskService.getTaskAnalytics(accessToken).catch(() => null)
      ]);

      const fetchedTasks = taskRes.tasks || [];
      setTasks(fetchedTasks);
      if (analyticsRes) setAnalytics(analyticsRes);

      // Handle deep-linked taskId from URL query (e.g. from Notification Center click)
      const queryTaskId = searchParams.get("taskId");
      if (queryTaskId) {
        const matched = fetchedTasks.find((t) => t._id === queryTaskId);
        if (matched) {
          setSelectedTask(matched);
          setIsDrawerOpen(true);
          // Clean search param
          searchParams.delete("taskId");
          setSearchParams(searchParams, { replace: true });
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load tasks workspace.");
    } finally {
      setIsLoading(false);
    }
  }, [
    accessToken,
    statusFilter,
    priorityFilter,
    categoryFilter,
    search,
    sortBy,
    activeQuickFilter,
    searchParams,
    setSearchParams
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derive unique categories from existing tasks
  const categories = useMemo(() => {
    const set = new Set(["Academics", "Development", "Career", "Project", "Personal"]);
    tasks.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [tasks]);

  // Overview counts
  const overviewStats = useMemo(() => {
    if (analytics?.overview) {
      return {
        dueToday: analytics.overview.dueTodayCount,
        overdue: analytics.overview.overdueCount,
        upcoming: analytics.overview.upcomingCount,
        completedThisWeek: analytics.overview.completedThisWeekCount
      };
    }
    return {
      dueToday: 0,
      overdue: 0,
      upcoming: 0,
      completedThisWeek: 0
    };
  }, [analytics]);

  // Handle Quick Filter Card Click
  const handleSelectQuickFilter = (filterKey) => {
    setActiveQuickFilter(filterKey);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setCategoryFilter("");
    setSortBy("dueDate_asc");
    setActiveQuickFilter("");
  };

  // Toggle Task Completion
  const handleToggleComplete = async (task) => {
    try {
      const newStatus = task.status === "completed" ? "todo" : "completed";
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, status: newStatus } : t))
      );
      if (selectedTask && selectedTask._id === task._id) {
        setSelectedTask((prev) => ({ ...prev, status: newStatus }));
      }
      await taskService.updateTask(accessToken, task._id, { status: newStatus });
      showToast(newStatus === "completed" ? "Task marked as completed!" : "Task marked as to-do.");
      fetchData();
    } catch (err) {
      setError(err.message || "Failed to update task completion.");
      fetchData();
    }
  };

  // Toggle My Day Status
  const handleToggleMyDay = async (task, isMyDay) => {
    try {
      const nextVal = typeof isMyDay === "boolean" ? isMyDay : !task.isMyDay;
      setTasks((prev) =>
        prev.map((t) =>
          t._id === task._id ? { ...t, isMyDay: nextVal, myDayDate: nextVal ? new Date() : null } : t
        )
      );
      if (selectedTask && selectedTask._id === task._id) {
        setSelectedTask((prev) => ({
          ...prev,
          isMyDay: nextVal,
          myDayDate: nextVal ? new Date() : null
        }));
      }
      await taskService.toggleMyDay(accessToken, task._id, nextVal);
      showToast(nextVal ? "Task added to My Day!" : "Task removed from My Day.");
      fetchData();
    } catch (err) {
      setError(err.message || "Failed to update My Day status.");
      fetchData();
    }
  };

  // Update Status (for Kanban Drag and Drop)
  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
      await taskService.updateTask(accessToken, taskId, { status: newStatus });
      fetchData();
    } catch (err) {
      setError(err.message || "Failed to move task.");
      fetchData();
    }
  };

  // Save Task (Create or Update)
  const handleSaveTask = async (taskData) => {
    if (taskToEdit) {
      await taskService.updateTask(accessToken, taskToEdit._id, taskData);
      showToast("Task updated successfully.");
    } else {
      await taskService.createTask(accessToken, taskData);
      showToast("New task created in workspace.");
    }
    setIsFormModalOpen(false);
    setTaskToEdit(null);
    fetchData();
  };

  // Update from Drawer
  const handleDrawerUpdateTask = async (taskId, updateData) => {
    const updated = await taskService.updateTask(accessToken, taskId, updateData);
    setSelectedTask(updated);
    fetchData();
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    try {
      await taskService.deleteTask(accessToken, taskId);
      showToast("Task removed from workspace.");
      if (selectedTask?._id === taskId) {
        setIsDrawerOpen(false);
        setSelectedTask(null);
      }
      fetchData();
    } catch (err) {
      setError(err.message || "Failed to delete task.");
    }
  };

  // Create Task Modal Triggers
  const handleOpenCreateModal = () => {
    setTaskToEdit(null);
    setInitialStatusForCreate("todo");
    setInitialDateForCreate("");
    setIsFormModalOpen(true);
  };

  const handleCreateWithStatus = (status) => {
    setTaskToEdit(null);
    setInitialStatusForCreate(status);
    setInitialDateForCreate("");
    setIsFormModalOpen(true);
  };

  const handleCreateWithDate = (dateStr) => {
    setTaskToEdit(null);
    setInitialStatusForCreate("todo");
    setInitialDateForCreate(dateStr);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setTaskToEdit(task);
    setIsFormModalOpen(true);
  };

  // Task Focus Mode Triggers
  const handleStartFocus = (task) => {
    setFocusTask(task);
    setIsFocusModalOpen(true);
  };

  const handleFocusComplete = async (taskId, payload) => {
    await taskService.recordFocusSession(accessToken, taskId, payload);
    showToast(`Logged ${payload.minutes} minutes to task & study tracker!`);
    fetchData();
  };

  // AI Task Actions
  const handleAddBreakdownTasks = async (suggestedTasks) => {
    for (const t of suggestedTasks) {
      await taskService.createTask(accessToken, {
        title: t.title,
        description: t.description,
        category: t.category,
        priority: t.priority,
        estimatedMinutes: t.estimatedMinutes,
        subtasks: t.subtasks,
        source: "ai_breakdown"
      });
    }
    showToast(`Added ${suggestedTasks.length} tasks from AI breakdown!`);
    fetchData();
  };

  const handleSmartReschedule = async (taskId) => {
    try {
      const res = await taskService.aiSmartReschedule(accessToken, taskId);
      if (res?.suggestedDeadline) {
        const dateFormatted = new Date(res.suggestedDeadline).toLocaleDateString();
        const confirmed = window.confirm(
          `Smart Reschedule Recommendation:\n\n${res.reason}\n\nReschedule deadline to ${dateFormatted}?`
        );
        if (confirmed) {
          await taskService.updateTask(accessToken, taskId, {
            deadline: res.suggestedDeadline
          });
          showToast(`Task rescheduled to ${dateFormatted}.`);
          fetchData();
        }
      }
    } catch (err) {
      setError(err.message || "Failed to reschedule task.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* 1. Page Header Bar */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-amber-200/60 dark:border-amber-900/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 overflow-hidden">
        {/* Subtle top accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-display">
              Action & Milestones
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 font-mono">
              {tasks.length} {tasks.length === 1 ? "Task" : "Tasks"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#172033] dark:text-white font-display tracking-tight">Tasks Workspace</h1>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-400 max-w-lg leading-relaxed">
            Organize coursework, engineering milestones, and daily deadlines with intelligent prioritization.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* AI Assistant Button */}
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#111827] hover:bg-[#F8FAFC] dark:hover:bg-slate-800 text-[#172033] dark:text-slate-200 border border-[#E7EAF0] dark:border-slate-700 hover:border-violet-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
            <span>AI Assistant</span>
          </button>

          {/* Create Task Button */}
          <Button variant="primary" size="md" onClick={handleOpenCreateModal} className="bg-amber-600 hover:bg-amber-700 shadow-amber-500/25">
            <Plus className="w-4 h-4 mr-1" />
            <span>Create Task</span>
          </Button>
        </div>
      </div>

      {/* Success Notification Toast */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-[#ECFDF3] border border-[#A6F4C5] text-[#027A48] text-xs flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage("")}
            className="text-[#027A48] hover:opacity-75 font-bold p-1 cursor-pointer flex items-center justify-center rounded-lg hover:bg-[#D1FADF]/60 transition-colors"
            aria-label="Dismiss toast"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Error Message with Retry */}
      {error && <ErrorMessage title="Task Workspace Notice" message={error} onRetry={fetchData} />}

      {/* 2. Interactive Overview Summary Cards */}
      <TaskOverviewCards
        stats={overviewStats}
        activeFilter={activeQuickFilter}
        onSelectFilter={handleSelectQuickFilter}
      />

      {/* 3. Search, Granular Filters & View Switcher */}
      <TaskFiltersBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        activeView={activeView}
        onViewChange={setActiveView}
        categories={categories}
        activeQuickFilter={activeQuickFilter}
        onResetFilters={handleResetFilters}
      />

      {/* 4. Active View Workspace Container */}
      {isLoading && tasks.length === 0 ? (
        <TaskListSkeleton count={5} />
      ) : activeView === "list" ? (
        <TaskListView
          tasks={tasks}
          totalAllTasks={analytics?.overview?.totalTasks || tasks.length}
          onToggleComplete={handleToggleComplete}
          onSelectTask={(task) => {
            setSelectedTask(task);
            setIsDrawerOpen(true);
          }}
          onEditTask={handleOpenEditModal}
          onDeleteTask={handleDeleteTask}
          onStartFocus={handleStartFocus}
          onResetFilters={handleResetFilters}
          onCreateTask={handleOpenCreateModal}
          onToggleMyDay={handleToggleMyDay}
          showCompleted={showCompleted}
          onToggleShowCompleted={() => setShowCompleted((prev) => !prev)}
          searchQuery={search}
        />
      ) : activeView === "my_day" ? (
        <TaskMyDayView
          allTasks={tasks}
          onToggleComplete={handleToggleComplete}
          onSelectTask={(task) => {
            setSelectedTask(task);
            setIsDrawerOpen(true);
          }}
          onToggleMyDay={handleToggleMyDay}
          onStartFocus={handleStartFocus}
          onQuickCreateTask={async (payload) => {
            try {
              await taskService.createTask(accessToken, payload);
              showToast("Task added to today's plan!");
              fetchData();
            } catch (err) {
              setError(err.message || "Failed to add task.");
            }
          }}
        />
      ) : activeView === "kanban" ? (
        <TaskKanbanBoard
          tasks={tasks}
          onUpdateStatus={handleUpdateStatus}
          onSelectTask={(task) => {
            setSelectedTask(task);
            setIsDrawerOpen(true);
          }}
          onCreateTaskWithStatus={handleCreateWithStatus}
        />
      ) : activeView === "calendar" ? (
        <TaskCalendarView
          tasks={tasks}
          onSelectTask={(task) => {
            setSelectedTask(task);
            setIsDrawerOpen(true);
          }}
          onCreateTaskWithDate={handleCreateWithDate}
        />
      ) : (
        <TaskAnalyticsPanel analytics={analytics} />
      )}

      {/* 5. Right Slide-Over Task Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedTask(null);
        }}
        onUpdateTask={handleDrawerUpdateTask}
        onDeleteTask={handleDeleteTask}
        onStartFocus={handleStartFocus}
        onToggleMyDay={handleToggleMyDay}
        categories={categories}
      />

      {/* 6. Create / Edit Task Modal */}
      <TaskFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setTaskToEdit(null);
        }}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        initialStatus={initialStatusForCreate}
        initialDate={initialDateForCreate}
        categories={categories}
      />

      {/* 7. Focus Mode Modal */}
      <TaskFocusModal
        isOpen={isFocusModalOpen}
        onClose={() => {
          setIsFocusModalOpen(false);
          setFocusTask(null);
        }}
        task={focusTask}
        onFocusComplete={handleFocusComplete}
      />

      {/* 8. AI Task Intelligence Modal */}
      <TaskAIModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onAddBreakdownTasks={handleAddBreakdownTasks}
        onRescheduleTask={handleSmartReschedule}
        tasks={tasks}
        apiBreakdown={(payload) => taskService.aiBreakdown(accessToken, payload)}
        apiDailyPlan={(payload) => taskService.aiDailyPlan(accessToken, payload)}
        apiRiskDetection={() => taskService.aiRiskDetection(accessToken)}
      />
    </div>
  );
};

export default Tasks;
