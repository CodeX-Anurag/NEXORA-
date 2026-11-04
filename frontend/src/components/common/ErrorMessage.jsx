import React from "react";
import { AlertCircle } from "lucide-react";

export const ErrorMessage = ({ title = "An error occurred", message, onRetry }) => {
  if (!message) return null;

  return (
    <div className="p-4 rounded-xl bg-[#FEF3F2] border border-[#FECDCA] text-[#B42318] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 my-2 animate-fade-in shadow-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-rose-100 text-[#D92D20] shrink-0 mt-0.5">
          <AlertCircle size={18} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[#B42318]">{title}</h4>
          <p className="text-xs text-[#7A271A] mt-0.5 leading-relaxed">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-[#FEF3F2] text-[#B42318] border border-[#FDA29B] rounded-lg transition-colors shrink-0 shadow-sm cursor-pointer"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
