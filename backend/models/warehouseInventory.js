const mongoose = require("mongoose");

const warehouseInventorySchema = new mongoose.Schema({
  supplier: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  finish: {
    type: String,
    required: true,
  },
  thickness: {
    type: String,
    required: true,
  },
  format: {
    type: String,
    required: true,
  },
  aggregationKey: {
    type: String,
  },
  boardCode: {
    type: String,
    required: true,
    unique: true,
  },
  warehouseQty: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  tlfQty: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  onHandQty: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  reservedQty: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  availableQty: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  onOrderQty: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  projectedQty: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = warehouseInventorySchema;
