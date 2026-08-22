const express = require("express");
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authLimiter } = require("../middleware/rateLimiter.middleware");

const router = express.Router();

// POST /api/v1/auth/register (Guarded by authLimiter for brute-force protection)
router.post("/register", authLimiter, authController.register);

// POST /api/v1/auth/login (Guarded by authLimiter for brute-force protection)
router.post("/login", authLimiter, authController.login);

// POST /api/v1/auth/refresh
router.post("/refresh", authController.refresh);

// POST /api/v1/auth/logout
router.post("/logout", authController.logout);

// GET /api/v1/auth/me (protected)
router.get("/me", authenticate, authController.getMe);

module.exports = router;
