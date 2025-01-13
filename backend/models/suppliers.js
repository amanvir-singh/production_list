const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema({
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
  
module.exports = supplierSchema;