import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Clock, CheckCircle2, Timer, BookOpen, Trash2, Plus } from "lucide-react";
import {
  BarChart,
  Bar,
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

export const Study = () => {
  const { accessToken } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

  const fetchStudySessions = useCallback(async () => {
    if (!accessToken) return;
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
      setError(err.message || "Failed to delete study session.");
    }
  };

  const totalMinutes = sessions.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const subjectChartData = useMemo(() => {
    const map = {};
    sessions.forEach((s) => {
      const sub = s.subject?.trim() || "General";
      map[sub] = (map[sub] || 0) + (s.duration || 0);
    });
    return Object.entries(map)
      .map(([subject, minutes]) => ({
        subject,
        minutes,
        hours: (minutes / 60).toFixed(1)
      }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 8);
  }, [sessions]);

  const uniqueSubjects = useMemo(() => {
    return new Set(sessions.map((s) => s.subject?.trim()).filter(Boolean)).size;
  }, [sessions]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#191816] border border-[#2D2925]">
        <div>
          <h1 className="text-2xl font-bold text-[#FAF7F2] font-display">Study Sessions & Focus Tracker</h1>
          <p className="text-xs text-[#9C9384] mt-1">Log your subject study time and monitor focus hours</p>
        </div>
        <Button variant="primary" onClick={handleOpenRecordModal}>
          + Record Study Session
        </Button>
      </div>

      {error && <ErrorMessage title="Study Tracker Error" message={error} onRetry={fetchStudySessions} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Study Time"
          value={`${totalHours} hrs`}
          subtext={`${totalMinutes} mins total`}
          color="terracotta"
          icon={Clock}
        />

        <StatCard
          label="Recorded Sessions"
          value={sessions.length}
          subtext="Focus logs"
          color="sage"
          icon={CheckCircle2}
        />

        <StatCard
          label="Avg Session"
          value={`${sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0}m`}
          subtext="Per focus block"
          color="amber"
          icon={Timer}
        />

        <StatCard
          label="Active Subjects"
          value={uniqueSubjects}
          subtext="Distinct topics"
          color="white"
          icon={BookOpen}
        />
      </div>

      {/* Visual Analytics: Study Time by Subject */}
      {subjectChartData.length > 0 && (
        <div className="p-6 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#FAF7F2] font-display">Study Duration by Subject</h3>
              <p className="text-xs text-[#9C9384]">Cumulative focus minutes logged across each technical subject</p>
            </div>
            <Badge variant="primary" size="xs">
              {subjectChartData.length} Subjects Tracked
            </Badge>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D2925" />
                <XAxis dataKey="subject" stroke="#9C9384" fontSize={11} interval={0} />
                <YAxis stroke="#9C9384" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#191816",
                    borderColor: "#332F2A",
                    borderRadius: "12px",
                    color: "#FAF7F2",
                    fontSize: "12px"
                  }}
                  formatter={(val) => [`${val} mins (${(val / 60).toFixed(1)} hrs)`, "Study Duration"]}
                />
                <Bar dataKey="minutes" fill="#E0693B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-[#191816] border border-[#2D2925] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full max-w-xs">
          <Input
            placeholder="Filter by subject..."
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="text-xs"
          />
        </div>
        {subjectFilter && (
          <button
            onClick={() => setSubjectFilter("")}
            className="text-xs text-[#E0693B] hover:underline shrink-0 font-medium"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Sessions List */}
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
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session._id}
              className="p-4 rounded-xl bg-[#191816] border border-[#2D2925] hover:border-[#3D3832] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-sm font-semibold text-[#FAF7F2]">{session.subject}</h3>
                  <Badge variant="success" size="xs">
                    {session.duration} mins
                  </Badge>
                  <span className="text-[11px] text-[#787165] font-mono">
                    {new Date(session.date || session.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {session.notes && <p className="text-xs text-[#9C9384] line-clamp-2 leading-relaxed">{session.notes}</p>}
              </div>

              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteSession(session._id)}
                className="flex items-center gap-1 text-xs"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Record Session Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Study Session"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveSession} isLoading={isSaving}>
              Save Session
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveSession} className="space-y-4">
          <Input
            label="Subject / Topic"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="e.g. Computer Networks / Operating Systems"
            required
          />

          {/* Duration Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#CDC5B6] uppercase tracking-wider block">
              Duration Preset
            </label>
            <div className="flex gap-2">
              {[25, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setFormData({ ...formData, duration: String(mins) })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border transition-all ${
                    formData.duration === String(mins)
                      ? "bg-[#E0693B]/10 text-[#E0693B] border-[#E0693B]/40"
                      : "bg-[#141312] text-[#9C9384] border-[#2D2925] hover:text-[#FAF7F2]"
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Duration (in minutes)"
            type="number"
            min="1"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            placeholder="45"
            required
          />

          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#CDC5B6] uppercase tracking-wider">
              Notes & Key Takeaways (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Covered TCP/IP layers, socket programming examples..."
              className="w-full px-3.5 py-2.5 text-sm bg-[#141312] border border-[#302C28] rounded-xl text-[#FAF7F2] placeholder-[#787165] focus:outline-none focus:border-[#E0693B] focus:ring-1 focus:ring-[#E0693B] min-h-[80px]"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal (Replaces window.confirm) */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Study Session"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Delete Session
            </Button>
          </>
        }
      >
        <p className="text-xs text-[#CDC5B6] leading-relaxed">
          Are you sure you want to permanently delete this study log entry? This will update your total focus hours and subject analytics.
        </p>
      </Modal>
    </div>
  );
};

export default Study;
