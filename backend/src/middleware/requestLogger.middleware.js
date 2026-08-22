const metricsService = require("../services/metrics.service");
const logger = require("../utils/logger");

const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;

    // Record request into in-memory bounded metrics
    metricsService.recordHttpRequest({
      method: req.method,
      route: req.originalUrl,
      statusCode: res.statusCode,
      latencyMs: duration
    });

    // Output structured JSON log in non-test mode
    if (process.env.NODE_ENV !== "test") {
      logger.info("http_request", {
        method: req.method,
        route: req.originalUrl,
        status: res.statusCode,
        latencyMs: duration
      });
    }
  });
  next();
};

module.exports = requestLogger;
