const mongoose = require("mongoose");

const TLFSyncAuditSchema = new mongoose.Schema({
  syncId: { type: String, required: true }, 
  startedAt: Date,
  finishedAt: Date,

  cursor: {
    previous: Number,
    next: Number,
  },

  summary: {
    boardsTouched: Number,
    totalWarehouseDelta: Number,
    totalEvents: Number,
    totalOrphans: Number,
  },

  boards: [
    {
      boardCode: String,

      snapshot: {
        oldTlfQty: Number,
        newTlfQty: Number,
        deltaT: Number,
        oldTlfDebt: Number,
        newTlfDebt: Number,
      },

      warehouse: {
        existed: Boolean,
        warehouseOld: Number,
        warehouseDeltaRaw: Number,
        warehouseDeltaApplied: Number,
        warehouseNew: Number,
        deficit: Number,
      },

      events: {
        total: Number,
        fromTLF: Number,
        fromWarehouse: Number,
        unknown: Number,

        details: [
          {
            auslagerRowId: Number,
            auslagerId: Number,
            dest: String,
            source: String,
            jobName: String,
            plan: String,
            eventTime: Date,
          },
        ],
      },

      orphans: {
        count: Number,
        details: [
          {
            auslagerRowId: Number,
            auslagerId: Number,
            dest: String,
            source: String,
            jobName: String,
            plan: String,
            eventTime: Date,
          },
        ],
      },
    },
  ],
});

module.exports = TLFSyncAuditSchema;
