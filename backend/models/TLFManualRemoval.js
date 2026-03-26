const mongoose = require("mongoose");

const TLFManualRemovalSchema = new mongoose.Schema({
  boardCode: String,
  qty: Number,
  detectedAt: Date,
  staleSyncs: Number, // how many consecutive syncs the debt sat unresolved
  note: { type: String, default: "Debt unresolved after N syncs, presumed manual removal" },
});

module.exports = TLFManualRemovalSchema;
