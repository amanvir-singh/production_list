const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const { schemas } = require("../createModels");

const EdgeBandThickness = mongoose.model(
  "edgeBandThickness",
  schemas.edgeBandThicknessSchema,
  "edgeBandThickness"
);

// Create
router.post("/add", async (req, res) => {
  try {
    const edgeBandThickness = new EdgeBandThickness(req.body);
    await edgeBandThickness.save();
    res.status(201).json(edgeBandThickness);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Read all
router.get("/", async (req, res) => {
  try {
    const edgeBandThicknesses = await EdgeBandThickness.find().sort({ name: 1 });
    res.json(edgeBandThicknesses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read one
router.get("/:id", async (req, res) => {
  try {
    const edgeBandThickness = await EdgeBandThickness.findById(req.params.id);
    if (!edgeBandThickness)
      return res.status(404).json({ message: "Edgeband thickness not found" });
    res.json(edgeBandThickness);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update
router.put("/:id", async (req, res) => {
  try {
    const edgeBandThickness = await EdgeBandThickness.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!edgeBandThickness)
      return res.status(404).json({ message: "Edgeband thickness not found" });
    res.json(edgeBandThickness);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete
router.delete("/:id", async (req, res) => {
  try {
    const edgeBandThickness = await EdgeBandThickness.findByIdAndDelete(
      req.params.id
    );
    if (!edgeBandThickness)
      return res.status(404).json({ message: "Edgeband thickness not found" });
    res.json({ message: "Edgeband thickness deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
