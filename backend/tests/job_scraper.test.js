/**
 * NEXORA Acceptance Tests — Job Intelligence & Web Scraper Pipeline
 * Verifies all 7 required acceptance criteria:
 * 1. Permitted public job posting with structured JobPosting metadata (JSON-LD)
 * 2. Public job page without structured metadata (Semantic HTML extraction fallback)
 * 3. Page that blocks automated access (401/403/Anti-bot challenge detection and fallback)
 * 4. Invalid URL format (400 Bad Request)
 * 5. URL targeting localhost or private IP (403 Forbidden SSRF prevention)
 * 6. Job description with missing fields (Graceful normalization & safe defaults)
 * 7. Resume tailoring using scraped requirements and verified user data (Non-hallucination)
 */

process.env.LLM_PROVIDER = "mock";

const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/User.model");
const ResumeProfile = require("../src/models/ResumeProfile.model");
const PlatformConnection = require("../src/models/PlatformConnection.model");
const { generateAccessToken } = require("../src/utils/jwt");
const { validateSafeUrl, isPrivateOrReservedIp } = require("../src/services/jobScraper.service");
const { extractJobData } = require("../src/services/jobExtraction.service");
const { analyzeAndNormalizeJob } = require("../src/services/jobAnalysis.service");
const { tailorResumeToJob } = require("../src/services/resumeTailoring.service");

describe("NEXORA Job Intelligence & Web Scraper Acceptance Suite", () => {
  let authToken = "";
  let userId = "";

  beforeAll(async () => {
    const defaultUserId = new mongoose.Types.ObjectId();
    userId = defaultUserId.toString();
    authToken = generateAccessToken({ _id: defaultUserId });

    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nexora_test_db";
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 1500 });
    } catch {
      // Offline / standalone test mode
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
      await PlatformConnection.deleteMany({});

      const testUser = await User.create({
        _id: new mongoose.Types.ObjectId(userId),
        name: "Devon Vance",
        email: "devon@example.com",
        passwordHash: "hashedpass123",
        role: "student"
      });

      authToken = generateAccessToken(testUser);
    }
  });

  // Test 1: Permitted public job posting with structured JobPosting metadata (JSON-LD)
  test("1. Successfully extracts 10 fields from public job posting with structured JSON-LD JobPosting metadata", async () => {
    const jsonLdHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Staff Backend Engineer - Acme Corp</title>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "JobPosting",
            "title": "Staff Backend Engineer",
            "description": "<p>Acme Corp is hiring a Staff Backend Engineer to scale our distributed cloud architecture.</p><h3>Required Skills</h3><ul><li>Node.js</li><li>TypeScript</li><li>PostgreSQL</li><li>Docker</li></ul>",
            "hiringOrganization": {
              "@type": "Organization",
              "name": "Acme Technologies",
              "sameAs": "https://acme.example.com"
            },
            "jobLocation": {
              "@type": "Place",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "San Francisco",
                "addressRegion": "CA",
                "addressCountry": "US"
              }
            },
            "employmentType": "FULL_TIME",
            "experienceRequirements": "5+ years",
            "skills": ["Node.js", "TypeScript", "PostgreSQL", "Docker", "Kubernetes"],
            "responsibilities": [
              "Architect high-throughput microservices",
              "Mentor junior engineers and lead code reviews"
            ],
            "qualifications": [
              "BS in Computer Science or equivalent practical experience",
              "Demonstrated track record with distributed cloud systems"
            ],
            "url": "https://acme.example.com/careers/staff-backend-engineer"
          }
          </script>
        </head>
        <body>
          <h1>Staff Backend Engineer at Acme Technologies</h1>
        </body>
      </html>
    `;

    // Direct service extraction test
    const extracted = extractJobData(jsonLdHtml, "https://acme.example.com/careers/staff-backend-engineer");
    expect(extracted.extractionMethod).toBe("json_ld");
    expect(extracted.isStructured).toBe(true);
    expect(extracted.jobTitle).toBe("Staff Backend Engineer");
    expect(extracted.company).toBe("Acme Technologies");
    expect(extracted.location).toContain("San Francisco");
    expect(extracted.jobType).toBe("Full-time");
    expect(extracted.experienceRequirements).toBe("5+ years");
    expect(extracted.requiredSkills).toEqual(expect.arrayContaining(["Node.js", "TypeScript", "Docker"]));
    expect(extracted.responsibilities.length).toBeGreaterThan(0);
    expect(extracted.qualifications.length).toBeGreaterThan(0);
    expect(extracted.applicationUrl).toBe("https://acme.example.com/careers/staff-backend-engineer");

    // Endpoint test via mocked fetch
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        get: (h) => (h.toLowerCase() === "content-type" ? "text/html; charset=utf-8" : null)
      },
      text: async () => jsonLdHtml
    });

    const res = await request(app)
      .post("/api/v1/jobs/scrape")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ url: "https://acme.example.com/careers/staff-backend-engineer" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.isStructured).toBe(true);
    expect(res.body.job.jobTitle).toBe("Staff Backend Engineer");
    expect(res.body.job.company).toBe("Acme Technologies");
    expect(res.body.job.jobType).toBe("Full-time");
    expect(res.body.job.applicationUrl).toBe("https://acme.example.com/careers/staff-backend-engineer");

    fetchSpy.mockRestore();
  });

  // Test 2: Public job page without structured metadata (HTML fallback)
  test("2. Successfully parses job requirements from semantic HTML text without JSON-LD metadata", async () => {
    const rawHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Frontend Engineer at Globex</title>
          <meta property="og:title" content="Frontend Engineer at Globex">
          <meta name="description" content="We are looking for a skilled Frontend Engineer proficient in React and Tailwind CSS.">
        </head>
        <body>
          <header><nav>Logo Navigation</nav></header>
          <main>
            <h1>Frontend Engineer</h1>
            <p>Globex Corporation is hiring a Frontend Engineer.</p>
            <h2>Required Skills</h2>
            <ul>
              <li>React</li>
              <li>JavaScript</li>
              <li>Tailwind CSS</li>
              <li>REST API</li>
            </ul>
            <h2>Primary Responsibilities</h2>
            <ul>
              <li>Develop responsive user interfaces using React and modern CSS.</li>
              <li>Collaborate with product designers to implement interactive components.</li>
            </ul>
            <h2>Qualifications</h2>
            <ul>
              <li>Strong proficiency in modern JavaScript and React.</li>
              <li>Experience building responsive web applications.</li>
            </ul>
          </main>
          <footer>Footer links</footer>
        </body>
      </html>
    `;

    const extracted = extractJobData(rawHtml, "https://globex.example.com/jobs/frontend");
    expect(extracted.extractionMethod).toBe("semantic_html");
    expect(extracted.isStructured).toBe(false);
    expect(extracted.jobTitle).toBe("Frontend Engineer");
    expect(extracted.company).toBe("Globex");
    expect(extracted.requiredSkills.length).toBeGreaterThan(0);
    expect(extracted.responsibilities.length).toBeGreaterThan(0);
    expect(extracted.qualifications.length).toBeGreaterThan(0);

    // Normalize through service
    const normalized = await analyzeAndNormalizeJob(extracted);
    expect(normalized.jobTitle).toBe("Frontend Engineer");
    expect(normalized.company).toBe("Globex");
    expect(normalized.requiredSkills.length).toBeGreaterThan(0);
  });

  // Test 3: Page that blocks automated access (403 / anti-bot challenge)
  test("3. Gracefully detects access restrictions (HTTP 403 or anti-bot shield) and returns paste fallback", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 403,
      headers: {
        get: () => "text/html"
      },
      text: async () => "<html><body>Cloudflare Ray ID: 893278912. Access Denied. Please verify you are a human.</body></html>"
    });

    const res = await request(app)
      .post("/api/v1/jobs/scrape")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ url: "https://protected-site.example.com/job-123" });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.fallbackRequired).toBe(true);
    expect(res.body.canPaste).toBe(true);
    expect(res.body.message).toMatch(/protected by a login wall|HTTP 403|paste the job description/i);

    fetchSpy.mockRestore();
  });

  // Test 4: Invalid URL format (400 Bad Request)
  test("4. Rejects malformed or non-http URLs with 400 Bad Request", async () => {
    // Malformed string
    const res1 = await request(app)
      .post("/api/v1/jobs/scrape")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ url: "ftp://not-supported.com/job" });

    expect(res1.status).toBe(400);
    expect(res1.body.message).toMatch(/Unsupported URL protocol|HTTP and HTTPS are permitted/i);

    // Completely invalid string
    const res2 = await request(app)
      .post("/api/v1/jobs/scrape")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ url: "not_a_valid_url" });

    expect(res2.status).toBe(400);
    expect(res2.body.message).toMatch(/Invalid URL format/i);
  });

  // Test 5: URL targeting localhost or private IP (SSRF protection)
  test("5. Blocks SSRF attempts targeting localhost, 127.0.0.1, RFC 1918 subnets, and metadata endpoints", async () => {
    // Localhost hostname check
    await expect(validateSafeUrl("http://localhost:3000/api/internal")).rejects.toMatchObject({
      statusCode: 403
    });

    // 127.0.0.1 loopback
    await expect(validateSafeUrl("http://127.0.0.1:8080/secrets")).rejects.toMatchObject({
      statusCode: 403
    });

    // Cloud metadata service (169.254.169.254)
    await expect(validateSafeUrl("http://169.254.169.254/latest/meta-data")).rejects.toMatchObject({
      statusCode: 403
    });

    // Private network subnet (192.168.1.1)
    await expect(validateSafeUrl("http://192.168.1.1/admin")).rejects.toMatchObject({
      statusCode: 403
    });

    // Private network subnet (10.0.0.1)
    await expect(validateSafeUrl("http://10.0.0.1/cluster")).rejects.toMatchObject({
      statusCode: 403
    });

    // Private network subnet (172.16.0.1)
    await expect(validateSafeUrl("http://172.16.0.1/portal")).rejects.toMatchObject({
      statusCode: 403
    });

    expect(isPrivateOrReservedIp("127.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("10.254.1.1")).toBe(true);
    expect(isPrivateOrReservedIp("192.168.0.10")).toBe(true);
    expect(isPrivateOrReservedIp("172.20.5.1")).toBe(true);
    expect(isPrivateOrReservedIp("169.254.1.1")).toBe(true);
    expect(isPrivateOrReservedIp("8.8.8.8")).toBe(false);

    // Endpoint test
    const res = await request(app)
      .post("/api/v1/jobs/scrape")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ url: "http://localhost:5000/admin" });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/blocked for security/i);
  });

  // Test 6: Job description with missing fields (graceful normalization)
  test("6. Gracefully handles job postings with missing fields without errors", async () => {
    const sparseJobHtml = `
      <!DOCTYPE html>
      <html>
        <body>
          <h1>Junior Developer</h1>
          <p>Looking for enthusiastic learners to join our early-stage startup.</p>
        </body>
      </html>
    `;

    const extracted = extractJobData(sparseJobHtml, "https://startup.example.com/apply");
    const normalized = await analyzeAndNormalizeJob(extracted);

    expect(normalized.jobTitle).toBeDefined();
    expect(normalized.company).toBeDefined();
    expect(Array.isArray(normalized.requiredSkills)).toBe(true);
    expect(Array.isArray(normalized.preferredSkills)).toBe(true);
    expect(Array.isArray(normalized.responsibilities)).toBe(true);
    expect(Array.isArray(normalized.qualifications)).toBe(true);
    expect(typeof normalized.jobDescription).toBe("string");
    expect(normalized.applicationUrl).toBe("https://startup.example.com/apply");

    // Endpoint match test with sparse data
    const matchRes = await request(app)
      .post("/api/v1/jobs/match")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        profileData: {
          skills: [{ name: "JavaScript" }, { name: "React" }],
          projects: []
        },
        jobRequirements: normalized
      });

    expect(matchRes.status).toBe(200);
    expect(matchRes.body.success).toBe(true);
    expect(typeof matchRes.body.matchAnalysis.matchScore).toBe("number");
    expect(Array.isArray(matchRes.body.matchAnalysis.suggestions)).toBe(true);
  });

  // Test 7: Resume tailoring using scraped requirements and verified user data
  test("7. Generates tailored resume strictly grounded in candidate's confirmed facts without hallucination", async () => {
    // Verified user profile mock
    const profileData = {
      userId,
      personalInfo: {
        fullName: "Devon Vance",
        email: "devon@example.com",
        phone: "+1 (555) 234-5678",
        location: "Seattle, WA",
        linkedin: "https://linkedin.com/in/devonvance",
        github: "https://github.com/devonvance",
        portfolio: "https://devonvance.dev"
      },
      targetRole: "Full Stack Engineer",
      professionalSummary: "Engineer specialized in React, TypeScript, and Node.js microservices.",
      education: [
        {
          degree: "Bachelor of Science",
          fieldOfStudy: "Computer Science",
          institution: "University of Washington",
          location: "Seattle, WA",
          startDate: "2020",
          endDate: "2024",
          gpa: "3.85"
        }
      ],
      skills: [
        { name: "TypeScript", category: "languages", level: 90 },
        { name: "Node.js", category: "frameworks", level: 85 },
        { name: "PostgreSQL", category: "tools", level: 80 },
        { name: "Docker", category: "tools", level: 75 }
      ],
      projects: [
        {
          title: "CloudVault Storage",
          description: "High-performance encrypted distributed object storage system.",
          techStack: ["TypeScript", "Node.js", "PostgreSQL", "Docker"],
          bulletPoints: [
            "Architected scalable microservices processing 10,000 files per second.",
            "Integrated AES-256 GCM encryption at rest with automated key rotation."
          ],
          githubUrl: "https://github.com/devonvance/cloudvault"
        }
      ],
      experience: [],
      certifications: [],
      achievements: [
        {
          title: "Hackathon Finalist",
          issuer: "PacWest Hackathon",
          description: "Built real-time collaborative code review editor."
        }
      ],
      lastConfirmedAt: new Date()
    };

    if (mongoose.connection.readyState === 1) {
      await ResumeProfile.create(profileData);
    }

    const scrapedJobRequirements = {
      jobTitle: "Senior Backend Developer",
      company: "Stripe",
      location: "Seattle / Remote",
      jobType: "Full-time",
      requiredSkills: ["TypeScript", "Node.js", "PostgreSQL", "Docker"],
      preferredSkills: ["Kubernetes", "AWS"],
      responsibilities: ["Scale core distributed transaction processing systems."],
      qualifications: ["3+ years experience with high-throughput backend services."]
    };

    // Run tailoring via service with profileOverride for pure unit isolation
    const tailoringResult = await tailorResumeToJob(userId, {
      jobRequirements: scrapedJobRequirements,
      profileOverride: profileData,
      template: "modern",
      preferredLength: "1_page"
    });

    expect(tailoringResult.success).toBe(true);
    expect(tailoringResult.tailoredResume).toBeDefined();

    // Verify candidate factual grounding: strictly candidate's identity, never fictional
    expect(tailoringResult.tailoredResume.personalInfo.fullName).toBe("Devon Vance");
    expect(tailoringResult.tailoredResume.personalInfo.email).toBe("devon@example.com");
    expect(tailoringResult.tailoredResume.education[0].institution).toBe("University of Washington");
    expect(tailoringResult.tailoredResume.projects[0].title).toBe("CloudVault Storage");

    // Verify match feedback
    expect(tailoringResult.matchAnalysis.matchedSkills.length).toBeGreaterThan(0);
    expect(tailoringResult.matchAnalysis.matchScore).toBeGreaterThanOrEqual(70);

    // Endpoint test
    const endpointRes = await request(app)
      .post("/api/v1/jobs/tailor")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        jobRequirements: scrapedJobRequirements,
        profileOverride: profileData,
        template: "modern"
      });

    expect(endpointRes.status).toBe(200);
    expect(endpointRes.body.success).toBe(true);
    expect(endpointRes.body.tailoredResume.personalInfo.fullName).toBe("Devon Vance");
  });
});
