import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { ForgotPassword } from "../pages/ForgotPassword";
import { ResetPassword } from "../pages/ResetPassword";
import { AuthProvider } from "../context/AuthContext";
import authService from "../services/auth.service";

describe("Forgot & Reset Password UI/UX Flow Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 'Forgot password?' link on Login page", () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </AuthProvider>
    );

    const forgotLink = screen.getByRole("link", { name: /forgot password\?/i });
    expect(forgotLink).toBeInTheDocument();
    expect(forgotLink.getAttribute("href")).toBe("/forgot-password");
  });

  it("renders Forgot Password form and handles successful submission", async () => {
    vi.spyOn(authService, "forgotPassword").mockResolvedValue({
      success: true,
      message: "Password reset instructions have been generated.",
      resetToken: "testtoken123",
      resetUrl: "http://localhost:5173/reset-password?token=testtoken123"
    });

    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    expect(screen.getByRole("heading", { name: /forgot your password\?/i })).toBeInTheDocument();
    const emailInput = screen.getByLabelText(/registered email address/i);
    const submitBtn = screen.getByRole("button", { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: "student@university.edu" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authService.forgotPassword).toHaveBeenCalledWith("student@university.edu");
      expect(screen.getByText(/reset link generated/i)).toBeInTheDocument();
      expect(screen.getByText(/proceed to reset password/i)).toBeInTheDocument();
    });
  });

  it("displays error message if forgotPassword service rejects", async () => {
    vi.spyOn(authService, "forgotPassword").mockRejectedValue(new Error("Network timeout"));

    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/registered email address/i);
    const submitBtn = screen.getByRole("button", { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: "error@test.com" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/network timeout/i)).toBeInTheDocument();
    });
  });

  it("ResetPassword verifies token on load and renders form with validation", async () => {
    vi.spyOn(authService, "verifyResetToken").mockResolvedValue({
      valid: true,
      email: "student@university.edu"
    });
    vi.spyOn(authService, "resetPassword").mockResolvedValue({
      success: true,
      message: "Password reset successfully."
    });

    render(
      <MemoryRouter initialEntries={["/reset-password?token=validtoken123&email=student@university.edu"]}>
        <ResetPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(authService.verifyResetToken).toHaveBeenCalledWith("validtoken123");
      expect(screen.getByRole("heading", { name: /reset your password/i })).toBeInTheDocument();
    });

    const newPassInput = screen.getByLabelText(/^new password/i);
    const confirmPassInput = screen.getByLabelText(/confirm new password/i);
    const submitBtn = screen.getByRole("button", { name: /reset password/i });

    // Initially disabled
    expect(submitBtn).toBeDisabled();

    // Type matching password with >= 8 chars
    fireEvent.change(newPassInput, { target: { value: "StrongPass2026!" } });
    fireEvent.change(confirmPassInput, { target: { value: "StrongPass2026!" } });

    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith("validtoken123", "StrongPass2026!");
      expect(screen.getByText(/password reset successfully!/i)).toBeInTheDocument();
    });
  });

  it("ResetPassword displays error state when token is invalid or expired", async () => {
    vi.spyOn(authService, "verifyResetToken").mockResolvedValue({
      valid: false,
      message: "Password reset link is invalid or has expired."
    });

    render(
      <MemoryRouter initialEntries={["/reset-password?token=expiredtoken"]}>
        <ResetPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/link invalid or expired/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /request a new reset link/i })).toBeInTheDocument();
    });
  });

  it("Register page renders live PasswordStrengthMeter and updates dynamically", () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByTestId("password-strength-meter")).toBeInTheDocument();
    expect(screen.getByText(/password strength:/i)).toBeInTheDocument();
    expect(screen.getByText(/0 of 4 criteria/i)).toBeInTheDocument();

    const passInput = screen.getByLabelText(/^password/i);
    // Type weak password
    fireEvent.change(passInput, { target: { value: "simple" } });
    expect(screen.getByText(/weak/i)).toBeInTheDocument();

    // Type strong password (8+ chars, upper/lower, number, symbol)
    fireEvent.change(passInput, { target: { value: "P@ssw0rd2026!" } });
    expect(screen.getByText(/strong/i)).toBeInTheDocument();
    expect(screen.getByText(/4 of 4 criteria/i)).toBeInTheDocument();
  });
});
