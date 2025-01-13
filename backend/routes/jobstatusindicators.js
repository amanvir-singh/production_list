const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const { schemas } = require('../createModels');

const JobStatusIndicator = mongoose.model('jobStatusIndicators', schemas.jobStatusIndicatorSchema, 'jobStatusIndicators');

// Create
router.post('/add', async (req, res) => {
  try {
    const jobStatusIndicator = new JobStatusIndicator(req.body);
    await jobStatusIndicator.save();
    res.status(201).json(jobStatusIndicator);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Read all
router.get('/', async (req, res) => {
  try {
    const jobStatusIndicators = await JobStatusIndicator.find();
    res.json(jobStatusIndicators);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read one
router.get('/:id', async (req, res) => {
  try {
    const jobStatusIndicator = await JobStatusIndicator.findById(req.params.id);
    if (!jobStatusIndicator) return res.status(404).json({ message: 'Job Status Indicator not found' });
    res.json(jobStatusIndicator);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update
router.put('/:id', async (req, res) => {
  try {
    const jobStatusIndicator = await JobStatusIndicator.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!jobStatusIndicator) return res.status(404).json({ message: 'Job Status Indicator not found' });
    res.json(jobStatusIndicator);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    const jobStatusIndicator = await JobStatusIndicator.findByIdAndDelete(req.params.id);
    if (!jobStatusIndicator) return res.status(404).json({ message: 'Job Status Indicator not found' });
    res.json({ message: 'Job Status Indicator deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
