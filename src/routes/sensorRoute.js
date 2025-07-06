const express = require('express')
const router = express.Router()
const { 
    getLatestSensorData, 
    startDiscoveryMode, 
    getDiscoveredDevices,
    pairWithDevice 
} = require('../services/mqttService')

router.get('/latest', (req, res) => {
    const data = getLatestSensorData()

    if (!data) {
        return res.status(404).json({
            success: false,
            error: 'No sensor data available yet'
        })
    }

    return res.status(200).json({
        success: true,
        data
    })
})

// Start device discovery mode
router.post('/discover', (req, res) => {
    const result = startDiscoveryMode()
    return res.status(result.success ? 200 : 400).json(result)
})

// Get discovered devices
router.get('/discover', (req, res) => {
    const devices = getDiscoveredDevices()
    return res.status(200).json({
        success: true,
        count: devices.length,
        devices
    })
})

// Pair with a specific device
router.post('/pair/:deviceId', (req, res) => {
    const { deviceId } = req.params
    const result = pairWithDevice(deviceId)
    return res.status(result.success ? 200 : 404).json(result)
})

module.exports = router
