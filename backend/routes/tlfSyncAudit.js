const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { schemas } = require("../createModels");

const TLFSyncAudit = mongoose.model("TLFSyncAudit");

// Get all sync audits (with pagination and sorting)
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const skip = parseInt(req.query.skip) || 0;
    
    const audits = await TLFSyncAudit.find()
      .sort({ startedAt: -1 })
      .limit(limit)
      .skip(skip);
    
    res.json(audits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /tlfSyncAudit/inflated?from=&to=
// Returns boards where warehouseDeltaApplied > 0 in the given period,
// grouped by boardCode with each contributing sync as a branch.
router.get("/inflated", async (req, res) => {
  try {
    const { from, to } = req.query;

    const dateMatch = {};
    if (from) dateMatch.$gte = new Date(from);
    if (to)   dateMatch.$lte = new Date(to);

    const matchStage = Object.keys(dateMatch).length
      ? { $match: { startedAt: dateMatch } }
      : { $match: {} };

    const results = await TLFSyncAudit.aggregate([
      matchStage,
      { $unwind: "$boards" },
      { $match: { "boards.warehouse.warehouseDeltaApplied": { $gt: 0 } } },
      {
        $group: {
          _id: "$boards.boardCode",
          totalInflation: { $sum: "$boards.warehouse.warehouseDeltaApplied" },
          syncCount: { $sum: 1 },
          syncs: {
            $push: {
              syncId: "$syncId",
              startedAt: "$startedAt",
              deltaT: "$boards.snapshot.deltaT",
              warehouseDeltaRaw: "$boards.warehouse.warehouseDeltaRaw",
              warehouseDeltaApplied: "$boards.warehouse.warehouseDeltaApplied",
              warehouseOld: "$boards.warehouse.warehouseOld",
              warehouseNew: "$boards.warehouse.warehouseNew",
            },
          },
        },
      },
      { $sort: { totalInflation: -1 } },
    ]);

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /tlfSyncAudit/earliest — returns the startedAt of the oldest audit
router.get("/earliest", async (req, res) => {
  try {
    const oldest = await TLFSyncAudit.findOne({}, { startedAt: 1 }).sort({ startedAt: 1 }).lean();
    res.json({ startedAt: oldest?.startedAt || null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /tlfSyncAudit/stale-debts?from=&to=
// Boards that had persistent unresolved debt in historical audit records.
router.get("/stale-debts", async (req, res) => {
  try {
    const { from, to } = req.query;

    const dateMatch = {};
    if (from) dateMatch.$gte = new Date(from);
    if (to)   dateMatch.$lte = new Date(to);

    const matchStage = Object.keys(dateMatch).length
      ? { $match: { startedAt: dateMatch } }
      : { $match: {} };

    const results = await TLFSyncAudit.aggregate([
      matchStage,
      { $unwind: "$boards" },
      {
        $match: {
          "boards.snapshot.oldTlfDebt": { $gt: 0 },
          "boards.snapshot.newTlfDebt": { $gt: 0 },
        },
      },
      { $sort: { startedAt: 1 } },
      {
        $group: {
          _id: "$boards.boardCode",
          syncCount: { $sum: 1 },
          maxDebt: { $max: "$boards.snapshot.newTlfDebt" },
          firstSeen: { $first: "$startedAt" },
          lastSeen: { $last: "$startedAt" },
          lastDebt: { $last: "$boards.snapshot.newTlfDebt" },
          history: {
            $push: {
              syncId: "$syncId",
              startedAt: "$startedAt",
              oldDebt: "$boards.snapshot.oldTlfDebt",
              newDebt: "$boards.snapshot.newTlfDebt",
              deltaT: "$boards.snapshot.deltaT",
            },
          },
        },
      },
      { $sort: { syncCount: -1 } },
    ]);

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get latest sync audit
router.get("/latest/info", async (req, res) => {
  try {
    const audit = await TLFSyncAudit.findOne().sort({ startedAt: -1 });

    if (!audit) {
      return res.status(404).json({ message: "No sync audits found" });
    }

    res.json(audit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific sync audit by syncId — must be LAST (catches all /:param)
router.get("/:syncId", async (req, res) => {
  try {
    const audit = await TLFSyncAudit.findOne({ syncId: req.params.syncId });

    if (!audit) {
      return res.status(404).json({ message: "Sync audit not found" });
    }

    res.json(audit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
