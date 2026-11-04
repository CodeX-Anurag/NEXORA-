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
        <p className="text-xs text-[#667085]">
          Access, manage, and reload your previously generated and customized resumes.
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="py-8 text-center text-xs text-[#667085]">Loading saved resumes...</div>
        ) : resumes.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#667085]">
            No saved resumes found in your account. Generate and save a resume to manage it here.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
            {resumes.map((r) => (
              <div
                key={r._id}
                onClick={() => {
                  onSelectResume(r);
                  onClose();
                }}
                className="p-4 rounded-xl bg-white border border-[#E7EAF0] hover:border-[#4F7CFF] cursor-pointer transition-all flex items-center justify-between group shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#4F7CFF]" />
                    <h4 className="font-semibold text-xs text-[#172033] font-display group-hover:text-[#4F7CFF]">
                      {r.title}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#F7F8FC] text-[#667085] border border-[#E7EAF0]">
                      {r.template}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#667085]">
                    Role: <span className="text-[#172033] font-medium">{r.targetRole}</span>
                    {r.targetCompany && ` at ${r.targetCompany}`}
                  </p>
                  <p className="text-[10px] text-[#667085] flex items-center gap-1">
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
                    className="p-1.5 text-[#667085] hover:text-rose-500 rounded-lg hover:bg-rose-50 cursor-pointer"
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
