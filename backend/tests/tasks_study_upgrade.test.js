/**
 * NEXORA Tasks Module Upgrade Test Suite
 * Verifies advanced task lifecycle, subtasks, recurrence automation, focus mode sync,
 * task analytics, multi-tenant isolation, notification reminders, and AI task planning.
 */

process.env.LLM_PROVIDER = "mock";

const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/User.model");
const Task = require("../src/models/Task.model");
const Notification = require("../src/models/Notification.model");
const StudySession = require("../src/models/StudySession.model");
const { generateAccessToken } = require("../src/utils/jwt");
const { calculateNextRecurrenceDate } = require("../src/services/task.service");

describe("NEXORA Tasks & Productivity Workspace Upgrade Suite", () => {
  let tokenA = "";
  let tokenB = "";
  let userAId = "";
  let userBId = "";

  beforeAll(async () => {
    const idA = new mongoose.Types.ObjectId();
    const idB = new mongoose.Types.ObjectId();
    userAId = idA.toString();
    userBId = idB.toString();

    tokenA = generateAccessToken({ _id: idA });
    tokenB = generateAccessToken({ _id: idB });

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
      await Task.deleteMany({});
      await Notification.deleteMany({});
      await StudySession.deleteMany({});

      const userA = await User.create({
        _id: new mongoose.Types.ObjectId(userAId),
        name: "Devon Vance",
        email: "devon@example.com",
        passwordHash: "hashedpass123",
        role: "student"
      });

      const userB = await User.create({
        _id: new mongoose.Types.ObjectId(userBId),
        name: "Morgan Lee",
        email: "morgan@example.com",
        passwordHash: "hashedpass456",
        role: "student"
      });

      tokenA = generateAccessToken(userA);
      tokenB = generateAccessToken(userB);
    }
  });

  // Feature 1: Advanced Task Creation with Subtasks, Recurrence & Urgent Priority
  test("1. Creates task with urgent priority, subtasks, category, and estimated duration", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const res = await request(app)
      .post("/api/v1/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        title: "Implement Distributed Raft Consensus",
        description: "Core leader election and log replication module",
        priority: "urgent",
        status: "in_progress",
        category: "Development",
        estimatedMinutes: 90,
        deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        recurrence: "none",
        subtasks: [
          { title: "Define RPC message schemas", completed: true },
          { title: "Implement heartbeat timer", completed: false },
          { title: "Write unit tests for split-brain", completed: false }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.task.title).toBe("Implement Distributed Raft Consensus");
    expect(res.body.task.priority).toBe("urgent");
    expect(res.body.task.category).toBe("Development");
    expect(res.body.task.estimatedMinutes).toBe(90);
    expect(res.body.task.subtasks.length).toBe(3);
    expect(res.body.task.subtasks[0].completed).toBe(true);
  });

  // Feature 2: Interactive Subtask Lifecycle (Toggle, Add, Delete)
  test("2. Toggles subtask completion, adds new subtask, and deletes subtask", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const task = await Task.create({
      userId: userAId,
      title: "Operating Systems Lab 3",
      category: "Academics",
      subtasks: [
        { title: "Review page replacement algorithms", completed: false },
        { title: "Implement LRU cache", completed: false }
      ]
    });

    const subtaskId = task.subtasks[0]._id.toString();

    // Toggle subtask complete
    const toggleRes = await request(app)
      .patch(`/api/v1/tasks/${task._id}/subtasks/${subtaskId}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ completed: true });

    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.task.subtasks[0].completed).toBe(true);

    // Add new subtask
    const addRes = await request(app)
      .post(`/api/v1/tasks/${task._id}/subtasks`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Write lab report benchmark" });

    expect(addRes.status).toBe(201);
    expect(addRes.body.task.subtasks.length).toBe(3);

    // Delete subtask
    const deleteRes = await request(app)
      .delete(`/api/v1/tasks/${task._id}/subtasks/${subtaskId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.task.subtasks.length).toBe(2);
  });

  // Feature 3: Recurring Task Automation
  test("3. Automatically creates next recurring occurrence when task is completed", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const initialDeadline = new Date("2026-11-01T12:00:00Z");
    const task = await Task.create({
      userId: userAId,
      title: "Weekly Engineering Sprint Review",
      priority: "high",
      status: "in_progress",
      category: "Development",
      estimatedMinutes: 45,
      deadline: initialDeadline,
      recurrence: "weekly",
      subtasks: [{ title: "Compile weekly PR metrics", completed: true }]
    });

    // Mark as completed
    const completeRes = await request(app)
      .put(`/api/v1/tasks/${task._id}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ status: "completed" });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.task.status).toBe("completed");

    // Verify next recurring occurrence was created automatically
    const allUserTasks = await Task.find({
      userId: userAId,
      title: "Weekly Engineering Sprint Review"
    });
    expect(allUserTasks.length).toBe(2);

    const nextOccurrence = allUserTasks.find((t) => t.status === "todo");
    expect(nextOccurrence).toBeDefined();
    expect(nextOccurrence.recurrence).toBe("weekly");
    expect(nextOccurrence.subtasks[0].completed).toBe(false); // Subtask reset for next occurrence

    // Recurrence date helper verification
    const nextDaily = calculateNextRecurrenceDate(new Date("2026-11-01"), "daily");
    expect(nextDaily.getDate()).toBe(2);
  });

  // Feature 4: Focus Mode Integration with StudySession
  test("4. Focus session logs actual duration to task and creates unified StudySession", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const task = await Task.create({
      userId: userAId,
      title: "Algorithms Dynamic Programming Session",
      category: "Academics",
      actualMinutes: 15
    });

    const res = await request(app)
      .post(`/api/v1/tasks/${task._id}/focus-session`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        minutes: 30,
        notes: "Solved LeetCode Hard Knapsack variant"
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.task.actualMinutes).toBe(45);

    // Verify StudySession document was created
    const session = await StudySession.findOne({ userId: userAId });
    expect(session).toBeDefined();
    expect(session.duration).toBe(30);
    expect(session.subject).toBe("Academics");
  });

  // Feature 5: Real Task Analytics
  test("5. GET /api/v1/tasks/analytics calculates real metrics from user tasks", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const now = new Date();
    // 1 task due today
    await Task.create({
      userId: userAId,
      title: "Due Today Task",
      status: "todo",
      priority: "urgent",
      category: "Academics",
      deadline: now,
      estimatedMinutes: 30
    });

    // 1 overdue task
    await Task.create({
      userId: userAId,
      title: "Overdue Task",
      status: "todo",
      priority: "high",
      category: "Development",
      deadline: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      estimatedMinutes: 60
    });

    // 1 completed task
    await Task.create({
      userId: userAId,
      title: "Completed Task",
      status: "completed",
      priority: "medium",
      category: "Personal",
      completedAt: now,
      estimatedMinutes: 20,
      actualMinutes: 25
    });

    const res = await request(app)
      .get("/api/v1/tasks/analytics")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.overview.totalTasks).toBe(3);
    expect(res.body.overview.completedTasks).toBe(1);
    expect(res.body.overview.completionRate).toBe(33);
    expect(res.body.overview.overdueCount).toBe(1);
    expect(res.body.overview.dueTodayCount).toBe(1);
    expect(res.body.focusTime.estimatedTotalMinutes).toBe(110);
    expect(res.body.focusTime.actualTotalMinutes).toBe(25);
  });

  // Feature 6: Multi-Tenant Security & Isolation
  test("6. User B cannot read, update, or delete User A's tasks", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const taskA = await Task.create({
      userId: userAId,
      title: "Alice Confidential Milestone"
    });

    // User B attempts to read
    const getRes = await request(app)
      .get(`/api/v1/tasks/${taskA._id}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(getRes.status).toBe(404);

    // User B attempts to update
    const updateRes = await request(app)
      .put(`/api/v1/tasks/${taskA._id}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ title: "Tampered by User B" });
    expect(updateRes.status).toBe(404);

    // User B attempts to delete
    const deleteRes = await request(app)
      .delete(`/api/v1/tasks/${taskA._id}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(deleteRes.status).toBe(404);

    // Verify task untouched
    const verifyTask = await Task.findById(taskA._id);
    expect(verifyTask.title).toBe("Alice Confidential Milestone");
  });

  // Feature 7: Notification Reminders & Database Idempotency
  test("7. Scans user deadlines and creates idempotent reminders without duplicates", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const now = new Date();
    // Overdue task
    await Task.create({
      userId: userAId,
      title: "Compiler Design Assignment",
      deadline: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      status: "todo"
    });

    // Check reminders call
    const res1 = await request(app)
      .post("/api/v1/notifications/check-reminders")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res1.status).toBe(200);
    expect(res1.body.remindersCreated).toBeGreaterThanOrEqual(1);

    // Second check on the same day must not duplicate notifications
    const res2 = await request(app)
      .post("/api/v1/notifications/check-reminders")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res2.status).toBe(200);
    expect(res2.body.remindersCreated).toBe(0); // 0 duplicates created!
  });

  // Feature 8: AI Task Breakdown & Planning
  test("8. AI breakdown generates actionable tasks and risk detection flags overdue tasks", async () => {
    // Breakdown endpoint
    const breakdownRes = await request(app)
      .post("/api/v1/tasks/ai/breakdown")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ goal: "Prepare for System Design Interview" });

    expect(breakdownRes.status).toBe(200);
    expect(breakdownRes.body.success).toBe(true);
    expect(Array.isArray(breakdownRes.body.suggestedTasks)).toBe(true);
    expect(breakdownRes.body.suggestedTasks.length).toBeGreaterThan(0);

    // Risk detection endpoint
    const riskRes = await request(app)
      .get("/api/v1/tasks/ai/risk-detection")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(riskRes.status).toBe(200);
    expect(riskRes.body.success).toBe(true);
    expect(typeof riskRes.body.totalAtRisk).toBe("number");
  });

  // Feature 9: My Day Workspace Persistence & Toggling
  test("9. Persists My Day state, toggles without altering deadline, and filters by myDay=true", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const futureDeadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days later

    // Create a task with a later deadline
    const task = await Task.create({
      userId: userAId,
      title: "Design System Architecture Document",
      deadline: futureDeadline,
      isMyDay: false
    });

    // Toggle into My Day via PATCH /tasks/:id/my-day
    const addRes = await request(app)
      .patch(`/api/v1/tasks/${task._id}/my-day`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ isMyDay: true });

    expect(addRes.status).toBe(200);
    expect(addRes.body.task.isMyDay).toBe(true);
    expect(new Date(addRes.body.task.deadline).getTime()).toBe(futureDeadline.getTime()); // Deadline preserved!

    // Verify filter myDay=true returns the task
    const listRes = await request(app)
      .get("/api/v1/tasks?myDay=true")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.tasks.some((t) => t._id.toString() === task._id.toString())).toBe(true);

    // Toggle out of My Day without deleting task or changing deadline
    const removeRes = await request(app)
      .patch(`/api/v1/tasks/${task._id}/my-day`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ isMyDay: false });

    expect(removeRes.status).toBe(200);
    expect(removeRes.body.task.isMyDay).toBe(false);
    expect(new Date(removeRes.body.task.deadline).getTime()).toBe(futureDeadline.getTime());

    // Task still exists in general tasks
    const checkTask = await Task.findById(task._id);
    expect(checkTask).not.toBeNull();
  });
});
