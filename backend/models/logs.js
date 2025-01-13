const mongoose = require("mongoose");


const logSchema = new mongoose.Schema({
    user: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true
    },
    details: {
      type: String,
      required: false 
    },
    time: {
      type: Date,
      default: Date.now 
    }
});
  
module.exports = logSchema;