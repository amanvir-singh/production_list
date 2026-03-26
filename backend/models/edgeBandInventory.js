const mongoose = require("mongoose");

const edgeBandInventorySchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
    },
    height: {
      type: String,
      required: true,
    },
    thickness: {
      type: String,
      required: true,
    },
    
    uniqueCode: {
      type: String,
      required: true,
      unique: true,
    },
    
    locations: [
      {
        position: {
          type: String,
          required: true,
        },
        qty: {
          type: Number,
          required: true,
          min: 0,
          default: 0,
        },
      },
    ],
    
    totalQty: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

edgeBandInventorySchema.index({ uniqueCode: 1 }, { unique: true });

module.exports = edgeBandInventorySchema;
