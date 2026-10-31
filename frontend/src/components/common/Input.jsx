import React from "react";

export const Input = ({
  label,
  error,
  helperText,
  id,
  type = "text",
  className = "",
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-[#CDC5B6] uppercase tracking-wider">
          {label}
          {required && <span className="text-[#E0693B] ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`w-full px-3.5 py-2.5 text-sm bg-[#181715] border ${
          error
            ? "border-rose-500/80 focus:ring-rose-500 focus:border-rose-500"
            : "border-[#302C28] hover:border-[#423D37] focus:border-[#E0693B] focus:ring-[#E0693B]"
        } rounded-xl text-[#FAF7F2] placeholder-[#787165] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#121110] disabled:opacity-50 transition-all ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-400 mt-0.5">{error}</p>}
      {!error && helperText && <p className="text-xs text-[#9C9384] mt-0.5">{helperText}</p>}
    </div>
  );
};

export default Input;
