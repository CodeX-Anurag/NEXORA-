const User = require("../models/User.model");
const AuthSession = require("../models/AuthSession.model");
const { hashPassword, comparePassword, hashToken, generateRandomToken } = require("../utils/hashing");
const { generateAccessToken } = require("../utils/jwt");
const { NODE_ENV, REFRESH_TOKEN_EXPIRES_DAYS, CLIENT_URL } = require("../config/env");
const crypto = require("crypto");

const REFRESH_COOKIE_NAME = "nexora_refreshToken";

/**
 * Cookie options for httpOnly refresh token
 */
const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: NODE_ENV === "production",
  sameSite: NODE_ENV === "production" ? "none" : "lax",
  path: "/api/v1/auth",
  maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000
});

/**
 * Helper to set refresh token cookie
 */
const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE_NAME, token, getRefreshCookieOptions());
};

/**
 * Helper to clear refresh token cookie
 */
const clearRefreshCookie = (res) => {
  res.cookie(REFRESH_COOKIE_NAME, "", {
    ...getRefreshCookieOptions(),
    maxAge: 0
  });
};

/**
 * Create a new refresh session and hash token for storage
 */
const createAuthSession = async (userId, existingFamilyId = null) => {
  const rawRefreshToken = generateRandomToken();
  const tokenHash = hashToken(rawRefreshToken);
  const familyId = existingFamilyId || crypto.randomUUID();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  await AuthSession.create({
    userId,
    tokenHash,
    familyId,
    expiresAt
  });

  return { rawRefreshToken, familyId };
};

/**
 * Register a new user
 */
const register = async ({ name, email, password }) => {
  if (!name || !email || !password) {
    const err = new Error("Name, email, and password are required.");
    err.statusCode = 400;
    throw err;
  }

  if (password.length < 8) {
    const err = new Error("Password must be at least 8 characters long.");
    err.statusCode = 400;
    throw err;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const err = new Error("An account with this email address already exists.");
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash
  });

  const { rawRefreshToken } = await createAuthSession(user._id);
  const accessToken = generateAccessToken(user);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || "student",
      education: user.education,
      preferences: user.preferences,
      careerGoal: user.careerGoal,
      createdAt: user.createdAt
    },
    accessToken,
    rawRefreshToken
  };
};

/**
 * Login user
 */
const login = async ({ email, password }) => {
  if (!email || !password) {
    const err = new Error("Email and password are required.");
    err.statusCode = 400;
    throw err;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
  if (!user) {
    const err = new Error("Invalid email or password.");
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    const err = new Error("Invalid email or password.");
    err.statusCode = 401;
    throw err;
  }

  const { rawRefreshToken } = await createAuthSession(user._id);
  const accessToken = generateAccessToken(user);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || "student",
      education: user.education,
      preferences: user.preferences,
      careerGoal: user.careerGoal,
      createdAt: user.createdAt
    },
    accessToken,
    rawRefreshToken
  };
};

/**
 * Refresh access token & rotate refresh token session
 */
const refreshSession = async (rawRefreshToken) => {
  if (!rawRefreshToken) {
    const err = new Error("Refresh token missing.");
    err.statusCode = 401;
    throw err;
  }

  const incomingHash = hashToken(rawRefreshToken);
  const session = await AuthSession.findOne({ tokenHash: incomingHash });

  if (!session) {
    const err = new Error("Invalid refresh session.");
    err.statusCode = 401;
    throw err;
  }

  // REUSE DETECTION: If session was already revoked, revoke all sessions in family!
  if (session.revokedAt) {
    console.warn(`[Security Alert] Refresh token reuse detected for family ${session.familyId}! Revoking all sessions.`);
    await AuthSession.updateMany(
      { familyId: session.familyId },
      { $set: { revokedAt: new Date() } }
    );
    const err = new Error("Security alert: Token reuse detected. Please log in again.");
    err.statusCode = 401;
    throw err;
  }

  // EXPIRATION CHECK
  if (new Date() > session.expiresAt) {
    session.revokedAt = new Date();
    await session.save();
    const err = new Error("Refresh session expired. Please log in again.");
    err.statusCode = 401;
    throw err;
  }

  // Verify user still exists
  const user = await User.findById(session.userId);
  if (!user) {
    const err = new Error("User no longer exists.");
    err.statusCode = 401;
    throw err;
  }

  // ROTATION: Revoke current session & create new session in same familyId
  session.revokedAt = new Date();
  await session.save();

  const { rawRefreshToken: newRefreshToken } = await createAuthSession(user._id, session.familyId);
  const newAccessToken = generateAccessToken(user);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || "student",
      education: user.education,
      preferences: user.preferences,
      careerGoal: user.careerGoal,
      createdAt: user.createdAt
    },
    accessToken: newAccessToken,
    rawRefreshToken: newRefreshToken
  };
};

/**
 * Logout user session
 */
const logout = async (rawRefreshToken) => {
  if (rawRefreshToken) {
    const tokenHash = hashToken(rawRefreshToken);
    await AuthSession.updateOne(
      { tokenHash },
      { $set: { revokedAt: new Date() } }
    );
  }
};

/**
 * Generate password reset token & instructions
 */
const forgotPassword = async (email) => {
  if (!email) {
    const err = new Error("Email address is required.");
    err.statusCode = 400;
    throw err;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  // For security, do not leak whether account exists to prevent email enumeration
  if (!user) {
    return {
      success: true,
      message: "If an account exists with this email address, you will receive password reset instructions."
    };
  }

  // Generate 64-char crypto secure hex token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);

  // Expiration: 1 hour from generation
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const clientBase = (CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  const resetUrl = `${clientBase}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

  console.log(`[AUTH] Password reset requested for ${user.email}. Token generated.`);
  console.log(`[AUTH] Reset Link: ${resetUrl}`);

  return {
    success: true,
    message: "Password reset instructions have been generated.",
    // Include resetUrl and token in non-production environments to allow immediate UI testing
    ...(NODE_ENV !== "production" ? { resetUrl, resetToken: rawToken } : {})
  };
};

/**
 * Verify whether a reset token is valid and unexpired
 */
const verifyResetToken = async (rawToken) => {
  if (!rawToken) {
    return { valid: false, message: "Reset token is required." };
  }

  const hashedToken = hashToken(rawToken);
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() }
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    return {
      valid: false,
      message: "Password reset link is invalid or has expired. Please request a new one."
    };
  }

  return {
    valid: true,
    email: user.email
  };
};

/**
 * Reset user password with token
 */
const resetPassword = async ({ token, password }) => {
  if (!token) {
    const err = new Error("Reset token is required.");
    err.statusCode = 400;
    throw err;
  }

  if (!password || password.length < 8) {
    const err = new Error("Password must be at least 8 characters long.");
    err.statusCode = 400;
    throw err;
  }

  const hashedToken = hashToken(token);
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() }
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    const err = new Error("Password reset link is invalid or has expired. Please request a new one.");
    err.statusCode = 400;
    throw err;
  }

  // Update password and clear reset fields
  user.passwordHash = await hashPassword(password);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Security: Revoke all existing sessions for this user so any compromised tokens are invalidated
  await AuthSession.updateMany(
    { userId: user._id },
    { $set: { revokedAt: new Date() } }
  );

  console.log(`[AUTH] Password successfully reset for user ${user.email}. Sessions invalidated.`);

  return {
    success: true,
    message: "Your password has been reset successfully. You can now log in with your new password."
  };
};

module.exports = {
  register,
  login,
  refreshSession,
  logout,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  setRefreshCookie,
  clearRefreshCookie,
  REFRESH_COOKIE_NAME
};
