const mongoose = require("mongoose");
const metricsService = require("./metrics.service");

/**
 * Liveness Probe — Lightweight process health indicator
 */
const getHealthStatus = () => {
  return {
    success: true,
    message: "NEXORA API is healthy",
    service: "nexora-api"
  };
};

/**
 * Readiness Probe — Verifies database connectivity
 */
const getReadinessStatus = () => {
  const isConnected = mongoose.connection.readyState === 1;

  if (!isConnected) {
    const err = new Error("Database service is currently unavailable.");
    err.statusCode = 503;
    throw err;
  }

  return {
    success: true,
    message: "NEXORA API is ready to serve requests",
    database: "connected"
  };
};

/**
 * System Diagnostics Probe — Detailed system metrics and AIUsage telemetry
 */
const getDiagnosticsStatus = async (userId = null) => {
  return await metricsService.getSystemDiagnostics(userId);
};

module.exports = {
  getHealthStatus,
  getReadinessStatus,
  getDiagnosticsStatus
};
