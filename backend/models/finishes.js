const mongoose = require("mongoose");


const finishesSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
      },
      code: {
        type: String,
        required: true,
        
      },
});

module.exports = finishesSchema;
