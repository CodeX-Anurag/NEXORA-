import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Clock,
  CheckCircle2,
  Timer,
  BookOpen,
  Trash2,
  Plus,
  Play,
  Calendar,
  Flame,
  BarChart2,
  TrendingUp,
  Filter,
  Sparkles
} from "lucide-react";
import {
  BarChart,
  Bar,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { useAuth } from "../context/AuthContext";
import studyService from "../services/study.service";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import StatCard from "../components/common/StatCard";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";
import { getSubjectTheme } from "../utils/colorSystem";
import StudyFocusModal from "../components/study/StudyFocusModal";

const PRESET_SUBJECTS = [
  "DSA & Algorithms",
  "DBMS & SQL",
  "Web Development",
  "Mathematics",
  "Operating Systems",
  "System Design"
];

const QUICK_DURATIONS = [25, 45, 60, 90, 120];

export const Study = () => {
  const { accessToken } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Chart view toggle: "subject" | "timeline"
  const [activeChartView, setActiveChartView] = useState("subject");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [formData, setFormData] = useState({
    subject: "",
    duration: "45",
    notes: "",
    date: new Date().toISOString().split("T")[0]
  });
  const [isSaving, setIsSaving] = useState(false);

  // Focus Timer Session State
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [focusSubject, setFocusSubject] = useState("DSA & Algorithms");
  const [successToast, setSuccessToast] = useState("");

  const fetchStudySessions = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const params = {};
      if (subjectFilter) params.subject = subjectFilter;

      const data = await studyService.getStudySessions(accessToken, params);
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err.message || "Failed to load study sessions.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, subjectFilter]);

  useEffect(() => {
    fetchStudySessions();
  }, [fetchStudySessions]);

  const handleOpenRecordModal = () => {
    setFormData({
      subject: "",
      duration: "45",
      notes: "",
      date: new Date().toISOString().split("T")[0]
    });
    setIsModalOpen(true);
  };

  const handleSaveSession = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.duration) return;

    setIsSaving(true);
    setError("");

    try {
      await studyService.createStudySession(accessToken, formData);
      setIsModalOpen(false);
      fetchStudySessions();
    } catch (err) {
      setError(err.message || "Failed to record study session.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSession = (sessionId) => {
    setDeleteConfirmId(sessionId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId || !accessToken) return;
    try {
      await studyService.deleteStudySession(accessToken, deleteConfirmId);
      setDeleteConfirmId(null);
      fetchStudySessions();
    } catch (err) {
      setError(err.message || "Failed to delete session.");
    }
  };

  const handleStartFocus = (subj = "DSA & Algorithms") => {
    setFocusSubject(subj);
    setIsFocusModalOpen(true);
  };

  const handleFocusComplete = async (sessionData) => {
    if (!accessToken) return;
    try {
      await studyService.createStudySession(accessToken, sessionData);
      setSuccessToast(`Logged ${sessionData.duration}m focus session on "${sessionData.subject}"! 🎉`);
      setTimeout(() => setSuccessToast(""), 5000);
      fetchStudySessions();
    } catch (err) {
      setError(err.message || "Failed to log focus study session.");
    }
  };

  // KPI Calculations
  const totalMinutes = useMemo(() => {
    return sessions.reduce((acc, curr) => acc + (parseInt(curr.duration, 10) || 0), 0);
  }, [sessions]);

  const totalHours = (totalMinutes / 60).toFixed(1);

  const uniqueSubjects = useMemo(() => {
    const subs = new Set(sessions.map((s) => s.subject));
    return subs.size;
  }, [sessions]);

  // Aggregate Chart Data: Duration by Subject (Multi-Color)
  const subjectChartData = useMemo(() => {
    const map = {};
    sessions.forEach((s) => {
      const sub = s.subject || "General";
      map[sub] = (map[sub] || 0) + (parseInt(s.duration, 10) || 0);
    });
    return Object.keys(map).map((sub) => {
      const theme = getSubjectTheme(sub);
      return {
        subject: sub,
        minutes: map[sub],
        hours: Math.round((map[sub] / 60) * 10) / 10,
        color: theme.hex,
        theme
      };
    });
  }, [sessions]);

  // Daily Activity Trend Chart Data
  const timelineChartData = useMemo(() => {
    const dayMap = {};
    sessions.forEach((s) => {
      if (!s.date) return;
      const dStr = new Date(s.date).toISOString().split("T")[0];
      dayMap[dStr] = (dayMap[dStr] || 0) + (parseInt(s.duration, 10) || 0);
    });

    return Object.keys(dayMap)
      .sort()
      .slice(-14)
      .map((iso) => {
        const d = new Date(iso);
        return {
          date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          minutes: dayMap[iso],
          hours: Math.round((dayMap[iso] / 60) * 10) / 10
        };
      });
  }, [sessions]);

  // Study Streak & Activity Heat Grid (Real Data)
  const { streakCount, calendarDays } = useMemo(() => {
    const dayMap = {};
    sessions.forEach((s) => {
      if (!s.date) return;
      const dStr = new Date(s.date).toISOString().split("T")[0];
      dayMap[dStr] = (dayMap[dStr] || 0) + (parseInt(s.duration, 10) || 0);
    });

    const days = [];
    const today = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      const mins = dayMap[iso] || 0;
      days.push({
        date: iso,
        dayName: d.toLocaleDateString("en-US", { weekday: "narrow" }),
        formatted: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        minutes: mins
      });
    }

    // Compute streak
    let streak = 0;
    const todayIso = today.toISOString().split("T")[0];
    const startOffset = dayMap[todayIso] > 0 ? 0 : 1;
    for (let i = startOffset; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      if (dayMap[iso] > 0) {
        streak++;
      } else {
        break;
      }
    }

    return { streakCount: streak, calendarDays: days };
  }, [sessions]);

  // Custom Interactive Tooltip for Subject Comparison
  const CustomSubjectTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pct = totalMinutes > 0 ? Math.round((data.minutes / totalMinutes) * 100) : 0;
      return (
        <div className="bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] p-3 rounded-xl shadow-xl space-y-1.5 min-w-[160px] animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <span className="font-bold text-xs text-[#172033] dark:text-white truncate">
              {data.subject}
            </span>
          </div>
          <div className="pt-1 border-t border-[#F1F4F9] dark:border-slate-800 text-[11px] space-y-1">
            <div className="flex justify-between text-[#667085] dark:text-slate-400">
              <span>Total Duration:</span>
              <span className="font-semibold text-[#172033] dark:text-slate-100 font-mono">
                {data.minutes}m ({data.hours}h)
              </span>
            </div>
            <div className="flex justify-between text-[#667085] dark:text-slate-400">
              <span>Focus Share:</span>
              <span className="font-semibold text-violet-600 dark:text-violet-400 font-mono">
                {pct}% of total
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* 1. Header Command Bar with Module Accent Glow */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-violet-200/60 dark:border-violet-900/40 shadow-sm overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-500" />
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
              <Sparkles size={14} className="text-violet-500" />
              Focus Telemetry & Velocity
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/40 font-mono">
              Real-Time Tracker
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#172033] dark:text-white font-display tracking-tight">
            Study Time Tracker
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-400 max-w-xl">
            Log deep-focus hours, compare subject discipline across DSA, DBMS, Web Dev, and Mathematics, and build continuous streaks.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 flex-wrap">
          {streakCount > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 shadow-2xs">
              <Flame size={18} className="text-amber-500 animate-pulse" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block leading-tight">
                  Current Streak
                </span>
                <span className="text-xs font-extrabold font-mono text-[#172033] dark:text-slate-100">
                  {streakCount} {streakCount === 1 ? "day streak" : "days streak"}
                </span>
              </div>
            </div>
          )}

          <Button
            variant="primary"
            onClick={() => handleStartFocus()}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-md shadow-emerald-500/25 cursor-pointer font-bold"
          >
            <Timer size={16} />
            <span>Start Focus Timer</span>
          </Button>

          <Button
            variant="secondary"
            onClick={handleOpenRecordModal}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 text-[#172033] dark:text-white border-[#E7EAF0] dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Plus size={16} />
            <span>Record Past Session</span>
          </Button>
        </div>
      </div>

      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast("")}
            className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-950 cursor-pointer text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Interactive Study Focus Section */}
      <div className="relative p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-emerald-50/80 via-violet-50/40 to-white dark:from-emerald-950/25 dark:via-violet-950/20 dark:to-[#111827] border border-emerald-200/80 dark:border-emerald-800/40 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
            <Timer size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-[#172033] dark:text-white font-display">
                Study Focus Mode & Timer
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono">
                Interactive Block
              </span>
            </div>
            <p className="text-xs text-[#667085] dark:text-slate-400 mt-0.5 max-w-lg leading-relaxed">
              Lock in for a focused learning sprint with live circular progress, completion chime, and auto-logging to your study metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 relative z-10 flex-wrap">
          <div className="hidden sm:flex items-center gap-1.5 mr-1">
            {[15, 25, 45, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => handleStartFocus("DSA & Algorithms")}
                className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition-all cursor-pointer shadow-2xs"
              >
                {mins}m
              </button>
            ))}
          </div>

          <Button
            variant="primary"
            onClick={() => handleStartFocus()}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/25 cursor-pointer font-bold px-4 py-2.5 text-xs"
          >
            <Play size={14} fill="currentColor" />
            <span>Launch Focus Timer</span>
          </Button>
        </div>
      </div>

      {error && <ErrorMessage title="Study Session Notice" message={error} onRetry={fetchStudySessions} />}

      {/* 2. Colorful KPI Cards with Meaningful Module Palette */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Study Time"
          value={`${totalHours}h`}
          subtext={`${totalMinutes} mins total focus`}
          color="violet"
          icon={Clock}
        />

        <StatCard
          label="Focus Sessions"
          value={sessions.length}
          subtext="Logged deep blocks"
          color="emerald"
          icon={CheckCircle2}
        />

        <StatCard
          label="Avg Session Length"
          value={`${sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0}m`}
          subtext="Per study session"
          color="amber"
          icon={Timer}
        />

        <StatCard
          label="Active Subjects"
          value={uniqueSubjects}
          subtext="Distinct technical topics"
          color="cyan"
          icon={BookOpen}
        />
      </div>

      {/* 3. Multi-Color Visual Analytics Section */}
      {subjectChartData.length > 0 && (
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] space-y-6 shadow-sm">
          {/* Chart Header & View Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F4F9] dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#172033] dark:text-white font-display">
                  {activeChartView === "subject" ? "Subject-Wise Time Distribution" : "Study Velocity Trend"}
                </h3>
                <Badge variant="violet" size="xs">
                  Multi-Color Analytics
                </Badge>
              </div>
              <p className="text-xs text-[#667085] dark:text-slate-400 mt-0.5">
                {activeChartView === "subject"
                  ? "Distinct color-coded focus minutes across your curriculum"
                  : "Daily focus volume across recent study sessions"}
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F8FAFC] dark:bg-[#161F30] border border-[#E7EAF0] dark:border-[#1F2937]">
              <button
                type="button"
                onClick={() => setActiveChartView("subject")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeChartView === "subject"
                    ? "bg-white dark:bg-[#111827] text-violet-600 dark:text-violet-400 shadow-2xs border border-[#E7EAF0] dark:border-slate-700"
                    : "text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-slate-200"
                }`}
              >
                <BarChart2 size={13} />
                <span>Subject Comparison</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveChartView("timeline")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeChartView === "timeline"
                    ? "bg-white dark:bg-[#111827] text-violet-600 dark:text-violet-400 shadow-2xs border border-[#E7EAF0] dark:border-slate-700"
                    : "text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-slate-200"
                }`}
              >
                <TrendingUp size={13} />
                <span>Activity Trend</span>
              </button>
            </div>
          </div>

          {/* Subject Distribution Ratio Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#667085] dark:text-slate-400">
              <span className="font-semibold">Subject Proportion Breakdown</span>
              <span className="font-mono">{totalHours} total hours</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
              {subjectChartData.map((item) => {
                const pct = totalMinutes > 0 ? (item.minutes / totalMinutes) * 100 : 0;
                return (
                  <div
                    key={item.subject}
                    style={{ width: `${pct}%`, backgroundColor: item.color }}
                    className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full hover:brightness-110"
                    title={`${item.subject}: ${item.minutes} mins (${Math.round(pct)}%)`}
                  />
                );
              })}
            </div>

            {/* Legend Chips */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              {subjectChartData.map((item) => (
                <div key={item.subject} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-[#172033] dark:text-slate-200">{item.subject}:</span>
                  <span className="font-mono text-[#667085] dark:text-slate-400">{item.hours}h</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {activeChartView === "subject" ? (
                <BarChart data={subjectChartData} margin={{ top: 15, right: 15, left: -15, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7EAF0" opacity={0.5} />
                  <XAxis
                    dataKey="subject"
                    stroke="#667085"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    stroke="#667085"
                    fontSize={11}
                    tickLine={false}
                    unit="m"
                  />
                  <Tooltip content={<CustomSubjectTooltip />} />
                  <Bar
                    dataKey="minutes"
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {subjectChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <AreaChart data={timelineChartData} margin={{ top: 15, right: 15, left: -15, bottom: 20 }}>
                  <defs>
                    <linearGradient id="studyTimelineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7EAF0" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#667085" fontSize={11} tickLine={false} />
                  <YAxis stroke="#667085" fontSize={11} tickLine={false} unit="m" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111827",
                      borderColor: "#1F2937",
                      borderRadius: "12px",
                      color: "#F8FAFC",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)"
                    }}
                    formatter={(val) => [`${val} mins (${(val / 60).toFixed(1)}h)`, "Focus Duration"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    stroke="#8B5CF6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#studyTimelineGrad)"
                    isAnimationActive={true}
                    animationDuration={900}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. Study Streak & Activity Heatmap (28-day Intensity Grid) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-[#172033] dark:text-white font-display">
              Study Streak & Activity Intensity
            </h3>
          </div>
          <span className="text-xs text-[#667085] dark:text-slate-400 font-mono">
            Past 4 weeks activity ({calendarDays.filter((d) => d.minutes > 0).length} active days)
          </span>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 md:grid-cols-28 gap-1.5 pt-1">
          {calendarDays.map((day) => {
            let heatClass = "bg-slate-100 dark:bg-slate-800 text-slate-400";
            if (day.minutes > 120) {
              heatClass = "bg-violet-600 text-white shadow-xs font-bold";
            } else if (day.minutes >= 60) {
              heatClass = "bg-violet-500 text-white font-semibold";
            } else if (day.minutes >= 30) {
              heatClass = "bg-violet-400 dark:bg-violet-600/70 text-white";
            } else if (day.minutes > 0) {
              heatClass = "bg-violet-200 dark:bg-violet-900/60 text-violet-900 dark:text-violet-200";
            }

            return (
              <div
                key={day.date}
                title={`${day.formatted}: ${day.minutes} mins studied`}
                className={`h-9 rounded-lg flex flex-col items-center justify-center text-[10px] transition-all hover:scale-110 cursor-pointer ${heatClass}`}
              >
                <span className="font-mono text-[9px] leading-none opacity-80">{day.dayName}</span>
                <span className="font-mono text-[10px] leading-tight">{day.minutes > 0 ? `${day.minutes}m` : "·"}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-1 text-[11px] text-[#667085] dark:text-slate-400 border-t border-[#F1F4F9] dark:border-slate-800">
          <span>Less active</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-800" />
            <span className="w-3 h-3 rounded bg-violet-200 dark:bg-violet-900/60" />
            <span className="w-3 h-3 rounded bg-violet-400" />
            <span className="w-3 h-3 rounded bg-violet-600" />
          </div>
          <span>Deep focus (120m+)</span>
        </div>
      </div>

      {/* 5. Filter & Search Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Filter size={15} className="text-[#98A2B3] dark:text-slate-500 shrink-0" />
          <Input
            placeholder="Filter sessions by subject or notes..."
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="text-xs"
          />
        </div>

        {/* Quick subject preset filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSubjectFilter("")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              !subjectFilter
                ? "bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/40 shadow-2xs"
                : "text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white"
            }`}
          >
            All ({sessions.length})
          </button>
          {PRESET_SUBJECTS.slice(0, 4).map((sub) => {
            const theme = getSubjectTheme(sub);
            const isSel = subjectFilter.toLowerCase() === sub.toLowerCase();
            return (
              <button
                key={sub}
                type="button"
                onClick={() => setSubjectFilter(isSel ? "" : sub)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  isSel
                    ? `${theme.lightBg} ${theme.text} ${theme.border} shadow-2xs`
                    : "border-transparent text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white"
                }`}
              >
                {sub.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Colorful Study Session Cards Grid */}
      {isLoading ? (
        <Loader text="Loading study session logs..." />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No study sessions recorded yet"
          description="Log your study hours to build subject discipline and track productivity progress."
          action={
            <Button variant="primary" size="sm" onClick={handleOpenRecordModal}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Record First Session
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => {
            const theme = getSubjectTheme(session.subject);

            return (
              <div
                key={session._id}
                className="relative rounded-2xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] hover:border-violet-300 dark:hover:border-violet-700/60 hover:shadow-md transition-all duration-200 flex flex-col justify-between p-5 space-y-3 shadow-[0_1px_3px_rgba(16,24,40,0.04)] overflow-hidden group hover:-translate-y-0.5"
              >
                {/* Left Subject Accent Ribbon */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{ backgroundColor: theme.hex }}
                />

                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2 pl-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${theme.lightBg} ${theme.text} ${theme.border}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.hex }} />
                      <span className="truncate max-w-[140px]">{session.subject}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartFocus(session.subject)}
                        className="px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/40 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title={`Start focus timer for ${session.subject}`}
                      >
                        <Timer size={12} />
                        <span>Focus</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSession(session._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete Session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pl-1 text-xs text-[#667085] dark:text-slate-400">
                    <span className="font-mono font-bold text-sm text-[#172033] dark:text-white flex items-center gap-1">
                      <Clock size={14} className="text-violet-500" />
                      {session.duration} mins
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar size={13} className="text-slate-400" />
                      {new Date(session.date).toLocaleDateString()}
                    </span>
                  </div>

                  {session.notes && (
                    <div className="pl-1 pt-1">
                      <p className="text-xs text-[#667085] dark:text-slate-300 bg-[#F8FAFC] dark:bg-[#161F30] p-3 rounded-xl border border-[#E7EAF0] dark:border-[#1F2937] leading-relaxed line-clamp-3">
                        {session.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Study Log"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Delete Log
            </Button>
          </>
        }
      >
        <p className="text-xs text-[#667085] dark:text-slate-300 leading-relaxed">
          Are you sure you want to permanently delete this study session record? This action cannot be undone.
        </p>
      </Modal>

      {/* Record Session Modal with Presets & Quick Duration Chips */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Study Session"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveSession} isLoading={isSaving} className="bg-violet-600 hover:bg-violet-700">
              Save Session
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveSession} className="space-y-4 text-xs">
          {/* Quick Subject Chips */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200">
              Quick Pick Subject
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_SUBJECTS.map((sub) => {
                const theme = getSubjectTheme(sub);
                const isSelected = formData.subject === sub;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setFormData({ ...formData, subject: sub })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                      isSelected
                        ? `${theme.lightBg} ${theme.text} ${theme.border} shadow-2xs`
                        : "bg-[#F8FAFC] dark:bg-slate-800 text-[#667085] dark:text-slate-300 border-[#E7EAF0] dark:border-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>

          <Input
            label="Subject / Topic"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="e.g. Distributed Systems, Dynamic Programming"
            required
          />

          {/* Quick Duration Buttons */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200">
              Duration Preset
            </label>
            <div className="flex gap-2">
              {QUICK_DURATIONS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setFormData({ ...formData, duration: String(mins) })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
                    String(formData.duration) === String(mins)
                      ? "bg-violet-600 text-white border-violet-600 shadow-2xs"
                      : "bg-[#F8FAFC] dark:bg-slate-800 text-[#172033] dark:text-slate-200 border-[#E7EAF0] dark:border-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Duration (minutes)"
            type="number"
            min="1"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            required
          />

          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1.5">
              Notes & Accomplishments
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="What algorithms or concepts did you master during this block?"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] rounded-xl text-xs text-[#172033] dark:text-white placeholder-[#98A2B3] focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 leading-relaxed shadow-xs"
            />
          </div>
        </form>
      </Modal>

      {/* Study Focus Mode & Pomodoro Timer Modal */}
      <StudyFocusModal
        isOpen={isFocusModalOpen}
        onClose={() => setIsFocusModalOpen(false)}
        initialSubject={focusSubject}
        onFocusComplete={handleFocusComplete}
        streakCount={streakCount}
      />
    </div>
  );
};

export default Study;
