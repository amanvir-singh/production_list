const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const { schemas } = require("../createModels");

const jobListMaterial = mongoose.model(
  "jobListMaterial",
  schemas.jobListMaterialSchema,
  "jobListMaterial"
);

// Create
router.post("/add", async (req, res) => {
  try {
    const joblistmaterial = new jobListMaterial(req.body);
    await joblistmaterial.save();
    res.status(201).json(joblistmaterial);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Read all
router.get("/", async (req, res) => {
  try {
    const joblistmaterials = await jobListMaterial.find();
    res.json(joblistmaterials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read one
router.get("/:id", async (req, res) => {
  try {
    const joblistmaterial = await jobListMaterial.findById(req.params.id);
    if (!joblistmaterial)
      return res.status(404).json({ message: "Job List Material not found" });
    res.json(joblistmaterial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update
router.put("/:id", async (req, res) => {
  try {
    const joblistmaterial = await jobListMaterial.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );
    if (!joblistmaterial)
      return res.status(404).json({ message: "Job List Material not found" });
    res.json(joblistmaterial);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete
router.delete("/:id", async (req, res) => {
  try {
    const joblistmaterial = await jobListMaterial.findByIdAndDelete(
      req.params.id
    );
    if (!joblistmaterial)
      return res.status(404).json({ message: "Job List Material not found" });
    res.json({ message: "Job List Material deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
