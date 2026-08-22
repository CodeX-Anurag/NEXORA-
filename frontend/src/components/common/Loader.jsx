import React from "react";

export const Loader = ({ text = "Loading NEXORA...", size = "md", fullScreen = false }) => {
  const sizeMap = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4"
  };

  const loaderContent = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeMap[size] || sizeMap.md} border-indigo-500 border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label="loading"
      />
      {text && <p className="text-sm font-medium text-slate-400 animate-pulse">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90">{loaderContent}</div>;
  }

  return <div className="p-6 flex items-center justify-center w-full">{loaderContent}</div>;
};

export default Loader;
