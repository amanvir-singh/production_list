const mongoose = require("mongoose");

const TLFOutfeedLogSchema = new mongoose.Schema({
  auslagerId: Number,
  auslagerRowId: Number, // AuslagerReport.ID
  boardCode: String,
  platzNr: Number, // 101/102/1/2
  dest: {
    type: String,
    enum: ["SAW", "CNC", "OUTFEED 1", "OUTFEED 2"],
    required: true,
  },
  jobName: String,
  plan: String,
  quantity: Number,
  source: {
    type: String,
    enum: ["TLF_STORAGE", "WAREHOUSE", "UNKNOWN"],
  },
  processedAt: Date,
  eventTime: Date,
});

module.exports = TLFOutfeedLogSchema;
