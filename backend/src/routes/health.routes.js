const express = require("express");
const healthController = require("../controllers/health.controller");
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");

const router = express.Router();

// GET /api/v1/health — Public Liveness Probe
router.get("/", healthController.getHealth);

// GET /api/v1/health/readiness — Public Database Readiness Probe
router.get("/readiness", healthController.getReadiness);

// GET /api/v1/health/diagnostics — Protected Admin-Only System Telemetry & AIUsage Probe
router.get("/diagnostics", authenticate, requireAdmin, healthController.getDiagnostics);

module.exports = router;
