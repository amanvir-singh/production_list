const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const { schemas } = require("../createModels");

const JobList = mongoose.model("joblists", schemas.jobListSchema, "joblists");

// Create
router.post("/add", async (req, res) => {
  try {
    const jobList = new JobList(req.body);
    await jobList.save();
    res.status(201).json(jobList);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Read all (non-archived)
router.get("/", async (req, res) => {
  try {
    const jobLists = await JobList.find({ archived: false });
    res.json(jobLists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read all archived
router.get("/archived", async (req, res) => {
  try {
    const archivedLists = await JobList.find({ archived: true });
    res.json(archivedLists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read one
router.get("/:id", async (req, res) => {
  try {
    const jobList = await JobList.findById(req.params.id);
    if (!jobList)
      return res.status(404).json({ message: "Job List not found" });
    res.json(jobList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update
router.put("/:id", async (req, res) => {
  try {
    const jobList = await JobList.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!jobList)
      return res.status(404).json({ message: "Job List not found" });
    res.json(jobList);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Archive
router.patch("/:id/archive", async (req, res) => {
  try {
    const jobList = await JobList.findByIdAndUpdate(
      req.params.id,
      { archived: true },
      { new: true }
    );
    if (!jobList)
      return res.status(404).json({ message: "Job List not found" });
    res.json(jobList);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Unarchive
router.patch("/:id/unarchive", async (req, res) => {
  try {
    const jobList = await JobList.findByIdAndUpdate(
      req.params.id,
      { archived: false },
      { new: true }
    );
    if (!jobList)
      return res.status(404).json({ message: "Job List not found" });
    res.json(jobList);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete
router.delete("/:id", async (req, res) => {
  try {
    const jobList = await JobList.findByIdAndDelete(req.params.id);
    if (!jobList)
      return res.status(404).json({ message: "Job List not found" });
    res.json({ message: "Job List deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
