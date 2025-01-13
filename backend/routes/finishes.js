const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const { schemas } = require('../createModels');

const Finish = mongoose.model('finishes', schemas.finishesSchema, 'finishes');

// Create
router.post('/add', async (req, res) => {
  try {
    const finish = new Finish(req.body);
    await finish.save();
    res.status(201).json(finish);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Read all
router.get('/', async (req, res) => {
  try {
    const finishes = await Finish.find();
    res.json(finishes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read one
router.get('/:id', async (req, res) => {
  try {
    const finish = await Finish.findById(req.params.id);
    if (!finish) return res.status(404).json({ message: 'Finish not found' });
    res.json(finish);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update
router.put('/:id', async (req, res) => {
  try {
    const finish = await Finish.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!finish) return res.status(404).json({ message: 'Finish not found' });
    res.json(finish);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    const finish = await Finish.findByIdAndDelete(req.params.id);
    if (!finish) return res.status(404).json({ message: 'Finish not found' });
    res.json({ message: 'Finish deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;