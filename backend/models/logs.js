const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  loggedAt: {
    type: Date,
    default: () => new Date(), 
    get: v => v.toLocaleString() 
  },
  previousData: mongoose.Schema.Types.Mixed,
  updatedData: mongoose.Schema.Types.Mixed
}, {
  timestamps: true, 
  toJSON: { getters: true } 
});

module.exports = logSchema;
