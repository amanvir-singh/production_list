const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const { schemas } = require('../createModels');

const ProductionList = mongoose.model('productionLists', schemas.productionListSchema, 'productionLists');

// Create
router.post('/add', async (req, res) => {
  try {
    const productionList = new ProductionList(req.body);
    await productionList.save();
    res.status(201).json(productionList);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Read all (non-archived)
router.get('/', async (req, res) => {
  try {
    const productionLists = await ProductionList.find({ archived: false });
    res.json(productionLists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read all archived
router.get('/archived', async (req, res) => {
  try {
    const archivedLists = await ProductionList.find({ archived: true });
    res.json(archivedLists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read one
router.get('/:id', async (req, res) => {
  try {
    const productionList = await ProductionList.findById(req.params.id);
    if (!productionList) return res.status(404).json({ message: 'Production List not found' });
    res.json(productionList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update
router.put('/:id', async (req, res) => {
  try {
    const productionList = await ProductionList.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!productionList) return res.status(404).json({ message: 'Production List not found' });
    res.json(productionList);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Archive
router.patch('/:id/archive', async (req, res) => {
  try {
    const productionList = await ProductionList.findByIdAndUpdate(
      req.params.id,
      { archived: true },
      { new: true }
    );
    if (!productionList) return res.status(404).json({ message: 'Production List not found' });
    res.json(productionList);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// Unarchive
router.patch('/:id/unarchive', async (req, res) => {
  try {
    const productionList = await ProductionList.findByIdAndUpdate(
      req.params.id,
      { archived: false },
      { new: true }
    );
    if (!productionList) return res.status(404).json({ message: 'Production List not found' });
    res.json(productionList);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Archive older jobs
router.post('/archive-older', async (req, res) => {
  const { days } = req.body;
  const date = new Date();
  date.setDate(date.getDate() - days);

  try {
    const result = await ProductionList.updateMany(
      { createdAt: { $lt: date }, archived: false },
      { archived: true }
    );
    res.json({ message: `${result.nModified} jobs archived` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    const productionList = await ProductionList.findByIdAndDelete(req.params.id);
    if (!productionList) return res.status(404).json({ message: 'Production List not found' });
    res.json({ message: 'Production List deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
