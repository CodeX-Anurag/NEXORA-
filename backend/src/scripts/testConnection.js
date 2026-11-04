const dns = require("node:dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

// Load .env from backend directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const uri = process.env.MONGODB_URI;

async function checkConnection() {
  console.log("=========================================");
  console.log("  NEXORA MongoDB Connection Diagnostics  ");
  console.log("=========================================\n");

  if (!uri) {
    console.error("❌ MONGODB_URI is not set in backend/.env!");
    process.exit(1);
  }

  // Mask credentials for display
  const maskedUri = uri.replace(/\/\/(.*):(.*)@/, "//$1:******@");
  console.log(`Attempting to connect to: ${maskedUri}`);

  const isCloud = uri.includes("mongodb+srv") || (!uri.includes("127.0.0.1") && !uri.includes("localhost"));
  const timeoutMs = isCloud ? 12000 : 3000;

  try {
    const start = Date.now();
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: timeoutMs
    });
    const latency = Date.now() - start;

    console.log("\n✅ Connection SUCCESSFUL!");
    console.log(`   Host:     ${conn.connection.host}`);
    console.log(`   Port:     ${conn.connection.port || "Default"}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   Latency:  ${latency}ms`);
    console.log(`   Mode:     ${isCloud ? "Cloud / Atlas Cluster" : "Local MongoDB"}`);

    // Test a lightweight ping command
    const admin = conn.connection.db.admin();
    const pingResult = await admin.ping();
    console.log("   Ping:    ", pingResult);

    console.log("\n🎉 Your MongoDB database is fully connected and ready to persist data.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Connection FAILED!");
    console.error(`   Error: ${err.message}\n`);

    if (err.message.includes("bad auth") || err.message.includes("Authentication failed")) {
      console.log("💡 Tip: Check your username and password in MONGODB_URI.");
      console.log("   If your password has special characters (@, :, /, #), they must be URL-encoded.");
    } else if (err.message.includes("querySrv ENOTFOUND") || err.message.includes("ETIMEDOUT") || err.message.includes("serverSelectionTimeoutMS")) {
      console.log("💡 Tip: Check your internet connection and MongoDB Atlas IP Access List.");
      console.log("   In MongoDB Atlas -> Network Access -> Add IP Address -> Allow Access from Anywhere (0.0.0.0/0).");
    } else if (err.message.includes("ECONNREFUSED") || err.message.includes("EACCES")) {
      console.log("💡 Tip: Local MongoDB is not running on 127.0.0.1:27017.");
      console.log("   Option A (Recommended): Use a free MongoDB Atlas cloud database.");
      console.log("   Option B: Start your local MongoDB service / MongoDB Compass.");
    }

    process.exit(1);
  }
}

checkConnection();
