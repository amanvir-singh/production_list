const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const { schemas } = require("../createModels");

const EdgeBandInventory = mongoose.model(
  "edgeBandInventory",
  schemas.edgeBandInventorySchema,
  "edgeBandInventory"
);

const EdgeBandLog = mongoose.model(
  "edgeBandLog",
  schemas.edgeBandLogSchema,
  "edgeBandLog"
);


function generateUniqueCode(code, height, thickness) {
  let heightDecimal = height;

  const fractionMatch = height.match(/(\d+)\/(\d+)/);
  if (fractionMatch) {
    const numerator = parseFloat(fractionMatch[1]);
    const denominator = parseFloat(fractionMatch[2]);
    heightDecimal = (numerator / denominator).toFixed(3);
  } else {
    const numMatch = height.match(/[\d.]+/);
    if (numMatch) {
      heightDecimal = parseFloat(numMatch[0]).toFixed(3);
    }
  }

  let thicknessNormalized = thickness;
  const thickMatch = thickness.match(/[\d.]+/);
  if (thickMatch) {
    thicknessNormalized = parseFloat(thickMatch[0]).toFixed(1);
  }

  return `${code}_${heightDecimal}_${thicknessNormalized}`;
}

function calculateTotalQty(locations) {
  return locations.reduce((sum, loc) => sum + (loc.qty || 0), 0);
}

async function writeLog(user, action, previousData, updatedData) {
  try {
    const log = new EdgeBandLog({ user, action, previousData, updatedData });
    await log.save();
  } catch (err) {
    console.error("EdgeBandLog write failed:", err.message);
  }
}

// Create
router.post("/add", async (req, res) => {
  try {
    const { code, height, thickness, locations, user } = req.body;

    if (!code || !height || !thickness) {
      return res.status(400).json({
        message: "Code, height, and thickness are required"
      });
    }

    const uniqueCode = generateUniqueCode(code, height, thickness);
    const totalQty = calculateTotalQty(locations || []);

    const edgeBand = new EdgeBandInventory({
      code,
      height,
      thickness,
      uniqueCode,
      locations: locations || [],
      totalQty,
    });

    await edgeBand.save();

    if (user) {
      await writeLog(user, `Created EdgeBand: ${uniqueCode}`, null, edgeBand.toObject());
    }

    res.status(201).json(edgeBand);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Edge band with this code, height, and thickness already exists"
      });
    }
    res.status(400).json({ message: error.message });
  }
});

//Read all
router.get("/", async (req, res) => {
  try {
    const { code, height, thickness } = req.query;

    const query = {};
    if (code) query.code = code;
    if (height) query.height = height;
    if (thickness) query.thickness = thickness;

    let edgeBands = await EdgeBandInventory.find(query);

    const sortedEdgeBands = edgeBands.sort((a, b) => {
      if (a.code !== b.code) return a.code.localeCompare(b.code);
      if (a.height !== b.height) return a.height.localeCompare(b.height);
      return a.thickness.localeCompare(b.thickness);
    });

    res.json(sortedEdgeBands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read one
router.get("/:id", async (req, res) => {
  try {
    const edgeBand = await EdgeBandInventory.findById(req.params.id);
    if (!edgeBand) {
      return res.status(404).json({ message: "Edge band not found" });
    }
    res.json(edgeBand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update
router.put("/:id", async (req, res) => {
  try {
    const { locations, user } = req.body;

    if (locations) {
      req.body.totalQty = calculateTotalQty(locations);
    }

    const previous = await EdgeBandInventory.findById(req.params.id).lean();

    const edgeBand = await EdgeBandInventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!edgeBand) {
      return res.status(404).json({ message: "Edge band not found" });
    }

    if (user) {
      await writeLog(
        user,
        `Updated EdgeBand: ${edgeBand.uniqueCode}`,
        previous,
        edgeBand.toObject()
      );
    }

    res.json(edgeBand);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add stock to existing edge band (merge-safe)
router.put("/add-stock/:id", async (req, res) => {
  try {
    const { locations, user } = req.body;

    if (!locations || !Array.isArray(locations)) {
      return res.status(400).json({
        message: "Locations array is required"
      });
    }

    const edgeBand = await EdgeBandInventory.findById(req.params.id);

    if (!edgeBand) {
      return res.status(404).json({ message: "Edge band not found" });
    }

    // Merge locations
    const addedSummary = [];
    locations.forEach(newLoc => {
      const existingLoc = edgeBand.locations.find(
        loc => loc.position === newLoc.position
      );

      if (existingLoc) {
        existingLoc.qty += newLoc.qty;
      } else {
        edgeBand.locations.push(newLoc);
      }
      addedSummary.push(`${newLoc.position}: +${newLoc.qty}`);
    });

    edgeBand.totalQty = calculateTotalQty(edgeBand.locations);

    await edgeBand.save();

    if (user) {
      await writeLog(
        user,
        `Added Stock to ${edgeBand.uniqueCode} (${addedSummary.join(", ")})`,
        null,
        { uniqueCode: edgeBand.uniqueCode, locations: edgeBand.locations, totalQty: edgeBand.totalQty }
      );
    }

    res.json(edgeBand);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Use/Deduct stock from a specific location
router.post("/:id/use", async (req, res) => {
  try {
    const { location, qtyUsed, user } = req.body;

    if (!location || !qtyUsed || qtyUsed <= 0) {
      return res.status(400).json({
        message: "Location and valid quantity are required"
      });
    }

    const edgeBand = await EdgeBandInventory.findById(req.params.id);

    if (!edgeBand) {
      return res.status(404).json({ message: "Edge band not found" });
    }

    const locationIndex = edgeBand.locations.findIndex(
      loc => loc.position === location
    );

    if (locationIndex === -1) {
      return res.status(404).json({
        message: `Location ${location} not found`
      });
    }

    const currentQty = edgeBand.locations[locationIndex].qty;

    if (currentQty < qtyUsed) {
      return res.status(400).json({
        message: `Insufficient quantity at location ${location}. Available: ${currentQty}, Requested: ${qtyUsed}`
      });
    }

    edgeBand.locations[locationIndex].qty -= qtyUsed;

    if (edgeBand.locations[locationIndex].qty === 0) {
      edgeBand.locations.splice(locationIndex, 1);
    }

    edgeBand.totalQty = calculateTotalQty(edgeBand.locations);

    await edgeBand.save();

    if (user) {
      await writeLog(
        user,
        `Deducted Stock from ${edgeBand.uniqueCode} at ${location}: -${qtyUsed}`,
        null,
        { uniqueCode: edgeBand.uniqueCode, locations: edgeBand.locations, totalQty: edgeBand.totalQty }
      );
    }

    res.json(edgeBand);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete
router.delete("/:id", async (req, res) => {
  try {
    const edgeBand = await EdgeBandInventory.findByIdAndDelete(req.params.id);
    if (!edgeBand) {
      return res.status(404).json({ message: "Edge band not found" });
    }

    const { user } = req.body;
    if (user) {
      await writeLog(
        user,
        `Deleted EdgeBand: ${edgeBand.uniqueCode}`,
        edgeBand.toObject(),
        null
      );
    }

    res.json({ message: "Edge band deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



module.exports = router;
