import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowLeft, KeyRound, Clock, ShieldCheck, CheckCircle2, ExternalLink } from "lucide-react";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import ErrorMessage from "../components/common/ErrorMessage";
import authService from "../services/auth.service";

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const res = await authService.forgotPassword(email);
      setSuccessData(res);
    } catch (err) {
      setError(err.message || "Failed to send reset email. Please try again.");
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
                <KeyRound size={12} />
                <span>Account Recovery</span>
              </div>
              <h2 className="text-2xl font-bold font-display text-[#172033] dark:text-[#F8FAFC] leading-snug">
                Regain access to your engineering suite.
              </h2>
              <p className="text-xs text-[#667085] dark:text-[#94A3B8] leading-relaxed">
                Your career trajectory, project telemetry, and oral defense histories are protected with industry-standard cryptographic sessions.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="auth-showcase-card p-3 rounded-xl bg-white/80 dark:bg-[#161F30]/90 border border-[#E7EAF0] dark:border-[#1F2937] flex items-center gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] dark:bg-[#4F7CFF]/15 text-[#4F7CFF] dark:text-[#7AA2FF] flex items-center justify-center shrink-0">
                  <Clock size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#172033] dark:text-[#F8FAFC]">1-Hour Expiration</h4>
                  <p className="text-[11px] text-[#667085] dark:text-[#94A3B8]">Single-use tokens expire quickly for safety</p>
                </div>
              </div>

              <div className="auth-showcase-card p-3 rounded-xl bg-white/80 dark:bg-[#161F30]/90 border border-[#E7EAF0] dark:border-[#1F2937] flex items-center gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] dark:bg-[#7C6CFA]/15 text-[#7C6CFA] dark:text-[#A78BFA] flex items-center justify-center shrink-0">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#172033] dark:text-[#F8FAFC]">Session Invalidation</h4>
                  <p className="text-[11px] text-[#667085] dark:text-[#94A3B8]">Resets revoke all active sessions across devices</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E7EAF0]/80 dark:border-[#1F2937] relative z-10 flex items-center gap-2 text-[11px] text-[#667085] dark:text-[#94A3B8]">
            <ShieldCheck size={14} className="text-[#12B76A]" />
            <span>End-to-end encrypted password verification</span>
          </div>
        </div>

        {/* Right Column: Form or Success Confirmation */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#667085] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-[#F8FAFC] transition-colors group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Sign In</span>
            </Link>

            {!successData ? (
              <>
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-bold tracking-tight text-[#172033] dark:text-[#F8FAFC] font-display">
                    Forgot your password?
                  </h2>
                  <p className="text-xs sm:text-sm text-[#667085] dark:text-[#94A3B8]">
                    Enter your email address below and we'll generate a secure password reset link.
                  </p>
                </div>

                {error && <ErrorMessage title="Request Failed" message={error} />}

                <form onSubmit={handleSubmit} method="post" className="space-y-4">
                  <Input
                    id="reset-email"
                    name="email"
                    label="Registered Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck="false"
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-2.5 text-sm font-semibold shadow-sm"
                    isLoading={isSubmitting}
                  >
                    Send Reset Link
                  </Button>
                </form>

                <p className="text-xs text-center text-[#667085] dark:text-[#94A3B8] pt-2">
                  Remember your password?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-[#4F7CFF] dark:text-[#7AA2FF] hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </>
            ) : (
              <div className="space-y-5 animate-fade-in">
                <div className="w-12 h-12 rounded-2xl bg-[#ECFDF3] dark:bg-[#12B76A]/15 text-[#12B76A] flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[#172033] dark:text-[#F8FAFC] font-display">
                    Reset Link Generated
                  </h3>
                  <p className="text-xs sm:text-sm text-[#667085] dark:text-[#94A3B8] leading-relaxed">
                    {successData.message || "If an account with that email exists, password reset instructions have been generated."}
                  </p>
                </div>

                {/* Development environment direct link helper */}
                {successData.resetUrl && (
                  <div className="p-4 rounded-xl bg-[#EEF2FF] dark:bg-[#4F7CFF]/10 border border-[#4F7CFF]/20 dark:border-[#4F7CFF]/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#4F7CFF] dark:text-[#7AA2FF] uppercase tracking-wider">
                        Development Direct Link
                      </span>
                      <span className="text-[10px] text-[#667085] dark:text-[#94A3B8]">Local Dev Mode</span>
                    </div>
                    <p className="text-xs text-[#172033] dark:text-[#F8FAFC]">
                      Since mail server is in development mode, you can open your reset link directly:
                    </p>
                    <Link
                      to={`/reset-password?token=${successData.resetToken}&email=${encodeURIComponent(email)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4F7CFF] text-white text-xs font-semibold hover:bg-[#3E6AE1] transition-colors"
                    >
                      <span>Proceed to Reset Password</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                )}

                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSuccessData(null);
                      setEmail("");
                    }}
                    className="w-full text-xs"
                  >
                    Try Another Email
                  </Button>
                  <Link
                    to="/login"
                    className="w-full py-2 text-center text-xs font-semibold text-[#4F7CFF] dark:text-[#7AA2FF] hover:underline"
                  >
                    Return to Sign In
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
