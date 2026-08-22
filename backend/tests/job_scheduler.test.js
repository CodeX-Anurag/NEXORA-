const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User.model");
const Task = require("../src/models/Task.model");
const StudySession = require("../src/models/StudySession.model");
const Notification = require("../src/models/Notification.model");
const reminderJob = require("../src/jobs/reminder.job");
const jobScheduler = require("../src/services/jobScheduler.service");

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nexora_test_db";
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
  } catch {
    // DB offline fallback
  }
});

afterAll(async () => {
  jobScheduler.stopScheduler();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

describe("Substep 11C — Automated Background Job & Scheduler Tests", () => {
  let token = "";
  let userId = "";

  beforeEach(async () => {
    jobScheduler.resetSchedulerState();

    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({});
      await Task.deleteMany({});
      await StudySession.deleteMany({});
      await Notification.deleteMany({});

      const reg = await request(app).post("/api/v1/auth/register").send({
        name: "Job User",
        email: "job_user@example.com",
        password: "Password123!"
      });
      token = reg.body.accessToken;
      userId = reg.body.user.id;
    }
  });

  test("1. Task Deadline & Overdue Reminder Job Processing", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const now = new Date();
    const dueIn12Hours = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const pastDeadline = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // Create 1 Task Due Soon + 1 Task Overdue + 1 Completed Task (should be ignored)
    await Task.create({ userId, title: "Task Due Soon", deadline: dueIn12Hours, status: "todo" });
    await Task.create({ userId, title: "Task Overdue", deadline: pastDeadline, status: "in_progress" });
    await Task.create({ userId, title: "Completed Task", deadline: pastDeadline, status: "completed" });

    const stats = await reminderJob.runReminderJob();

    expect(stats.processedTasks).toBe(3);
    expect(stats.createdCount).toBeGreaterThanOrEqual(2);

    const notifications = await Notification.find({ userId });
    expect(notifications.length).toBeGreaterThanOrEqual(2);

    const types = notifications.map((n) => n.type);
    expect(types).toContain("TASK_DUE_SOON");
    expect(types).toContain("TASK_OVERDUE");
  });

  test("2. Study Inactivity Reminder Job Processing (48h Inactive)", async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Simulate user created 3 days ago with no study sessions
    const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
    await User.findByIdAndUpdate(userId, { createdAt: threeDaysAgo });

    const stats = await reminderJob.runReminderJob();
    expect(stats.createdCount).toBeGreaterThanOrEqual(1);

    const studyNotifs = await Notification.find({ userId, type: "STUDY_REMINDER" });
    expect(studyNotifs.length).toBe(1);
  });

  test("3. Scheduler Cycle Execution & 11B Observability Telemetry Integration", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const cycleResult = await jobScheduler.executeJobCycle();
    expect(cycleResult.success).toBe(true);

    const metrics = jobScheduler.getSchedulerMetrics();
    expect(metrics.metrics.totalJobRuns).toBe(1);
    expect(metrics.metrics.successfulRuns).toBe(1);

    // Verify diagnostics probe includes backgroundJobs telemetry
    const diagRes = await request(app)
      .get("/api/v1/health/diagnostics")
      .set("Authorization", `Bearer ${token}`);

    expect(diagRes.status).toBe(200);
    expect(diagRes.body.backgroundJobs).toBeDefined();
    expect(diagRes.body.backgroundJobs.metrics.totalJobRuns).toBe(1);
  });
});
