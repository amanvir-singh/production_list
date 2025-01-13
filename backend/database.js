const mongoose = require("mongoose");
require("dotenv").config();
const { initializeModels } = require("./createModels.js");

// Connect to MongoDB
async function connectDB() {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("Connected to MongoDB");
    } catch (err) {
      console.error("MongoDB connection error:", err);
      process.exit(1); // Exit the process with failure
    }
};

async function main() {
    await connectDB(); // Wait for MongoDB connection
    const { User, Material, Supplier, Finish, Thickness, Log } = initializeModels();
}



module.exports = main;