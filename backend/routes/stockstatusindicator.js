const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const { schemas } = require('../createModels');

const StockStatusIndicator = mongoose.model('stockStatusIndicators', schemas.stockStatusIndicatorSchema, 'stockStatusIndicators');

// Create
router.post('/add', async (req, res) => {
  try {
    const stockStatusIndicator = new StockStatusIndicator(req.body);
    await stockStatusIndicator.save();
    res.status(201).json(stockStatusIndicator);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Read all
router.get('/', async (req, res) => {
  try {
    const stockStatusIndicators = await StockStatusIndicator.find();
    res.json(stockStatusIndicators);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read one
router.get('/:id', async (req, res) => {
  try {
    const stockStatusIndicator = await StockStatusIndicator.findById(req.params.id);
    if (!stockStatusIndicator) return res.status(404).json({ message: 'Stock Status Indicator not found' });
    res.json(stockStatusIndicator);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update
router.put('/:id', async (req, res) => {
  try {
    const stockStatusIndicator = await StockStatusIndicator.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!stockStatusIndicator) return res.status(404).json({ message: 'Stock Status Indicator not found' });
    res.json(stockStatusIndicator);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    const stockStatusIndicator = await StockStatusIndicator.findByIdAndDelete(req.params.id);
    if (!stockStatusIndicator) return res.status(404).json({ message: 'Stock Status Indicator not found' });
    res.json({ message: 'Stock Status Indicator deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
