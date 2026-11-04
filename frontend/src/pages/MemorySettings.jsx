import React, { useState, useEffect, useCallback } from "react";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import Modal from "../components/common/Modal";
import memoryService from "../services/memory.service";
import authService from "../services/auth.service";
import { useAuth } from "../context/AuthContext";

export default function MemorySettings() {
  const { user, accessToken, updateProfile, refreshUser } = useAuth();
  const [memories, setMemories] = useState([]);
  const [activeType, setActiveType] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [newMemoryText, setNewMemoryText] = useState("");
  const [newMemoryType, setNewMemoryType] = useState("long_term");
  const [newImportance, setNewImportance] = useState(3);

  // Privacy Settings State
  const [privacySettings, setPrivacySettings] = useState({
    aiMemoryEnabled: true,
    profileMemoryEnabled: true,
    conversationMemoryEnabled: true,
    preferenceMemoryEnabled: true
  });

  const fetchMemories = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await memoryService.getMemories(accessToken, activeType);
      setMemories(res.memories || []);
    } catch (err) {
      setError(err.message || "Failed to load memory items.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, activeType]);

  useEffect(() => {
    fetchMemories();
    if (user?.preferences) {
      setPrivacySettings((prev) => ({
        ...prev,
        aiMemoryEnabled: user.preferences.aiMemoryEnabled !== false,
        profileMemoryEnabled: user.preferences.profileMemoryEnabled !== false,
        conversationMemoryEnabled: user.preferences.conversationMemoryEnabled !== false,
        preferenceMemoryEnabled: user.preferences.preferenceMemoryEnabled !== false
      }));
    }
  }, [user, activeType, fetchMemories]);

  const handleTogglePrivacy = async (key) => {
    const updated = {
      ...privacySettings,
      [key]: !privacySettings[key]
    };
    setPrivacySettings(updated);
    try {
      if (updateProfile) {
        await updateProfile({ preferences: updated });
      } else if (authService.updatePreferences) {
        await authService.updatePreferences(accessToken, updated);
      }
      if (refreshUser) {
        await refreshUser();
      }
      setSuccessMsg("Privacy preferences saved.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update preferences.");
    }
  };

  const handleCreateMemory = async (e) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;

    setActionLoading(true);
    setError("");
    try {
      const res = await memoryService.createMemory(accessToken, {
        memory: newMemoryText.trim(),
        type: newMemoryType,
        importance: parseInt(newImportance, 10),
        source: "explicit"
      });
      setMemories((prev) => [res.memory, ...prev]);
      setIsAddModalOpen(false);
      setNewMemoryText("");
      setSuccessMsg("Memory stored successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to create memory.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMemory = async (id) => {
    setActionLoading(true);
    setError("");
    try {
      await memoryService.deleteMemory(accessToken, id);
      setMemories((prev) => prev.filter((m) => m._id !== id));
      setSuccessMsg("Memory deleted.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to delete memory.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearAllMemories = async () => {
    setActionLoading(true);
    setError("");
    try {
      await memoryService.deleteAllMemories(accessToken);
      setMemories([]);
      setIsClearModalOpen(false);
      setSuccessMsg("All user memories cleared.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to clear memories.");
    } finally {
      setActionLoading(false);
    }
  };

  const MEMORY_TYPE_THEMES = {
    long_term: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40",
    preference: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/40",
    career: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/40",
    fact: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40",
    session: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40"
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-emerald-200/60 dark:border-emerald-900/40 shadow-sm space-y-2 overflow-hidden">
        {/* Top Emerald accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-display">System Configuration</span>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#172033] dark:text-slate-100 font-display">Memory System &amp; Privacy Controls</h1>
        <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-400 leading-relaxed max-w-2xl">
          Inspect, customize, and manage persistent assistant memories and privacy boundaries for AI Coach interactions.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-semibold shadow-xs animate-fade-in">
          {successMsg}
        </div>
      )}

      {/* Privacy & Context Controls Card */}
      <div className="bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100 font-display">AI Privacy &amp; Context Controls</h2>
          <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
            Control how NEXORA retrieves persistent memory and student background during AI sessions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-[#F8FAFC] dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 rounded-2xl shadow-2xs">
            <div>
              <span className="font-semibold text-[#172033] dark:text-slate-100 text-sm block">AI Long-Term Memory</span>
              <span className="text-xs text-[#667085] dark:text-slate-400">Inject stored personal facts into AI Coach prompts</span>
            </div>
            <button
              onClick={() => handleTogglePrivacy("aiMemoryEnabled")}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                privacySettings.aiMemoryEnabled ? "bg-emerald-500 justify-end" : "bg-slate-200 dark:bg-slate-700 justify-start"
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#F8FAFC] dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 rounded-2xl shadow-2xs">
            <div>
              <span className="font-semibold text-[#172033] dark:text-slate-100 text-sm block">Profile &amp; Activity Reading</span>
              <span className="text-xs text-[#667085] dark:text-slate-400">Include career goal, tasks, and study session context</span>
            </div>
            <button
              onClick={() => handleTogglePrivacy("profileMemoryEnabled")}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                privacySettings.profileMemoryEnabled ? "bg-emerald-500 justify-end" : "bg-slate-200 dark:bg-slate-700 justify-start"
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#F8FAFC] dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 rounded-2xl shadow-2xs">
            <div>
              <span className="font-semibold text-[#172033] dark:text-slate-100 text-sm block">Conversation History Bounding</span>
              <span className="text-xs text-[#667085] dark:text-slate-400">Retain short-term chat history in active sessions</span>
            </div>
            <button
              onClick={() => handleTogglePrivacy("conversationMemoryEnabled")}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                privacySettings.conversationMemoryEnabled ? "bg-emerald-500 justify-end" : "bg-slate-200 dark:bg-slate-700 justify-start"
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#F8FAFC] dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 rounded-2xl shadow-2xs">
            <div>
              <span className="font-semibold text-[#172033] dark:text-slate-100 text-sm block">Preference Memories</span>
              <span className="text-xs text-[#667085] dark:text-slate-400">Allow retrieval of explicit user preference items</span>
            </div>
            <button
              onClick={() => handleTogglePrivacy("preferenceMemoryEnabled")}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                privacySettings.preferenceMemoryEnabled ? "bg-emerald-500 justify-end" : "bg-slate-200 dark:bg-slate-700 justify-start"
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Memory Catalog & Management */}
      <div className="bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100 font-display">Persistent Memory Inspector</h2>
            <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
              View, filter, or manually register explicit facts and preferences.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-sm shadow-emerald-500/25"
            >
              + Add Memory
            </Button>
            <Button variant="danger" onClick={() => setIsClearModalOpen(true)}>
              Clear All
            </Button>
          </div>
        </div>

        {/* Type Filters */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F1F4F9] dark:border-slate-800">
          {[
            { id: "", label: "All Types" },
            { id: "long_term", label: "Long Term" },
            { id: "preference", label: "Preference" },
            { id: "career", label: "Career" },
            { id: "fact", label: "Fact" },
            { id: "session", label: "Session" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveType(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeType === tab.id
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-[#F8FAFC] dark:bg-slate-900 text-[#667085] dark:text-slate-400 border border-[#E7EAF0] dark:border-slate-800 hover:text-[#172033] dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Memory Items List */}
        {loading ? (
          <Loader text="Loading memory items..." />
        ) : memories.length === 0 ? (
          <div className="text-center py-12 bg-[#F8FAFC] dark:bg-slate-900/60 rounded-2xl border border-dashed border-[#E7EAF0] dark:border-slate-800">
            <p className="text-[#172033] dark:text-slate-100 text-sm font-semibold">No memory items recorded yet.</p>
            <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
              Add an explicit memory or interact with AI Coach to build context.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memories.map((item) => (
              <div
                key={item._id}
                className="bg-[#F8FAFC] dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-white dark:hover:bg-slate-800/80 transition-all shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold uppercase tracking-wider border ${MEMORY_TYPE_THEMES[item.type] || "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200"}`}>
                      {item.type}
                    </span>
                    <span className="text-[#667085] dark:text-slate-400 text-[11px] font-mono">Importance: {item.importance}/5</span>
                  </div>
                  <p className="text-[#172033] dark:text-slate-100 text-xs leading-relaxed font-medium">{item.memory}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-[#98A2B3] dark:text-slate-500 pt-2 border-t border-[#E7EAF0] dark:border-slate-800">
                  <span>Source: {item.source}</span>
                  <button
                    onClick={() => handleDeleteMemory(item._id)}
                    disabled={actionLoading}
                    className="text-rose-500 hover:text-rose-600 transition-colors font-medium cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Memory Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Custom Memory">
        <form onSubmit={handleCreateMemory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 tracking-normal mb-1.5">Memory Content</label>
            <textarea
              required
              rows={3}
              value={newMemoryText}
              onChange={(e) => setNewMemoryText(e.target.value)}
              placeholder="e.g. Prefer TypeScript over JavaScript for backend APIs"
              className="w-full rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 px-3.5 py-2.5 text-[#172033] dark:text-slate-100 text-sm placeholder-[#98A2B3] dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 tracking-normal mb-1.5">Memory Type</label>
              <select
                value={newMemoryType}
                onChange={(e) => setNewMemoryType(e.target.value)}
                className="w-full rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 px-3.5 py-2 text-[#172033] dark:text-slate-100 text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="long_term">Long Term</option>
                <option value="preference">Preference</option>
                <option value="career">Career Goal</option>
                <option value="fact">Fact</option>
                <option value="session">Session</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 tracking-normal mb-1.5">Importance (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={newImportance}
                onChange={(e) => setNewImportance(e.target.value)}
                className="w-full rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 px-3.5 py-2 text-[#172033] dark:text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#F1F4F9] dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white border-none">
              Save Memory
            </Button>
          </div>
        </form>
      </Modal>

      {/* Clear All Memories Modal */}
      <Modal isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)} title="Clear All Memories">
        <div className="space-y-4">
          <p className="text-sm text-[#172033] dark:text-slate-200">
            Are you sure you want to delete <strong className="text-rose-600">ALL</strong> stored assistant memories? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsClearModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleClearAllMemories} disabled={actionLoading}>
              Yes, Delete All
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
