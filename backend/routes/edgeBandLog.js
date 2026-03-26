const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const { schemas } = require("../createModels");

const EdgeBandLog = mongoose.model(
  "edgeBandLog",
  schemas.edgeBandLogSchema,
  "edgeBandLog"
);

// Create
router.post("/add", async (req, res) => {
  try {
    const log = new EdgeBandLog(req.body);
    await log.save();
    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Read all with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const logs = await EdgeBandLog.find()
      .sort({ loggedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await EdgeBandLog.countDocuments();

    res.json({
      logs,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalLogs: total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const flattenObject = (obj) => {
  let result = [];
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (typeof value === "object" && value !== null) {
        result.push(flattenObject(value));
      } else {
        result.push(`${key}: ${value}`);
      }
    }
  }
  return result.join(" ");
};

// Search
router.get("/search", async (req, res) => {
  try {
    const searchTerm = req.query.term;
    const logs = await EdgeBandLog.find({}).sort({ loggedAt: -1 });

    const filteredLogs = logs.filter((log) => {
      const flattenedPreviousData = flattenObject(log.previousData || {});
      const flattenedUpdatedData = flattenObject(log.updatedData || {});

      return (
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flattenedPreviousData.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flattenedUpdatedData.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    res.json({ logs: filteredLogs, totalLogs: filteredLogs.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read one
router.get("/:id", async (req, res) => {
  try {
    const log = await EdgeBandLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Log not found" });
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
