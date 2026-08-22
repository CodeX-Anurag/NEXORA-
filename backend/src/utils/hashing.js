const bcrypt = require("bcryptjs");
const crypto = require("crypto");

/**
 * Hash plain-text password using bcryptjs
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compare plain password against stored hash
 */
const comparePassword = async (candidatePassword, hashedPassword) => {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};

/**
 * Hash opaque token string (e.g. refresh token) using SHA256
 */
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Generate a cryptographically secure random token string
 */
const generateRandomToken = () => {
  return crypto.randomBytes(40).toString("hex");
};

module.exports = {
  hashPassword,
  comparePassword,
  hashToken,
  generateRandomToken
};
