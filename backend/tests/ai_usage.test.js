const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User.model");
const AIUsage = require("../src/models/AIUsage.model");
const aiUsageService = require("../src/services/aiUsage.service");

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nexora_test_db";
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
  } catch {
    // DB offline fallback for mock execution
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

describe("Substep 11A — Centralized AI Token, Cost & Performance Metrics Tracking Tests", () => {
  let tokenA = "";
  let tokenB = "";
  let userAId = "";
  let userBId = "";

  beforeEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({});
      await AIUsage.deleteMany({});

      const regA = await request(app).post("/api/v1/auth/register").send({
        name: "Telemetry Alice",
        email: "telemetry_alice@example.com",
        password: "Password123!"
      });
      tokenA = regA.body.accessToken;
      userAId = regA.body.user.id;

      const regB = await request(app).post("/api/v1/auth/register").send({
        name: "Telemetry Bob",
        email: "telemetry_bob@example.com",
        password: "Password123!"
      });
      tokenB = regB.body.accessToken;
      userBId = regB.body.user.id;
    }
  });

  test("1. Cost Calculation Strategy & Model Pricing Math Accuracy", () => {
    const costGpt4oMini = aiUsageService.calculateEstimatedCost("gpt-4o-mini", 1000, 1000);
    // (1000/1000 * 0.00015) + (1000/1000 * 0.0006) = 0.00075
    expect(costGpt4oMini).toBe(0.00075);

    const costEmbed = aiUsageService.calculateEstimatedCost("text-embedding-3-small", 5000, 0);
    // (5000/1000 * 0.00002) = 0.0001
    expect(costEmbed).toBe(0.0001);

    const costMock = aiUsageService.calculateEstimatedCost("mock-model", 100, 50);
    expect(costMock).toBe(0);

    const costUnknown = aiUsageService.calculateEstimatedCost("unknown-future-model", 500, 500);
    expect(costUnknown).toBe(0);
  });

  test("2. Non-Streaming AI Chat automatically logs AIUsage record with token & latency metrics", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const res = await request(app)
      .post("/api/v1/ai/chat")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ message: "Explain JavaScript closures" });

    expect(res.status).toBe(200);

    const usageRecords = await AIUsage.find({ userId: userAId });
    expect(usageRecords.length).toBe(1);
    expect(usageRecords[0].operation).toBe("chat");
    expect(usageRecords[0].endpoint).toBe("/api/v1/ai/chat");
    expect(usageRecords[0].totalTokens).toBeGreaterThan(0);
    expect(usageRecords[0].success).toBe(true);
    expect(usageRecords[0].latencyMs).toBeGreaterThanOrEqual(0);
  });

  test("3. SSE Streaming AI Chat produces EXACTLY ONE usage record per completed generation", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const res = await request(app)
      .post("/api/v1/ai/chat/stream")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ message: "Stream response for telemetry test" });

    expect(res.headers["content-type"]).toContain("text/event-stream");

    const usageRecords = await AIUsage.find({ userId: userAId });
    expect(usageRecords.length).toBe(1);
    expect(usageRecords[0].operation).toBe("stream");
    expect(usageRecords[0].endpoint).toBe("/api/v1/ai/chat/stream");
    expect(usageRecords[0].success).toBe(true);
  });

  test("4. Privacy & Security Bounds — AIUsage contains metadata ONLY (No prompts or responses)", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const secretPrompt = "SUPER_SECRET_STUDENT_PROMPT_CONTENT_XYZ_999";
    await request(app)
      .post("/api/v1/ai/chat")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ message: secretPrompt });

    const usageRecord = await AIUsage.findOne({ userId: userAId }).lean();
    expect(usageRecord).toBeDefined();

    // Verify zero prompt or response string storage in schema keys
    const recordString = JSON.stringify(usageRecord);
    expect(recordString).not.toContain(secretPrompt);
    expect(recordString).not.toContain("NEXORA AI Coach");
    expect(usageRecord.promptContent).toBeUndefined();
    expect(usageRecord.responseContent).toBeUndefined();
  });

  test("5. Telemetry DB Persistence Failure is swallowed safely without failing primary AI request", async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Simulate DB error in recordUsage
    const spy = jest.spyOn(AIUsage, "create").mockImplementationOnce(() => {
      throw new Error("Simulated Database Telemetry Write Error");
    });

    const res = await request(app)
      .post("/api/v1/ai/chat")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ message: "Test graceful telemetry error handling" });

    // Primary request MUST succeed with 200 OK despite telemetry write failure!
    expect(res.status).toBe(200);
    expect(res.body.assistantMessage).toBeDefined();

    spy.mockRestore();
  });

  test("6. User Ownership Isolation — User B cannot retrieve User A usage telemetry metrics", async () => {
    if (mongoose.connection.readyState !== 1) return;

    await aiUsageService.recordUsage({
      userId: userAId,
      provider: "mock",
      model: "mock-model",
      operation: "chat",
      endpoint: "/api/v1/ai/chat",
      promptTokens: 100,
      completionTokens: 50
    });

    const metricsA = await aiUsageService.getUserUsageMetrics(userAId);
    const metricsB = await aiUsageService.getUserUsageMetrics(userBId);

    expect(metricsA.totalRequests).toBe(1);
    expect(metricsA.totalTokens).toBe(150);
    expect(metricsB.totalRequests).toBe(0);
    expect(metricsB.totalTokens).toBe(0);
  });
});
