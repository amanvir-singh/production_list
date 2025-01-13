const mongoose = require('mongoose');

const materialEntrySchema = new mongoose.Schema({
  material: String,
  customMaterial: String,
  quantitySaw: Number,
  quantityCNC: Number
});

const productionListSchema = new mongoose.Schema({
  jobName: { type: String, required: true },
  cutlistName: { type: String, required: true },
  materials: [materialEntrySchema],
  stockStatus: { type: String },
  jobStatus: { type: String },
  priority: Number,
  note: String,
  archived: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = productionListSchema;
