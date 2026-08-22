const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User.model");
const Memory = require("../src/models/Memory.model");
const MemoryRetriever = require("../src/ai/memoryRetriever");
const ContextBuilder = require("../src/ai/contextBuilder");
const { cosineSimilarity } = require("../src/utils/vectorMath");

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

describe("Phase 8B — Semantic Memory + Vector Search Tests", () => {
  test("1. Cosine similarity mathematical calculation accuracy", () => {
    const vecA = [1, 0, 0];
    const vecB = [1, 0, 0];
    const vecC = [0, 1, 0];

    expect(cosineSimilarity(vecA, vecB)).toBe(1);
    expect(cosineSimilarity(vecA, vecC)).toBe(0);
  });

  test("2. Controlled mock vector semantic matching & top-K filtering", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const user = await User.create({ name: "Vector User", email: "vector@example.com", passwordHash: "hash" });
    
    // Controlled vectors: Vector A matches Query Vector [1, 0, 0...], Vector B matches [0, 1, 0...]
    const vecA = new Array(1536).fill(0);
    vecA[0] = 1.0;

    const vecB = new Array(1536).fill(0);
    vecB[1] = 1.0;

    await Memory.create([
      { userId: user._id, memory: "High matching vector memory A", type: "long_term", embedding: vecA, importance: 5 },
      { userId: user._id, memory: "Low matching vector memory B", type: "long_term", embedding: vecB, importance: 1 }
    ]);

    const mockClientOverride = {
      generateEmbedding: async () => vecA // Controlled query vector
    };

    const retrieved = await MemoryRetriever.retrieveRelevantMemories(
      user._id,
      "High matching query",
      { aiMemoryEnabled: true },
      mockClientOverride
    );

    expect(retrieved.length).toBeGreaterThan(0);
    expect(retrieved[0]).toBe("High matching vector memory A");
  });

  test("3. Security Isolation — User B cannot retrieve User A vector matches", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const userA = await User.create({ name: "Alice 8B", email: "alice8b@example.com", passwordHash: "hash" });
    const userB = await User.create({ name: "Bob 8B", email: "bob8b@example.com", passwordHash: "hash" });

    const vec = new Array(1536).fill(0.5);
    await Memory.create({
      userId: userA._id,
      memory: "Alice secret vector fact",
      type: "fact",
      embedding: vec
    });

    const mockClient = { generateEmbedding: async () => vec };

    const retrievedB = await MemoryRetriever.retrieveRelevantMemories(
      userB._id,
      "Alice secret",
      { aiMemoryEnabled: true },
      mockClient
    );

    expect(retrievedB.length).toBe(0);
  });

  test("4. Privacy Bounds — aiMemoryEnabled & preferenceMemoryEnabled handling", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const user = await User.create({ name: "Priv 8B", email: "priv8b@example.com", passwordHash: "hash" });
    const vec = new Array(1536).fill(0.2);

    await Memory.create([
      { userId: user._id, memory: "General long-term memory", type: "long_term", embedding: vec },
      { userId: user._id, memory: "Explicit preference memory", type: "preference", embedding: vec }
    ]);

    const mockClient = { generateEmbedding: async () => vec };

    // Case 1: aiMemoryEnabled = false turns off ALL retrieval
    const resDisabled = await MemoryRetriever.retrieveRelevantMemories(
      user._id,
      "test query",
      { aiMemoryEnabled: false },
      mockClient
    );
    expect(resDisabled.length).toBe(0);

    // Case 2: preferenceMemoryEnabled = false excludes preference type only
    const resNoPref = await MemoryRetriever.retrieveRelevantMemories(
      user._id,
      "test query",
      { aiMemoryEnabled: true, preferenceMemoryEnabled: false },
      mockClient
    );

    expect(resNoPref).toContain("General long-term memory");
    expect(resNoPref).not.toContain("Explicit preference memory");
  });

  test("5. ContextBuilder Integration with Semantic Memory Retriever", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const user = await User.create({ name: "Context 8B", email: "context8b@example.com", passwordHash: "hash" });
    const vec = new Array(1536).fill(0.8);

    await Memory.create({
      userId: user._id,
      memory: "Student target career is Cloud Architect",
      type: "career",
      embedding: vec
    });

    const { systemContext } = await ContextBuilder.buildContext(
      user._id,
      "What is my career target?",
      [],
      { isFreshChat: false }
    );

    expect(systemContext).toContain("STUDENT CONTEXT");
  });
});
