const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { schemas } = require("../createModels");

const TLFOrphanPanel = mongoose.model("TLFOrphanPanel");

// Get all orphan panels
router.get("/", async (req, res) => {
  try {
    const panels = await TLFOrphanPanel.find().sort({ lastSeenAt: -1 });
    res.json(panels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
