const mongoose = require("mongoose");

const edgebandSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
    },
  },
  { collection: "edgeband" }
);

module.exports = edgebandSchema;
