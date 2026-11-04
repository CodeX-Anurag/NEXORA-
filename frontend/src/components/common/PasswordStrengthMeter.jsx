import React from "react";
import { Check } from "lucide-react";

/**
 * Reusable Live Password Strength Meter
 * Evaluates password on 4 standards:
 * 1. Minimum 8 characters
 * 2. Mixed casing (lowercase and uppercase)
 * 3. At least one digit (0-9)
 * 4. At least one special symbol (!@#$%^&*...)
 */
export const PasswordStrengthMeter = ({
  password = "",
  confirmPassword = null,
  showRequirements = true,
  className = ""
}) => {
  const hasMinLength = password.length >= 8;
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const isMatching = confirmPassword !== null ? password.length > 0 && password === confirmPassword : true;

  const rules = [
    { label: "8+ characters", met: hasMinLength },
    { label: "Upper & lowercase", met: hasMixedCase },
    { label: "At least 1 number", met: hasNumber },
    { label: "At least 1 symbol", met: hasSymbol }
  ];

  const metCount = rules.filter((r) => r.met).length;

  // Level configuration
  const getLevel = () => {
    if (!password) {
      return {
        label: "Empty",
        colorText: "text-[#98A2B3] dark:text-[#64748B]",
        colorBg: "bg-transparent",
        bars: 0
      };
    }
    if (metCount <= 1) {
      return {
        label: "Weak",
        colorText: "text-rose-600 dark:text-rose-400 font-semibold",
        colorBg: "bg-rose-500",
        bars: 1
      };
    }
    if (metCount === 2) {
      return {
        label: "Fair",
        colorText: "text-amber-600 dark:text-amber-400 font-semibold",
        colorBg: "bg-amber-500",
        bars: 2
      };
    }
    if (metCount === 3) {
      return {
        label: "Good",
        colorText: "text-[#4F7CFF] dark:text-[#7AA2FF] font-semibold",
        colorBg: "bg-[#4F7CFF]",
        bars: 3
      };
    }
    return {
      label: "Strong",
      colorText: "text-emerald-600 dark:text-emerald-400 font-semibold",
      colorBg: "bg-emerald-500",
      bars: 4
    };
  };

  const level = getLevel();

  return (
    <div className={`space-y-2 pt-1 ${className}`} data-testid="password-strength-meter">
      {/* Strength Bar Header */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#667085] dark:text-[#94A3B8] font-medium flex items-center gap-1.5">
          <span>Password Strength:</span>
          <span className={level.colorText}>{level.label}</span>
        </span>
        <span className="text-[11px] text-[#98A2B3] dark:text-[#64748B]">
          {metCount} of 4 criteria
        </span>
      </div>

      {/* 4 Segmented Progress Bars */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        {[0, 1, 2, 3].map((index) => {
          const isFilled = index < level.bars;
          return (
            <div
              key={index}
              className={`h-full rounded-full transition-all duration-300 ${
                isFilled
                  ? level.colorBg
                  : "bg-[#E7EAF0] dark:bg-[#1F2937]"
              }`}
            />
          );
        })}
      </div>

      {/* Live Requirement Tags */}
      {showRequirements && (
        <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
          {rules.map((rule, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-1.5 transition-colors duration-200 ${
                rule.met
                  ? "text-emerald-600 dark:text-emerald-400 font-medium"
                  : "text-[#98A2B3] dark:text-[#64748B]"
              }`}
            >
              {rule.met ? (
                <Check size={12} className="shrink-0 stroke-[2.5]" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-[#D0D5DD] dark:bg-[#374151] shrink-0 ml-0.5" />
              )}
              <span>{rule.label}</span>
            </div>
          ))}

          {/* Confirm Password matching check if prop passed */}
          {confirmPassword !== null && (
            <div
              className={`flex items-center gap-1.5 col-span-2 transition-colors duration-200 ${
                isMatching
                  ? "text-emerald-600 dark:text-emerald-400 font-medium"
                  : "text-[#98A2B3] dark:text-[#64748B]"
              }`}
            >
              {isMatching ? (
                <Check size={12} className="shrink-0 stroke-[2.5]" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-[#D0D5DD] dark:bg-[#374151] shrink-0 ml-0.5" />
              )}
              <span>Passwords match</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;
