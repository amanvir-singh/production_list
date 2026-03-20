const mongoose = require("mongoose");

const TLFPendingOutfeedSchema = new mongoose.Schema({
  boardCode: String,
  qty: Number,
  updatedAt: Date,
});

module.exports = TLFPendingOutfeedSchema;
