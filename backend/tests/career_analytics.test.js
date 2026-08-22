const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User.model");
const UserSkill = require("../src/models/UserSkill.model");
const Project = require("../src/models/Project.model");

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nexora_test_db";
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
  } catch {
    // Skip if DB is offline
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
    await Project.deleteMany({});
  }
});

describe("Phase 4 Career, Skills, Projects & Analytics APIs", () => {
  const userAData = { name: "User A", email: "usera@example.com", password: "Password123!" };
  const userBData = { name: "User B", email: "userb@example.com", password: "Password123!" };

  test("GET /api/v1/skills - Public Skill Catalog Retrieval", async () => {
    const res = await request(app).get("/api/v1/skills");
    expect(res.status).toBe(200);
    expect(res.body.skills).toBeDefined();
    expect(res.body.skills.length).toBeGreaterThan(0);
  });

  test("GET /api/v1/careers - Public Career Catalog Retrieval", async () => {
    const res = await request(app).get("/api/v1/careers");
    expect(res.status).toBe(200);
    expect(res.body.careers).toBeDefined();
    expect(res.body.careers.length).toBeGreaterThan(0);
  });

  test("Student Skill Ratings & Deterministic Skill Gap Analysis", async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Register User A
    const regRes = await request(app).post("/api/v1/auth/register").send(userAData);
    const token = regRes.body.accessToken;

    // Set target career to "Frontend Developer"
    const careerRes = await request(app)
      .put("/api/v1/users/me/career")
      .set("Authorization", `Bearer ${token}`)
      .send({ targetRole: "Frontend Developer" });

    expect(careerRes.status).toBe(200);
    expect(careerRes.body.targetRole).toBe("Frontend Developer");

    // Add React skill level = 80 (required is 90 -> gap = 10 -> Strong)
    await request(app)
      .post("/api/v1/users/me/skills")
      .set("Authorization", `Bearer ${token}`)
      .send({ skillName: "React", currentLevel: 80 });

    // Add JavaScript skill level = 40 (required is 90 -> gap = 50 -> Critical)
    await request(app)
      .post("/api/v1/users/me/skills")
      .set("Authorization", `Bearer ${token}`)
      .send({ skillName: "JavaScript", currentLevel: 40 });

    // Fetch career analysis
    const analysisRes = await request(app)
      .get("/api/v1/users/me/career")
      .set("Authorization", `Bearer ${token}`);

    expect(analysisRes.status).toBe(200);
    expect(analysisRes.body.careerReadinessScore).toBeGreaterThan(0);
    expect(analysisRes.body.skillGaps).toBeDefined();

    const reactGap = analysisRes.body.skillGaps.find((s) => s.skillName === "React");
    expect(reactGap).toBeDefined();
    expect(reactGap.gap).toBe(10);
    expect(reactGap.category).toBe("Strong");

    const jsGap = analysisRes.body.skillGaps.find((s) => s.skillName === "JavaScript");
    expect(jsGap).toBeDefined();
    expect(jsGap.gap).toBe(50);
    expect(jsGap.category).toBe("Critical");
  });

  test("Project CRUD & User Ownership Isolation", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const resA = await request(app).post("/api/v1/auth/register").send(userAData);
    const tokenA = resA.body.accessToken;

    const resB = await request(app).post("/api/v1/auth/register").send(userBData);
    const tokenB = resB.body.accessToken;

    // User A creates project
    const createRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        title: "NEXORA Student Platform",
        description: "AI productivity app",
        techStack: ["React", "Node.js", "MongoDB"],
        githubUrl: "https://github.com/example/nexora"
      });

    expect(createRes.status).toBe(201);
    const projectId = createRes.body.project._id;

    // User B attempts to access User A's project (404)
    const accessBRes = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(accessBRes.status).toBe(404);

    // User A updates project
    const updateRes = await request(app)
      .put(`/api/v1/projects/${projectId}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ status: "completed" });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.project.status).toBe("completed");

    // User A deletes project
    const deleteRes = await request(app)
      .delete(`/api/v1/projects/${projectId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(deleteRes.status).toBe(200);
  });

  test("Analytics Endpoints", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const resA = await request(app).post("/api/v1/auth/register").send(userAData);
    const tokenA = resA.body.accessToken;

    const dashAnalytics = await request(app)
      .get("/api/v1/analytics/dashboard")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(dashAnalytics.status).toBe(200);
    expect(dashAnalytics.body.productivity).toBeDefined();
    expect(dashAnalytics.body.career).toBeDefined();

    const prodAnalytics = await request(app)
      .get("/api/v1/analytics/productivity")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(prodAnalytics.status).toBe(200);
    expect(prodAnalytics.body.statusCounts).toBeDefined();

    const careerAnalytics = await request(app)
      .get("/api/v1/analytics/career")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(careerAnalytics.status).toBe(200);
    expect(careerAnalytics.body.careerReadinessScore).toBeDefined();
  });
});
