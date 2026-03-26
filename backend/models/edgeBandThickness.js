const mongoose = require("mongoose");

const edgeBandThicknessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
});

module.exports = edgeBandThicknessSchema;
