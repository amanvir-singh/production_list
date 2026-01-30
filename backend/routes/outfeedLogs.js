const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { schemas } = require("../createModels");

const TLFOutfeedLog = mongoose.model("TLFOutfeedLog");

// Get all logs
router.get("/", async (req, res) => {
  try {
    // Sort by recent first by default
    const logs = await TLFOutfeedLog.find().sort({ processedAt: -1, eventTime: -1 }).limit(1000); 
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
