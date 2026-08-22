const mongoose = require("mongoose");
const { MONGODB_URI } = require("./env");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB (${error.message}). API server starting in non-DB mode.`);
    return null;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("[MongoDB] Disconnected successfully");
  } catch (error) {
    console.error(`[MongoDB] Disconnect error: ${error.message}`);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
