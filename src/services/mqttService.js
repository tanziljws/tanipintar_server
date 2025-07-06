const mqtt = require('mqtt')
const logger = require('../utils/logger')

const {
    MQTT_BROKER_URL,
    MQTT_CLIENT_ID,
    MQTT_USERNAME,
    MQTT_PASSWORD,
} = process.env

if (!MQTT_BROKER_URL || !MQTT_CLIENT_ID || !MQTT_USERNAME || !MQTT_PASSWORD) {
    throw new Error('[MQTT] Missing required MQTT environment variables.')
}

let mqttClient = null
let latestSensorData = null
let discoveredDevices = []
let isDiscoveryMode = false
let discoveryTimer = null

const connectMQTT = () => {
    mqttClient = mqtt.connect(MQTT_BROKER_URL, {
        clientId: MQTT_CLIENT_ID,
        username: MQTT_USERNAME,
        password: MQTT_PASSWORD,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
    })

    mqttClient.on('connect', () => {
        logger.info(`[MQTT] Connected to ${MQTT_BROKER_URL} as ${MQTT_CLIENT_ID}`)

        mqttClient.subscribe('kebun/sensor', (err) => {
            if (err) {
                logger.error('[MQTT] Failed to subscribe to kebun/sensor:', err)
            } else {
                logger.info('[MQTT] Subscribed to kebun/sensor')
            }
        })

        // Subscribe to discovery topic
        mqttClient.subscribe('discovery/#', (err) => {
            if (err) {
                logger.error('[MQTT] Failed to subscribe to discovery/#:', err)
            } else {
                logger.info('[MQTT] Subscribed to discovery/#')
            }
        })
    })

    mqttClient.on('reconnect', () => {
        logger.warn('[MQTT] Reconnecting...')
    })

    mqttClient.on('error', (err) => {
        logger.error('[MQTT] Connection error:', err)
    })

    mqttClient.on('message', handleMessage)
}

const handleMessage = (topic, message) => {
    // Handle sensor data
    if (topic === 'kebun/sensor') {
        handleSensorMessage(topic, message)
        return
    }
    
    // Handle discovery messages
    if (topic.startsWith('discovery/') && isDiscoveryMode) {
        try {
            const data = JSON.parse(message.toString())
            const deviceId = topic.split('/')[1]
            
            // Check if device already discovered
            const existingDeviceIndex = discoveredDevices.findIndex(d => d.id === deviceId)
            
            if (existingDeviceIndex === -1) {
                // Add new device
                discoveredDevices.push({
                    id: deviceId,
                    name: data.name || `Device ${deviceId}`,
                    type: data.type || 'unknown',
                    capabilities: data.capabilities || [],
                    lastSeen: new Date().toISOString(),
                    data: data
                })
                logger.info(`[MQTT] New device discovered: ${deviceId}`)
            } else {
                // Update existing device
                discoveredDevices[existingDeviceIndex].lastSeen = new Date().toISOString()
                discoveredDevices[existingDeviceIndex].data = data
                logger.info(`[MQTT] Device seen again: ${deviceId}`)
            }
        } catch (err) {
            logger.error('[MQTT] Failed to parse discovery data:', err)
        }
    }
}

const handleSensorMessage = (topic, message) => {
    try {
        const data = JSON.parse(message.toString());
        logger.info(`[MQTT] Sensor data received from ${data.node}`)
        logger.info(JSON.stringify(data, null, 2))

        latestSensorData = data
    } catch (err) {
        logger.error('[MQTT] Failed to parse sensor data:', err)
    }
}

const publishMessage = (topic, payload) => {
    if (!mqttClient?.connected) {
        logger.warn('[MQTT] Cannot publish, client not connected')
        return
    }

    mqttClient.publish(topic, payload, {}, (err) => {
        if (err) {
            logger.error(`[MQTT] Failed to publish to ${topic}:`, err)
        }
    })
}

// Start device discovery mode for 30 seconds
const startDiscoveryMode = () => {
    if (isDiscoveryMode) {
        return {
            success: false,
            message: 'Discovery mode already active'
        }
    }
    
    // Clear previous discoveries
    discoveredDevices = []
    isDiscoveryMode = true
    
    // Publish discovery request
    publishMessage('discovery/request', JSON.stringify({
        action: 'identify',
        requestId: Date.now().toString()
    }))
    
    logger.info('[MQTT] Started discovery mode for 30 seconds')
    
    // Set timer to end discovery mode after 30 seconds
    clearTimeout(discoveryTimer)
    discoveryTimer = setTimeout(() => {
        isDiscoveryMode = false
        logger.info('[MQTT] Discovery mode ended')
    }, 30000)
    
    return {
        success: true,
        message: 'Discovery mode started for 30 seconds'
    }
}

// Get list of discovered devices
const getDiscoveredDevices = () => {
    return discoveredDevices
}

// Pair with a specific device
const pairWithDevice = (deviceId) => {
    const device = discoveredDevices.find(d => d.id === deviceId)
    
    if (!device) {
        return {
            success: false,
            message: `Device ${deviceId} not found in discovered devices`
        }
    }
    
    // Here you would implement the actual pairing logic
    // For example, storing the device in a database
    // and setting up any device-specific configurations
    
    // For now, we'll just return success
    return {
        success: true,
        message: `Successfully paired with device ${deviceId}`,
        device
    }
}

module.exports = {
    connectMQTT,
    publishMessage,
    getLatestSensorData: () => latestSensorData,
    startDiscoveryMode,
    getDiscoveredDevices,
    pairWithDevice
}
