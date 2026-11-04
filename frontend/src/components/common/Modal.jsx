import React, { useEffect } from "react";
import { X } from "lucide-react";

export const Modal = ({ isOpen, onClose, title, children, footer, maxWidth = "max-w-lg" }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className={`relative w-full ${maxWidth} bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] rounded-3xl shadow-2xl dark:shadow-black/60 overflow-hidden flex flex-col animate-modal-in`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7EAF0] dark:border-[#1F2937] bg-white dark:bg-[#111827]">
          <h3 className="text-base font-semibold text-[#172033] dark:text-white font-display">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#98A2B3] hover:text-[#172033] dark:hover:text-white hover:bg-[#F8FAFC] dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-[#667085] dark:text-slate-300 text-sm overflow-y-auto max-h-[70vh] space-y-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#F8FAFC] dark:bg-[#161F30] border-t border-[#E7EAF0] dark:border-[#1F2937]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
