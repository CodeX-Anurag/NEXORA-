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

describe("Substep 9B — Authentication & Authorization Hardening Tests", () => {
  const userAData = { name: "Alice 9B", email: "alice9b@example.com", password: "Password123!" };
  const userBData = { name: "Bob 9B", email: "bob9b@example.com", password: "Password123!" };

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

  test("1. Missing, malformed, or invalid tokens are rejected with HTTP 401", async () => {
    const missingRes = await request(app).get("/api/v1/tasks");
    expect(missingRes.status).toBe(401);

    const invalidRes = await request(app)
      .get("/api/v1/tasks")
      .set("Authorization", "Bearer invalid-fake-jwt-token");
    expect(invalidRes.status).toBe(401);
  });

  test("2. Client-supplied userId in body cannot override token identity", async () => {
    if (mongoose.connection.readyState !== 1) return;

    // User A creates task attempting to pass User B's ID in request body
    const res = await request(app)
      .post("/api/v1/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        title: "User A Task",
        userId: userBId // Malicious override attempt
      });

    expect(res.status).toBe(201);
    expect(res.body.task.userId.toString()).toBe(userAId); // Server enforced User A
    expect(res.body.task.userId.toString()).not.toBe(userBId);
  });

  test("3. Cross-User Task Security (User A cannot read, update, or delete User B's task)", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const taskB = await Task.create({ userId: userBId, title: "Bob Private Task" });

    // User A attempts GET User B task
    const getRes = await request(app)
      .get(`/api/v1/tasks/${taskB._id}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(getRes.status).toBe(404);

    // User A attempts PUT User B task
    const putRes = await request(app)
      .put(`/api/v1/tasks/${taskB._id}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Hacked Title" });
    expect(putRes.status).toBe(404);

    // User A attempts DELETE User B task
    const delRes = await request(app)
      .delete(`/api/v1/tasks/${taskB._id}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(delRes.status).toBe(404);

    // Verify Bob's task remains unchanged in DB
    const unchanged = await Task.findById(taskB._id);
    expect(unchanged.title).toBe("Bob Private Task");
  });

  test("4. Cross-User Study Session Security", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const sessionB = await StudySession.create({
      userId: userBId,
      subject: "Quantum Physics",
      duration: 60
    });

    const getRes = await request(app)
      .get(`/api/v1/study/${sessionB._id}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(getRes.status).toBe(404);

    const delRes = await request(app)
      .delete(`/api/v1/study/${sessionB._id}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(delRes.status).toBe(404);
  });

  test("5. Cross-User Project Security", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const projectB = await Project.create({
      userId: userBId,
      title: "Bob Secret Project",
      techStack: ["React", "Go"]
    });

    const getRes = await request(app)
      .get(`/api/v1/projects/${projectB._id}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(getRes.status).toBe(404);

    const putRes = await request(app)
      .put(`/api/v1/projects/${projectB._id}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Hacked Project" });
    expect(putRes.status).toBe(404);
  });

  test("6. Cross-User Conversation & AI Message Security (JSON & Streaming)", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const convB = await Conversation.create({ userId: userBId, title: "Bob Private Conversation" });

    // User A attempts GET Bob's messages
    const getRes = await request(app)
      .get(`/api/v1/conversations/${convB._id}/messages`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(getRes.status).toBe(404);

    // User A attempts JSON AI Chat into Bob's conversation
    const chatRes = await request(app)
      .post("/api/v1/ai/chat")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ conversationId: convB._id, message: "Hacked message" });
    expect(chatRes.status).toBe(404);

    // User A attempts Streaming AI Chat into Bob's conversation
    const streamRes = await request(app)
      .post("/api/v1/ai/chat/stream")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ conversationId: convB._id, message: "Hacked stream message" });
    expect(streamRes.text).toContain("AI_STREAM_ERROR");
  });

  test("7. Cross-User Memory Security", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const memB = await Memory.create({
      userId: userBId,
      memory: "Bob secret preference",
      type: "preference"
    });

    const putRes = await request(app)
      .put(`/api/v1/memories/${memB._id}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ memory: "Overwritten memory" });
    expect(putRes.status).toBe(404);

    const delRes = await request(app)
      .delete(`/api/v1/memories/${memB._id}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(delRes.status).toBe(404);
  });

  test("8. Cross-User Recommendation Security", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const recB = await Recommendation.create({
      userId: userBId,
      fingerprint: "skill:react",
      title: "Master React Testing",
      description: "Bob recommendation",
      type: "skill"
    });

    const feedbackRes = await request(app)
      .put(`/api/v1/ai/recommendations/${recB._id}/feedback`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ feedback: "accepted" });
    expect(feedbackRes.status).toBe(404);
  });

  test("9. Same-User Access (User A can manage Alice's own resources)", async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Create
    const createRes = await request(app)
      .post("/api/v1/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Alice Valid Task" });
    expect(createRes.status).toBe(201);
    const taskId = createRes.body.task._id;

    // Read
    const getRes = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(getRes.status).toBe(200);

    // Update
    const putRes = await request(app)
      .put(`/api/v1/tasks/${taskId}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ status: "completed" });
    expect(putRes.status).toBe(200);

    // Delete
    const delRes = await request(app)
      .delete(`/api/v1/tasks/${taskId}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(delRes.status).toBe(200);
  });
});
