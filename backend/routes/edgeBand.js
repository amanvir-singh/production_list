const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const { schemas } = require("../createModels");

const edgeBand = mongoose.model("edgeband", schemas.edgebandSchema, "edgeband");

// Create
router.post("/add", async (req, res) => {
  try {
    const edgeband = new edgeBand(req.body);
    await edgeband.save();
    res.status(201).json(edgeband);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Read all
router.get("/", async (req, res) => {
  try {
    const edgebands = await edgeBand.find();
    res.json(edgebands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read one
router.get("/:id", async (req, res) => {
  try {
    const edgeband = await edgeBand.findById(req.params.id);
    if (!edgeband)
      return res.status(404).json({ message: "Edgeband not found" });
    res.json(edgeband);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update
router.put("/:id", async (req, res) => {
  try {
    const edgeband = await edgeBand.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!edgeband)
      return res.status(404).json({ message: "Edgeband not found" });
    res.json(edgeband);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete
router.delete("/:id", async (req, res) => {
  try {
    const edgeband = await edgeBand.findByIdAndDelete(req.params.id);
    if (!edgeband)
      return res.status(404).json({ message: "Edgeband not found" });
    res.json({ message: "Edgeband deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
