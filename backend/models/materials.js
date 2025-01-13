const mongoose = require("mongoose");


const materialSchema = new mongoose.Schema({
    code: {
      type: String,
      required: true,
      unique: true,
    },
    colorCode :{
      type: String,
        required: true,
    },
    name: {
      type: String,
      required: false,
    },
    thickness :{
        type: String,
        required: true,
    },
    length: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
      required: true,
    },
    supplier: {
      type: String,
      required: true,
    },
    finish: {
      type: String,
      required: true,
    },
});
  

module.exports = materialSchema;