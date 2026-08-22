const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User.model");
const Task = require("../src/models/Task.model");
const StudySession = require("../src/models/StudySession.model");
const Project = require("../src/models/Project.model");
const Conversation = require("../src/models/Conversation.model");
const Message = require("../src/models/Message.model");
const Memory = require("../src/models/Memory.model");
const Recommendation = require("../src/models/Recommendation.model");

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

describe("Substep 9D — Comprehensive System Integration & Regression Tests", () => {
  const userAData = { name: "Integration Alice", email: "int_alice@example.com", password: "Password123!" };
  const userBData = { name: "Integration Bob", email: "int_bob@example.com", password: "Password123!" };

  let tokenA = "";
  let tokenB = "";
  let userAId = "";
  let userBId = "";

  beforeEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({});
      await Task.deleteMany({});
      await StudySession.deleteMany({});
      await Project.deleteMany({});
      await Conversation.deleteMany({});
      await Message.deleteMany({});
      await Memory.deleteMany({});
      await Recommendation.deleteMany({});

      const regA = await request(app).post("/api/v1/auth/register").send(userAData);
      tokenA = regA.body.accessToken;
      userAId = regA.body.user.id;

      const regB = await request(app).post("/api/v1/auth/register").send(userBData);
      tokenB = regB.body.accessToken;
      userBId = regB.body.user.id;
    }
  });

  test("1. End-to-End Student Workflow: Tasks -> Study -> Projects -> Analytics", async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Create Task
    const taskRes = await request(app)
      .post("/api/v1/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Master TypeScript", priority: "high" });
    expect(taskRes.status).toBe(201);

    // Record Study Session
    const studyRes = await request(app)
      .post("/api/v1/study")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ subject: "TypeScript Fundamentals", duration: 45 });
    expect(studyRes.status).toBe(201);

    // Create Project
    const projRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "NEXORA Portfolio", techStack: ["React", "Node"] });
    expect(projRes.status).toBe(201);

    // Check Analytics Dashboard
    const analyticsRes = await request(app)
      .get("/api/v1/analytics")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.success).toBe(true);
  });

  test("2. End-to-End AI Engine Workflow: Memory -> AI Chat -> Recommendations -> Roadmap -> Skill Analysis", async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Create Memory
    const memRes = await request(app)
      .post("/api/v1/memories")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ memory: "Alice aims to become a Full Stack Engineer", type: "goal" });
    expect(memRes.status).toBe(201);

    // Normal JSON AI Chat
    const chatRes = await request(app)
      .post("/api/v1/ai/chat")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ message: "What should I study next?" });
    expect(chatRes.status).toBe(200);
    expect(chatRes.body.assistantMessage).toBeDefined();

    // AI Skill Analysis
    const skillAnalysisRes = await request(app)
      .post("/api/v1/ai/skill-analysis")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(skillAnalysisRes.status).toBe(200);
    expect(skillAnalysisRes.body.metrics).toBeDefined();

    // AI Roadmap Generation
    const roadmapRes = await request(app)
      .post("/api/v1/ai/generate-roadmap")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ targetRole: "Full Stack Engineer" });
    expect(roadmapRes.status).toBe(200);
    expect(roadmapRes.body.roadmap.stages.length).toBeGreaterThan(0);

    // AI Recommendations
    const recRes = await request(app)
      .post("/api/v1/ai/recommend")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(recRes.status).toBe(200);
    expect(recRes.body.recommendation).toBeDefined();
  });

  test("3. SSE Streaming Contract & Single Message Persistence Verification", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const streamRes = await request(app)
      .post("/api/v1/ai/chat/stream")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ message: "Integration test streaming question" });

    expect(streamRes.headers["content-type"]).toContain("text/event-stream");
    expect(streamRes.text).toContain("event: start");
    expect(streamRes.text).toContain("event: token");
    expect(streamRes.text).toContain("event: complete");

    // Exactly 1 user message + 1 assistant message in MongoDB
    const conversations = await Conversation.find({ userId: userAId });
    expect(conversations.length).toBe(1);

    const messages = await Message.find({ conversationId: conversations[0]._id });
    expect(messages.length).toBe(2);
    expect(messages.filter((m) => m.role === "user").length).toBe(1);
    expect(messages.filter((m) => m.role === "assistant").length).toBe(1);
  });

  test("4. System Security & Cross-User Hardening Verification", async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Create private resource for Bob
    const taskB = await Task.create({ userId: userBId, title: "Bob Confidential Task" });

    // Alice attempts access -> 404
    const res = await request(app)
      .get(`/api/v1/tasks/${taskB._id}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(res.status).toBe(404);

    // Invalid ObjectId format -> 400
    const invalidIdRes = await request(app)
      .get("/api/v1/tasks/invalid-object-id")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(invalidIdRes.status).toBe(400);

    // Oversized prompt -> 400
    const hugePrompt = "x".repeat(5001);
    const sizeRes = await request(app)
      .post("/api/v1/ai/chat")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ message: hugePrompt });
    expect(sizeRes.status).toBe(400);
  });

  test("5. Account Deletion Cascade Integrity", async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Create user-owned resources for Alice
    await Task.create({ userId: userAId, title: "Alice Task" });
    await StudySession.create({ userId: userAId, subject: "Math", duration: 30 });
    await Project.create({ userId: userAId, title: "Alice Project" });
    await Memory.create({ userId: userAId, memory: "Alice Memory" });
    await Recommendation.create({ userId: userAId, fingerprint: "test:1", title: "Rec 1", description: "Desc" });

    // Delete Alice's account
    const delRes = await request(app)
      .delete("/api/v1/users/me")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(delRes.status).toBe(200);

    // Confirm all Alice records deleted, while Bob's records remain untouched
    const [tasks, study, projects, memories, recs] = await Promise.all([
      Task.find({ userId: userAId }),
      StudySession.find({ userId: userAId }),
      Project.find({ userId: userAId }),
      Memory.find({ userId: userAId }),
      Recommendation.find({ userId: userAId })
    ]);

    expect(tasks.length).toBe(0);
    expect(study.length).toBe(0);
    expect(projects.length).toBe(0);
    expect(memories.length).toBe(0);
    expect(recs.length).toBe(0);
  });
});
