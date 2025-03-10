const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "Editor", "Manager", "Inventory Associate", "Reader", "Not Assigned"],
      default: "Reader",
    },
});
  

module.exports = userSchema;