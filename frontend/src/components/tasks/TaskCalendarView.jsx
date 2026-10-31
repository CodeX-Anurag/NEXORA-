import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";

const priorityDotColors = {
  urgent: "bg-rose-500",
  high: "bg-rose-400",
  medium: "bg-amber-400",
  low: "bg-[#787165]"
};

export const TaskCalendarView = ({
  tasks = [],
  onSelectTask,
  onCreateTaskWithDate
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of current month
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayIndex = firstDayOfMonth.getDay(); // 0 = Sunday

  // Number of days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Build task map by YYYY-MM-DD
  const tasksByDate = {};
  const unscheduledTasks = [];

  tasks.forEach((task) => {
    if (task.deadline) {
      const d = new Date(task.deadline);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      if (!tasksByDate[key]) tasksByDate[key] = [];
      tasksByDate[key].push(task);
    } else {
      unscheduledTasks.push(task);
    }
  });

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Generate calendar grid cells (empty slots for preceding days + month days)
  const calendarCells = [];
  for (let i = 0; i < startDayIndex; i++) {
    calendarCells.push({ dayNumber: null });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    calendarCells.push({
      dayNumber: day,
      dateKey,
      isToday: dateKey === todayKey,
      tasks: tasksByDate[dateKey] || []
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      {/* Main Calendar Grid (3 cols on large screen) */}
      <div className="lg:col-span-3 p-5 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-4">
        {/* Calendar Navigation Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2D2925]">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#E0693B]" />
            <h3 className="text-base font-bold text-[#FAF7F2] font-display">{monthName}</h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#25221F] hover:bg-[#2D2925] text-[#FAF7F2] border border-[#38332E] transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-[#25221F] hover:bg-[#2D2925] text-[#FAF7F2] border border-[#38332E] transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-[#25221F] hover:bg-[#2D2925] text-[#FAF7F2] border border-[#38332E] transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday Labels */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekDays.map((wd) => (
            <div key={wd} className="text-[11px] font-bold uppercase tracking-wider text-[#787165] py-1">
              {wd}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarCells.map((cell, idx) => {
            if (!cell.dayNumber) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[90px] rounded-xl bg-[#141312]/40 border border-transparent"
                />
              );
            }

            return (
              <div
                key={cell.dateKey}
                onClick={() => onCreateTaskWithDate(cell.dateKey)}
                className={`min-h-[90px] p-2 rounded-xl bg-[#141312] border transition-all text-left flex flex-col justify-between group cursor-pointer ${
                  cell.isToday
                    ? "border-[#E0693B]/50 bg-[#E0693B]/5"
                    : "border-[#24211D] hover:border-[#38332E] hover:bg-[#1A1815]"
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-mono font-bold flex items-center justify-center ${
                      cell.isToday
                        ? "bg-[#E0693B] text-white"
                        : "text-[#CDC5B6] group-hover:text-[#FAF7F2]"
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                  {cell.tasks.length > 0 && (
                    <span className="text-[10px] font-mono text-[#9C9384] font-semibold">
                      {cell.tasks.length}
                    </span>
                  )}
                </div>

                {/* Task Badges inside cell */}
                <div className="space-y-1 mt-1 overflow-y-auto max-h-[60px] scrollbar-none">
                  {cell.tasks.slice(0, 3).map((task) => (
                    <div
                      key={task._id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTask(task);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] truncate flex items-center gap-1 font-medium border transition-colors ${
                        task.status === "completed"
                          ? "bg-[#1E1C19] border-[#2B2723] text-[#787165] line-through"
                          : "bg-[#1C1A17] hover:bg-[#25221F] border-[#302C28] text-[#FAF7F2]"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          priorityDotColors[task.priority] || priorityDotColors.medium
                        }`}
                      />
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                  {cell.tasks.length > 3 && (
                    <span className="text-[9px] text-[#E0693B] block font-mono pl-1">
                      +{cell.tasks.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar: Unscheduled Tasks (1 col) */}
      <div className="p-5 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#2D2925]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#9C9384]" />
            <h4 className="text-xs font-bold text-[#FAF7F2] uppercase tracking-wider font-display">
              Without Due Date
            </h4>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#141312] text-[#9C9384] border border-[#2D2925]">
            {unscheduledTasks.length}
          </span>
        </div>

        {unscheduledTasks.length === 0 ? (
          <p className="text-xs text-[#787165] italic py-4 text-center">
            All tasks have scheduled deadlines.
          </p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {unscheduledTasks.map((task) => (
              <div
                key={task._id}
                onClick={() => onSelectTask(task)}
                className="p-3 rounded-xl bg-[#141312] border border-[#262420] hover:border-[#38332E] hover:bg-[#1A1815] transition-all cursor-pointer space-y-1.5 group"
              >
                <div className="flex items-center justify-between gap-1">
                  <h5 className="text-xs font-semibold text-[#FAF7F2] truncate group-hover:text-[#E0693B] transition-colors">
                    {task.title}
                  </h5>
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold rounded-full border shrink-0 ${
                      task.priority === "urgent"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        : "bg-[#22201D] text-[#9C9384] border-[#332F2A]"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#9C9384] font-mono">
                  <span>{task.category || "General"}</span>
                  {task.estimatedMinutes > 0 && <span>{task.estimatedMinutes}m est</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCalendarView;
