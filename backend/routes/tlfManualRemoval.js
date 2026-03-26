const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const TLFManualRemoval = mongoose.model("TLFManualRemoval");

// GET /tlfManualRemoval?from=&to=
router.get("/", async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};

    if (from || to) {
      filter.detectedAt = {};
      if (from) filter.detectedAt.$gte = new Date(from);
      if (to)   filter.detectedAt.$lte = new Date(to);
    }

    const records = await TLFManualRemoval.find(filter)
      .sort({ detectedAt: -1 })
      .lean();

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
