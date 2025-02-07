const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const { schemas } = require('../createModels');

const Log = mongoose.model('logs', schemas.logSchema, 'logs');

// Create
router.post('/add', async (req, res) => {
  try {
    const log = new Log(req.body);
    await log.save();
    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Read all with pagination and limit
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const logs = await Log.find()
      .sort({ loggedAt: -1 }) // Sort by loggedAt, newest first
      .skip(skip)
      .limit(limit);

    const total = await Log.countDocuments();

    res.json({
      logs,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalLogs: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Flatten object and join key-value pairs into a string
const flattenObject = (obj) => {
  let result = [];

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (typeof value === 'object' && value !== null) {
        result.push(flattenObject(value)); // Recursively flatten nested objects
      } else {
        result.push(`${key}: ${value}`);
      }
    }
  }

  return result.join(' '); // Combine flattened key-value pairs into one string
};

router.get('/search', async (req, res) => {
  try {
    const searchTerm = req.query.term;

    // Fetch logs and flatten the previousData and updatedData before searching
    const logs = await Log.find({}).sort({ loggedAt: -1 });

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

    res.json({
      logs: filteredLogs,
      totalLogs: filteredLogs.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Read one
router.get('/:id', async (req, res) => {
  try {
    const log = await Log.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Log not found' });
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update (Note: Updating logs is often not recommended for audit trails)
router.put('/:id', async (req, res) => {
  try {
    const log = await Log.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!log) return res.status(404).json({ message: 'Log not found' });
    res.json(log);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete (Note: Deleting logs is often not recommended for audit trails)
router.delete('/:id', async (req, res) => {
  try {
    const log = await Log.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ message: 'Log not found' });
    res.json({ message: 'Log deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
