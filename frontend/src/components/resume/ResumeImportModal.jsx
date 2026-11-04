import React, { useState } from "react";
import { UploadCloud, CheckCircle2, AlertTriangle } from "lucide-react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import resumeService from "../../services/resume.service";

export const ResumeImportModal = ({
  isOpen,
  onClose,
  accessToken,
  onApplyImportedData
}) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("upload"); // "upload" | "review"
  const [extractedData, setExtractedData] = useState(null);

  const resetState = () => {
    setFile(null);
    setIsUploading(false);
    setError("");
    setStep("upload");
    setExtractedData(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 5 * 1024 * 1024) {
      setError("File exceeds 5MB size limit. Please upload a smaller document.");
      return;
    }

    const name = selected.name.toLowerCase();
    if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
      setError("Only PDF (.pdf) and Microsoft Word (.docx) documents are supported.");
      return;
    }

    setError("");
    setFile(selected);
  };

  const handleUploadAndParse = async () => {
    if (!file || !accessToken) return;
    setIsUploading(true);
    setError("");

    try {
      const res = await resumeService.importResumeFile(accessToken, file);
      if (res && res.extractedData) {
        setExtractedData(res.extractedData);
        setStep("review");
      } else {
        throw new Error("Unable to extract structured resume fields from document.");
      }
    } catch (err) {
      setError(err.message || "Failed to process resume file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleApply = () => {
    if (!extractedData) return;
    onApplyImportedData(extractedData);
    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Existing Resume">
      {step === "upload" ? (
        <div className="space-y-5">
          <p className="text-xs text-[#667085] leading-relaxed">
            Upload your existing PDF or DOCX resume. NEXORA will extract your details into structured fields. You can review and edit every field before applying it to your profile.
          </p>

          {/* Drag & Drop Box */}
          <div className="border-2 border-dashed border-[#E7EAF0] hover:border-[#4F7CFF] rounded-2xl p-8 text-center bg-[#F7F8FC] hover:bg-blue-50/20 transition-colors">
            <input
              type="file"
              id="resume-file-input"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="resume-file-input" className="cursor-pointer flex flex-col items-center space-y-3">
              <div className="p-3.5 rounded-full bg-blue-50 text-[#4F7CFF]">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold text-[#172033]">
                  {file ? file.name : "Click to select or drag and drop your resume"}
                </span>
                <p className="text-xs text-[#667085]">Supported formats: PDF (.pdf), Word (.docx) — Max 5MB</p>
              </div>
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUploadAndParse}
              disabled={!file || isUploading}
              isLoading={isUploading}
            >
              {isUploading ? "Extracting with Gemini..." : "Upload & Extract"}
            </Button>
          </div>
        </div>
      ) : (
        /* Review Screen Before Saving */
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Extracted successfully! Review the parsed details below before updating your profile.</span>
          </div>

          {/* Extracted Details Preview */}
          <div className="space-y-4 text-xs">
            {/* Contact */}
            <div className="p-4 rounded-xl bg-[#F7F8FC] border border-[#E7EAF0] space-y-2">
              <h4 className="font-bold text-[#172033] font-display text-sm">Extracted Personal Info</h4>
              <div className="grid grid-cols-2 gap-2 text-[#172033]">
                <p><span className="text-[#667085]">Name:</span> {extractedData?.personalInfo?.fullName || "Not found"}</p>
                <p><span className="text-[#667085]">Email:</span> {extractedData?.personalInfo?.email || "Not found"}</p>
                <p><span className="text-[#667085]">Phone:</span> {extractedData?.personalInfo?.phone || "Not found"}</p>
                <p><span className="text-[#667085]">Location:</span> {extractedData?.personalInfo?.location || "Not found"}</p>
              </div>
            </div>

            {/* Skills */}
            <div className="p-4 rounded-xl bg-[#F7F8FC] border border-[#E7EAF0] space-y-2">
              <h4 className="font-bold text-[#172033] font-display text-sm">
                Extracted Skills ({extractedData?.skills?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {extractedData?.skills?.map((s, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded text-[11px] font-mono bg-white text-[#172033] border border-[#E7EAF0]">
                    {typeof s === "string" ? s : s.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div className="p-4 rounded-xl bg-[#F7F8FC] border border-[#E7EAF0] space-y-2">
              <h4 className="font-bold text-[#172033] font-display text-sm">
                Extracted Work Experience ({extractedData?.experience?.length || 0})
              </h4>
              {extractedData?.experience?.map((exp, idx) => (
                <div key={idx} className="border-b border-[#E7EAF0] pb-2 last:border-0">
                  <p className="font-semibold text-[#172033]">{exp.title} — {exp.company}</p>
                  <p className="text-[11px] text-[#667085]">{exp.startDate} – {exp.endDate}</p>
                </div>
              ))}
            </div>

            {/* Projects */}
            <div className="p-4 rounded-xl bg-[#F7F8FC] border border-[#E7EAF0] space-y-2">
              <h4 className="font-bold text-[#172033] font-display text-sm">
                Extracted Projects ({extractedData?.projects?.length || 0})
              </h4>
              {extractedData?.projects?.map((p, idx) => (
                <div key={idx} className="border-b border-[#E7EAF0] pb-2 last:border-0">
                  <p className="font-semibold text-[#172033]">{p.title}</p>
                  {p.description && <p className="text-[11px] text-[#667085] line-clamp-1">{p.description}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-[#E7EAF0]">
            <Button variant="ghost" size="sm" onClick={() => setStep("upload")}>
              ← Back to Upload
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleApply}>
                Confirm & Apply to Profile
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ResumeImportModal;
