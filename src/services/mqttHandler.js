const logger = require('../utils/logger')

const deviceLastSeen = {}
const deviceStatus = {}
const pumpStatus = {}
const pumpControlLog = {}

const OFFLINE_TIMEOUT = 60 * 1000

function handleIncomingMessage(topic, message) {
    try {
        const payloadStr = message.toString()

        // === Tangani pesan status langsung ===
        if (topic.startsWith('kebun/status/')) {
            const id = topic.split('/')[2]
            const status = payloadStr.trim().toLowerCase()

            deviceLastSeen[id] = Date.now()
            if (deviceStatus[id] !== status) {
                deviceStatus[id] = status
                logger.info(`[STATUS] Device "${id}" is ${status.toUpperCase()}`)
            }
            return
        }

        // === Tangani status pompa ===
        if (topic.startsWith('kebun/pompa/') && topic.endsWith('/status')) {
            try {
                const statusPayload = JSON.parse(payloadStr)
                const id = statusPayload.id || topic.split('/')[2]

                pumpStatus[id] = statusPayload
                deviceLastSeen[id] = Date.now()

                if (deviceStatus[id] !== 'online') {
                    deviceStatus[id] = 'online'
                    logger.info(`[STATUS] Pump Device "${id}" is ONLINE`)
                }

                logger.info(`[POMPA-STATUS] "${id}": Relay States = ${relayStateString(statusPayload)}, Uptime = ${statusPayload.uptime || '-'}s`)
            } catch (err) {
                logger.warn(`[POMPA-STATUS] Invalid JSON on topic "${topic}": ${err.message}`)
            }

            return
        }

        // === Tangani perintah kontrol pompa ===
        if (topic.startsWith('kebun/pompa/') && topic.endsWith('/control')) {
            try {
                const controlPayload = JSON.parse(payloadStr)
                const id = controlPayload.id || topic.split('/')[2]

                pumpControlLog[id] = controlPayload
                logger.info(`[POMPA-CONTROL] "${id}": ${JSON.stringify(controlPayload)}`)
            } catch (err) {
                logger.warn(`[POMPA-CONTROL] Invalid JSON on topic "${topic}": ${err.message}`)
            }

            return
        }

        // === Tangani pesan data sensor ===
        const payload = JSON.parse(payloadStr)

        if (!validatePayload(payload)) {
            logger.warn(`[SENSOR] Invalid payload received on topic "${topic}"`)
            return
        }

        const id = payload.id || payload.node || topic.split('/')[2]
        deviceLastSeen[id] = Date.now()

        if (deviceStatus[id] !== 'online') {
            deviceStatus[id] = 'online'
            logger.info(`[STATUS] Device "${id}" is ONLINE`)
        }

        const formattedSensorData = {
            id: id,
            moisture: parseFloat(payload.moisture.toFixed(2)),
            ec: parseFloat(payload.ec.toFixed(2)),
            nitrogen: parseFloat(payload.nitrogen.toFixed(2)),
            phosphorus: parseFloat(payload.phosphorus.toFixed(2)),
            potassium: parseFloat(payload.potassium.toFixed(2)),
            timestamp: payload.timestamp
        }

        logger.info(`[SENSOR-STATUS] ${JSON.stringify(formattedSensorData)}`)
    } catch (err) {
        logger.error(`[MQTT] Failed to handle message from topic "${topic}": ${err.message}`)
    }
}

function validatePayload(data) {
    return (
        data &&
        typeof data === 'object' &&
        (data.id || data.node) &&
        typeof data.moisture === 'number' &&
        typeof data.ec === 'number' &&
        typeof data.nitrogen === 'number' &&
        typeof data.phosphorus === 'number' &&
        typeof data.potassium === 'number' &&
        typeof data.timestamp === 'number'
    )
}

function relayStateString(payload) {
    const relays = ['relay1', 'relay2', 'relay3', 'relay4']
    return relays.map(r => `${r.toUpperCase()}: ${payload[r] ? 'ON' : 'OFF'}`).join(', ')
}

// === Timer update status offline secara otomatis ===
setInterval(() => {
    const now = Date.now()
    Object.entries(deviceLastSeen).forEach(([id, lastSeen]) => {
        const elapsed = now - lastSeen

        if (elapsed > OFFLINE_TIMEOUT && deviceStatus[id] !== 'offline') {
            deviceStatus[id] = 'offline'
            logger.info(`[STATUS] Device "${id}" is OFFLINE`)
        }
    })
}, 10 * 1000)

function getKnownDevices() {
    return Object.keys(deviceLastSeen)
}

function getDeviceStatus() {
    return deviceStatus
}

function getDeviceLastSeen() {
    return deviceLastSeen
}

module.exports = {
    handleIncomingMessage,
    getKnownDevices,
    getDeviceStatus,
    getDeviceLastSeen
}
