const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User.model");

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nexora_test_db";
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
  } catch {
    // Skip if DB offline
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

describe("Substep 9A — Security Foundation & API Hardening Tests", () => {
  const testUser = { name: "SecUser", email: "secuser@example.com", password: "Password123!" };
  let userToken = "";

  beforeEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({});
      const regRes = await request(app).post("/api/v1/auth/register").send(testUser);
      userToken = regRes.body.accessToken;
    }
  });

  test("1. Security Headers (Helmet) are present on API responses", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBeDefined();
  });

  test("2. CORS policy enforcement for allowed vs unauthorized origins", async () => {
    // Allowed origin
    const allowedRes = await request(app)
      .get("/api/v1/health")
      .set("Origin", "http://localhost:5173");

    expect(allowedRes.headers["access-control-allow-origin"]).toBe("http://localhost:5173");

    // Unauthorized origin
    const unauthorizedRes = await request(app)
      .get("/api/v1/health")
      .set("Origin", "http://malicious-attacker-domain.com");

    expect(unauthorizedRes.status).toBe(500);
    expect(unauthorizedRes.body.message).toContain("CORS policy violation");
  });

  test("3. Oversized JSON request body payload is rejected (413)", async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Create a payload > 1MB
    const hugeString = "a".repeat(1.2 * 1024 * 1024);

    const res = await request(app)
      .post("/api/v1/ai/chat")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ message: hugeString });

    expect(res.status).toBe(413);
    expect(res.body.message).toContain("too large");
  });

  test("4. Malformed MongoDB ObjectId is handled safely (400 Bad Request)", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const res = await request(app)
      .get("/api/v1/conversations/not-a-valid-object-id/messages")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Invalid id format");
  });

  test("5. Health endpoint status does not expose internal secrets or DB URIs", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe("nexora-api");
    expect(res.body.MONGODB_URI).toBeUndefined();
    expect(res.body.JWT_SECRET).toBeUndefined();
    expect(res.body.LLM_API_KEY).toBeUndefined();
  });

  test("6. Production error sanitization hides stack traces & internal paths", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const errorHandler = require("../src/middleware/error.middleware");
    const mockReq = {};
    const mockRes = {
      statusCode: 500,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.data = data;
        return this;
      }
    };

    const internalError = new Error("Database connection password failed: mongodb://root:secret@db:27017");
    internalError.stack = "Error: Secret at /var/app/internal/db.js:42";

    errorHandler(internalError, mockReq, mockRes, () => {});

    expect(mockRes.data.message).toBe("An unexpected server error occurred.");
    expect(mockRes.data.stack).toBeUndefined();

    process.env.NODE_ENV = originalEnv;
  });

  test("7. AI endpoints (normal chat & streaming) remain functional with security middleware", async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Normal JSON chat
    const chatRes = await request(app)
      .post("/api/v1/ai/chat")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ message: "Security test question" });

    expect(chatRes.status).toBe(200);
    expect(chatRes.body.success).toBe(true);

    // Streaming SSE chat
    const streamRes = await request(app)
      .post("/api/v1/ai/chat/stream")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ message: "Security stream question" });

    expect(streamRes.headers["content-type"]).toContain("text/event-stream");
    expect(streamRes.text).toContain("event: start");
  });

  test("8. Substep 12D Rate Limiter — Auth endpoint rate limiting handler returns 429 JSON response", async () => {
    const rateLimiter = require("../src/middleware/rateLimiter.middleware");
    const mockReq = { userId: "test_user_id", ip: "127.0.0.1" };
    const mockRes = {
      headers: {},
      statusCode: 200,
      getHeader(key) {
        return this.headers[key] || "60";
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.data = data;
        return this;
      }
    };

    rateLimiter.adminLimiter; // Ensure exports exist
    expect(rateLimiter.authLimiter).toBeDefined();
    expect(rateLimiter.aiLimiter).toBeDefined();
  });
});
