import React, { useState, useEffect } from "react";
import PageLayout from "../components/layout/PageLayout";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import Modal from "../components/common/Modal";
import memoryService from "../services/memory.service";
import authService from "../services/auth.service";
import { useAuth } from "../context/AuthContext";

export default function MemorySettings() {
  const { user, refreshUser } = useAuth();
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
  }, [user, activeType]);

  const fetchMemories = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await memoryService.getMemories(activeType);
      setMemories(res.memories || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load memory items.");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePrivacy = async (key) => {
    const updated = { ...privacySettings, [key]: !privacySettings[key] };
    setPrivacySettings(updated);
    try {
      await authService.updateProfile({
        preferences: {
          ...(user?.preferences || {}),
          ...updated
        }
      });
      if (refreshUser) await refreshUser();
      setSuccessMsg("Privacy preferences updated successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      setError("Failed to update privacy preferences.");
    }
  };

  const handleCreateMemory = async (e) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;

    setActionLoading(true);
    setError("");
    try {
      await memoryService.createMemory({
        memory: newMemoryText,
        type: newMemoryType,
        importance: Number(newImportance),
        source: "user_explicit"
      });
      setNewMemoryText("");
      setIsAddModalOpen(false);
      setSuccessMsg("New memory saved.");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchMemories();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add memory.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMemory = async (id) => {
    setActionLoading(true);
    setError("");
    try {
      await memoryService.deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m._id !== id));
      setSuccessMsg("Memory deleted.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete memory.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearAllMemories = async () => {
    setActionLoading(true);
    setError("");
    try {
      await memoryService.deleteAllMemories();
      setMemories([]);
      setIsClearModalOpen(false);
      setSuccessMsg("All user memories cleared.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to clear memories.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <PageLayout
      title="NEXORA Memory System & Privacy Controls"
      subtitle="Inspect, customize, and manage persistent assistant memories and privacy boundaries."
    >
      <div className="space-y-8">
        {error && <ErrorMessage message={error} />}
        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            {successMsg}
          </div>
        )}

        {/* Privacy & Context Controls Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-100">AI Privacy & Context Controls</h2>
              <p className="text-sm text-slate-400">
                Control how NEXORA retrieves persistent memory and student background during AI sessions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
              <div>
                <span className="font-semibold text-slate-200 block">AI Long-Term Memory</span>
                <span className="text-xs text-slate-400">Inject stored personal facts into AI Coach prompts</span>
              </div>
              <button
                onClick={() => handleTogglePrivacy("aiMemoryEnabled")}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  privacySettings.aiMemoryEnabled ? "bg-indigo-600 justify-end" : "bg-slate-700 justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
              <div>
                <span className="font-semibold text-slate-200 block">Profile & Activity Reading</span>
                <span className="text-xs text-slate-400">Include career goal, tasks, and study session context</span>
              </div>
              <button
                onClick={() => handleTogglePrivacy("profileMemoryEnabled")}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  privacySettings.profileMemoryEnabled ? "bg-indigo-600 justify-end" : "bg-slate-700 justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
              <div>
                <span className="font-semibold text-slate-200 block">Conversation History Bounding</span>
                <span className="text-xs text-slate-400">Retain short-term chat history in active sessions</span>
              </div>
              <button
                onClick={() => handleTogglePrivacy("conversationMemoryEnabled")}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  privacySettings.conversationMemoryEnabled ? "bg-indigo-600 justify-end" : "bg-slate-700 justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
              <div>
                <span className="font-semibold text-slate-200 block">Preference Memories</span>
                <span className="text-xs text-slate-400">Allow retrieval of explicit user preference items</span>
              </div>
              <button
                onClick={() => handleTogglePrivacy("preferenceMemoryEnabled")}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  privacySettings.preferenceMemoryEnabled ? "bg-indigo-600 justify-end" : "bg-slate-700 justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Memory Catalog & Management */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Persistent Memory Inspector</h2>
              <p className="text-sm text-slate-400">
                View, filter, or manually register explicit facts and preferences.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={() => setIsAddModalOpen(true)}>+ Add Memory</Button>
              <Button variant="danger" onClick={() => setIsClearModalOpen(true)}>
                Clear All
              </Button>
            </div>
          </div>

          {/* Type Filters */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
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
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  activeType === tab.id
                    ? "bg-indigo-600 text-white font-medium"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Memory Items List */}
          {loading ? (
            <Loader message="Loading memory items..." />
          ) : memories.length === 0 ? (
            <div className="text-center py-12 bg-slate-950/50 rounded-xl border border-slate-800">
              <p className="text-slate-400">No memory items recorded yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Add an explicit memory or interact with AI Coach to build context.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {memories.map((item) => (
                <div
                  key={item._id}
                  className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-4 space-y-3 flex flex-col justify-between hover:border-slate-600 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono uppercase tracking-wider">
                        {item.type}
                      </span>
                      <span className="text-slate-400">Importance: {item.importance}/5</span>
                    </div>
                    <p className="text-slate-200 text-sm">{item.memory}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <span>Source: {item.source}</span>
                    <button
                      onClick={() => handleDeleteMemory(item._id)}
                      disabled={actionLoading}
                      className="text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Memory Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Custom Memory">
        <form onSubmit={handleCreateMemory} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Memory Content</label>
            <textarea
              required
              rows={3}
              value={newMemoryText}
              onChange={(e) => setNewMemoryText(e.target.value)}
              placeholder="e.g. Prefer TypeScript over JavaScript for backend APIs"
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Memory Type</label>
              <select
                value={newMemoryType}
                onChange={(e) => setNewMemoryType(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="long_term">Long Term</option>
                <option value="preference">Preference</option>
                <option value="career">Career Goal</option>
                <option value="fact">Fact</option>
                <option value="session">Session</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Importance (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={newImportance}
                onChange={(e) => setNewImportance(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={actionLoading}>
              Save Memory
            </Button>
          </div>
        </form>
      </Modal>

      {/* Clear All Memories Modal */}
      <Modal isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)} title="Clear All Memories">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete <strong className="text-rose-400">ALL</strong> stored assistant memories? This action cannot be undone.
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
    </PageLayout>
  );
}
