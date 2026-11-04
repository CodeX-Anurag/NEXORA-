import React, { useState } from "react";
import { Image, Maximize2, Download, Copy, Check, X } from "lucide-react";

export const GeneratedImageCard = ({ imageUrl, prompt = "", format = "png" }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Fallback API Base URL for relative paths
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api/v1";
  const backendHost = API_BASE_URL.replace("/api/v1", "");
  const fullImageUrl = imageUrl?.startsWith("http")
    ? imageUrl
    : `${backendHost}${imageUrl?.startsWith("/") ? imageUrl : `/${imageUrl}`}`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = fullImageUrl;
    link.download = `nexora_${(prompt || "diagram").slice(0, 20).replace(/[^a-z0-9]/gi, "_")}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="my-3 rounded-2xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] overflow-hidden shadow-sm max-w-lg space-y-2">
      {/* Image Preview Container */}
      <div className="relative group overflow-hidden bg-[#0B0F19] flex items-center justify-center min-h-[220px]">
        <img
          src={fullImageUrl}
          alt={prompt || "AI Generated Diagram"}
          className="w-full h-auto max-h-[360px] object-contain transition-transform duration-300 group-hover:scale-102"
          loading="lazy"
        />

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-2xs">
          <button
            onClick={() => setIsZoomed(true)}
            className="p-2.5 rounded-xl bg-white/90 text-[#172033] hover:bg-white shadow-lg transition-transform hover:scale-105 cursor-pointer"
            title="Expand Fullscreen"
          >
            <Maximize2 size={16} />
          </button>
          <button
            onClick={handleDownload}
            className="p-2.5 rounded-xl bg-white/90 text-[#172033] hover:bg-white shadow-lg transition-transform hover:scale-105 cursor-pointer"
            title="Download Image"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Metadata & Prompt Badge */}
      <div className="p-3.5 space-y-2 border-t border-[#F1F4F9] dark:border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Image size={12} />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 font-mono">
              AI Generated Visual
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-500">
              {format}
            </span>
            <button
              onClick={handleCopyPrompt}
              className="text-[11px] text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white flex items-center gap-1 cursor-pointer font-sans"
            >
              {copiedPrompt ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              <span>{copiedPrompt ? "Copied" : "Prompt"}</span>
            </button>
          </div>
        </div>

        {prompt && (
          <p className="text-xs text-[#667085] dark:text-slate-300 italic line-clamp-2">
            &ldquo;{prompt}&rdquo;
          </p>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isZoomed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl bg-[#0B0F19] border border-[#1E293B] rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <span className="text-xs font-mono text-slate-400 truncate max-w-md">{prompt}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download size={13} />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setIsZoomed(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              <img
                src={fullImageUrl}
                alt={prompt}
                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneratedImageCard;