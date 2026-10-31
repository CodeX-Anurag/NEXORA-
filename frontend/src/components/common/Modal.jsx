import React, { useEffect } from "react";

export const Modal = ({ isOpen, onClose, title, children, footer }) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#191816] border border-[#332F2A] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D2925] bg-[#1E1C19]">
          <h3 className="text-base font-semibold text-[#FAF7F2] font-display">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9C9384] hover:text-[#FAF7F2] hover:bg-[#2A2723] transition-colors focus:outline-none"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-[#CDC5B6] text-sm overflow-y-auto max-h-[70vh] space-y-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#141312] border-t border-[#2D2925]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
