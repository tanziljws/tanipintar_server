const express = require('express');
const router = express.Router();

const { createGarden, getUserGarden, deleteGarden, updateGarden } = require('./gardenController');
const { gardenValidation } = require('./gardenValidator');
const authMiddleware = require('../../../middlewares/authMiddleware');

// Import sensor routes
const sensorRoutes = require('./sensorRoute');

// Garden CRUD routes
router.post('/', authMiddleware, gardenValidation, createGarden);
router.get('/', authMiddleware, getUserGarden);
router.delete('/:id', authMiddleware, deleteGarden);
router.put('/:id', authMiddleware, gardenValidation, updateGarden);

// Sensor data routes
router.use('/', sensorRoutes);

module.exports = router;
