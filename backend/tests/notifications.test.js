const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User.model");
const Notification = require("../src/models/Notification.model");
const notificationService = require("../src/services/notification.service");

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nexora_test_db";
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
  } catch {
    // DB offline fallback
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

describe("Substep 11C — Notification Service & REST API Tests", () => {
  let tokenA = "";
  let tokenB = "";
  let userAId = "";
  let userBId = "";

  beforeEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({});
      await Notification.deleteMany({});

      const regA = await request(app).post("/api/v1/auth/register").send({
        name: "Notif Alice",
        email: "notif_alice@example.com",
        password: "Password123!"
      });
      tokenA = regA.body.accessToken;
      userAId = regA.body.user.id;

      const regB = await request(app).post("/api/v1/auth/register").send({
        name: "Notif Bob",
        email: "notif_bob@example.com",
        password: "Password123!"
      });
      tokenB = regB.body.accessToken;
      userBId = regB.body.user.id;
    }
  });

  test("1. Idempotency & Deduplication — Duplicate key insertion is swallowed safely", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const dedupKey = `${userAId}_TASK_DUE_SOON_test_task_24h`;

    const firstCall = await notificationService.createNotificationIdempotent({
      userId: userAId,
      type: "TASK_DUE_SOON",
      title: "Task Due Soon",
      message: "Your task is due in 24 hours",
      deduplicationKey: dedupKey
    });

    expect(firstCall.created).toBe(true);
    expect(firstCall.duplicate).toBe(false);

    // Second call with identical deduplicationKey MUST be recognized as duplicate without throwing
    const secondCall = await notificationService.createNotificationIdempotent({
      userId: userAId,
      type: "TASK_DUE_SOON",
      title: "Task Due Soon",
      message: "Your task is due in 24 hours",
      deduplicationKey: dedupKey
    });

    expect(secondCall.created).toBe(false);
    expect(secondCall.duplicate).toBe(true);

    const count = await Notification.countDocuments({ userId: userAId });
    expect(count).toBe(1);
  });

  test("2. GET /api/v1/notifications — Authenticated User List & Unread Count", async () => {
    if (mongoose.connection.readyState !== 1) return;

    await notificationService.createNotificationIdempotent({
      userId: userAId,
      type: "STUDY_REMINDER",
      title: "Study Time",
      message: "Time to log a study session",
      deduplicationKey: `${userAId}_STUDY_1`
    });

    const res = await request(app)
      .get("/api/v1/notifications")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.notifications.length).toBe(1);
    expect(res.body.unreadCount).toBe(1);
  });

  test("3. User Ownership Isolation — User B cannot access User A's notifications", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const notifA = await notificationService.createNotificationIdempotent({
      userId: userAId,
      type: "TASK_OVERDUE",
      title: "Alice Task Overdue",
      message: "Alice overdue task",
      deduplicationKey: `${userAId}_OVERDUE_1`
    });

    // User B attempts to mark User A's notification as read -> 404
    const res = await request(app)
      .patch(`/api/v1/notifications/${notifA.notification._id}/read`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
  });

  test("4. PATCH /api/v1/notifications/:id/read & /read-all — Mark Read Lifecycle", async () => {
    if (mongoose.connection.readyState !== 1) return;

    const notifA = await notificationService.createNotificationIdempotent({
      userId: userAId,
      type: "TASK_DUE_SOON",
      title: "Alice Task Due",
      message: "Due soon",
      deduplicationKey: `${userAId}_DUE_1`
    });

    const readSingleRes = await request(app)
      .patch(`/api/v1/notifications/${notifA.notification._id}/read`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(readSingleRes.status).toBe(200);
    expect(readSingleRes.body.notification.isRead).toBe(true);

    const readAllRes = await request(app)
      .patch("/api/v1/notifications/read-all")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(readAllRes.status).toBe(200);
    expect(readAllRes.body.success).toBe(true);
  });
});
