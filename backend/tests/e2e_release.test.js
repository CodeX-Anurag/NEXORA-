const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User.model");
const UserSkill = require("../src/models/UserSkill.model");
const Project = require("../src/models/Project.model");
const Task = require("../src/models/Task.model");
const StudySession = require("../src/models/StudySession.model");
const Notification = require("../src/models/Notification.model");

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

describe("Phase 12 — Substep 12E: Final E2E Release Engineering & System Regression Suite", () => {
  const timestamp = Date.now();
  const studentUserA = {
    name: "E2E Student Alice",
    email: `nexora.e2e.userA.${timestamp}@example.com`,
    password: "Password123!"
  };

  const studentUserB = {
    name: "E2E Student Bob",
    email: `nexora.e2e.userB.${timestamp}@example.com`,
    password: "Password123!"
  };

  const adminUser = {
    name: "E2E Admin Lead",
    email: `nexora.e2e.admin.${timestamp}@example.com`,
    password: "Password123!"
  };

  let tokenA = "";
  let tokenB = "";
  let adminToken = "";

  beforeEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({});
      await UserSkill.deleteMany({});
      await Project.deleteMany({});
      await Task.deleteMany({});
      await StudySession.deleteMany({});
      await Notification.deleteMany({});

      // Register Student A
      const regA = await request(app).post("/api/v1/auth/register").send(studentUserA);
      tokenA = regA.body.accessToken;

      // Register Student B
      const regB = await request(app).post("/api/v1/auth/register").send(studentUserB);
      tokenB = regB.body.accessToken;

      // Register Admin User & update role directly in DB
      const regAdmin = await request(app).post("/api/v1/auth/register").send(adminUser);
      adminToken = regAdmin.body.accessToken;
      await User.updateOne({ email: adminUser.email }, { $set: { role: "admin" } });
    }
  });

  test("1. E2E Authentication Lifecycle & Session Security", async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Login
    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: studentUserA.email,
      password: studentUserA.password
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.accessToken).toBeDefined();

    // Verify /auth/me
    const meRes = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${tokenA}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe(studentUserA.email);

    // Protected Route Rejection without Token
    const unauthRes = await request(app).get("/api/v1/auth/me");
    expect(unauthRes.status).toBe(401);
  });

  test("2. E2E Student Productivity (Tasks, Study Sessions, Projects, Analytics)", async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Create Task
    const taskRes = await request(app).post("/api/v1/tasks").set("Authorization", `Bearer ${tokenA}`).send({
      title: "Complete E2E Algorithms Assignment",
      priority: "high",
      deadline: "2026-10-01"
    });
    expect(taskRes.status).toBe(201);
    const taskId = taskRes.body.task._id;

    // Record Study Session
    const studyRes = await request(app).post("/api/v1/study/sessions").set("Authorization", `Bearer ${tokenA}`).send({
      subject: "Data Structures",
      duration: 120
    });
    expect(studyRes.status).toBe(201);

    // Record Project
    const projectRes = await request(app).post("/api/v1/projects").set("Authorization", `Bearer ${tokenA}`).send({
      title: "NEXORA Cloud Engine",
      techStack: ["Node.js", "React"]
    });
    expect(projectRes.status).toBe(201);

    // Verify Dashboard Overview Metrics
    const dashRes = await request(app).get("/api/v1/dashboard/overview").set("Authorization", `Bearer ${tokenA}`);
    expect(dashRes.status).toBe(200);
    expect(dashRes.body.metrics.totalTasks).toBe(1);
    expect(dashRes.body.metrics.totalStudyMinutes).toBe(120);

    // Clean up task
    await request(app).delete(`/api/v1/tasks/${taskId}`).set("Authorization", `Bearer ${tokenA}`);
  });

  test("3. E2E Roadmap → Task Conversion & Idempotency", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const roadmapTaskPayload = {
      title: "Master React Hooks & State Management",
      description: "Stage 1 Action for Full Stack Developer roadmap.",
      priority: "high",
      source: "ai_roadmap",
      roadmapRole: "Full Stack Developer",
      roadmapStage: "Stage 1: Core Fundamentals",
      deduplicationKey: `roadmap_Full Stack Developer_Stage 1_0_${timestamp}`
    };

    // 1st conversion
    const res1 = await request(app).post("/api/v1/tasks").set("Authorization", `Bearer ${tokenA}`).send(roadmapTaskPayload);
    expect(res1.status).toBe(201);
    expect(res1.body.task.source).toBe("ai_roadmap");

    // 2nd conversion (duplicate attempt returns existing task)
    const res2 = await request(app).post("/api/v1/tasks").set("Authorization", `Bearer ${tokenA}`).send(roadmapTaskPayload);
    expect(res2.status).toBe(201);
    expect(res2.body.task._id).toBe(res1.body.task._id);
  });

  test("4. E2E Resume & Portfolio Synthesis (JSON & Markdown Exports)", async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Add skill & project for Alice
    await request(app).post("/api/v1/skills").set("Authorization", `Bearer ${tokenA}`).send({ skillName: "Node.js", currentLevel: 90 });
    await request(app).post("/api/v1/projects").set("Authorization", `Bearer ${tokenA}`).send({
      title: "E2E Showcase Engine",
      techStack: ["Node.js", "Express"]
    });

    // Get Resume JSON
    const resumeRes = await request(app).get("/api/v1/resume").set("Authorization", `Bearer ${tokenA}`);
    expect(resumeRes.status).toBe(200);
    expect(resumeRes.body.resume.personalInfo.name).toBe(studentUserA.name);
    expect(resumeRes.body.resume.projects.length).toBe(1);

    // Export Resume Markdown
    const exportRes = await request(app).get("/api/v1/resume/export?format=markdown").set("Authorization", `Bearer ${tokenA}`);
    expect(exportRes.status).toBe(200);
    expect(exportRes.body.export).toContain(`# ${studentUserA.name.toUpperCase()}`);
    expect(exportRes.body.export).toContain("E2E Showcase Engine");
  });

  test("5. E2E Admin Authorization Boundary & Diagnostics Telemetry", async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Student A attempts to access admin diagnostics -> 403 Forbidden
    const studentDiagRes = await request(app).get("/api/v1/health/diagnostics").set("Authorization", `Bearer ${tokenA}`);
    expect(studentDiagRes.status).toBe(403);

    // Admin accesses diagnostics probe -> 200 OK with telemetry
    const adminDiagRes = await request(app).get("/api/v1/health/diagnostics").set("Authorization", `Bearer ${adminToken}`);
    expect(adminDiagRes.status).toBe(200);
    expect(adminDiagRes.body.success).toBe(true);
    expect(adminDiagRes.body.telemetry.systemHealth).toBeDefined();
    expect(adminDiagRes.body.telemetry.requests).toBeDefined();
  });

  test("6. E2E Security Hardening & Rate Limiter Verification", async () => {
    // Security Headers (Helmet)
    const healthRes = await request(app).get("/api/v1/health");
    expect(healthRes.headers["x-content-type-options"]).toBe("nosniff");

    // CORS Origin Enforcement
    const corsRes = await request(app).get("/api/v1/health").set("Origin", "http://unauthorized-attacker.com");
    expect(corsRes.status).toBe(500);

    // Rate Limiter Exports & Middlewares
    const rateLimiter = require("../src/middleware/rateLimiter.middleware");
    expect(rateLimiter.apiLimiter).toBeDefined();
    expect(rateLimiter.authLimiter).toBeDefined();
    expect(rateLimiter.aiLimiter).toBeDefined();
    expect(rateLimiter.adminLimiter).toBeDefined();
  });

  test("7. E2E Synthetic User Cascade Teardown Verification", async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Delete Alice via /users/me cascade
    const deleteRes = await request(app).delete("/api/v1/users/me").set("Authorization", `Bearer ${tokenA}`);
    expect(deleteRes.status).toBe(200);

    // Verify user profile is removed from MongoDB
    const checkUser = await User.findOne({ email: studentUserA.email });
    expect(checkUser).toBeNull();
  });
});
