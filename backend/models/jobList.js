const mongoose = require("mongoose");
const { Decimal128 } = mongoose.Types;

const partlistSchema = new mongoose.Schema({
  partname: String,
  material: String,
  length: { type: Decimal128, required: true },
  width: { type: Decimal128, required: true },
  quantity: Number,
  grain: String,
  jobName1: { type: String, required: true },
  EL: { type: String },
  ER: { type: String },
  ET: { type: String },
  EB: { type: String },
  partcomment: { type: String },
  itemnumber: { type: String },
});

const jobListSchema = new mongoose.Schema(
  {
    jobName: { type: String, required: true },
    CreatedBy: { type: String },
    Addedto: { type: String },
    Addedby: { type: String },
    partlist: [partlistSchema],
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = jobListSchema;
