import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
    <div className="max-w-md mx-auto my-12 p-8 rounded-2xl bg-[#191816] border border-[#2D2925] shadow-2xl space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-[#FAF7F2] font-display">Sign In to NEXORA</h2>
        <p className="text-xs text-[#9C9384]">Enter your credentials to access your student workspace</p>
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

        <Input
          id="login-password"
          name="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

        <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isSubmitting}>
          Sign In
        </Button>
      </form>

      <div className="pt-4 border-t border-[#262420] text-center text-xs text-[#9C9384]">
        Don't have an account?{" "}
        <Link to="/register" className="text-[#E0693B] hover:text-[#EB784B] font-semibold transition-colors">
          Register Here
        </Link>
      </div>
    </div>
  );
};

export default Login;
