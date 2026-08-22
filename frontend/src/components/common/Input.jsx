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
        <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
          {label}
          {required && <span className="text-rose-400 ml-1">*</span>}
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
        className={`w-full px-3.5 py-2 text-sm bg-slate-900 border ${
          error ? "border-rose-500 focus:ring-rose-500" : "border-slate-800 focus:ring-indigo-500 focus:border-indigo-500"
        } rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-950 disabled:opacity-50 transition-colors ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-400 mt-0.5">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-400 mt-0.5">{helperText}</p>}
    </div>
  );
};

export default Input;
