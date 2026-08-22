const request = require("supertest");
const app = require("../src/app");
const { validateEnv } = require("../src/config/env");

describe("Substep 10A — Environment & Configuration Management Tests", () => {
  test("1. Development and Test modes allow mock provider fallbacks", () => {
    const devConfig = {
      NODE_ENV: "development",
      JWT_SECRET: "nexora_dev_secret_key_change_in_production_32bytes",
      MONGODB_URI: "mongodb://127.0.0.1:27017/nexora_db",
      LLM_PROVIDER: "mock",
      EMBEDDING_PROVIDER: "mock"
    };

    expect(() => validateEnv(devConfig)).not.toThrow();
  });

  test("2. Production mode fails fast when JWT_SECRET is default dev secret", () => {
    const badProdConfig = {
      NODE_ENV: "production",
      JWT_SECRET: "nexora_dev_secret_key_change_in_production_32bytes",
      MONGODB_URI: "mongodb+srv://prod_user:secret@cluster0.mongodb.net/nexora_prod",
      LLM_PROVIDER: "openai",
      LLM_API_KEY: "valid-key"
    };

    expect(() => validateEnv(badProdConfig)).toThrow(/JWT_SECRET must be configured/);
  });

  test("3. Production mode fails fast when MONGODB_URI is default local URI", () => {
    const badProdConfig = {
      NODE_ENV: "production",
      JWT_SECRET: "strong_production_secret_key_998877665544332211",
      MONGODB_URI: "mongodb://127.0.0.1/nexora_db",
      LLM_PROVIDER: "openai",
      LLM_API_KEY: "valid-key"
    };

    expect(() => validateEnv(badProdConfig)).toThrow(/MONGODB_URI must point to a valid production MongoDB/);
  });

  test("4. Production mode fails fast when OpenAI API key is missing or mock", () => {
    const badProdConfig = {
      NODE_ENV: "production",
      JWT_SECRET: "strong_production_secret_key_998877665544332211",
      MONGODB_URI: "mongodb+srv://prod_user:secret@cluster0.mongodb.net/nexora_prod",
      LLM_PROVIDER: "openai",
      LLM_API_KEY: "mock-key"
    };

    expect(() => validateEnv(badProdConfig)).toThrow(/LLM_API_KEY must be provided/);
  });

  test("5. Server secrets are excluded from public health API response", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.MONGODB_URI).toBeUndefined();
    expect(res.body.JWT_SECRET).toBeUndefined();
    expect(res.body.LLM_API_KEY).toBeUndefined();
    expect(res.body.EMBEDDING_API_KEY).toBeUndefined();
  });
});
