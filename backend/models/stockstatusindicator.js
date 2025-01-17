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
  defaultForNew :{
    type: Boolean,
    default: false,
  },
   considerForPreProd: {
    type: Boolean,
    default: false,
  },
  defaultCompleted: {
    type: Boolean,
    default: false,
  }
});

module.exports = stockStatusIndicatorSchema;
