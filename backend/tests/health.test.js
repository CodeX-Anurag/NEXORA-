const request = require("supertest");
const app = require("../src/app");

describe("GET /api/v1/health", () => {
  test("should return 200 OK with health status JSON", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "NEXORA API is healthy",
      service: "nexora-api"
    });
  });

  test("should return 404 for unknown endpoints", async () => {
    const response = await request(app).get("/api/v1/unknown");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Resource not found");
  });
});
