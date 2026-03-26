const mongoose = require("mongoose");

const edgeBandHeightSchema = new mongoose.Schema({
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

module.exports = edgeBandHeightSchema;
