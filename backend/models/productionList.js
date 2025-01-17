const mongoose = require('mongoose');

const materialEntrySchema = new mongoose.Schema({
  material: String,
  customMaterial: String,
  quantitySaw: Number,
  quantityCNC: Number,
  stockStatus: { type: String },
  jobStatus: { type: String }
});

const productionListSchema = new mongoose.Schema({
  jobName: { type: String, required: true },
  cutlistName: { type: String, required: true },
  materials: [materialEntrySchema],
  priority: Number,
  note: String,
  archived: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = productionListSchema;
