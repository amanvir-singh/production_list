const mongoose = require("mongoose");

const TLFOutfeedCursorSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: "auslagerCursor",
    immutable: true,
  },
  lastProcessedId: Number,
  lastProcessedAt: Date,
});

module.exports = TLFOutfeedCursorSchema;
