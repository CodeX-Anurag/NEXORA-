const mongoose = require("mongoose");
const AIUsage = require("../models/AIUsage.model");
const aiUsageService = require("./aiUsage.service");
const jobScheduler = require("./jobScheduler.service");

/**
 * Bounded In-Memory Metrics Collector Service
 * Process-local latency ring buffer (Capacity: 500 samples)
 */
const RESERVOIR_CAPACITY = 500;
let latencyReservoir = [];
let reservoirIndex = 0;

let metricsState = {
  totalRequests: 0,
  status2xx: 0,
  status4xx: 0,
  status5xx: 0,
  statusCodes: {}
};

/**
 * Record an HTTP request into in-memory bounded metrics
 */
const recordHttpRequest = ({ method: _method, route: _route, statusCode, latencyMs }) => {
  metricsState.totalRequests += 1;

  // Status Code Counters
  const codeStr = String(statusCode);
  metricsState.statusCodes[codeStr] = (metricsState.statusCodes[codeStr] || 0) + 1;

  if (statusCode >= 200 && statusCode < 300) {
    metricsState.status2xx += 1;
  } else if (statusCode >= 400 && statusCode < 500) {
    metricsState.status4xx += 1;
  } else if (statusCode >= 500) {
    metricsState.status5xx += 1;
  }

  // Latency Ring Buffer Reservoir Management
  if (typeof latencyMs === "number" && latencyMs >= 0) {
    if (latencyReservoir.length < RESERVOIR_CAPACITY) {
      latencyReservoir.push(latencyMs);
    } else {
      latencyReservoir[reservoirIndex] = latencyMs;
      reservoirIndex = (reservoirIndex + 1) % RESERVOIR_CAPACITY;
    }
  }
};

/**
 * Calculate P95, P99, and Average Latency from current reservoir
 */
const calculateLatencyPercentiles = () => {
  if (latencyReservoir.length === 0) {
    return { avgMs: 0, p95Ms: 0, p99Ms: 0 };
  }

  const sorted = [...latencyReservoir].sort((a, b) => a - b);
  const count = sorted.length;

  const p95Idx = Math.floor(0.95 * (count - 1));
  const p99Idx = Math.floor(0.99 * (count - 1));
  const sum = sorted.reduce((acc, val) => acc + val, 0);

  return {
    avgMs: Math.round(sum / count),
    p95Ms: sorted[p95Idx],
    p99Ms: sorted[p99Idx]
  };
};

/**
 * Reset metrics (Used in tests)
 */
const resetMetrics = () => {
  latencyReservoir = [];
  reservoirIndex = 0;
  metricsState = {
    totalRequests: 0,
    status2xx: 0,
    status4xx: 0,
    status5xx: 0,
    statusCodes: {}
  };
};

/**
 * Get Comprehensive System Diagnostics
 * Integrates process metrics, HTTP metrics, database state, and 11A AIUsage telemetry
 */
const getSystemDiagnostics = async (userId = null) => {
  const memory = process.memoryUsage();
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };

  const latency = calculateLatencyPercentiles();
  const totalReqs = metricsState.totalRequests;
  const totalErrors = metricsState.status4xx + metricsState.status5xx;
  const errorRatePercent = totalReqs > 0 ? parseFloat(((totalErrors / totalReqs) * 100).toFixed(2)) : 0;

  // AI Telemetry aggregation (Reusing Substep 11A AIUsage model & service)
  let aiTelemetry = {
    totalRequests: 0,
    totalTokens: 0,
    totalEstimatedCostUSD: 0,
    avgLatencyMs: 0,
    avgQualityScore: 100,
    schemaValidationFailures: 0,
    fallbackCount: 0,
    qualitySuccessRatePercent: 100
  };

  if (dbState === 1) {
    try {
      if (userId) {
        const userAiMetrics = await aiUsageService.getUserUsageMetrics(userId);
        const count = userAiMetrics.totalRequests;
        aiTelemetry = {
          totalRequests: count,
          totalTokens: userAiMetrics.totalTokens,
          totalEstimatedCostUSD: userAiMetrics.totalEstimatedCost,
          avgLatencyMs: userAiMetrics.averageLatencyMs,
          avgQualityScore: userAiMetrics.averageQualityScore,
          schemaValidationFailures: userAiMetrics.schemaValidationFailures,
          fallbackCount: userAiMetrics.fallbackCount,
          qualitySuccessRatePercent: count > 0 ? parseFloat((((count - userAiMetrics.fallbackCount) / count) * 100).toFixed(1)) : 100
        };
      } else {
        const allUsageDocs = await AIUsage.find({}).lean();
        let totalTokens = 0;
        let totalCost = 0;
        let totalLatency = 0;
        let totalQualityScore = 0;
        let fallbackCount = 0;
        let schemaValidationFailures = 0;

        for (const doc of allUsageDocs) {
          totalTokens += doc.totalTokens || 0;
          totalCost += doc.estimatedCost || 0;
          totalLatency += doc.latencyMs || 0;
          totalQualityScore += typeof doc.qualityScore === "number" ? doc.qualityScore : 100;
          if (doc.fallbackActivated) fallbackCount += 1;
          if (doc.isValidSchema === false) schemaValidationFailures += 1;
        }
        const count = allUsageDocs.length;
        aiTelemetry = {
          totalRequests: count,
          totalTokens,
          totalEstimatedCostUSD: parseFloat(totalCost.toFixed(6)),
          avgLatencyMs: count > 0 ? Math.round(totalLatency / count) : 0,
          avgQualityScore: count > 0 ? parseFloat((totalQualityScore / count).toFixed(1)) : 100,
          schemaValidationFailures,
          fallbackCount,
          qualitySuccessRatePercent: count > 0 ? parseFloat((((count - fallbackCount) / count) * 100).toFixed(1)) : 100
        };
      }
    } catch {
      // Swallowed safely if database unindexed or query fails
    }
  }

  return {
    success: true,
    timestamp: new Date().toISOString(),
    system: {
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      memoryUsage: {
        rssMB: parseFloat((memory.rss / (1024 * 1024)).toFixed(2)),
        heapTotalMB: parseFloat((memory.heapTotal / (1024 * 1024)).toFixed(2)),
        heapUsedMB: parseFloat((memory.heapUsed / (1024 * 1024)).toFixed(2))
      }
    },
    database: {
      status: dbStatusMap[dbState] || "unknown",
      readyState: dbState
    },
    requests: {
      total: totalReqs,
      statusDistribution: {
        "2xx": metricsState.status2xx,
        "4xx": metricsState.status4xx,
        "5xx": metricsState.status5xx,
        details: metricsState.statusCodes
      },
      errorRatePercent
    },
    latency,
    aiTelemetry,
    backgroundJobs: jobScheduler.getSchedulerMetrics()
  };
};

module.exports = {
  recordHttpRequest,
  calculateLatencyPercentiles,
  resetMetrics,
  getSystemDiagnostics
};
