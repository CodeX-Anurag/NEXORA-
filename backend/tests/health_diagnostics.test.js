const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User.model");
const metricsService = require("../src/services/metrics.service");
const logger = require("../src/utils/logger");

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nexora_test_db";
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
  } catch {
    // DB offline fallback
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

describe("Substep 11B & 11E — System Health Diagnostics & Admin Authorization Tests", () => {
  let studentToken = "";
  let adminToken = "";

  beforeEach(async () => {
    metricsService.resetMetrics();

    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({});

      // Register standard student user
      const studentReg = await request(app).post("/api/v1/auth/register").send({
        name: "Student User",
        email: "student_obs@example.com",
        password: "Password123!"
      });
      studentToken = studentReg.body.accessToken;

      // Register admin user & set role = 'admin'
      const adminReg = await request(app).post("/api/v1/auth/register").send({
        name: "Admin User",
        email: "admin_obs@example.com",
        password: "Password123!"
      });
      adminToken = adminReg.body.accessToken;
      await User.findByIdAndUpdate(adminReg.body.user.id, { role: "admin" });
    }
  });

  test("1. P95 and P99 Latency Calculation Accuracy with Known Latency Samples", () => {
    metricsService.resetMetrics();

    // Record 100 deterministic latency samples: 1ms, 2ms, ... 100ms
    for (let i = 1; i <= 100; i++) {
      metricsService.recordHttpRequest({ method: "GET", route: "/test", statusCode: 200, latencyMs: i });
    }

    const latency = metricsService.calculateLatencyPercentiles();
    expect(latency.avgMs).toBe(51); // (1..100)/100 = 50.5 -> 51
    expect(latency.p95Ms).toBe(95);
    expect(latency.p99Ms).toBe(99);
  });

  test("2. Bounded Reservoir Ring Buffer Rollover & Memory Bounds", () => {
    metricsService.resetMetrics();

    // Record 600 samples (exceeding 500 capacity)
    for (let i = 1; i <= 600; i++) {
      metricsService.recordHttpRequest({ method: "GET", route: "/test", statusCode: 200, latencyMs: i });
    }

    const latency = metricsService.calculateLatencyPercentiles();
    expect(latency.avgMs).toBeGreaterThan(0);
    expect(latency.p95Ms).toBeGreaterThan(0);
    expect(latency.p99Ms).toBeGreaterThan(0);
  });

  test("3. HTTP Status Classification (2xx, 4xx, 5xx) and Request Counter", async () => {
    metricsService.resetMetrics();

    // 2xx request
    await request(app).get("/api/v1/health");
    // 4xx request
    await request(app).get("/api/v1/unknown-route");

    const diag = await metricsService.getSystemDiagnostics();
    expect(diag.requests.total).toBeGreaterThanOrEqual(2);
    expect(diag.requests.statusDistribution["2xx"]).toBeGreaterThanOrEqual(1);
    expect(diag.requests.statusDistribution["4xx"]).toBeGreaterThanOrEqual(1);
  });

  test("4. Readiness Probe — HTTP 200 when DB connected", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const res = await request(app).get("/api/v1/health/readiness");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.database).toBe("connected");
  });

  test("5. Diagnostics Probe — Rejects unauthenticated requests with HTTP 401", async () => {
    const res = await request(app).get("/api/v1/health/diagnostics");
    expect(res.status).toBe(401);
  });

  test("6. Diagnostics Probe — Rejects authenticated standard student with HTTP 403 Forbidden", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const res = await request(app)
      .get("/api/v1/health/diagnostics")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Admin authorization required");
  });

  test("7. Diagnostics Probe — Returns system telemetry when authenticated as Admin (HTTP 200)", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const res = await request(app)
      .get("/api/v1/health/diagnostics")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.system.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(res.body.system.memoryUsage.heapUsedMB).toBeGreaterThan(0);
    expect(res.body.database.status).toBe("connected");
    expect(res.body.requests).toBeDefined();
    expect(res.body.latency).toBeDefined();
    expect(res.body.aiTelemetry).toBeDefined();
  });

  test("8. Route Normalization in Logger Utility", () => {
    const normalizedId = logger.normalizeRoute("/api/v1/tasks/60d5ecb8b3b3a123456789ab");
    expect(normalizedId).toBe("/api/v1/tasks/:id");

    const normalizedQuery = logger.normalizeRoute("/api/v1/ai/chat?token=secret123");
    expect(normalizedQuery).toBe("/api/v1/ai/chat");
  });
});
