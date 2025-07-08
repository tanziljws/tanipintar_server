const express = require('express')
const router = express.Router()

const { controlPump } = require('../services/mqttClient')
const {
    getDeviceStatus,
    getDeviceLastSeen,
    getKnownDevices
} = require('../services/mqttHandler')

// ✅ Kontrol Pompa
// Endpoint: POST /api/sensors/pump/control
router.post('/pump/control', (req, res) => {
    const { nodeId, relay, state } = req.body

    if (!nodeId || typeof relay !== 'number' || typeof state !== 'boolean') {
        return res.status(400).json({
            message: 'Field "nodeId" (string), "relay" (number), dan "state" (boolean) wajib diisi.'
        })
    }

    try {
        controlPump(nodeId, relay, state)
        return res.status(200).json({
            message: `Kontrol pompa dikirim ke node "${nodeId}"`
        })
    } catch (err) {
        return res.status(500).json({
            message: 'Gagal mengirim kontrol pompa',
            error: err.message
        })
    }
})

// ✅ Get Semua Perangkat yang Dikenal
// Endpoint: GET /api/sensors/devices
router.get('/devices', (req, res) => {
    const devices = getKnownDevices()
    return res.status(200).json({ devices })
})

// ✅ Get Status Perangkat
// Endpoint: GET /api/sensors/devices/status
router.get('/devices/status', (req, res) => {
    const statuses = getDeviceStatus()
    return res.status(200).json({ statuses })
})

// ✅ Get Last Seen Perangkat
// Endpoint: GET /api/sensors/devices/lastseen
router.get('/devices/lastseen', (req, res) => {
    const lastSeen = getDeviceLastSeen()
    return res.status(200).json({ lastSeen })
})

module.exports = router
