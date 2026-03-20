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

// Get a specific sync audit by syncId
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

module.exports = router;
