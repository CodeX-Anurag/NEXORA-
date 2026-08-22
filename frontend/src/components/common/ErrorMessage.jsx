import React from "react";

export const ErrorMessage = ({ title = "An error occurred", message, onRetry }) => {
  if (!message) return null;

  return (
    <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 my-2">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-rose-900/50 text-rose-400 shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-rose-300">{title}</h4>
          <p className="text-xs text-rose-400/90 mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 text-xs font-medium bg-rose-900/40 hover:bg-rose-900/80 text-rose-200 border border-rose-700/50 rounded-lg transition-colors shrink-0"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
