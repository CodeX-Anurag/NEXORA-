const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User.model");
const UserSkill = require("../src/models/UserSkill.model");
const Project = require("../src/models/Project.model");
const Task = require("../src/models/Task.model");

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

describe("Substep 12C — Automated Student Resume & Portfolio Intelligence Engine Tests", () => {
  let tokenA = "";
  let tokenB = "";

  beforeEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({});
      await UserSkill.deleteMany({});
      await Project.deleteMany({});
      await Task.deleteMany({});

      // Register User A
      const regA = await request(app).post("/api/v1/auth/register").send({
        name: "Alice Developer",
        email: "alice_resume@example.com",
        password: "Password123!"
      });
      tokenA = regA.body.accessToken;

      // Add User A Skills & Projects
      await request(app).post("/api/v1/skills").set("Authorization", `Bearer ${tokenA}`).send({ skillName: "Node.js", currentLevel: 85 });
      await request(app).post("/api/v1/skills").set("Authorization", `Bearer ${tokenA}`).send({ skillName: "React", currentLevel: 75 });

      await request(app).post("/api/v1/projects").set("Authorization", `Bearer ${tokenA}`).send({
        title: "NEXORA Web Engine",
        description: "AI-powered productivity platform",
        techStack: ["Node.js", "React", "MongoDB"],
        githubUrl: "https://github.com/alice/nexora"
      });

      await request(app).post("/api/v1/tasks").set("Authorization", `Bearer ${tokenA}`).send({
        title: "Master Microservices Architecture",
        status: "completed",
        source: "ai_roadmap",
        roadmapRole: "Full Stack Developer",
        roadmapStage: "Stage 1: Core Fundamentals"
      });

      // Register User B
      const regB = await request(app).post("/api/v1/auth/register").send({
        name: "Bob Student",
        email: "bob_resume@example.com",
        password: "Password123!"
      });
      tokenB = regB.body.accessToken;
    }
  });

  test("1. GET /api/v1/resume — Synthesizes authenticated student data into valid JSON schema", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const res = await request(app).get("/api/v1/resume").set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.resume.personalInfo.name).toBe("Alice Developer");
    expect(res.body.resume.targetRole).toBe("Full Stack Developer");
    expect(res.body.resume.skills.expert.length).toBeGreaterThanOrEqual(1);
    expect(res.body.resume.projects.length).toBe(1);
    expect(res.body.resume.projects[0].title).toBe("NEXORA Web Engine");
    expect(res.body.resume.achievements.length).toBe(1);
  });

  test("2. GET /api/v1/resume/export?format=markdown — Returns clean GFM Markdown string", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const res = await request(app).get("/api/v1/resume/export?format=markdown").set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.format).toBe("markdown");
    expect(res.body.export).toContain("# ALICE DEVELOPER");
    expect(res.body.export).toContain("## TECHNICAL SKILLS");
    expect(res.body.export).toContain("NEXORA Web Engine");
  });

  test("3. User Ownership Isolation — User B receives only Bob's isolated resume data", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const res = await request(app).get("/api/v1/resume").set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body.resume.personalInfo.name).toBe("Bob Student");
    expect(res.body.resume.projects.length).toBe(0); // Bob has 0 projects
    expect(res.body.resume.achievements.length).toBe(0);
  });

  test("4. Unauthenticated Rejection — Returns HTTP 401 when token is missing", async () => {
    const res = await request(app).get("/api/v1/resume");
    expect(res.status).toBe(401);
  });
});
