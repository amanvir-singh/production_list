const mongoose = require("mongoose");

const jobListMaterialSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
});

module.exports = jobListMaterialSchema;
