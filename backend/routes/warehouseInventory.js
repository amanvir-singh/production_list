const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const { schemas } = require("../createModels");

const WarehouseInventory = mongoose.model(
  "warehouseInventory",
  schemas.warehouseInventorySchema,
  "warehouseInventory"
);

// Create
router.post("/add", async (req, res) => {
  try {
    const inventory = new WarehouseInventory(req.body);
    await inventory.save();
    res.status(201).json(inventory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Read all
router.get("/", async (req, res) => {
  try {
    const inventory = await WarehouseInventory.find();
    // Sort by boardCode
    const sortedInventory = inventory.sort((a, b) =>
      a.boardCode.localeCompare(b.boardCode, undefined, { numeric: true })
    );
    res.json(sortedInventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read one
router.get("/:id", async (req, res) => {
  try {
    const inventory = await WarehouseInventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory record not found" });
    }
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update
router.put("/:id", async (req, res) => {
  try {
    const inventory = await WarehouseInventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!inventory) {
      return res.status(404).json({ message: "Inventory record not found" });
    }
    res.json(inventory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add stock
router.put("/add-stock/:boardCode", async (req, res) => {
  try {
    const { qtyToAdd } = req.body;
    
    if (!qtyToAdd || isNaN(qtyToAdd)) {
        return res.status(400).json({ message: "Invalid quantity provided" });
    }

    const inventory = await WarehouseInventory.findOneAndUpdate(
      { boardCode: req.params.boardCode },
      { $inc: { warehouseQty: Number(qtyToAdd) } },
      { new: true }
    );

    if (!inventory) {
      return res.status(404).json({ message: "Inventory record not found" });
    }
    
    res.json(inventory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete
router.delete("/:id", async (req, res) => {
  try {
    const inventory = await WarehouseInventory.findByIdAndDelete(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory record not found" });
    }
    res.json({ message: "Inventory record deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
