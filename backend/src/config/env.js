const dotenv = require("dotenv");
const path = require("path");

// Load .env variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nexora_db",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  JWT_SECRET: process.env.JWT_SECRET || "nexora_dev_secret_key_change_in_production_32bytes",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  REFRESH_TOKEN_EXPIRES_DAYS: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || "7", 10),
  LLM_PROVIDER: process.env.LLM_PROVIDER || "mock",
  LLM_API_KEY: process.env.LLM_API_KEY || "mock-key",
  LLM_MODEL: process.env.LLM_MODEL || "mock-model",
  EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER || "mock",
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
  EMBEDDING_DIMENSION: parseInt(process.env.EMBEDDING_DIMENSION || "1536", 10),
  EMBEDDING_API_KEY: process.env.EMBEDDING_API_KEY || "mock-key",
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
  AI_RATE_LIMIT_MAX: parseInt(process.env.AI_RATE_LIMIT_MAX || "20", 10)
};

/**
 * Production Environment Validation (Fail-Fast)
 */
const validateEnv = (cfg) => {
  if (cfg.NODE_ENV !== "production") return;

  const errors = [];

  if (!cfg.JWT_SECRET || cfg.JWT_SECRET === "nexora_dev_secret_key_change_in_production_32bytes") {
    errors.push("JWT_SECRET must be configured with a secure production secret key.");
  }

  if (!cfg.MONGODB_URI || cfg.MONGODB_URI.includes("127.0.0.1/nexora_db") || cfg.MONGODB_URI.includes("localhost/nexora_db")) {
    errors.push("MONGODB_URI must point to a valid production MongoDB instance.");
  }

  if (cfg.LLM_PROVIDER === "openai" && (!cfg.LLM_API_KEY || cfg.LLM_API_KEY === "mock-key")) {
    errors.push("LLM_API_KEY must be provided when LLM_PROVIDER is set to 'openai'.");
  }

  if (cfg.EMBEDDING_PROVIDER === "openai" && (!cfg.EMBEDDING_API_KEY || cfg.EMBEDDING_API_KEY === "mock-key")) {
    errors.push("EMBEDDING_API_KEY must be provided when EMBEDDING_PROVIDER is set to 'openai'.");
  }

  if (errors.length > 0) {
    throw new Error(`[Production Configuration Error]\n- ${errors.join("\n- ")}`);
  }
};

validateEnv(config);

module.exports = {
  ...config,
  validateEnv
};
