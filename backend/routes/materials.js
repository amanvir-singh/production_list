const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const { schemas } = require("../createModels");

const Material = mongoose.model(
  "materials",
  schemas.materialSchema,
  "materials"
);

// Helper to escape regex special chars
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Create
router.post("/add", async (req, res) => {
  try {
    const material = new Material(req.body);
    await material.save();
    res.status(201).json(material);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Read all
router.get("/", async (req, res) => {
  try {
    const materials = await Material.find();
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read one
router.get("/:id", async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material)
      return res.status(404).json({ message: "Material not found" });
    res.json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update
router.put("/:id", async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!material)
      return res.status(404).json({ message: "Material not found" });
    res.json(material);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete
router.delete("/:id", async (req, res) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);
    if (!material)
      return res.status(404).json({ message: "Material not found" });
    res.json({ message: "Material deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/by-code/:code", async (req, res) => {
  try {
    const code = req.params.code;

    // Case-insensitive exact match: ^code$
    const material = await Material.findOne({
      code: { $regex: `^${escapeRegex(code)}$`, $options: "i" },
    });

    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }
    res.json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
