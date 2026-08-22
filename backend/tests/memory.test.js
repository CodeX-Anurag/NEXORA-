const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User.model");
const Memory = require("../src/models/Memory.model");
const Conversation = require("../src/models/Conversation.model");
const Message = require("../src/models/Message.model");
const MemoryRetriever = require("../src/ai/memoryRetriever");
const ContextBuilder = require("../src/ai/contextBuilder");

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
    await Memory.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});
  }
});

describe("Phase 6 NEXORA Memory System Unit & Integration Tests", () => {
  const userA = { name: "Alice", email: "alice@example.com", password: "Password123!" };
  const userB = { name: "Bob", email: "bob@example.com", password: "Password123!" };

  test("Memory REST APIs - CRUD & User Ownership Isolation", async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Register User A & User B
    const resA = await request(app).post("/api/v1/auth/register").send(userA);
    const tokenA = resA.body.accessToken;
    const userIdA = resA.body.user.id;

    const resB = await request(app).post("/api/v1/auth/register").send(userB);
    const tokenB = resB.body.accessToken;

    // 1. Create Memory for User A
    const createRes = await request(app)
      .post("/api/v1/memories")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        memory: "Prefers TypeScript over plain JavaScript for backend APIs",
        type: "preference",
        importance: 4
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.memory.memory).toContain("TypeScript");
    const memoryId = createRes.body.memory._id;

    // 2. Retrieve User A memories
    const getResA = await request(app)
      .get("/api/v1/memories")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(getResA.status).toBe(200);
    expect(getResA.body.memories.length).toBe(1);

    // 3. Verify User Isolation: User B cannot retrieve User A's memories
    const getResB = await request(app)
      .get("/api/v1/memories")
      .set("Authorization", `Bearer ${tokenB}`);

    expect(getResB.status).toBe(200);
    expect(getResB.body.memories.length).toBe(0);

    // 4. Update Memory for User A
    const updateRes = await request(app)
      .put(`/api/v1/memories/${memoryId}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ importance: 5 });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.memory.importance).toBe(5);

    // 5. User B attempts to delete User A's memory (404)
    const deleteFailRes = await request(app)
      .delete(`/api/v1/memories/${memoryId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(deleteFailRes.status).toBe(404);

    // 6. Delete Memory by ID for User A
    const deleteRes = await request(app)
      .delete(`/api/v1/memories/${memoryId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    // 7. Delete All Memories for User A
    await request(app)
      .post("/api/v1/memories")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ memory: "Memory 1 to clear", type: "fact" });
    await request(app)
      .post("/api/v1/memories")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ memory: "Memory 2 to clear", type: "fact" });

    const deleteAllRes = await request(app)
      .delete("/api/v1/memories")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(deleteAllRes.status).toBe(200);
    expect(deleteAllRes.body.success).toBe(true);

    const postClearGet = await request(app)
      .get("/api/v1/memories")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(postClearGet.body.memories.length).toBe(0);
  });

  test("MemoryRetriever & Relevance Scoring", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const userDoc = await User.create({ name: "Tester", email: "testm@example.com", passwordHash: "hash" });
    
    await Memory.create([
      { userId: userDoc._id, memory: "Interested in React Hooks and state management", type: "preference", importance: 5 },
      { userId: userDoc._id, memory: "Wants to master Docker and Kubernetes", type: "career", importance: 3 },
      { userId: userDoc._id, memory: "Prefers dark mode theme", type: "preference", importance: 2 }
    ]);

    const retrieved = await MemoryRetriever.retrieveRelevantMemories(
      userDoc._id,
      "Can you give me tips on React components?",
      { aiMemoryEnabled: true }
    );

    expect(retrieved.length).toBeGreaterThan(0);
    expect(retrieved[0]).toContain("React");
  });

  test("Privacy Settings & Fresh Chat Mode in ContextBuilder", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const userDoc = await User.create({
      name: "Privacy User",
      email: "privacy@example.com",
      passwordHash: "hash",
      preferences: { aiMemoryEnabled: false, profileMemoryEnabled: false }
    });

    await Memory.create({
      userId: userDoc._id,
      memory: "Secret memory fact",
      type: "fact",
      importance: 5
    });

    // Case 1: Fresh / Private Chat Mode
    const freshContext = await ContextBuilder.buildContext(userDoc._id, "Hello AI", [], { isFreshChat: true });
    expect(freshContext.systemContext).toContain("PRIVATE / FRESH CHAT CONTEXT");
    expect(freshContext.systemContext).not.toContain("Secret memory fact");

    // Case 2: Privacy settings disabled profile reading & AI memory
    const privacyContext = await ContextBuilder.buildContext(userDoc._id, "Hello AI", [], { isFreshChat: false });
    expect(privacyContext.systemContext).not.toContain("Secret memory fact");
  });

  test("AI Chat Integration with Long-Term Memory Context", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const regRes = await request(app).post("/api/v1/auth/register").send(userA);
    const token = regRes.body.accessToken;

    // Save a custom memory
    await request(app)
      .post("/api/v1/memories")
      .set("Authorization", `Bearer ${token}`)
      .send({ memory: "Student wants to become a Senior Full Stack Engineer by Dec 2026", type: "career", importance: 5 });

    // Send AI chat message
    const chatRes = await request(app)
      .post("/api/v1/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: "What is my goal?" });

    expect(chatRes.status).toBe(200);
    expect(chatRes.body.success).toBe(true);
    expect(chatRes.body.assistantMessage).toBeDefined();
  });
});
