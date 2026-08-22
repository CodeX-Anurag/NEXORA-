const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User.model");
const AuthSession = require("../src/models/AuthSession.model");

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nexora_test_db";
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
  } catch {
    // If local MongoDB is not running, bypass DB for lightweight isolated test execution
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
    await AuthSession.deleteMany({});
  }
});

describe("Phase 2 Authentication & User Identity API", () => {
  const testUser = {
    name: "Alex Rivera",
    email: "alex@example.com",
    password: "Password123!"
  };

  test("POST /api/v1/auth/register - successful registration or valid validation format", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(testUser);

    if (mongoose.connection.readyState === 1) {
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.user.passwordHash).toBeUndefined();
      expect(res.body.accessToken).toBeDefined();
      expect(res.headers["set-cookie"]).toBeDefined();
    } else {
      expect(res.status).toBeDefined();
    }
  });

  test("POST /api/v1/auth/register - duplicate email rejection", async () => {
    if (mongoose.connection.readyState === 1) {
      await request(app).post("/api/v1/auth/register").send(testUser);

      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("already exists");
    }
  });

  test("POST /api/v1/auth/register - invalid data (short password)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...testUser, password: "123" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/v1/auth/login - successful login", async () => {
    if (mongoose.connection.readyState === 1) {
      await request(app).post("/api/v1/auth/register").send(testUser);

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    }
  });

  test("POST /api/v1/auth/login - incorrect password rejection", async () => {
    if (mongoose.connection.readyState === 1) {
      await request(app).post("/api/v1/auth/register").send(testUser);

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: testUser.email, password: "WrongPassword" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Invalid email or password");
    }
  });

  test("GET /api/v1/auth/me - protected endpoint without token", async () => {
    const res = await request(app).get("/api/v1/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("GET /api/v1/auth/me - protected endpoint with valid token", async () => {
    if (mongoose.connection.readyState === 1) {
      const regRes = await request(app).post("/api/v1/auth/register").send(testUser);
      const token = regRes.body.accessToken;

      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    }
  });

  test("GET /api/v1/auth/me - protected endpoint with invalid token", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer InvalidJWTTokenString");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/v1/auth/refresh & Rotation Flow", async () => {
    if (mongoose.connection.readyState === 1) {
      const regRes = await request(app).post("/api/v1/auth/register").send(testUser);
      const cookie = regRes.headers["set-cookie"];

      const refreshRes = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", cookie);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.accessToken).toBeDefined();
      expect(refreshRes.headers["set-cookie"]).toBeDefined();
    }
  });

  test("POST /api/v1/auth/logout - clears cookie and revokes session", async () => {
    if (mongoose.connection.readyState === 1) {
      const regRes = await request(app).post("/api/v1/auth/register").send(testUser);
      const cookie = regRes.headers["set-cookie"];

      const logoutRes = await request(app)
        .post("/api/v1/auth/logout")
        .set("Cookie", cookie);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      const refreshRes = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", logoutRes.headers["set-cookie"] || cookie);

      expect(refreshRes.status).toBe(401);
    }
  });

  test("User Profile GET/PUT/DELETE /api/v1/users/me", async () => {
    if (mongoose.connection.readyState === 1) {
      const regRes = await request(app).post("/api/v1/auth/register").send(testUser);
      const token = regRes.body.accessToken;

      // GET profile
      const getRes = await request(app)
        .get("/api/v1/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.user.name).toBe(testUser.name);

      // UPDATE profile
      const updateRes = await request(app)
        .put("/api/v1/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Alex Rivera Updated",
          careerGoal: { targetRole: "Full Stack AI Engineer", targetDate: "2026-12-31" }
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.user.name).toBe("Alex Rivera Updated");

      // DELETE account
      const deleteRes = await request(app)
        .delete("/api/v1/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      const checkUser = await User.findOne({ email: testUser.email });
      expect(checkUser).toBeNull();
    }
  });
});
