const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const { schemas } = require("../createModels");

const EdgeBandHeight = mongoose.model(
  "edgeBandHeight",
  schemas.edgeBandHeightSchema,
  "edgeBandHeight"
);

// Create
router.post("/add", async (req, res) => {
  try {
    const edgeBandHeight = new EdgeBandHeight(req.body);
    await edgeBandHeight.save();
    res.status(201).json(edgeBandHeight);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Read all
router.get("/", async (req, res) => {
  try {
    const edgeBandHeights = await EdgeBandHeight.find().sort({ name: 1 });
    res.json(edgeBandHeights);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read one
router.get("/:id", async (req, res) => {
  try {
    const edgeBandHeight = await EdgeBandHeight.findById(req.params.id);
    if (!edgeBandHeight)
      return res.status(404).json({ message: "Edgeband height not found" });
    res.json(edgeBandHeight);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update
router.put("/:id", async (req, res) => {
  try {
    const edgeBandHeight = await EdgeBandHeight.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!edgeBandHeight)
      return res.status(404).json({ message: "Edgeband height not found" });
    res.json(edgeBandHeight);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete
router.delete("/:id", async (req, res) => {
  try {
    const edgeBandHeight = await EdgeBandHeight.findByIdAndDelete(req.params.id);
    if (!edgeBandHeight)
      return res.status(404).json({ message: "Edgeband height not found" });
    res.json({ message: "Edgeband height deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
