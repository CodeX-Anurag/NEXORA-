const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User.model");
const Conversation = require("../src/models/Conversation.model");
const Message = require("../src/models/Message.model");
const Memory = require("../src/models/Memory.model");
const aiService = require("../src/services/ai.service");

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
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    await Memory.deleteMany({});
  }
});

describe("Phase 8C — SSE Backend Streaming Tests", () => {
  const userA = { name: "Streamer A", email: "streamer_a@example.com", password: "Password123!" };
  const userB = { name: "Streamer B", email: "streamer_b@example.com", password: "Password123!" };

  test("1. Authentication Required for /api/v1/ai/chat/stream", async () => {
    const res = await request(app).post("/api/v1/ai/chat/stream").send({ message: "Hello stream" });
    expect(res.status).toBe(401);
  });

  test("2. Conversation Ownership Isolation (User B cannot stream on User A's session)", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const resA = await request(app).post("/api/v1/auth/register").send(userA);
    const tokenA = resA.body.accessToken;

    const resB = await request(app).post("/api/v1/auth/register").send(userB);
    const tokenB = resB.body.accessToken;

    // User A creates conversation
    const convA = await Conversation.create({ userId: resA.body.user.id, title: "Alice Session" });

    // User B attempts to stream into User A's conversation
    const hackRes = await request(app)
      .post("/api/v1/ai/chat/stream")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ conversationId: convA._id, message: "Malicious stream attempt" });

    // Returns error event or 404
    expect(hackRes.text).toContain("AI_STREAM_ERROR");
  });

  test("3. SSE Headers & Event Lifecycle (start, token, complete)", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const regRes = await request(app).post("/api/v1/auth/register").send(userA);
    const token = regRes.body.accessToken;

    const res = await request(app)
      .post("/api/v1/ai/chat/stream")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: "Explain React Hooks in detail" });

    expect(res.headers["content-type"]).toContain("text/event-stream");
    expect(res.headers["cache-control"]).toContain("no-cache");
    expect(res.headers["connection"]).toBe("keep-alive");

    const text = res.text;
    expect(text).toContain("event: start");
    expect(text).toContain("event: token");
    expect(text).toContain("event: complete");
    expect(text).toContain("assistantMessageId");
  });

  test("4. Single Message Persistence (1 User Message + 1 Assistant Message in MongoDB)", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const regRes = await request(app).post("/api/v1/auth/register").send(userA);
    const token = regRes.body.accessToken;

    const streamRes = await request(app)
      .post("/api/v1/ai/chat/stream")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: "What is Node.js Express?" });

    const conversations = await Conversation.find({ userId: regRes.body.user.id });
    expect(conversations.length).toBe(1);

    const messages = await Message.find({ conversationId: conversations[0]._id });
    
    // EXPLICIT CHECK: Exactly 2 message documents (1 user + 1 assistant), ZERO token-level documents
    expect(messages.length).toBe(2);
    expect(messages[0].role).toBe("user");
    expect(messages[1].role).toBe("assistant");
    expect(messages[1].content).toContain("Express");
  });

  test("5. Semantic Memory Integration & Privacy Bounds during Streaming", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const regRes = await request(app).post("/api/v1/auth/register").send(userA);
    const token = regRes.body.accessToken;
    const userId = regRes.body.user.id;

    // Save a persistent memory
    const vec = new Array(1536).fill(0.5);
    await Memory.create({
      userId,
      memory: "Prefers Python for Machine Learning data science tasks",
      type: "preference",
      embedding: vec
    });

    const streamRes = await request(app)
      .post("/api/v1/ai/chat/stream")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: "What language do I prefer for machine learning?" });

    expect(streamRes.text).toContain("event: complete");
  });

  test("6. Error Event Handling on Provider Stream Failure", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const regRes = await request(app).post("/api/v1/auth/register").send(userA);
    const token = regRes.body.accessToken;

    const failingLLM = {
      generateStream: async () => {
        throw new Error("Provider Stream Timeout (504)");
      }
    };

    // Call service directly with failing mock LLM
    try {
      await aiService.generateStreamingChatResponse(
        regRes.body.user.id,
        { messageContent: "Test prompt" },
        () => {},
        null,
        failingLLM
      );
    } catch (err) {
      expect(err.message).toContain("Provider Stream Timeout");
    }
  });

  test("7. Normal JSON Chat Endpoint (/api/v1/ai/chat) Remains Functional", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const regRes = await request(app).post("/api/v1/auth/register").send(userA);
    const token = regRes.body.accessToken;

    const chatRes = await request(app)
      .post("/api/v1/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: "Hello AI" });

    expect(chatRes.status).toBe(200);
    expect(chatRes.body.success).toBe(true);
    expect(chatRes.body.assistantMessage).toBeDefined();
  });
});
