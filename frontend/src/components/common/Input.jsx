import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export const Input = ({
  label,
  error,
  helperText,
  id,
  name,
  type = "text",
  className = "",
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  autoComplete,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const inputName = name || inputId;

  const isPasswordType = type === "password";
  const effectiveType = isPasswordType ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-[#172033] tracking-normal flex items-center"
        >
          {label}
          {required && <span className="text-[#4F7CFF] ml-1">*</span>}
        </label>
      )}

      <div className="relative flex items-center w-full">
        <input
          id={inputId}
          name={inputName}
          type={effectiveType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          className={`w-full px-3.5 py-2.5 text-sm bg-white border ${
            error
              ? "border-rose-500 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
              : "border-[#E7EAF0] hover:border-[#D0D5DD] focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10"
          } rounded-xl text-[#172033] placeholder-[#98A2B3] focus:outline-none transition-all shadow-[0_1px_2px_rgba(16,24,40,0.04)] disabled:opacity-50 disabled:bg-[#F8FAFC] ${
            isPasswordType ? "pr-10" : ""
          } ${className}`}
          {...props}
        />

        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 p-1 text-[#98A2B3] hover:text-[#172033] transition-colors focus:outline-none cursor-pointer"
            aria-label={showPassword ? "Mask input" : "Reveal input"}
            title={showPassword ? "Hide text" : "Show text"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-rose-500 font-medium mt-0.5">{error}</p>}
      {!error && helperText && <p className="text-xs text-[#667085] mt-0.5">{helperText}</p>}
    </div>
  );
};

export default Input;
