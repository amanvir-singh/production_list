const mongoose = require("mongoose");

const TLFOrphanPanelSchema = new mongoose.Schema({
  boardCode: String,
  totalQty: {
    type: Number,
    default: 0,
  },
  events: [
    {
      auslagerRowId: Number,
      auslagerId: Number,
      jobName: String,
      plan: String,
      dest: String,
      eventTime: Date,
    },
  ],
  firstSeenAt: Date,
  lastSeenAt: Date,
});

module.exports = TLFOrphanPanelSchema;
