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
  defaultForNew :{
    type: Boolean,
    default: false,
  },
  considerForPreProd: {
    type: Boolean,
    default: false,
  },
  defaultForAutoArchive: {
    type: Boolean,
    default: false,
  }
});

module.exports = jobStatusIndicatorSchema;
