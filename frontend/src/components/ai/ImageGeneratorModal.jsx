import React, { useState } from "react";
import { Sparkles, AlertCircle, X, ArrowRight } from "lucide-react";
import aiService from "../../services/ai.service";
import Button from "../common/Button";

const EXAMPLE_PROMPTS = [
  "Von Neumann CPU architecture with ALU, CU and Registers",
  "Binary Search Tree with balanced left and right subtrees",
  "OSI 7-Layer reference model diagram",
  "HTTP request-response lifecycle with proxy and database"
];

export const ImageGeneratorModal = ({ isOpen, onClose, onImageGenerated, activeConversationId, accessToken }) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleGenerate = async (targetPrompt) => {
    const textToGen = targetPrompt || prompt;
    if (!textToGen.trim()) return;

    setIsGenerating(true);
    setError("");

    try {
      const res = await aiService.generateImage(accessToken, {
        prompt: textToGen.trim(),
        conversationId: activeConversationId
      });

      if (res.image) {
        onImageGenerated(res.image, res.userMessage, res.assistantMessage, res.conversationId);
        onClose();
        setPrompt("");
      }
    } catch (err) {
      setError(err.message || "Failed to generate image.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] rounded-3xl p-6 shadow-2xl space-y-5 animate-modal-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F1F4F9] dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/40 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172033] dark:text-white font-display">
                Generate Technical Diagram / Image
              </h3>
              <span className="text-[10px] text-[#667085] dark:text-slate-400 font-mono">
                Multimodal Visual Intelligence
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

        {/* Prompt Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#172033] dark:text-slate-200">
            Describe the visual explanation or architecture you need:
          </label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Explain CPU architecture with ALU and Control Unit..."
            className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 rounded-2xl p-3 text-xs text-[#172033] dark:text-slate-100 placeholder-[#98A2B3] focus:outline-none focus:border-violet-500 leading-relaxed shadow-xs"
          />
        </div>

        {/* Example Prompt Chips */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400">
            Suggested CS Diagrams:
          </span>
          <div className="grid grid-cols-1 gap-1.5">
            {EXAMPLE_PROMPTS.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setPrompt(ex);
                  handleGenerate(ex);
                }}
                disabled={isGenerating}
                className="text-left text-xs p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-900 hover:bg-violet-50 dark:hover:bg-violet-950/40 text-[#667085] dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-300 border border-[#E7EAF0] dark:border-slate-800 transition-colors flex items-center justify-between cursor-pointer group"
              >
                <span className="truncate">{ex}</span>
                <ArrowRight size={13} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#F1F4F9] dark:border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleGenerate()}
            isLoading={isGenerating}
            disabled={!prompt.trim() || isGenerating}
            className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 border-none text-white shadow-violet-500/25"
          >
            <Sparkles size={14} />
            <span>Generate Visual</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageGeneratorModal;