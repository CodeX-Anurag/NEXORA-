const mongoose = require("mongoose");
const Memory = require("../src/models/Memory.model");
const Task = require("../src/models/Task.model");
const StudySession = require("../src/models/StudySession.model");
const Project = require("../src/models/Project.model");
const Conversation = require("../src/models/Conversation.model");
const Message = require("../src/models/Message.model");
const Recommendation = require("../src/models/Recommendation.model");
const vectorIndexDef = require("../src/config/vectorIndex.json");
const MemoryRetriever = require("../src/ai/memoryRetriever");

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nexora_test_db";
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
  } catch {
    // Skip DB calls if offline
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

describe("Substep 10B — MongoDB Atlas Production Setup Tests", () => {
  test("1. vectorIndex.json conforms to MongoDB Atlas Vector Search specification", () => {
    expect(vectorIndexDef.name).toBe("vector_index");
    expect(vectorIndexDef.type).toBe("vectorSearch");
    expect(vectorIndexDef.definition.fields).toBeDefined();

    const vectorField = vectorIndexDef.definition.fields.find((f) => f.type === "vector");
    expect(vectorField).toBeDefined();
    expect(vectorField.path).toBe("embedding");
    expect(vectorField.numDimensions).toBe(1536);
    expect(vectorField.similarity).toBe("cosine");

    const userIdFilter = vectorIndexDef.definition.fields.find((f) => f.path === "userId");
    expect(userIdFilter).toBeDefined();
    expect(userIdFilter.type).toBe("filter");

    const typeFilter = vectorIndexDef.definition.fields.find((f) => f.path === "type");
    expect(typeFilter).toBeDefined();
    expect(typeFilter.type).toBe("filter");
  });

  test("2. Memory model schema matches vector search & user isolation contracts", () => {
    const memoryPaths = Memory.schema.paths;

    expect(memoryPaths.userId).toBeDefined();
    expect(memoryPaths.userId.instance.toLowerCase()).toBe("objectid");

    expect(memoryPaths.memory).toBeDefined();
    expect(memoryPaths.type).toBeDefined();
    expect(memoryPaths.embedding).toBeDefined();
  });

  test("3. Compound indexes are present across models for performance", () => {
    const taskIndexes = Task.schema.indexes();
    const studyIndexes = StudySession.schema.indexes();
    const projectIndexes = Project.schema.indexes();
    const convIndexes = Conversation.schema.indexes();
    const msgIndexes = Message.schema.indexes();
    const memIndexes = Memory.schema.indexes();
    const recIndexes = Recommendation.schema.indexes();

    expect(taskIndexes.length).toBeGreaterThan(0);
    expect(studyIndexes.length).toBeGreaterThan(0);
    expect(projectIndexes.length).toBeGreaterThan(0);
    expect(convIndexes.length).toBeGreaterThan(0);
    expect(msgIndexes.length).toBeGreaterThan(0);
    expect(memIndexes.length).toBeGreaterThan(0);
    expect(recIndexes.length).toBeGreaterThan(0);
  });

  test("4. MemoryRetriever gracefully preserves fallback retrieval when vector search pipeline is unindexed", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const mockUserId = new mongoose.Types.ObjectId();
    const results = await MemoryRetriever.retrieveRelevantMemories(mockUserId, "TypeScript skills", { aiMemoryEnabled: true });
    expect(Array.isArray(results)).toBe(true);
  });
});
