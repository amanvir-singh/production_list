const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const { schemas } = require('../createModels');


const ProductionList = mongoose.model('productionLists', schemas.productionListSchema, 'productionLists');

router.post('/', async (req, res) => {
  try {
    const { consideredStockStatuses, consideredJobStatuses } = req.body;

    const validCombinations = consideredStockStatuses.flatMap(stockStatus => 
      consideredJobStatuses.map(jobStatus => ({
        stockStatus,
        jobStatus
      }))
    );


    const preprodData = await ProductionList.aggregate([
      { $match: { archived: false } },
      { $unwind: "$materials" },
      {
        $match: {
          $or: validCombinations.map(combo => ({
            "materials.stockStatus": combo.stockStatus,
            "materials.jobStatus": combo.jobStatus
          }))
        }
      },
      {
        $project: {
          jobName: 1,
          cutlistName: 1,
          priority: 1,
          material: "$materials.material",
          customMaterial: "$materials.customMaterial",
          quantitySaw: "$materials.quantitySaw",
          quantityCNC: "$materials.quantityCNC",
          stockStatus: "$materials.stockStatus",
          jobStatus: "$materials.jobStatus",
          createdAt: 1,
        }
      }
    ]);

    res.json(preprodData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching preprod data", error: error.message });
  }
});


router.post('/complete', async (req, res) => {
  try {
    const { materialName, cutlistId, completedStatus } = req.body;

    const productionList = await ProductionList.findById(cutlistId);

    if (!productionList) {
      return res.status(404).json({ message: 'Production list not found' });
    }

    const material = productionList.materials.find(m => 
      m.material === materialName || m.customMaterial === materialName
    );

    if (!material) {
      return res.status(404).json({ message: 'Material not found in the production list' });
    }

    material.stockStatus = completedStatus;
    await productionList.save();

    res.status(200).json({ message: 'Material marked as complete' });
  } catch (error) {
    console.error('Error marking material as complete:', error);
    res.status(500).json({ message: 'An error occurred while marking the material as complete' });
  }
});

module.exports = router;
