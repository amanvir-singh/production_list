const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const { schemas } = require("../createModels");

const TLFInventoryFixer = mongoose.model(
  "TLFInventoryFixer",
  schemas.TLFInventoryFixerSchema,
  "TLFInventoryFixer"
);

// Create
router.post("/add", async (req, res) => {
  try {
    const tlfinventoryfixer = new TLFInventoryFixer(req.body);
    await tlfinventoryfixer.save();
    res.status(201).json(tlfinventoryfixer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Read all
router.get("/", async (req, res) => {
  try {
    const tlfinventoryfixerlist = await TLFInventoryFixer.find();
    res.json(tlfinventoryfixerlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read one
router.get("/:id", async (req, res) => {
  try {
    const tlfinventoryfixer = await TLFInventoryFixer.findById(req.params.id);
    if (!tlfinventoryfixer)
      return res.status(404).json({ message: "TLF Inventory Fixer not found" });
    res.json(tlfinventoryfixer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update
router.put("/:id", async (req, res) => {
  try {
    const tlfinventoryfixer = await TLFInventoryFixer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!tlfinventoryfixer)
      return res.status(404).json({ message: "TLF Inventory Fixer not found" });
    res.json(tlfinventoryfixer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete
router.delete("/:id", async (req, res) => {
  try {
    const tlfinventoryfixer = await TLFInventoryFixer.findByIdAndDelete(
      req.params.id
    );
    if (!tlfinventoryfixer)
      return res.status(404).json({ message: "TLF Inventory Fixer not found" });
    res.json({ message: "TLF Inventory Fixer deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
