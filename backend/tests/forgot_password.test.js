const authService = require("../src/services/auth.service");
const User = require("../src/models/User.model");
const AuthSession = require("../src/models/AuthSession.model");

describe("Forgot & Reset Password Functionality Unit Tests", () => {
  const mockUser = {
    _id: "507f1f77bcf86cd799439011",
    name: "John Doe",
    email: "john@example.com",
    passwordHash: "mockHashedPassword",
    save: jest.fn().mockResolvedValue(true)
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("forgotPassword", () => {
    test("rejects missing email with 400", async () => {
      await expect(authService.forgotPassword("")).rejects.toThrow("Email address is required.");
    });

    test("returns safe generic message if user does not exist (prevents enumeration)", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      const res = await authService.forgotPassword("nonexistent@example.com");
      expect(res.success).toBe(true);
      expect(res.message).toContain("If an account exists");
    });

    test("generates and stores reset token when user exists", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue(mockUser);

      const res = await authService.forgotPassword("john@example.com");
      expect(res.success).toBe(true);
      expect(mockUser.passwordResetToken).toBeDefined();
      expect(mockUser.passwordResetExpires).toBeInstanceOf(Date);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.resetToken).toBeDefined();
      expect(res.resetUrl).toContain(res.resetToken);
    });
  });

  describe("verifyResetToken", () => {
    test("returns invalid if token is empty", async () => {
      const res = await authService.verifyResetToken("");
      expect(res.valid).toBe(false);
    });

    test("returns invalid if token is not found or expired", async () => {
      jest.spyOn(User, "findOne").mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const res = await authService.verifyResetToken("expiredorbadtoken");
      expect(res.valid).toBe(false);
      expect(res.message).toContain("invalid or has expired");
    });

    test("returns valid with email when token matches and unexpired", async () => {
      jest.spyOn(User, "findOne").mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const res = await authService.verifyResetToken("validtoken123");
      expect(res.valid).toBe(true);
      expect(res.email).toBe("john@example.com");
    });
  });

  describe("resetPassword", () => {
    test("rejects short password (< 8 chars)", async () => {
      await expect(
        authService.resetPassword({ token: "sometoken", password: "short" })
      ).rejects.toThrow("at least 8 characters");
    });

    test("rejects invalid token", async () => {
      jest.spyOn(User, "findOne").mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await expect(
        authService.resetPassword({ token: "badtoken", password: "NewStrongPassword123!" })
      ).rejects.toThrow("invalid or has expired");
    });

    test("successfully updates password, clears token, and revokes active sessions", async () => {
      jest.spyOn(User, "findOne").mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });
      jest.spyOn(AuthSession, "updateMany").mockResolvedValue({ modifiedCount: 2 });

      const res = await authService.resetPassword({
        token: "goodtoken",
        password: "BrandNewPassword2026!"
      });

      expect(res.success).toBe(true);
      expect(mockUser.passwordResetToken).toBeUndefined();
      expect(mockUser.passwordResetExpires).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalled();
      expect(AuthSession.updateMany).toHaveBeenCalledWith(
        { userId: mockUser._id },
        expect.objectContaining({ $set: expect.any(Object) })
      );
    });
  });
});
