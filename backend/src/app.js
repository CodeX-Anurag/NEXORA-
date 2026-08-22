const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { CLIENT_URL, NODE_ENV } = require("./config/env");
const { apiLimiter, aiLimiter } = require("./middleware/rateLimiter.middleware");
const requestLogger = require("./middleware/requestLogger.middleware");
const notFoundHandler = require("./middleware/notFound.middleware");
const errorHandler = require("./middleware/error.middleware");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const taskRoutes = require("./routes/task.routes");
const studyRoutes = require("./routes/study.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const skillRoutes = require("./routes/skill.routes");
const careerRoutes = require("./routes/career.routes");
const projectRoutes = require("./routes/project.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const aiRoutes = require("./routes/ai.routes");
const conversationRoutes = require("./routes/conversation.routes");
const memoryRoutes = require("./routes/memory.routes");
const notificationRoutes = require("./routes/notification.routes");
const resumeRoutes = require("./routes/resume.routes");

const app = express();

// Substep 12D — Enable Trust Proxy for Render / Cloud HTTPS proxies
app.set("trust proxy", 1);

// 1. HTTP Security Headers (Helmet with Substep 12D Production HSTS)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Allow API response flexibility without breaking frontend assets
    hsts: NODE_ENV === "production" ? { maxAge: 31536000, includeSubDomains: true } : false
  })
);

// 2. Request Body Size Limits (1MB JSON Limit)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// 3. CORS Configuration (Scoped to CLIENT_URL with credentials support)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (Postman, curl, internal node) or matching CLIENT_URL
      if (!origin || origin === CLIENT_URL) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy violation: Access from this origin is prohibited."));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(requestLogger);

// 4. Public Health Route
// Must be available before API rate limiting for Render health checks.
app.use("/api/v1/health", healthRoutes);

// 5. Rate Limiting Middleware
app.use("/api/v1", apiLimiter);
app.use("/api/v1/ai", aiLimiter);

// 6. Versioned API Routes (/api/v1)
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/study", studyRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/skills", skillRoutes);
app.use("/api/v1/careers", careerRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/analytics", analyticsRoutes);

// Phase 5 & 8 AI Routes
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/conversations", conversationRoutes);

// Phase 6 Memory Routes
app.use("/api/v1/memories", memoryRoutes);
app.use("/api/v1/memory", memoryRoutes);

// Phase 11 Notifications Route
app.use("/api/v1/notifications", notificationRoutes);

// Phase 12 Resume & Portfolio Route
app.use("/api/v1/resume", resumeRoutes);

// Fallback Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
