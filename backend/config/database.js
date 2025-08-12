const mongoose = require("mongoose");

async function connectDB() {
  try {
    // console.log("hii")
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 60000,
      maxPoolSize: 10,
      connectTimeoutMS: 10000,
    });

    console.log("✅ Database connected successfully");
  } catch (err) {
    console.error("❌ Database connection error:", err);
    process.exit(1); // Exit if initial DB connection fails
  }
}

module.exports = connectDB;
