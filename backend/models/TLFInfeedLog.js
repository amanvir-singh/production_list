const mongoose = require("mongoose");

const TLFInfeedLogSchema = new mongoose.Schema({
  bewegungRowId: { type: Number, unique: true }, // ID from dbo.Bewegungen (for dedup)
  boardCode: String,
  fromPosition: Number,
  toPosition: Number,
  quantity: { type: Number, default: 1 },
  eventTime: Date,
  processedAt: Date,
});

module.exports = TLFInfeedLogSchema;
