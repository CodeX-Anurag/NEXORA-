import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Sparkles, Mic, Target, Zap, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import ErrorMessage from "../components/common/ErrorMessage";

export const Login = () => {
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem("nexora_last_email") || "";
    } catch {
      return "";
    }
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  // If already authenticated, redirect to destination immediately
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, from, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login(trimmedEmail, password);
      try {
        localStorage.setItem("nexora_last_email", trimmedEmail);
      } catch {
        // ignore
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 lg:p-10 relative">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-[#4F7CFF]/5 to-[#7C6CFA]/5 blur-3xl rounded-full" />
      </div>

      {/* Two-column Auth Card */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] rounded-3xl shadow-[0_20px_50px_rgba(23,32,51,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Minimal Branding & Visual Showcase (Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 auth-showcase-panel p-8 flex-col justify-between relative overflow-hidden">
          {/* Subtle ambient glow in dark mode */}
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
                <Zap size={12} />
                <span>Next-Gen Engineering Suite</span>
              </div>
              <h2 className="text-2xl font-bold font-display text-[#172033] dark:text-[#F8FAFC] leading-snug">
                Supercharge your career & academic journey.
              </h2>
              <p className="text-xs text-[#667085] dark:text-[#94A3B8] leading-relaxed">
                The unified intelligence platform for computer science students: master oral defenses, track real productivity, and align skills to industry demand.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="auth-showcase-card p-3 rounded-xl bg-white/80 dark:bg-[#161F30]/90 border border-[#E7EAF0] dark:border-[#1F2937] flex items-center gap-3 shadow-xs transition-all duration-200">
                <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] dark:bg-[#4F7CFF]/15 text-[#4F7CFF] dark:text-[#7AA2FF] flex items-center justify-center shrink-0">
                  <Mic size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#172033] dark:text-[#F8FAFC]">AI Socratic Viva</h4>
                  <p className="text-[11px] text-[#667085] dark:text-[#94A3B8]">Voice-driven technical oral defense examiner</p>
                </div>
              </div>

              <div className="auth-showcase-card p-3 rounded-xl bg-white/80 dark:bg-[#161F30]/90 border border-[#E7EAF0] dark:border-[#1F2937] flex items-center gap-3 shadow-xs transition-all duration-200">
                <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] dark:bg-[#7C6CFA]/15 text-[#7C6CFA] dark:text-[#A78BFA] flex items-center justify-center shrink-0">
                  <Target size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#172033] dark:text-[#F8FAFC]">Career Intelligence</h4>
                  <p className="text-[11px] text-[#667085] dark:text-[#94A3B8]">Live gap analysis against top tech roles</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E7EAF0]/80 dark:border-[#1F2937] relative z-10 flex items-center gap-2 text-[11px] text-[#667085] dark:text-[#94A3B8]">
            <ShieldCheck size={14} className="text-[#12B76A]" />
            <span>Enterprise-grade security & privacy encryption</span>
          </div>
        </div>

        {/* Right Column: Authentication Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div className="space-y-1.5">
              {/* Mobile brand header */}
              <div className="flex items-center gap-2 lg:hidden mb-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#4F7CFF] to-[#7C6CFA] flex items-center justify-center text-white">
                  <Sparkles size={14} />
                </div>
                <span className="font-display font-bold text-lg text-[#172033]">NEXORA</span>
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-[#172033] font-display">
                Sign in to your account
              </h2>
              <p className="text-xs sm:text-sm text-[#667085]">
                Enter your credentials to access your student workspace
              </p>
            </div>

            {error && <ErrorMessage title="Authentication Failed" message={error} />}

            <form onSubmit={handleSubmit} method="post" className="space-y-4" autoComplete="on">
              <Input
                id="login-email"
                name="email"
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                autoComplete="username email"
                autoCapitalize="none"
                spellCheck="false"
                required
              />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="text-xs font-semibold text-[#172033] dark:text-[#F8FAFC] tracking-normal flex items-center"
                  >
                    Password
                    <span className="text-[#4F7CFF] ml-1">*</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-[#4F7CFF] dark:text-[#7AA2FF] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-2.5 text-sm font-semibold shadow-sm"
                isLoading={isSubmitting}
              >
                Sign In
              </Button>
            </form>

            <div className="pt-4 border-t border-[#E7EAF0] text-center text-xs text-[#667085]">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-[#4F7CFF] hover:text-[#3E6AE1] font-semibold transition-colors"
              >
                Register Here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
