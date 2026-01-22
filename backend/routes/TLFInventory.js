const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");

const { schemas } = require("../createModels");
const TLFInventory = mongoose.model(
  "TLFInventory",
  schemas.TLFInventorySchema,
  "TLFInventory"
);

// Routes

router.get("/", async (req, res) => {
  try {
    const latest = await TLFInventory.findOne({})
      .sort({ FetchedAt: -1 })
      .lean();
    res.json(latest || null);
  } catch (error) {
    console.error("Error fetching TLF inventory:", error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
