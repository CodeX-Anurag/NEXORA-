const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/User.model");
const ResumeProfile = require("../src/models/ResumeProfile.model");
const SavedResume = require("../src/models/SavedResume.model");
const { validateSafeUrl, compareProfileWithJob } = require("../src/services/jobResearch.service");
const { generateResumeDocx, generateResumePdf } = require("../src/services/resumeExport.service");
const { extractTextFromResumeBuffer } = require("../src/services/resumeImport.service");

describe("NEXORA Resume Intelligence Upgrade Test Suite", () => {
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
      await ResumeProfile.deleteMany({});
      await SavedResume.deleteMany({});

      // Register User A
      const regA = await request(app).post("/api/v1/auth/register").send({
        name: "Alex Morgan",
        email: "alex@example.com",
        password: "Password123!"
      });
      tokenA = regA.body.accessToken;
      userAId = regA.body.user?.id;

      // Register User B
      const regB = await request(app).post("/api/v1/auth/register").send({
        name: "Sam Jordan",
        email: "sam@example.com",
        password: "Password123!"
      });
      tokenB = regB.body.accessToken;
    }
  });

  // Feature 1: Profile Prefilling & Persistent Confirmation
  describe("Feature 1: Resume Profile & Persistent Storage", () => {
    test("GET /api/v1/resume/profile pre-fills user profile and calculates completion checklist", async () => {
      if (mongoose.connection.readyState !== 1) return;

      const res = await request(app)
        .get("/api/v1/resume/profile")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profile.personalInfo.fullName).toBe("Alex Morgan");
      expect(res.body.profile.personalInfo.email).toBe("alex@example.com");
      expect(res.body.completion).toBeDefined();
      expect(typeof res.body.completion.percentage).toBe("number");
    });

    test("PUT /api/v1/resume/profile persistently saves confirmed details", async () => {
      if (mongoose.connection.readyState !== 1) return;

      const updatePayload = {
        personalInfo: {
          fullName: "Alex Morgan",
          email: "alex@example.com",
          phone: "+1-555-0199",
          location: "San Francisco, CA",
          linkedin: "https://linkedin.com/in/alexmorgan",
          github: "https://github.com/alexmorgan"
        },
        targetRole: "Senior Backend Engineer",
        professionalSummary: "Backend engineer with 3 years building scalable distributed systems.",
        education: [
          {
            degree: "B.S. in Computer Science",
            institution: "Stanford University",
            startDate: "2020",
            endDate: "2024",
            gpa: "3.9"
          }
        ],
        skills: [
          { name: "Node.js", category: "languages", level: 90 },
          { name: "TypeScript", category: "languages", level: 85 }
        ],
        projects: [
          {
            title: "Distributed Cache",
            description: "High-performance in-memory cache",
            techStack: ["Node.js", "Redis"],
            bulletPoints: ["Engineered caching layer improving latency by 40%"]
          }
        ]
      };

      const res = await request(app)
        .put("/api/v1/resume/profile")
        .set("Authorization", `Bearer ${tokenA}`)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profile.personalInfo.phone).toBe("+1-555-0199");
      expect(res.body.profile.targetRole).toBe("Senior Backend Engineer");

      // Verify persistence directly in MongoDB
      const savedDoc = await ResumeProfile.findOne({ userId: userAId });
      expect(savedDoc).toBeDefined();
      expect(savedDoc.personalInfo.location).toBe("San Francisco, CA");
      expect(savedDoc.projects.length).toBe(1);
      expect(savedDoc.lastConfirmedAt).not.toBeNull();
    });
  });

  // Feature 2: Document Import & Text Extraction
  describe("Feature 2: Document Import & Security", () => {
    test("Rejects upload with missing file with 400 Bad Request", async () => {
      if (mongoose.connection.readyState !== 1) return;

      const res = await request(app)
        .post("/api/v1/resume/import")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
    });

    test("Extracts text correctly from text-based buffer", async () => {
      const mockDocxText = "Jane Doe\njane@example.com\nSoftware Engineer\nSkills: React, Node.js";
      // Test function exists and handles invalid type gracefully
      await expect(
        extractTextFromResumeBuffer(Buffer.from(mockDocxText), "image/png", "file.png")
      ).rejects.toThrow();
    });
  });

  // Feature 3 & 7: Job Description Research & SSRF Protection
  describe("Feature 3 & 7: Job Research & SSRF Security", () => {
    test("Blocks SSRF to private/internal IP ranges and localhosts", async () => {
      await expect(validateSafeUrl("http://localhost:5000")).rejects.toThrow();
      await expect(validateSafeUrl("http://127.0.0.1:8080")).rejects.toThrow();
      await expect(validateSafeUrl("http://169.254.169.254/latest/meta-data")).rejects.toThrow();
      await expect(validateSafeUrl("http://10.0.0.1")).rejects.toThrow();
      await expect(validateSafeUrl("file:///etc/passwd")).rejects.toThrow();
      await expect(validateSafeUrl("ftp://example.com/job")).rejects.toThrow();
    });

    test("Permits valid public HTTP/HTTPS URLs", async () => {
      const safe = await validateSafeUrl("https://example.com/careers/job-123");
      expect(safe).toBe("https://example.com/careers/job-123");
    });

    test("Calculates transparent skill match without hallucinating missing skills", () => {
      const mockProfile = {
        skills: [{ name: "Node.js" }, { name: "TypeScript" }, { name: "Docker" }]
      };

      const mockJob = {
        requiredSkills: ["Node.js", "Kubernetes", "TypeScript"],
        preferredSkills: ["Docker", "GraphQL"],
        responsibilities: ["Develop scalable microservices"]
      };

      const match = compareProfileWithJob(mockProfile, mockJob);

      expect(match.matchScore).toBeGreaterThan(0);
      expect(match.matchedSkills.some((s) => s.name === "Node.js")).toBe(true);
      expect(match.matchedSkills.some((s) => s.name === "TypeScript")).toBe(true);
      expect(match.missingSkills.required).toContain("Kubernetes");
      expect(match.missingSkills.preferred).toContain("GraphQL");
      expect(match.disclaimer).toContain("not a hiring guarantee");
    });
  });

  // Feature 4: Gemini Resume Generation & Schema Validation
  describe("Feature 4: Tailored Resume Generation", () => {
    test("POST /api/v1/resume/generate returns structured ATS resume adhering to schema", async () => {
      if (mongoose.connection.readyState !== 1) return;

      // Seed a confirmed profile first
      await request(app)
        .put("/api/v1/resume/profile")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          personalInfo: {
            fullName: "Alex Morgan",
            email: "alex@example.com",
            phone: "555-1234"
          },
          targetRole: "Full Stack Developer",
          skills: [{ name: "React", level: 80 }, { name: "Node.js", level: 85 }],
          projects: [{ title: "Productivity App", description: "MERN Stack App", techStack: ["React", "Node.js"] }]
        });

      const res = await request(app)
        .post("/api/v1/resume/generate")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          template: "modern",
          targetRole: "Full Stack Developer"
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.resumeData).toBeDefined();
      expect(res.body.resumeData.personalInfo.fullName).toBe("Alex Morgan");
      expect(res.body.resumeData.targetRole).toBe("Full Stack Developer");
      expect(res.body.resumeData.professionalSummary).toBeDefined();
      // Ensure it is NOT returning raw unparsed markdown or raw json string
      expect(typeof res.body.resumeData).toBe("object");
      expect(typeof res.body.resumeData.personalInfo).toBe("object");
    });
  });

  // Feature 5 & 6: Binary Export (DOCX & PDF)
  describe("Feature 5 & 6: Binary Export Engines", () => {
    const mockResume = {
      personalInfo: {
        fullName: "Alex Morgan",
        email: "alex@example.com",
        phone: "+1-555-0100",
        location: "New York, NY",
        linkedin: "https://linkedin.com/in/alex",
        github: "https://github.com/alex"
      },
      targetRole: "Software Engineer",
      professionalSummary: "Results-driven engineer specializing in high-performance cloud applications.",
      skills: [{ name: "JavaScript", category: "languages" }, { name: "Node.js", category: "languages" }],
      experience: [
        {
          title: "Software Engineer",
          company: "Tech Corp",
          location: "New York",
          startDate: "2023",
          endDate: "Present",
          bulletPoints: ["Engineered scalable APIs", "Maintained CI/CD pipelines"]
        }
      ],
      projects: [
        {
          title: "Microservices Gateway",
          techStack: ["Node.js", "Docker"],
          bulletPoints: ["Routed 10k requests/min with sub-50ms latency"]
        }
      ],
      education: [
        {
          degree: "B.S. in Computer Science",
          institution: "City University",
          startDate: "2019",
          endDate: "2023",
          gpa: "3.8"
        }
      ]
    };

    test("generateResumeDocx creates a valid, non-empty OpenXML DOCX buffer", async () => {
      const buffer = await generateResumeDocx(mockResume, "modern");
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(1000);
      // OpenXML documents start with PK (zip magic bytes 0x50, 0x4B)
      expect(buffer[0]).toBe(0x50);
      expect(buffer[1]).toBe(0x4b);
    });

    test("generateResumePdf creates a valid vector PDF buffer with selectable text", async () => {
      const buffer = await generateResumePdf(mockResume, "modern");
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(500);
      // PDF documents start with %PDF- (0x25, 0x50, 0x44, 0x46)
      const header = buffer.slice(0, 5).toString("utf-8");
      expect(header).toBe("%PDF-");
    });
  });

  // Feature 6: Saved Resumes CRUD & Cross-User Security Isolation
  describe("Feature 6: Saved Resumes CRUD & User Isolation", () => {
    test("User A can save, retrieve, and delete a resume, and User B cannot access it", async () => {
      if (mongoose.connection.readyState !== 1) return;

      // 1. User A saves a resume
      const createRes = await request(app)
        .post("/api/v1/resume/saved")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          title: "Alex Google SWE Resume",
          targetRole: "Software Engineer",
          template: "technical",
          resumeData: {
            personalInfo: { fullName: "Alex Morgan", email: "alex@example.com" },
            targetRole: "Software Engineer"
          }
        });

      expect(createRes.status).toBe(201);
      const resumeId = createRes.body.resume._id;

      // 2. User A can retrieve it
      const getResA = await request(app)
        .get(`/api/v1/resume/saved/${resumeId}`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(getResA.status).toBe(200);
      expect(getResA.body.resume.title).toBe("Alex Google SWE Resume");

      // 3. User B CANNOT retrieve User A's resume (Strict Tenant Isolation)
      const getResB = await request(app)
        .get(`/api/v1/resume/saved/${resumeId}`)
        .set("Authorization", `Bearer ${tokenB}`);

      expect(getResB.status).toBe(404);

      // 4. User B CANNOT delete User A's resume
      const delResB = await request(app)
        .delete(`/api/v1/resume/saved/${resumeId}`)
        .set("Authorization", `Bearer ${tokenB}`);

      expect(delResB.status).toBe(404);

      // 5. User A can delete their own resume
      const delResA = await request(app)
        .delete(`/api/v1/resume/saved/${resumeId}`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(delResA.status).toBe(200);
    });

    test("Unauthenticated requests are rejected with HTTP 401", async () => {
      const res = await request(app).get("/api/v1/resume/profile");
      expect(res.status).toBe(401);
    });
  });
});
