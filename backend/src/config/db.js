const mongoose = require("mongoose");
const { MONGODB_URI, NODE_ENV } = require("./env");

let memoryServer = null;

const seedIfEmpty = async () => {
  try {
    const Skill = require("../models/Skill.model");
    const count = await Skill.countDocuments();
    if (count === 0) {
      console.log("[MongoDB Fallback] Seeding default skills and demo users...");
      const { SKILLS_SEED, CAREERS_SEED } = require("../seed/careerData");
      const CareerGoal = require("../models/CareerGoal.model");
      const User = require("../models/User.model");
      const { hashPassword } = require("../utils/hashing");

      for (const skill of SKILLS_SEED) {
        await Skill.findOneAndUpdate({ name: skill.name }, skill, { upsert: true });
      }
      for (const career of CAREERS_SEED) {
        await CareerGoal.findOneAndUpdate({ title: career.title }, career, { upsert: true });
      }

      const passwordHash = await hashPassword("Password123!");
      await User.findOneAndUpdate(
        { email: "demo@nexora.com" },
        {
          name: "Alex Rivera",
          email: "demo@nexora.com",
          passwordHash,
          role: "student",
          education: { degree: "B.Tech Computer Science", institution: "MITS", year: 2026 },
          careerGoal: { targetRole: "Full Stack Developer" },
          preferences: { theme: "dark", notifications: true }
        },
        { upsert: true }
      );
      console.log("[MongoDB Fallback] Demo user 'demo@nexora.com' (password: Password123!) ready.");
    }
  } catch (err) {
    console.warn("[MongoDB Fallback] Auto-seed non-fatal warning:", err.message);
  }
};

const connectDB = async () => {
  if (!MONGODB_URI || !MONGODB_URI.startsWith("mongodb")) {
    throw new Error("A valid MONGODB_URI is required.");
  }

  const isCloud = MONGODB_URI.includes("mongodb+srv") || (!MONGODB_URI.includes("127.0.0.1") && !MONGODB_URI.includes("localhost"));
  const timeoutMs = isCloud ? 6000 : 2500;

  try {
    console.log(`[MongoDB] Connecting to ${isCloud ? "MongoDB Atlas Cloud Cluster" : "local MongoDB"}...`);
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: timeoutMs,
      maxPoolSize: 10
    });

    console.log(
      `[MongoDB] Connected successfully to: ${conn.connection.host}`
    );
    console.log(
      `[MongoDB] Database: ${conn.connection.name}`
    );

    return conn;
  } catch (error) {
    console.error(
      `[MongoDB] Primary connection failed: ${error.message}`
    );

    // In development mode, auto-fallback to in-memory MongoDB so server remains online
    if (NODE_ENV !== "production") {
      console.warn("\n======================================================================");
      console.warn("⚠️  [MongoDB Dev Fallback] Unable to connect to primary MongoDB instance.");
      if (error.message.includes("whitelist") || error.message.includes("Could not connect to any servers")) {
        console.warn("💡 Tip: Your current IP address is likely not whitelisted in MongoDB Atlas.");
        console.warn("   To use your persistent cloud database:");
        console.warn("   1. Open MongoDB Atlas (cloud.mongodb.com)");
        console.warn("   2. Go to 'Network Access' -> 'Add IP Address'");
        console.warn("   3. Add your current IP or allow '0.0.0.0/0' (Allow Access from Anywhere)");
      }
      console.warn("🚀 Starting in-memory MongoDB instance so NEXORA API server stays online...");
      console.warn("======================================================================\n");

      try {
        const { MongoMemoryServer } = require("mongodb-memory-server");
        memoryServer = await MongoMemoryServer.create();
        const memUri = memoryServer.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`[MongoDB] Connected to in-memory database successfully at: ${memUri}`);

        // Seed demo accounts and catalog if empty
        await seedIfEmpty();

        return conn;
      } catch (memError) {
        console.error(`[MongoDB] In-memory database failed to start: ${memError.message}`);
        throw memError;
      }
    }

    // In production, never fallback silently
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("[MongoDB] Disconnected successfully.");
    }
    if (memoryServer) {
      await memoryServer.stop();
      console.log("[MongoDB] In-memory database stopped.");
      memoryServer = null;
    }
  } catch (error) {
    console.error(
      `[MongoDB] Disconnect error: ${error.message}`
    );
    throw error;
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
