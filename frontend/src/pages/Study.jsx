import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import studyService from "../services/study.service";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";

export const Study = () => {
  const { accessToken } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this study session record?")) return;
    try {
      await studyService.deleteStudySession(accessToken, sessionId);
      fetchStudySessions();
    } catch (err) {
      setError(err.message || "Failed to delete study session.");
    }
  };

  // Deterministic calculations
  const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Study Sessions & Focus Tracker</h1>
          <p className="text-xs text-slate-400 mt-1">Log your subject study time and monitor focus hours</p>
        </div>
        <Button variant="primary" onClick={handleOpenRecordModal}>
          + Record Study Session
        </Button>
      </div>

      {error && <ErrorMessage title="Study Tracker Error" message={error} onRetry={fetchStudySessions} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Study Time</span>
          <p className="text-2xl font-bold text-indigo-400 font-mono">{totalHours} hrs</p>
          <p className="text-[11px] text-slate-500">({totalMinutes} minutes total)</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Recorded Sessions</span>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{sessions.length}</p>
          <p className="text-[11px] text-slate-500">Log entries</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avg Session Duration</span>
          <p className="text-2xl font-bold text-cyan-400 font-mono">
            {sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0} mins
          </p>
          <p className="text-[11px] text-slate-500">Per focus session</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
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
            className="text-xs text-indigo-400 hover:underline shrink-0"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Sessions List */}
      {isLoading ? (
        <Loader text="Loading study session logs..." />
      ) : sessions.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-200">No study sessions recorded yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Log your study hours to build subject discipline and track productivity progress.
          </p>
          <Button variant="primary" size="sm" onClick={handleOpenRecordModal}>
            + Record First Session
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session._id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-sm font-semibold text-slate-100">{session.subject}</h3>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-mono">
                    {session.duration} mins
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(session.date || session.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {session.notes && <p className="text-xs text-slate-400 line-clamp-2">{session.notes}</p>}
              </div>

              <Button variant="danger" size="sm" onClick={() => handleDeleteSession(session._id)}>
                Delete
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
            <label className="text-sm font-medium text-slate-300">Notes & Key Takeaways (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Covered TCP/IP layers, socket programming examples..."
              className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Study;
