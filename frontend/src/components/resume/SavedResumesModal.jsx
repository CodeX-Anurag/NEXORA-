import React, { useEffect, useState, useCallback } from "react";
import { Trash2, Calendar, FileText } from "lucide-react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import resumeService from "../../services/resume.service";

export const SavedResumesModal = ({
  isOpen,
  onClose,
  accessToken,
  onSelectResume
}) => {
  const [resumes, setResumes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSaved = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await resumeService.listSavedResumes(accessToken);
      setResumes(res.resumes || []);
    } catch (err) {
      setError(err.message || "Failed to load saved resumes.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isOpen) {
      loadSaved();
    }
  }, [isOpen, loadSaved]);

  const handleDelete = async (e, resumeId) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this saved resume?")) return;
    try {
      await resumeService.deleteSavedResume(accessToken, resumeId);
      setResumes((prev) => prev.filter((r) => r._id !== resumeId));
    } catch (err) {
      setError(err.message || "Failed to delete resume.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Saved Resumes">
      <div className="space-y-4">
        <p className="text-xs text-[#9C9384]">
          Access, manage, and reload your previously generated and customized resumes.
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="py-8 text-center text-xs text-[#787165]">Loading saved resumes...</div>
        ) : resumes.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#787165]">
            No saved resumes found in your account. Generate and save a resume to manage it here.
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {resumes.map((r) => (
              <div
                key={r._id}
                onClick={() => {
                  onSelectResume(r);
                  onClose();
                }}
                className="p-3.5 rounded-xl bg-[#141312] border border-[#2D2925] hover:border-[#E0693B] cursor-pointer transition-colors flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#E0693B]" />
                    <h4 className="font-semibold text-xs text-[#FAF7F2] font-display group-hover:text-[#E0693B]">
                      {r.title}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#1F1D1A] text-[#9C9384] border border-[#2D2925]">
                      {r.template}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9C9384]">
                    Role: <span className="text-[#CDC5B6]">{r.targetRole}</span>
                    {r.targetCompany && ` at ${r.targetCompany}`}
                  </p>
                  <p className="text-[10px] text-[#787165] flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Updated: {new Date(r.updatedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" className="text-xs">
                    Open
                  </Button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, r._id)}
                    className="p-1.5 text-[#787165] hover:text-rose-400 rounded-lg hover:bg-[#1E1C19]"
                    title="Delete resume"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SavedResumesModal;
