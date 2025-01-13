const mongoose = require('mongoose');

const stockStatusIndicatorSchema = new mongoose.Schema({
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

module.exports = stockStatusIndicatorSchema;
