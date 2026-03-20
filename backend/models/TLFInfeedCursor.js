const mongoose = require("mongoose");

const TLFInfeedCursorSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: "bewegungCursor",
    immutable: true,
  },
  lastProcessedId: Number,
  lastProcessedAt: Date,
});

module.exports = TLFInfeedCursorSchema;
