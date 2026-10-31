const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User.model");
const VivaSession = require("../src/models/VivaSession.model");
const Task = require("../src/models/Task.model");

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nexora_test_db";
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
  } catch {
    // If local MongoDB is offline in test suite
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
    await VivaSession.deleteMany({});
    await Task.deleteMany({});
  }
});

describe("AI Socratic Viva Examiner Feature", () => {
  const student = { name: "Viva Student", email: "vivastudent@example.com", password: "Password123!" };

  test("Unauthorized requests to viva endpoints are rejected with 401", async () => {
    const res = await request(app).post("/api/v1/viva/start").send({ topic: "React" });
    expect(res.status).toBe(401);
  });

  test("Initializes a new viva session and generates Question 1", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const reg = await request(app).post("/api/v1/auth/register").send(student);
    const token = reg.body.accessToken;

    const res = await request(app)
      .post("/api/v1/viva/start")
      .set("Authorization", `Bearer ${token}`)
      .send({
        topic: "React Architecture",
        difficulty: "Intermediate",
        maxRounds: 3
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.session.topic).toBe("React Architecture");
    expect(res.body.session.rounds.length).toBe(1);
    expect(res.body.session.rounds[0].question).toBeTruthy();
  });

  test("Submits answer, calculates evaluation score, and fetches history", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const reg = await request(app).post("/api/v1/auth/register").send(student);
    const token = reg.body.accessToken;

    const startRes = await request(app)
      .post("/api/v1/viva/start")
      .set("Authorization", `Bearer ${token}`)
      .send({
        topic: "Node.js Concurrency",
        difficulty: "Intermediate",
        maxRounds: 3
      });

    const sessionId = startRes.body.session._id;

    // Submit answer to Round 1
    const ansRes = await request(app)
      .post(`/api/v1/viva/${sessionId}/submit`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        answer: "Node.js uses a single-threaded event loop powered by libuv for non-blocking I/O operations."
      });

    expect(ansRes.status).toBe(200);
    expect(ansRes.body.success).toBe(true);
    expect(ansRes.body.evaluation).toBeDefined();
    expect(ansRes.body.evaluation.score).toBeGreaterThanOrEqual(1);

    // Get History
    const histRes = await request(app)
      .get("/api/v1/viva/history")
      .set("Authorization", `Bearer ${token}`);

    expect(histRes.status).toBe(200);
    expect(histRes.body.history.length).toBe(1);
    expect(histRes.body.history[0].topic).toBe("Node.js Concurrency");
  });

  test("Converts recommended topics into study tasks", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const reg = await request(app).post("/api/v1/auth/register").send(student);
    const token = reg.body.accessToken;

    const session = await VivaSession.create({
      userId: reg.body.user.id || reg.body.user._id,
      topic: "System Design",
      difficulty: "Advanced",
      status: "completed",
      maxRounds: 3,
      currentRound: 3,
      averageScore: 8.5,
      summaryReport: {
        overallGrade: "A",
        recommendedTopics: ["Consistent Hashing", "Message Queue Backpressure"]
      }
    });

    const taskRes = await request(app)
      .post(`/api/v1/viva/${session._id}/create-tasks`)
      .set("Authorization", `Bearer ${token}`);

    expect(taskRes.status).toBe(200);
    expect(taskRes.body.success).toBe(true);
    expect(taskRes.body.tasks.length).toBe(2);

    const created = await Task.find({ userId: session.userId });
    expect(created.length).toBe(2);
  });
});
