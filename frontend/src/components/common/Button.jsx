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
    "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#121110] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

  const variants = {
    primary:
      "bg-[#E0693B] hover:bg-[#EB784B] active:bg-[#C5572C] text-white shadow-sm shadow-[#E0693B]/20 focus:ring-[#E0693B]",
    secondary:
      "bg-[#22201D] hover:bg-[#2A2724] text-[#FAF7F2] border border-[#35312C] hover:border-[#47423B] focus:ring-[#CDC5B6]",
    outline:
      "border border-[#E0693B]/50 text-[#E0693B] hover:bg-[#E0693B]/10 hover:border-[#E0693B] focus:ring-[#E0693B]",
    danger:
      "bg-[#DC3838] hover:bg-[#C52B2B] text-white shadow-sm shadow-rose-900/30 focus:ring-rose-500",
    success:
      "bg-[#2EA366] hover:bg-[#268B57] text-white shadow-sm shadow-emerald-900/30 focus:ring-[#2EA366]",
    ghost:
      "bg-transparent hover:bg-[#22201D] text-[#CDC5B6] hover:text-[#FAF7F2] focus:ring-[#47423B]"
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
