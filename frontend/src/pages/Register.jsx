import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import ErrorMessage from "../components/common/ErrorMessage";

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
    <div className="max-w-md mx-auto my-12 p-8 rounded-2xl bg-[#191816] border border-[#2D2925] shadow-2xl space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-[#FAF7F2] font-display">Create NEXORA Account</h2>
        <p className="text-xs text-[#9C9384]">Join the AI-powered student productivity platform</p>
      </div>

      {error && <ErrorMessage title="Registration Failed" message={error} />}

      <form onSubmit={handleSubmit} method="post" className="space-y-4" autoComplete="on">
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

        <Input
          id="register-password"
          name="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          helperText="Minimum 8 characters"
          autoComplete="new-password"
          required
        />

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

        <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isSubmitting}>
          Create Account
        </Button>
      </form>

      <div className="pt-4 border-t border-[#262420] text-center text-xs text-[#9C9384]">
        Already have an account?{" "}
        <Link to="/login" className="text-[#E0693B] hover:text-[#EB784B] font-semibold transition-colors">
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default Register;
