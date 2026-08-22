const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User.model");
const Conversation = require("../src/models/Conversation.model");
const Message = require("../src/models/Message.model");
const MockProviderAdapter = require("../src/ai/providers/mock.provider");
const ResponseParser = require("../src/ai/responseParser");
const PromptManager = require("../src/ai/promptManager");

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
    await Conversation.deleteMany({});
    await Message.deleteMany({});
  }
});

describe("Phase 5 AI Foundation Unit & Integration Tests", () => {
  const userAData = { name: "User A", email: "usera@example.com", password: "Password123!" };
  const userBData = { name: "User B", email: "userb@example.com", password: "Password123!" };

  test("Mock Provider Adapter contract & Response Parser", async () => {
    const adapter = new MockProviderAdapter();
    const result = await adapter.generateResponse({
      systemPrompt: PromptManager.getSystemPrompt(),
      messages: [{ role: "user", content: "How do I study React?" }]
    });

    expect(result).toBeDefined();
    expect(result.content).toContain("React");
    expect(result.provider).toBe("mock");
    expect(result.usage).toBeDefined();

    const parsed = ResponseParser.parse(result);
    expect(parsed.content).toBeDefined();
    expect(parsed.provider).toBe("mock");
  });

  test("POST /api/v1/ai/chat - AI Chat Execution & Message Persistence", async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Register User A
    const regRes = await request(app).post("/api/v1/auth/register").send(userAData);
    const token = regRes.body.accessToken;

    // Send AI chat message
    const chatRes = await request(app)
      .post("/api/v1/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: "Help me create a study plan for Node.js" });

    expect(chatRes.status).toBe(200);
    expect(chatRes.body.success).toBe(true);
    expect(chatRes.body.conversationId).toBeDefined();
    expect(chatRes.body.userMessage.content).toBe("Help me create a study plan for Node.js");
    expect(chatRes.body.assistantMessage.content).toBeDefined();

    const conversationId = chatRes.body.conversationId;

    // Verify messages persisted in DB
    const messagesRes = await request(app)
      .get(`/api/v1/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${token}`);

    expect(messagesRes.status).toBe(200);
    expect(messagesRes.body.messages.length).toBe(2);
    expect(messagesRes.body.messages[0].role).toBe("user");
    expect(messagesRes.body.messages[1].role).toBe("assistant");
  });

  test("Conversation Ownership & Security Checks", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const resA = await request(app).post("/api/v1/auth/register").send(userAData);
    const tokenA = resA.body.accessToken;

    const resB = await request(app).post("/api/v1/auth/register").send(userBData);
    const tokenB = resB.body.accessToken;

    // User A creates conversation
    const createRes = await request(app)
      .post("/api/v1/conversations")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "User A CS Plan" });

    expect(createRes.status).toBe(201);
    const convId = createRes.body.conversation._id;

    // User B attempts to access User A's conversation messages (404)
    const accessBRes = await request(app)
      .get(`/api/v1/conversations/${convId}/messages`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(accessBRes.status).toBe(404);
  });

  test("POST /api/v1/ai/chat - Invalid Request Handling", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const regRes = await request(app).post("/api/v1/auth/register").send(userAData);
    const token = regRes.body.accessToken;

    const emptyRes = await request(app)
      .post("/api/v1/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: "" });

    expect(emptyRes.status).toBe(400);
    expect(emptyRes.body.success).toBe(false);
  });
});
