const mongoose = require("mongoose");

const TLFPendingOutfeedSchema = new mongoose.Schema({
  boardCode: String,
  qty: Number,
  stableCount: { type: Number, default: 0 }, // syncs this debt has sat unchanged
  updatedAt: Date,
});

module.exports = TLFPendingOutfeedSchema;
