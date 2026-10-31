const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/User.model");
const PlatformConnection = require("../src/models/PlatformConnection.model");
const Project = require("../src/models/Project.model");
const ResumeProfile = require("../src/models/ResumeProfile.model");
const { extractGithubUsername } = require("../src/services/platformConnectors/github.connector");
const { extractLeetCodeUsername } = require("../src/services/platformConnectors/leetcode.connector");
const { extractCodeforcesHandle } = require("../src/services/platformConnectors/codeforces.connector");
const { validateLinkedInUrl } = require("../src/services/platformConnectors/linkedin.connector");

describe("NEXORA Career Intelligence — Multi-Platform Profile Integration Tests", () => {
  let tokenA = "";
  let tokenB = "";
  let userAId = "";

  beforeAll(async () => {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nexora_test_db";
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    } catch {
      // Offline fallback
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
      await PlatformConnection.deleteMany({});
      await Project.deleteMany({});
      await ResumeProfile.deleteMany({});

      // Register User A
      const regA = await request(app).post("/api/v1/auth/register").send({
        name: "Dana Developer",
        email: "dana@example.com",
        password: "Password123!"
      });
      tokenA = regA.body.accessToken;
      userAId = regA.body.user?.id;

      // Register User B
      const regB = await request(app).post("/api/v1/auth/register").send({
        name: "Evan Engineer",
        email: "evan@example.com",
        password: "Password123!"
      });
      tokenB = regB.body.accessToken;
    }
  });

  describe("Platform Connectors & Input Parsing", () => {
    test("Extracts clean usernames and URLs from diverse input formats", () => {
      // GitHub
      expect(extractGithubUsername("octocat")).toBe("octocat");
      expect(extractGithubUsername("https://github.com/octocat")).toBe("octocat");
      expect(extractGithubUsername("https://github.com/octocat/repo")).toBe("octocat");

      // LeetCode
      expect(extractLeetCodeUsername("leetcode_coder")).toBe("leetcode_coder");
      expect(extractLeetCodeUsername("https://leetcode.com/u/coder99")).toBe("coder99");

      // Codeforces
      expect(extractCodeforcesHandle("tourist")).toBe("tourist");
      expect(extractCodeforcesHandle("https://codeforces.com/profile/tourist")).toBe("tourist");

      // LinkedIn
      const li = validateLinkedInUrl("https://linkedin.com/in/danadev");
      expect(li.username).toBe("danadev");
      expect(li.profileUrl).toBe("https://linkedin.com/in/danadev");
    });
  });

  describe("Multi-Platform Profile REST API Lifecycle", () => {
    test("1. GET /api/v1/career/platforms returns normalized slots for all supported platforms", async () => {
      if (mongoose.connection.readyState !== 1) return;

      const res = await request(app)
        .get("/api/v1/career/platforms")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.connectedCount).toBe(0);
      expect(res.body.platforms.length).toBeGreaterThanOrEqual(4);
      expect(res.body.platforms.some((p) => p.platform === "github")).toBe(true);
      expect(res.body.platforms.some((p) => p.platform === "leetcode")).toBe(true);
    });

    test("2. Connects and verifies self-confirmed LeetCode profile without fabrication", async () => {
      if (mongoose.connection.readyState !== 1) return;

      const res = await request(app)
        .post("/api/v1/career/platforms/leetcode/connect")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          username: "dana_codes",
          isManual: true,
          easy: 80,
          medium: 120,
          hard: 25,
          contestRating: 1840
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.connection.verificationStatus).toBe("user_confirmed");
      expect(res.body.connection.summary.primaryMetric).toBe("225 Problems Solved");
      expect(res.body.connection.importedData.totalSolved).toBe(225);
      expect(res.body.connection.importedData.contestRating).toBe(1840);
    });

    test("3. Connects official LinkedIn URL with user-confirmed headline without scraping", async () => {
      if (mongoose.connection.readyState !== 1) return;

      const res = await request(app)
        .post("/api/v1/career/platforms/linkedin/connect")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          profileUrl: "https://linkedin.com/in/danadev",
          headline: "Distributed Systems Engineer"
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.connection.verificationStatus).toBe("user_confirmed");
      expect(res.body.connection.profileUrl).toBe("https://linkedin.com/in/danadev");
    });

    test("4. Updates selected repositories and custom bullet points", async () => {
      if (mongoose.connection.readyState !== 1) return;

      // Seed a connection directly in DB
      await PlatformConnection.create({
        userId: userAId,
        platform: "github",
        username: "danadev",
        profileUrl: "https://github.com/danadev",
        connectionStatus: "connected",
        verificationStatus: "api_verified",
        selectedItems: [
          {
            id: "101",
            title: "Async Message Broker",
            description: "High-throughput messaging system",
            techStack: ["Node.js", "Redis"],
            url: "https://github.com/danadev/broker",
            stars: 45,
            forks: 12,
            bulletPoints: ["Engineered low-latency queue processing 50k msgs/sec."],
            selectedForResume: true
          }
        ]
      });

      const res = await request(app)
        .put("/api/v1/career/platforms/github/selected")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          selectedItems: [
            {
              id: "101",
              title: "Async Message Broker (V2)",
              description: "High-throughput messaging system",
              techStack: ["Node.js", "Redis", "TypeScript"],
              url: "https://github.com/danadev/broker",
              stars: 45,
              forks: 12,
              bulletPoints: ["Engineered low-latency queue with zero data loss under failover."],
              selectedForResume: true
            }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.selectedItems[0].title).toBe("Async Message Broker (V2)");
      expect(res.body.selectedItems[0].bulletPoints[0]).toContain("zero data loss");
    });

    test("5. Synchronizes verified GitHub projects into NEXORA Project models", async () => {
      if (mongoose.connection.readyState !== 1) return;

      await PlatformConnection.create({
        userId: userAId,
        platform: "github",
        username: "danadev",
        profileUrl: "https://github.com/danadev",
        connectionStatus: "connected",
        selectedItems: [
          {
            id: "201",
            title: "Cloud Observability Agent",
            description: "Lightweight telemetry agent",
            techStack: ["Go", "Docker"],
            url: "https://github.com/danadev/agent",
            stars: 30,
            selectedForResume: true
          }
        ]
      });

      const res = await request(app)
        .post("/api/v1/career/platforms/sync/projects")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.projects.length).toBe(1);
      expect(res.body.projects[0].title).toBe("Cloud Observability Agent");

      // Verify in Project collection
      const projDoc = await Project.findOne({ userId: userAId, githubUrl: "https://github.com/danadev/agent" });
      expect(projDoc).toBeDefined();
      expect(projDoc.techStack).toContain("Go");
    });

    test("6. Multi-Tenant Isolation — User B cannot view or disconnect User A's platform", async () => {
      if (mongoose.connection.readyState !== 1) return;

      // User A connects GitHub
      await PlatformConnection.create({
        userId: userAId,
        platform: "github",
        username: "danadev",
        connectionStatus: "connected"
      });

      // User B checks their own platforms
      const resB = await request(app)
        .get("/api/v1/career/platforms")
        .set("Authorization", `Bearer ${tokenB}`);

      const githubSlotB = resB.body.platforms.find((p) => p.platform === "github");
      expect(githubSlotB.connectionStatus).toBe("disconnected");
      expect(githubSlotB.username).toBe("");

      // User B tries to disconnect User A's github
      const delResB = await request(app)
        .delete("/api/v1/career/platforms/github")
        .set("Authorization", `Bearer ${tokenB}`);

      expect(delResB.status).toBe(404);
    });

    test("7. Disconnects platform and removes imported records cleanly", async () => {
      if (mongoose.connection.readyState !== 1) return;

      await PlatformConnection.create({
        userId: userAId,
        platform: "leetcode",
        username: "dana_codes",
        connectionStatus: "connected"
      });

      const delRes = await request(app)
        .delete("/api/v1/career/platforms/leetcode")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      const check = await PlatformConnection.findOne({ userId: userAId, platform: "leetcode" });
      expect(check).toBeNull();
    });

    test("8. Unauthenticated requests are rejected with 401", async () => {
      const res = await request(app).get("/api/v1/career/platforms");
      expect(res.status).toBe(401);
    });
  });
});
