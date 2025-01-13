const mongoose = require('mongoose');

const jobStatusIndicatorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  color: {
    type: String,
    required: true,
  },
});

module.exports = jobStatusIndicatorSchema;
