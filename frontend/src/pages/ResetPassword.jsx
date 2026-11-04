import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, ArrowLeft, CheckCircle2, ShieldCheck, AlertCircle, Lock } from "lucide-react";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import ErrorMessage from "../components/common/ErrorMessage";
import PasswordStrengthMeter from "../components/common/PasswordStrengthMeter";
import authService from "../services/auth.service";

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlToken = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const [token, setToken] = useState(urlToken);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(Boolean(urlToken));
  const [tokenStatus, setTokenStatus] = useState({ valid: true, message: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // If token is in URL on load, verify its validity with backend
  useEffect(() => {
    if (!urlToken) return;

    let isMounted = true;
    setIsVerifying(true);

    authService
      .verifyResetToken(urlToken)
      .then((res) => {
        if (!isMounted) return;
        if (!res.valid) {
          setTokenStatus({ valid: false, message: res.message || "Invalid or expired reset token." });
        } else {
          setTokenStatus({ valid: true, message: "" });
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setTokenStatus({ valid: false, message: err.message || "Failed to verify reset token." });
      })
      .finally(() => {
        if (isMounted) setIsVerifying(false);
      });

    return () => {
      isMounted = false;
    };
  }, [urlToken]);

  // Real-time password validation metrics
  const hasMinLength = password.length >= 8;
  const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Please provide a valid password reset token.");
      return;
    }

    if (!hasMinLength) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.resetPassword(token, password);
      setIsSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 lg:p-10 relative">
      {/* Subtle background ambient blur */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-[#4F7CFF]/5 to-[#7C6CFA]/5 blur-3xl rounded-full" />
      </div>

      {/* Two-column Auth Card */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] rounded-3xl shadow-[0_20px_50px_rgba(23,32,51,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Visual Showcase (Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 auth-showcase-panel p-8 flex-col justify-between relative overflow-hidden">
          {/* Ambient lighting in dark mode */}
          <div className="absolute -top-20 -left-20 w-56 h-56 bg-[#4F7CFF]/10 dark:bg-[#4F7CFF]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-[#7C6CFA]/10 dark:bg-[#7C6CFA]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#4F7CFF] to-[#7C6CFA] flex items-center justify-center text-white shadow-md shadow-[#4F7CFF]/20">
                <Sparkles size={18} />
              </div>
              <span className="font-display font-bold text-xl text-[#172033] dark:text-[#F8FAFC] tracking-tight">
                NEXORA
              </span>
            </div>

            <div className="space-y-3 pt-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EEF2FF] dark:bg-[#4F7CFF]/15 border border-[#4F7CFF]/20 dark:border-[#4F7CFF]/30 text-[#4F7CFF] dark:text-[#7AA2FF] text-[11px] font-semibold">
                <Lock size={12} />
                <span>Security Hardening</span>
              </div>
              <h2 className="text-2xl font-bold font-display text-[#172033] dark:text-[#F8FAFC] leading-snug">
                Set a strong, memorable new password.
              </h2>
              <p className="text-xs text-[#667085] dark:text-[#94A3B8] leading-relaxed">
                Choose a unique passphrase of at least 8 characters. We recommend combining letters, numbers, and symbols.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-[#667085] dark:text-[#94A3B8]">
                <CheckCircle2
                  size={15}
                  className={hasMinLength ? "text-[#12B76A]" : "text-[#98A2B3] dark:text-[#64748B]"}
                />
                <span className={hasMinLength ? "text-[#172033] dark:text-[#F8FAFC] font-medium" : ""}>
                  At least 8 characters
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-[#667085] dark:text-[#94A3B8]">
                <CheckCircle2
                  size={15}
                  className={hasNumberOrSpecial ? "text-[#12B76A]" : "text-[#98A2B3] dark:text-[#64748B]"}
                />
                <span className={hasNumberOrSpecial ? "text-[#172033] dark:text-[#F8FAFC] font-medium" : ""}>
                  Numbers or special symbols
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-[#667085] dark:text-[#94A3B8]">
                <CheckCircle2
                  size={15}
                  className={passwordsMatch ? "text-[#12B76A]" : "text-[#98A2B3] dark:text-[#64748B]"}
                />
                <span className={passwordsMatch ? "text-[#172033] dark:text-[#F8FAFC] font-medium" : ""}>
                  Passwords match
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E7EAF0]/80 dark:border-[#1F2937] relative z-10 flex items-center gap-2 text-[11px] text-[#667085] dark:text-[#94A3B8]">
            <ShieldCheck size={14} className="text-[#12B76A]" />
            <span>Encrypted with bcrypt cryptographic salting</span>
          </div>
        </div>

        {/* Right Column: Reset Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#667085] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-[#F8FAFC] transition-colors group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Sign In</span>
            </Link>

            {isSuccess ? (
              <div className="space-y-5 animate-fade-in">
                <div className="w-12 h-12 rounded-2xl bg-[#ECFDF3] dark:bg-[#12B76A]/15 text-[#12B76A] flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[#172033] dark:text-[#F8FAFC] font-display">
                    Password Reset Successfully!
                  </h3>
                  <p className="text-xs sm:text-sm text-[#667085] dark:text-[#94A3B8] leading-relaxed">
                    Your password has been securely updated. You can now log in to your account with your new credentials.
                  </p>
                </div>

                <Button
                  variant="primary"
                  onClick={() => navigate("/login")}
                  className="w-full py-2.5 text-sm font-semibold shadow-sm"
                >
                  Sign In With New Password
                </Button>
              </div>
            ) : !tokenStatus.valid ? (
              <div className="space-y-5">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/15 text-rose-500 flex items-center justify-center">
                  <AlertCircle size={24} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[#172033] dark:text-[#F8FAFC] font-display">
                    Link Invalid or Expired
                  </h3>
                  <p className="text-xs sm:text-sm text-[#667085] dark:text-[#94A3B8] leading-relaxed">
                    {tokenStatus.message}
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    variant="primary"
                    onClick={() => navigate("/forgot-password")}
                    className="w-full text-xs font-semibold py-2.5"
                  >
                    Request a New Reset Link
                  </Button>
                  <Link
                    to="/login"
                    className="w-full py-2 text-center text-xs font-semibold text-[#4F7CFF] dark:text-[#7AA2FF] hover:underline"
                  >
                    Return to Sign In
                  </Link>
                </div>
              </div>
            ) : isVerifying ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-8 h-8 mx-auto border-2 border-[#4F7CFF] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-[#667085] dark:text-[#94A3B8]">Verifying reset token...</p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-bold tracking-tight text-[#172033] dark:text-[#F8FAFC] font-display">
                    Reset your password
                  </h2>
                  <p className="text-xs sm:text-sm text-[#667085] dark:text-[#94A3B8]">
                    {emailParam ? (
                      <>Resetting password for <span className="font-semibold text-[#172033] dark:text-[#F8FAFC]">{emailParam}</span></>
                    ) : (
                      "Enter your new credentials below to update your account."
                    )}
                  </p>
                </div>

                {error && <ErrorMessage title="Reset Failed" message={error} />}

                <form onSubmit={handleSubmit} method="post" className="space-y-4">
                  {/* If user navigated without URL token, allow typing/pasting it */}
                  {!urlToken && (
                    <Input
                      id="reset-manual-token"
                      name="token"
                      label="Reset Security Code / Token"
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Paste your 64-character token"
                      required
                    />
                  )}

                  <div className="space-y-1.5">
                    <Input
                      id="new-password"
                      name="password"
                      label="New Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                    />

                    {/* Live Password Strength Meter */}
                    <PasswordStrengthMeter
                      password={password}
                      confirmPassword={confirmPassword ? confirmPassword : null}
                    />
                  </div>

                  <Input
                    id="confirm-password"
                    name="confirmPassword"
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    error={confirmPassword && password !== confirmPassword ? "Passwords do not match" : ""}
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-2.5 text-sm font-semibold shadow-sm"
                    isLoading={isSubmitting}
                    disabled={!password || password.length < 8 || password !== confirmPassword}
                  >
                    Reset Password
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
