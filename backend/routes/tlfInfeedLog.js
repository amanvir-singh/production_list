const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const TLFInfeedLog = mongoose.model("TLFInfeedLog");

// GET /tlfInfeedLog — paginated list with optional ?from=&to= date range
router.get("/", async (req, res) => {
  try {
    const { from, to, limit = 1000 } = req.query;
    const filter = {};

    if (from || to) {
      filter.eventTime = {};
      if (from) filter.eventTime.$gte = new Date(from);
      if (to) filter.eventTime.$lte = new Date(to);
    }

    const logs = await TLFInfeedLog.find(filter)
      .sort({ eventTime: -1 })
      .limit(Number(limit));

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /tlfInfeedLog/daily — daily summary (date + boardCode + count)
router.get("/daily", async (req, res) => {
  try {
    const { from, to } = req.query;
    const match = {};

    if (from || to) {
      match.eventTime = {};
      if (from) match.eventTime.$gte = new Date(from);
      if (to) match.eventTime.$lte = new Date(to);
    }

    const summary = await TLFInfeedLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$eventTime" } },
            boardCode: "$boardCode",
          },
          count: { $sum: "$quantity" },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          totalPanels: { $sum: "$count" },
          boardCodes: {
            $push: { boardCode: "$_id.boardCode", count: "$count" },
          },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
