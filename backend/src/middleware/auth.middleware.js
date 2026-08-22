const { verifyAccessToken } = require("../utils/jwt");
const User = require("../models/User.model");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please provide a valid Bearer token."
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User associated with token no longer exists."
      });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || "Invalid or expired authentication token."
    });
  }
};

/**
 * Authorization Guard — Restricts access to users with 'admin' role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Admin authorization required to access platform telemetry."
    });
  }
  next();
};

module.exports = {
  authenticate,
  requireAdmin
};
