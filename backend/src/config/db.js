const mongoose = require("mongoose");
const { MONGODB_URI } = require("./env");

let memoryServer = null;

const connectDB = async () => {
  try {
    const isCloud = MONGODB_URI && (MONGODB_URI.includes("mongodb+srv") || (!MONGODB_URI.includes("127.0.0.1") && !MONGODB_URI.includes("localhost")));
    const timeoutMs = isCloud ? 10000 : 2500;

    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: timeoutMs
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB (${error.message}).`);

    // In development mode, auto-fallback to in-memory MongoDB so registration/auth/features work seamlessly
    if (process.env.NODE_ENV !== "production") {
      try {
        console.log("[MongoDB] Starting in-memory MongoDB instance for local development...");
        const { MongoMemoryServer } = require("mongodb-memory-server");
        memoryServer = await MongoMemoryServer.create();
        const memUri = memoryServer.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`[MongoDB] Connected to in-memory database successfully at ${memUri}`);
        return conn;
      } catch (memError) {
        console.error(`[MongoDB Error] Failed to start in-memory database: ${memError.message}`);
      }
    }

    console.warn("[MongoDB Warning] API server starting in non-DB mode.");
    return null;
  }
};

const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("[MongoDB] Disconnected successfully");
    }
    if (memoryServer) {
      await memoryServer.stop();
      console.log("[MongoDB] In-memory database stopped");
      memoryServer = null;
    }
  } catch (error) {
    console.error(`[MongoDB] Disconnect error: ${error.message}`);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
