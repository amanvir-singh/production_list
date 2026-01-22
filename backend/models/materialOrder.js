const mongoose = require("mongoose");

const materialOrderSchema = new mongoose.Schema(
  {
    boardCode: {
      type: String,
      required: true,
    },
    code:{
        type: String,
        required: true,
    },
    supplier: {
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
    orderedQty: {
      type: Number,
      required: true,
      min: 0,
    },
    anticipatedDate: {
      type: Date,
    },
    receivedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    receivedDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["To Order", "On Order", "Received", "Cancelled"],
      default: "To Order",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = materialOrderSchema;
