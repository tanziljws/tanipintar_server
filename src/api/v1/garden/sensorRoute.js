const express = require('express');
const router = express.Router();

const { 
  getSensorData, 
  getPumpData, 
  getSmartDecisions, 
  getGardenOverview 
} = require('./sensorController');
const authMiddleware = require('../../../middlewares/authMiddleware');

// Routes untuk sensor data
router.get('/:gardenId/sensors', authMiddleware, getSensorData);
router.get('/:gardenId/pumps', authMiddleware, getPumpData);
router.get('/:gardenId/smart-decisions', authMiddleware, getSmartDecisions);
router.get('/:gardenId/overview', authMiddleware, getGardenOverview);

module.exports = router;
