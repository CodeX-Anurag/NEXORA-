import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, CheckCircle2, Rocket, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import ErrorMessage from "../components/common/ErrorMessage";
import PasswordStrengthMeter from "../components/common/PasswordStrengthMeter";

export const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Please enter your full name.");
      return;
    }

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      await register(trimmedName, trimmedEmail, password);
      try {
        localStorage.setItem("nexora_last_email", trimmedEmail);
      } catch {
        // ignore
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 lg:p-10 relative">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-[#7C6CFA]/5 to-[#4F7CFF]/5 blur-3xl rounded-full" />
      </div>

      {/* Two-column Auth Card */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] rounded-3xl shadow-[0_20px_50px_rgba(23,32,51,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Minimal Branding & Visual Showcase (Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 auth-showcase-panel p-8 flex-col justify-between relative overflow-hidden">
          {/* Subtle ambient glow in dark mode */}
          <div className="absolute -top-20 -left-20 w-56 h-56 bg-[#7C6CFA]/10 dark:bg-[#7C6CFA]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-[#4F7CFF]/10 dark:bg-[#4F7CFF]/15 rounded-full blur-3xl pointer-events-none" />

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
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F5F3FF] dark:bg-[#7C6CFA]/15 border border-[#7C6CFA]/20 dark:border-[#7C6CFA]/30 text-[#7C6CFA] dark:text-[#A78BFA] text-[11px] font-semibold">
                <Rocket size={12} />
                <span>Join Top Technical Students</span>
              </div>
              <h2 className="text-2xl font-bold font-display text-[#172033] dark:text-[#F8FAFC] leading-snug">
                Accelerate your growth with intelligent tools.
              </h2>
              <p className="text-xs text-[#667085] dark:text-[#94A3B8] leading-relaxed">
                Connect your GitHub, LeetCode, and study routines to build an impressive profile backed by verifiable technical competencies.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-start gap-2.5 text-xs text-[#667085] dark:text-[#94A3B8]">
                <CheckCircle2 size={16} className="text-[#12B76A] shrink-0 mt-0.5" />
                <span>Unlimited AI Socratic Viva oral practice exams</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-[#667085] dark:text-[#94A3B8]">
                <CheckCircle2 size={16} className="text-[#12B76A] shrink-0 mt-0.5" />
                <span>Dynamic GitHub & coding platform telemetry sync</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-[#667085] dark:text-[#94A3B8]">
                <CheckCircle2 size={16} className="text-[#12B76A] shrink-0 mt-0.5" />
                <span>Automated resume compiler & portfolio generator</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E7EAF0]/80 dark:border-[#1F2937] relative z-10 flex items-center gap-2 text-[11px] text-[#667085] dark:text-[#94A3B8]">
            <ShieldCheck size={14} className="text-[#12B76A]" />
            <span>Completely free for students & learners</span>
          </div>
        </div>

        {/* Right Column: Registration Form */}
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
                Create your account
              </h2>
              <p className="text-xs sm:text-sm text-[#667085]">
                Join the AI-powered student productivity & career platform
              </p>
            </div>

            {error && <ErrorMessage title="Registration Failed" message={error} />}

            <form onSubmit={handleSubmit} method="post" className="space-y-3.5" autoComplete="on">
              <Input
                id="register-name"
                name="name"
                label="Full Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                autoComplete="name"
                autoCapitalize="words"
                required
              />

              <Input
                id="register-email"
                name="email"
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@university.edu"
                autoComplete="username email"
                autoCapitalize="none"
                spellCheck="false"
                required
              />

              <div className="space-y-1">
                <Input
                  id="register-password"
                  name="password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters password"
                  autoComplete="new-password"
                  required
                />
                <PasswordStrengthMeter
                  password={password}
                  confirmPassword={confirmPassword ? confirmPassword : null}
                />
              </div>

              <Input
                id="register-confirm-password"
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full py-2.5 text-sm font-semibold shadow-sm mt-1"
                isLoading={isSubmitting}
              >
                Create Account
              </Button>
            </form>

            <div className="pt-4 border-t border-[#E7EAF0] text-center text-xs text-[#667085]">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-[#4F7CFF] hover:text-[#3E6AE1] font-semibold transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
