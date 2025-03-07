const mongoose = require("mongoose");

const TLFInventoryFixerSchema = new mongoose.Schema({
  BoardCode: { type: String, required: true },
  QtytoFix: { type: Number, required: true },
});

module.exports = TLFInventoryFixerSchema;
