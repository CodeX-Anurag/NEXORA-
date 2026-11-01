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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#191816] border border-[#2D2925] shadow-xl space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#E0693B] font-display">System Configuration</span>
        <h1 className="text-2xl font-bold text-[#FAF7F2] font-display">Memory System & Privacy Controls</h1>
        <p className="text-xs text-[#9C9384] leading-relaxed">
          Inspect, customize, and manage persistent assistant memories and privacy boundaries for AI Coach interactions.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}
      {successMsg && (
        <div className="p-4 bg-[#2EA366]/10 border border-[#2EA366]/30 text-[#2EA366] rounded-xl text-xs font-semibold">
          {successMsg}
        </div>
      )}

      {/* Privacy & Context Controls Card */}
      <div className="bg-[#191816] border border-[#2D2925] rounded-2xl p-6 space-y-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-[#FAF7F2] font-display">AI Privacy & Context Controls</h2>
          <p className="text-xs text-[#9C9384] mt-1">
            Control how NEXORA retrieves persistent memory and student background during AI sessions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-[#141312] border border-[#2D2925] rounded-xl">
            <div>
              <span className="font-semibold text-[#FAF7F2] text-sm block">AI Long-Term Memory</span>
              <span className="text-xs text-[#9C9384]">Inject stored personal facts into AI Coach prompts</span>
            </div>
            <button
              onClick={() => handleTogglePrivacy("aiMemoryEnabled")}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                privacySettings.aiMemoryEnabled ? "bg-[#E0693B] justify-end" : "bg-[#2A2724] justify-start"
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#141312] border border-[#2D2925] rounded-xl">
            <div>
              <span className="font-semibold text-[#FAF7F2] text-sm block">Profile & Activity Reading</span>
              <span className="text-xs text-[#9C9384]">Include career goal, tasks, and study session context</span>
            </div>
            <button
              onClick={() => handleTogglePrivacy("profileMemoryEnabled")}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                privacySettings.profileMemoryEnabled ? "bg-[#E0693B] justify-end" : "bg-[#2A2724] justify-start"
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#141312] border border-[#2D2925] rounded-xl">
            <div>
              <span className="font-semibold text-[#FAF7F2] text-sm block">Conversation History Bounding</span>
              <span className="text-xs text-[#9C9384]">Retain short-term chat history in active sessions</span>
            </div>
            <button
              onClick={() => handleTogglePrivacy("conversationMemoryEnabled")}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                privacySettings.conversationMemoryEnabled ? "bg-[#E0693B] justify-end" : "bg-[#2A2724] justify-start"
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#141312] border border-[#2D2925] rounded-xl">
            <div>
              <span className="font-semibold text-[#FAF7F2] text-sm block">Preference Memories</span>
              <span className="text-xs text-[#9C9384]">Allow retrieval of explicit user preference items</span>
            </div>
            <button
              onClick={() => handleTogglePrivacy("preferenceMemoryEnabled")}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                privacySettings.preferenceMemoryEnabled ? "bg-[#E0693B] justify-end" : "bg-[#2A2724] justify-start"
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Memory Catalog & Management */}
      <div className="bg-[#191816] border border-[#2D2925] rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#FAF7F2] font-display">Persistent Memory Inspector</h2>
            <p className="text-xs text-[#9C9384] mt-1">
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
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#262420]">
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
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeType === tab.id
                  ? "bg-[#E0693B] text-white shadow-sm"
                  : "bg-[#22201D] text-[#9C9384] hover:text-[#FAF7F2] hover:bg-[#2A2724]"
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
          <div className="text-center py-12 bg-[#141312] rounded-xl border border-[#2D2925]">
            <p className="text-[#CDC5B6] text-sm">No memory items recorded yet.</p>
            <p className="text-xs text-[#787165] mt-1">
              Add an explicit memory or interact with AI Coach to build context.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memories.map((item) => (
              <div
                key={item._id}
                className="bg-[#141312] border border-[#2D2925] rounded-xl p-4 space-y-3 flex flex-col justify-between hover:border-[#3D3832] transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E0693B]/10 text-[#E0693B] font-mono text-[10px] font-semibold uppercase tracking-wider border border-[#E0693B]/25">
                      {item.type}
                    </span>
                    <span className="text-[#9C9384] text-[11px] font-mono">Importance: {item.importance}/5</span>
                  </div>
                  <p className="text-[#FAF7F2] text-xs leading-relaxed">{item.memory}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-[#787165] pt-2 border-t border-[#262420]">
                  <span>Source: {item.source}</span>
                  <button
                    onClick={() => handleDeleteMemory(item._id)}
                    disabled={actionLoading}
                    className="text-rose-400 hover:text-rose-300 transition-colors font-medium"
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
            <label className="block text-xs font-semibold text-[#CDC5B6] uppercase tracking-wider mb-1.5">Memory Content</label>
            <textarea
              required
              rows={3}
              value={newMemoryText}
              onChange={(e) => setNewMemoryText(e.target.value)}
              placeholder="e.g. Prefer TypeScript over JavaScript for backend APIs"
              className="w-full rounded-xl bg-[#141312] border border-[#302C28] px-3.5 py-2.5 text-[#FAF7F2] text-sm placeholder-[#787165] focus:outline-none focus:border-[#E0693B] focus:ring-1 focus:ring-[#E0693B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#CDC5B6] uppercase tracking-wider mb-1.5">Memory Type</label>
              <select
                value={newMemoryType}
                onChange={(e) => setNewMemoryType(e.target.value)}
                className="w-full rounded-xl bg-[#141312] border border-[#302C28] px-3.5 py-2 text-[#FAF7F2] text-sm focus:outline-none focus:border-[#E0693B] focus:ring-1 focus:ring-[#E0693B]"
              >
                <option value="long_term">Long Term</option>
                <option value="preference">Preference</option>
                <option value="career">Career Goal</option>
                <option value="fact">Fact</option>
                <option value="session">Session</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CDC5B6] uppercase tracking-wider mb-1.5">Importance (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={newImportance}
                onChange={(e) => setNewImportance(e.target.value)}
                className="w-full rounded-xl bg-[#141312] border border-[#302C28] px-3.5 py-2 text-[#FAF7F2] text-sm focus:outline-none focus:border-[#E0693B] focus:ring-1 focus:ring-[#E0693B]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#262420]">
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
          <p className="text-sm text-[#CDC5B6]">
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
    </div>
  );
}
