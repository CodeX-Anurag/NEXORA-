import React from "react";

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  className = "",
  type = "button",
  onClick,
  ...props
}) => {
  const baseStyle =
    "inline-flex items-center justify-center font-medium transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#111827] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none disabled:shadow-none";

  const variants = {
    primary:
      "bg-[#4F7CFF] hover:bg-[#3E6AE1] active:bg-[#3258C7] text-white shadow-sm shadow-[#4F7CFF]/20 hover:shadow-md hover:shadow-[#4F7CFF]/35 hover:brightness-105 focus:ring-[#4F7CFF]",
    secondary:
      "bg-white dark:bg-[#1A2333] hover:bg-[#F8FAFC] dark:hover:bg-[#243047] active:bg-[#F1F4F9] text-[#172033] dark:text-slate-100 border border-[#E7EAF0] dark:border-[#2D3B55] hover:border-[#4F7CFF]/40 hover:text-[#4F7CFF] dark:hover:text-[#6B93FF] shadow-2xs hover:shadow-md hover:shadow-black/5 focus:ring-[#4F7CFF]",
    outline:
      "border border-[#4F7CFF] text-[#4F7CFF] hover:bg-[#EEF2FF] dark:hover:bg-blue-950/40 hover:border-[#3E6AE1] hover:shadow-sm hover:shadow-[#4F7CFF]/20 active:bg-[#E0E7FF] focus:ring-[#4F7CFF]",
    danger:
      "bg-[#F04438] hover:bg-[#D92D20] active:bg-[#B42318] text-white shadow-sm shadow-rose-500/20 hover:shadow-md hover:shadow-rose-500/35 hover:brightness-105 focus:ring-[#F04438]",
    success:
      "bg-[#12B76A] hover:bg-[#039855] active:bg-[#027A48] text-white shadow-sm shadow-emerald-500/20 hover:shadow-md hover:shadow-emerald-500/35 hover:brightness-105 focus:ring-[#12B76A]",
    ghost:
      "bg-transparent hover:bg-[#F1F4F9] dark:hover:bg-slate-800 text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white hover:shadow-2xs focus:ring-[#D0D5DD]"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs font-semibold gap-1.5",
    md: "px-4 py-2 text-sm font-medium gap-2",
    lg: "px-5 py-2.5 text-base font-semibold gap-2.5"
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyle} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
