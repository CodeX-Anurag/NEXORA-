const rateLimit = require("express-rate-limit");
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, AI_RATE_LIMIT_MAX } = require("../config/env");

/**
 * User-Aware Key Generator for Rate Limiters
 * Uses authenticated req.userId if available, otherwise falls back to req.ip
 */
const userAwareKeyGenerator = (req) => {
  if (req.userId) {
    return `user_${req.userId}`;
  }
  return req.ip || "127.0.0.1";
};

/**
 * Custom Handler for Standardized HTTP 429 JSON Response
 */
const rateLimitHandler = (req, res /*, next, options */) => {
  const retryAfterHeader = res.getHeader("Retry-After");
  const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60;

  return res.status(429).json({
    success: false,
    message: "Too many requests. Rate limit exceeded. Please try again later.",
    retryAfterSeconds
  });
};

/**
 * General API Rate Limiter (100 requests per 15 minutes)
 */
const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  max: RATE_LIMIT_MAX || 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userAwareKeyGenerator,
  handler: rateLimitHandler,
  validate: { keyGeneratorIpFallback: false }
});

/**
 * Authentication Brute-Force Rate Limiter (10 requests per 15 minutes)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  validate: { keyGeneratorIpFallback: false }
});

/**
 * AI Endpoint & Stream Initiation Rate Limiter (15 requests per 1 minute)
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: AI_RATE_LIMIT_MAX || 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userAwareKeyGenerator,
  handler: rateLimitHandler,
  validate: { keyGeneratorIpFallback: false }
});

/**
 * Admin Observability Rate Limiter (30 requests per 1 minute)
 */
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userAwareKeyGenerator,
  handler: rateLimitHandler,
  validate: { keyGeneratorIpFallback: false }
});

module.exports = {
  apiLimiter,
  authLimiter,
  aiLimiter,
  adminLimiter
};
