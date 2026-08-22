const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User.model");
const Task = require("../src/models/Task.model");
const StudySession = require("../src/models/StudySession.model");

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nexora_test_db";
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
  } catch {
    // If MongoDB is not running locally, skip DB tests
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
    await Task.deleteMany({});
    await StudySession.deleteMany({});
  }
});

describe("Phase 3 Core Student Platform APIs", () => {
  const userAData = { name: "User A", email: "usera@example.com", password: "Password123!" };
  const userBData = { name: "User B", email: "userb@example.com", password: "Password123!" };

  test("Task CRUD & User Ownership Isolation", async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Register User A & User B
    const resA = await request(app).post("/api/v1/auth/register").send(userAData);
    const tokenA = resA.body.accessToken;

    const resB = await request(app).post("/api/v1/auth/register").send(userBData);
    const tokenB = resB.body.accessToken;

    // User A creates a task
    const createTaskRes = await request(app)
      .post("/api/v1/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        title: "Complete CS101 Assignment",
        description: "Finish data structure problems",
        priority: "high",
        deadline: "2026-09-01"
      });

    expect(createTaskRes.status).toBe(201);
    const taskId = createTaskRes.body.task._id;

    // User A lists tasks
    const listARes = await request(app)
      .get("/api/v1/tasks")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(listARes.status).toBe(200);
    expect(listARes.body.tasks.length).toBe(1);

    // User B lists tasks (should see 0 tasks)
    const listBRes = await request(app)
      .get("/api/v1/tasks")
      .set("Authorization", `Bearer ${tokenB}`);

    expect(listBRes.status).toBe(200);
    expect(listBRes.body.tasks.length).toBe(0);

    // User B attempts to access User A's task (should return 404)
    const accessBRes = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(accessBRes.status).toBe(404);

    // User A updates task to completed
    const updateRes = await request(app)
      .put(`/api/v1/tasks/${taskId}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ status: "completed" });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.task.status).toBe("completed");

    // User A deletes task
    const deleteRes = await request(app)
      .delete(`/api/v1/tasks/${taskId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });

  test("Study Session Creation & Ownership Isolation", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const resA = await request(app).post("/api/v1/auth/register").send(userAData);
    const tokenA = resA.body.accessToken;

    const resB = await request(app).post("/api/v1/auth/register").send(userBData);
    const tokenB = resB.body.accessToken;

    // Record study session for User A
    const createStudyRes = await request(app)
      .post("/api/v1/study/sessions")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        subject: "Algorithms",
        duration: 90,
        notes: "Studied Graph Traversals BFS/DFS"
      });

    expect(createStudyRes.status).toBe(201);
    const sessionId = createStudyRes.body.session._id;

    // User A gets study sessions
    const getARes = await request(app)
      .get("/api/v1/study/sessions")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(getARes.status).toBe(200);
    expect(getARes.body.sessions.length).toBe(1);
    expect(getARes.body.sessions[0].duration).toBe(90);

    // User B attempts to delete User A's study session (should return 404)
    const deleteBRes = await request(app)
      .delete(`/api/v1/study/sessions/${sessionId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(deleteBRes.status).toBe(404);
  });

  test("Dashboard Metrics Calculation", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const resA = await request(app).post("/api/v1/auth/register").send(userAData);
    const tokenA = resA.body.accessToken;

    // Create 2 tasks (1 completed, 1 pending)
    await request(app).post("/api/v1/tasks").set("Authorization", `Bearer ${tokenA}`).send({ title: "Task 1", status: "completed" });
    await request(app).post("/api/v1/tasks").set("Authorization", `Bearer ${tokenA}`).send({ title: "Task 2", status: "todo" });

    // Record 2 study sessions (60m + 30m = 90m = 1.5h)
    await request(app).post("/api/v1/study/sessions").set("Authorization", `Bearer ${tokenA}`).send({ subject: "Math", duration: 60 });
    await request(app).post("/api/v1/study/sessions").set("Authorization", `Bearer ${tokenA}`).send({ subject: "Physics", duration: 30 });

    // Fetch dashboard overview
    const dashRes = await request(app)
      .get("/api/v1/dashboard/overview")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(dashRes.status).toBe(200);
    expect(dashRes.body.metrics.totalTasks).toBe(2);
    expect(dashRes.body.metrics.completedTasks).toBe(1);
    expect(dashRes.body.metrics.pendingTasks).toBe(1);
    expect(dashRes.body.metrics.completionRate).toBe(50);
    expect(dashRes.body.metrics.totalStudyMinutes).toBe(90);
    expect(dashRes.body.metrics.totalStudyHours).toBe(1.5);
  });

  test("Substep 12B — AI Roadmap Action to Task Conversion & Idempotent Deduplication", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const resA = await request(app).post("/api/v1/auth/register").send(userAData);
    const tokenA = resA.body.accessToken;

    const roadmapTaskPayload = {
      title: "Master React & Virtual DOM",
      description: "Stage 1 Action for Full Stack Developer roadmap.",
      priority: "high",
      source: "ai_roadmap",
      roadmapRole: "Full Stack Developer",
      roadmapStage: "Stage 1: Core Fundamentals",
      deduplicationKey: "roadmap_Full Stack Developer_Stage 1_0"
    };

    // 1. Initial conversion from AI Roadmap
    const createRes = await request(app)
      .post("/api/v1/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send(roadmapTaskPayload);

    expect(createRes.status).toBe(201);
    expect(createRes.body.task.source).toBe("ai_roadmap");
    expect(createRes.body.task.roadmapRole).toBe("Full Stack Developer");
    expect(createRes.body.task.deduplicationKey).toBe("roadmap_Full Stack Developer_Stage 1_0");

    // 2. Duplicate conversion attempt (Idempotent deduplication returns existing task without duplicate rows)
    const duplicateRes = await request(app)
      .post("/api/v1/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send(roadmapTaskPayload);

    expect(duplicateRes.status).toBe(201);
    expect(duplicateRes.body.task._id).toBe(createRes.body.task._id);

    // Verify database count remains 1
    const listRes = await request(app).get("/api/v1/tasks").set("Authorization", `Bearer ${tokenA}`);
    expect(listRes.body.tasks.length).toBe(1);
  });
});
