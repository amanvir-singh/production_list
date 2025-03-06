const mongoose = require("mongoose");
const { Decimal128 } = mongoose.Types;

const boardSchema = new mongoose.Schema({
  ID: { type: Number, required: true },
  BoardCode: { type: String, required: true },
  Length: { type: Decimal128, required: true },
  Width: { type: Decimal128, required: true },
  Thickness: { type: Decimal128, required: true },
  Infeeds: { type: Number, required: true },
  Outfeeds: { type: Number, required: true },
  TotalQty: { type: Number, required: true }, // Calculated as Infeeds - Outfeeds
});

const TLFInventorySchema = new mongoose.Schema({
  FetchedAt: { type: Date, default: Date.now },
  boards: [boardSchema],
});

module.exports = TLFInventorySchema;
