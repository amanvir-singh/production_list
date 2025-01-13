const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const { schemas } = require('../createModels');

const Thickness = mongoose.model('thicknesses', schemas.thicknessSchema, 'thicknesses');

// Create
router.post('/add', async (req, res) => {
  try {
    const thickness = new Thickness(req.body);
    await thickness.save();
    res.status(201).json(thickness);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Read all
router.get('/', async (req, res) => {
  try {
    const thicknesses = await Thickness.find();
    res.json(thicknesses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read one
router.get('/:id', async (req, res) => {
  try {
    const thickness = await Thickness.findById(req.params.id);
    if (!thickness) return res.status(404).json({ message: 'Thickness not found' });
    res.json(thickness);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update
router.put('/:id', async (req, res) => {
  try {
    const thickness = await Thickness.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!thickness) return res.status(404).json({ message: 'Thickness not found' });
    res.json(thickness);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    const thickness = await Thickness.findByIdAndDelete(req.params.id);
    if (!thickness) return res.status(404).json({ message: 'Thickness not found' });
    res.json({ message: 'Thickness deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;