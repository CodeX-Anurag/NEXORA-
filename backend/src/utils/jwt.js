const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/env");

/**
 * Sign short-lived access JWT token with minimum required claims
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user._id.toString() },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Verify JWT access token
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    const err = new Error(
      error.name === "TokenExpiredError" ? "Access token expired" : "Invalid access token"
    );
    err.statusCode = 401;
    throw err;
  }
};

module.exports = {
  generateAccessToken,
  verifyAccessToken
};
