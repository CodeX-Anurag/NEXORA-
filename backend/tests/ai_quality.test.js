const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User.model");
const AIUsage = require("../src/models/AIUsage.model");
const aiQualityEvaluator = require("../src/utils/aiQualityEvaluator");
const aiIntelligenceService = require("../src/services/aiIntelligence.service");

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

describe("Substep 11D — AI Quality Evaluation & Fallback Diagnostics Tests", () => {
  let token = "";
  let userId = "";

  beforeEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({});
      await AIUsage.deleteMany({});

      const reg = await request(app).post("/api/v1/auth/register").send({
        name: "Quality Student",
        email: "quality_student@example.com",
        password: "Password123!"
      });
      token = reg.body.accessToken;
      userId = reg.body.user.id;
    }
  });

  test("1. Deterministic Text & Schema Quality Evaluator Unit Math", () => {
    // Valid Text
    const validText = aiQualityEvaluator.evaluateTextQuality({ content: "Here is a clear and helpful AI response." });
    expect(validText.qualityScore).toBe(100);
    expect(validText.isValidSchema).toBe(true);
    expect(validText.qualityIssues.length).toBe(0);

    // Empty Text
    const emptyText = aiQualityEvaluator.evaluateTextQuality({ content: "   " });
    expect(emptyText.qualityScore).toBe(0);
    expect(emptyText.qualityIssues).toContain("EMPTY_RESPONSE");

    // Malformed JSON Structured Output
    const malformedJson = aiQualityEvaluator.evaluateStructuredQuality({
      rawText: "{ career: invalid json without quotes }",
      schemaType: "roadmap"
    });
    expect(malformedJson.qualityScore).toBe(40);
    expect(malformedJson.isValidSchema).toBe(false);
    expect(malformedJson.fallbackActivated).toBe(true);
    expect(malformedJson.qualityIssues).toContain("MALFORMED_JSON");

    // Schema Property Missing
    const missingPropJson = aiQualityEvaluator.evaluateStructuredQuality({
      rawText: JSON.stringify({ career: "Full Stack Developer" }), // missing 'stages'
      schemaType: "roadmap"
    });
    expect(missingPropJson.qualityScore).toBe(50);
    expect(missingPropJson.isValidSchema).toBe(false);
    expect(missingPropJson.fallbackActivated).toBe(true);
  });

  test("2. Roadmap Generation — Valid LLM JSON generates Quality Score = 100", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const mockLLM = {
      generateResponse: async () => ({
        content: JSON.stringify({
          career: "Full Stack Developer",
          stages: [
            { title: "Stage 1: Core", skills: ["JS"], actions: ["Learn JS"] },
            { title: "Stage 2: Advanced", skills: ["Node"], actions: ["Learn Node"] },
            { title: "Stage 3: Mastery", skills: ["React"], actions: ["Build App"] }
          ]
        }),
        provider: "mock",
        model: "mock-model",
        usage: { promptTokens: 100, completionTokens: 150, totalTokens: 250 }
      })
    };

    const result = await aiIntelligenceService.generateCareerRoadmap(userId, "Full Stack Developer", mockLLM);

    expect(result.success).toBe(true);
    expect(result.roadmap.career).toBe("Full Stack Developer");

    const usageRecord = await AIUsage.findOne({ userId, operation: "roadmap" });
    expect(usageRecord).toBeDefined();
    expect(usageRecord.qualityScore).toBe(100);
    expect(usageRecord.isValidSchema).toBe(true);
    expect(usageRecord.fallbackActivated).toBe(false);
  });

  test("3. Roadmap Generation — Malformed LLM JSON activates Fallback & logs Fallback Telemetry", async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Simulate LLM outputting plain text instead of valid JSON
    const mockBrokenLLM = {
      generateResponse: async () => ({
        content: "Sorry, I cannot generate a JSON roadmap right now.",
        provider: "mock",
        model: "mock-model",
        usage: { promptTokens: 80, completionTokens: 40, totalTokens: 120 }
      })
    };

    const result = await aiIntelligenceService.generateCareerRoadmap(userId, "Full Stack Developer", mockBrokenLLM);

    // Primary request MUST succeed via fallback
    expect(result.success).toBe(true);
    expect(result.roadmap.stages.length).toBeGreaterThan(0);

    const usageRecord = await AIUsage.findOne({ userId, operation: "roadmap" });
    expect(usageRecord).toBeDefined();
    expect(usageRecord.qualityScore).toBe(50);
    expect(usageRecord.isValidSchema).toBe(false);
    expect(usageRecord.fallbackActivated).toBe(true);
    expect(usageRecord.qualityIssues).toContain("MALFORMED_JSON");
  });

  test("4. Privacy Bounds — AIUsage contains metadata ONLY (Zero prompts or AI response bodies)", async () => {
    if (mongoose.connection.readyState !== 1) return;

    await request(app)
      .post("/api/v1/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ messageContent: "Can you explain REST API security?" });

    const usageRecord = await AIUsage.findOne({ userId, operation: "chat" });
    expect(usageRecord).toBeDefined();

    const recordObj = usageRecord.toObject();
    expect(recordObj.prompt).toBeUndefined();
    expect(recordObj.response).toBeUndefined();
    expect(recordObj.messageContent).toBeUndefined();
    expect(recordObj.qualityScore).toBeGreaterThan(0);
  });

  test("5. System Diagnostics Probe Includes Substep 11D Quality Telemetry Metrics", async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Record one valid chat and one fallback roadmap
    await AIUsage.create({
      userId,
      provider: "mock",
      model: "mock-model",
      operation: "chat",
      endpoint: "/api/v1/ai/chat",
      qualityScore: 100,
      isValidSchema: true,
      fallbackActivated: false
    });

    await AIUsage.create({
      userId,
      provider: "mock",
      model: "mock-model",
      operation: "roadmap",
      endpoint: "/api/v1/ai/generate-roadmap",
      qualityScore: 50,
      isValidSchema: false,
      fallbackActivated: true
    });

    const diagRes = await request(app)
      .get("/api/v1/health/diagnostics")
      .set("Authorization", `Bearer ${token}`);

    expect(diagRes.status).toBe(200);
    expect(diagRes.body.aiTelemetry).toBeDefined();
    expect(diagRes.body.aiTelemetry.totalRequests).toBe(2);
    expect(diagRes.body.aiTelemetry.avgQualityScore).toBe(75);
    expect(diagRes.body.aiTelemetry.fallbackCount).toBe(1);
    expect(diagRes.body.aiTelemetry.schemaValidationFailures).toBe(1);
  });
});
