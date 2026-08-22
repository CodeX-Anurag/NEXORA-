const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User.model");
const UserSkill = require("../src/models/UserSkill.model");
const Recommendation = require("../src/models/Recommendation.model");
const ResponseParser = require("../src/ai/responseParser");
const aiIntelligenceService = require("../src/services/aiIntelligence.service");

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

beforeEach(async () => {
  if (mongoose.connection.readyState === 1) {
    await User.deleteMany({});
    await UserSkill.deleteMany({});
    await Recommendation.deleteMany({});
  }
});

describe("Phase 7 AI Intelligence & Recommendation Engine Tests", () => {
  const testUser = { name: "Carol", email: "carol@example.com", password: "Password123!" };

  test("1. Career & Skill Analysis - Backend Metrics & AI Explanation Match", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const regRes = await request(app).post("/api/v1/auth/register").send(testUser);
    const token = regRes.body.accessToken;

    const res = await request(app)
      .post("/api/v1/ai/skill-analysis")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.metrics.careerReadinessScore).toBeDefined();
    expect(res.body.aiExplanation).toBeDefined();
  });

  test("2. Structured Roadmap Generation & Strict Validation", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const regRes = await request(app).post("/api/v1/auth/register").send(testUser);
    const token = regRes.body.accessToken;

    const res = await request(app)
      .post("/api/v1/ai/generate-roadmap")
      .set("Authorization", `Bearer ${token}`)
      .send({ targetRole: "Full Stack Developer" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.roadmap.career).toBe("Full Stack Developer");
    expect(Array.isArray(res.body.roadmap.stages)).toBe(true);
    expect(res.body.roadmap.stages.length).toBe(3);

    // Verify strict schema validation
    expect(() => ResponseParser.validateRoadmapSchema(res.body.roadmap)).not.toThrow();
  });

  test("3. Recommendation Engine - Generation, Fingerprinting & Feedback Loop", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const regRes = await request(app).post("/api/v1/auth/register").send(testUser);
    const token = regRes.body.accessToken;

    // 1. Generate Recommendation
    const genRes = await request(app)
      .post("/api/v1/ai/recommend")
      .set("Authorization", `Bearer ${token}`);

    expect(genRes.status).toBe(201);
    expect(genRes.body.success).toBe(true);
    const rec = genRes.body.recommendation;
    expect(rec._id).toBeDefined();
    expect(rec.fingerprint).toBeDefined();
    expect(rec.feedback).toBe("pending");

    // 2. Submit Feedback (accepted)
    const fbRes = await request(app)
      .put(`/api/v1/ai/recommendations/${rec._id}/feedback`)
      .set("Authorization", `Bearer ${token}`)
      .send({ feedback: "accepted" });

    expect(fbRes.status).toBe(200);
    expect(fbRes.body.recommendation.feedback).toBe("accepted");
    expect(fbRes.body.recommendation.status).toBe("accepted");

    // 3. Verify clean feedback enum (give_another is NOT in feedback enum)
    const invalidFbRes = await request(app)
      .put(`/api/v1/ai/recommendations/${rec._id}/feedback`)
      .set("Authorization", `Bearer ${token}`)
      .send({ feedback: "give_another" });

    expect(invalidFbRes.body.recommendation.feedback).toBe("accepted"); // remains accepted
  });

  test("3. (Cont.) Give Another Recommendation - Produces Distinct Non-Duplicate Item", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const regRes = await request(app).post("/api/v1/auth/register").send(testUser);
    const token = regRes.body.accessToken;

    // Generate initial recommendation
    const firstRes = await request(app)
      .post("/api/v1/ai/recommend")
      .set("Authorization", `Bearer ${token}`);

    const firstRec = firstRes.body.recommendation;

    // Request "Give Another"
    const giveAnotherRes = await request(app)
      .post("/api/v1/ai/recommendations/give-another")
      .set("Authorization", `Bearer ${token}`);

    expect(giveAnotherRes.status).toBe(201);
    const secondRec = giveAnotherRes.body.recommendation;

    expect(secondRec._id).not.toBe(firstRec._id);
    expect(secondRec.fingerprint).not.toBe(firstRec.fingerprint);
  });

  test("4. Multi-User Security Isolation", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const regResA = await request(app).post("/api/v1/auth/register").send(testUser);
    const tokenA = regResA.body.accessToken;

    const regResB = await request(app).post("/api/v1/auth/register").send({
      name: "Dave",
      email: "dave@example.com",
      password: "Password123!"
    });
    const tokenB = regResB.body.accessToken;

    // User A generates recommendation
    const recRes = await request(app)
      .post("/api/v1/ai/recommend")
      .set("Authorization", `Bearer ${tokenA}`);

    const recId = recRes.body.recommendation._id;

    // User B attempts to feedback User A's recommendation (404)
    const unauthorizedRes = await request(app)
      .put(`/api/v1/ai/recommendations/${recId}/feedback`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ feedback: "accepted" });

    expect(unauthorizedRes.status).toBe(404);
  });

  test("5. Error Handling - LLM Failure Handled Gracefully", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const regRes = await request(app).post("/api/v1/auth/register").send(testUser);
    const userId = regRes.body.user.id;

    const failingLLM = {
      generateResponse: async () => {
        throw new Error("Provider quota exceeded (503 Service Unavailable)");
      }
    };

    await expect(aiIntelligenceService.analyzeSkillGaps(userId, failingLLM)).rejects.toThrow("quota exceeded");
  });
});
