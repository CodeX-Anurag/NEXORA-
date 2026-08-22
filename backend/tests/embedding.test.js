const mongoose = require("mongoose");
const User = require("../src/models/User.model");
const Memory = require("../src/models/Memory.model");
const EmbeddingClient = require("../src/ai/embeddingClient");
const MockEmbeddingProvider = require("../src/ai/providers/mockEmbedding.provider");
const OpenAIEmbeddingProvider = require("../src/ai/providers/openaiEmbedding.provider");
const memoryService = require("../src/services/memory.service");

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
  }
});

describe("Phase 8A — Embedding Infrastructure Tests", () => {
  test("1. Mock embedding returns configured dimension (1536)", async () => {
    const client = new EmbeddingClient("mock", 1536);
    const vector = await client.generateEmbedding("React State Management");

    expect(Array.isArray(vector)).toBe(true);
    expect(vector.length).toBe(1536);
    expect(typeof vector[0]).toBe("number");
  });

  test("2. Mock embedding is deterministic", async () => {
    const provider = new MockEmbeddingProvider({ dimension: 1536 });
    const vecA1 = await provider.generateEmbedding("Same Input Text");
    const vecA2 = await provider.generateEmbedding("Same Input Text");
    const vecB = await provider.generateEmbedding("Different Input Text");

    expect(vecA1).toEqual(vecA2);
    expect(vecA1).not.toEqual(vecB);
  });

  test("3. Provider selection works (mock vs openai)", () => {
    const mockClient = new EmbeddingClient("mock");
    expect(mockClient.adapter).toBeInstanceOf(MockEmbeddingProvider);

    const openaiClient = new EmbeddingClient("openai");
    expect(openaiClient.adapter).toBeInstanceOf(OpenAIEmbeddingProvider);
  });

  test("4. OpenAI provider adapter abstraction & mock API call handling", async () => {
    const adapter = new OpenAIEmbeddingProvider({ apiKey: "mock-key", dimension: 1536 });
    
    // Abstracted call without API key throws expected controlled error
    await expect(adapter.generateEmbedding("Test text")).rejects.toThrow("OpenAI API key missing or invalid");
  });

  test("5. Memory creation stores embedding vector in MongoDB", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const user = await User.create({ name: "User 8A", email: "user8a@example.com", passwordHash: "hash" });
    const mem = await memoryService.createMemory(user._id, {
      memory: "Prefers TypeScript for API development",
      type: "preference"
    });

    expect(mem._id).toBeDefined();
    expect(Array.isArray(mem.embedding)).toBe(true);
    expect(mem.embedding.length).toBe(1536);

    const dbRecord = await Memory.findById(mem._id);
    expect(dbRecord.embedding.length).toBe(1536);
  });

  test("6. Memory update regenerates embedding vector", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const user = await User.create({ name: "User 8A-2", email: "user8a2@example.com", passwordHash: "hash" });
    const mem = await memoryService.createMemory(user._id, { memory: "Original text" });
    const originalVec = mem.embedding;

    const updated = await memoryService.updateMemory(user._id, mem._id, {
      memory: "Updated text with completely different content"
    });

    expect(updated.embedding.length).toBe(1536);
    expect(updated.embedding).not.toEqual(originalVec);
  });

  test("7. aiMemoryEnabled=false prevents embedding generation", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const privateUser = await User.create({
      name: "Private User",
      email: "private8a@example.com",
      passwordHash: "hash",
      preferences: { aiMemoryEnabled: false }
    });

    const mem = await memoryService.createMemory(privateUser._id, {
      memory: "Private secret fact"
    });

    expect(mem.memory).toBe("Private secret fact");
    expect(mem.embedding).toBeUndefined();
  });

  test("8. Memory deletion removes embedding with document", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const user = await User.create({ name: "Del User", email: "del8a@example.com", passwordHash: "hash" });
    const mem = await memoryService.createMemory(user._id, { memory: "Memory to delete" });

    await memoryService.deleteMemory(user._id, mem._id);
    const dbRecord = await Memory.findById(mem._id);

    expect(dbRecord).toBeNull();
  });

  test("9. Wrong vector dimension is rejected", async () => {
    const invalidAdapter = {
      generateEmbedding: async () => [0.1, 0.2, 0.3] // 3 dimensions instead of 1536
    };

    const client = new EmbeddingClient("mock", 1536);
    client.adapter = invalidAdapter;

    await expect(client.generateEmbedding("Test")).rejects.toThrow("Invalid vector dimension");
  });

  test("10. Provider failure is handled safely", async () => {
    const failingAdapter = {
      generateEmbedding: async () => {
        throw new Error("Provider API timeout");
      }
    };

    const client = new EmbeddingClient("mock", 1536);
    client.adapter = failingAdapter;

    await expect(client.generateEmbedding("Test")).rejects.toThrow("Provider API timeout");
  });
});
