const dns = require("dns");
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const app = require("./app");
const { PORT } = require("./config/env");
const { connectDB, disconnectDB } = require("./config/db");
const mongoose = require("mongoose");
const jobScheduler = require("./services/jobScheduler.service");

let server;

const startServer = async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      console.log(`[Server] NEXORA API backend running on port ${PORT}`);
      // Start in-process background job scheduler in non-test mode
      if (process.env.NODE_ENV !== "test") {
        jobScheduler.startScheduler();
        console.log("[Server] Background job scheduler initialized.");
      }
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `\n[Server Error] Port ${PORT} is already in use by another running instance of NEXORA.\n` +
          `Please close the other terminal running 'npm run dev' or free port ${PORT}.\n`
        );
      } else {
        console.error(`[Server Error] ${error.message}`);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error(`[Server] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  console.log(`[Server] Received ${signal}. Starting graceful shutdown...`);
  // Stop background timer scheduler cleanly
  jobScheduler.stopScheduler();

  if (server) {
    server.close(async () => {
      console.log("[Server] HTTP server closed.");
      try {
        await disconnectDB();
        console.log("[Server] Database connection closed.");
        process.exit(0);
      } catch (err) {
        console.error(`[Server] Error during database disconnect: ${err.message}`);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer();
