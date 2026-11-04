import React, { useState, useRef } from "react";
import { UploadCloud, FileText, Check, AlertCircle, X } from "lucide-react";
import aiService from "../../services/ai.service";
import Button from "../common/Button";

export const DocumentAttachModal = ({ isOpen, onClose, onDocumentAttached, accessToken }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds maximum allowed size of 10MB.");
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError("");

    try {
      const res = await aiService.uploadDocument(accessToken, selectedFile);
      if (res.document) {
        onDocumentAttached(res.document);
        onClose();
      }
    } catch (err) {
      setError(err.message || "Failed to upload document.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] rounded-3xl p-6 shadow-2xl space-y-5 animate-modal-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F1F4F9] dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172033] dark:text-white font-display">
                Attach Educational Document
              </h3>
              <span className="text-[10px] text-[#667085] dark:text-slate-400 font-mono">
                PDF, DOCX, TXT, or Image Notes
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Upload Dropzone */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg"
          className="hidden"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#D0D5DD] dark:border-slate-700 hover:border-violet-400 rounded-3xl p-8 text-center cursor-pointer transition-colors bg-[#F8FAFC] dark:bg-slate-900/50 space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto shadow-2xs">
            <UploadCloud size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-[#172033] dark:text-white block font-display">
              {selectedFile ? selectedFile.name : "Click to select notes, syllabus, or assignments"}
            </span>
            <span className="text-[10px] text-[#667085] dark:text-slate-400 mt-1 block">
              PDF, DOCX, TXT, PNG, JPEG up to 10MB
            </span>
          </div>
        </div>

        {selectedFile && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2 truncate">
              <FileText size={15} className="shrink-0 text-emerald-600" />
              <span className="truncate font-semibold">{selectedFile.name}</span>
            </div>
            <span className="font-mono text-[10px] shrink-0">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#F1F4F9] dark:border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleUpload}
            isLoading={isUploading}
            disabled={!selectedFile || isUploading}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 border-none text-white shadow-blue-500/25"
          >
            <Check size={14} />
            <span>{isUploading ? "Extracting Text..." : "Attach Document"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocumentAttachModal;