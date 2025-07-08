// src/services/mqttClient.js
const mqtt = require('mqtt')
const dotenv = require('dotenv')
const { handleIncomingMessage, getKnownDevices } = require('./mqttHandler')
const logger = require('../utils/logger')

dotenv.config()

const brokerUrl = process.env.MQTT_BROKER_URL
const options = {
    clientId: process.env.MQTT_CLIENT_ID + '-' + Math.random().toString(16).substr(2, 4),
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clean: true,
    connectTimeout: 10000,
    reconnectPeriod: 5000,
    keepalive: 60
}

let client
async function initMQTT() {
    return new Promise((resolve, reject) => {
        client = mqtt.connect(brokerUrl, options)

        client.on('connect', () => {
            logger.info('[MQTT] Connected to: ' + brokerUrl)

            const topics = [
                'kebun/sensor',
                'kebun/status/#',
                'kebun/pompa/+/control',
                'kebun/pompa/+/status'
            ]

            client.subscribe(topics, (err) => {
                if (err) {
                    logger.error('[MQTT] Failed to subscribe:', err)
                    reject(err)
                } else {
                    logger.info('[MQTT] Subscribed to topics: ' + topics.join(', '))
                    resolve()
                }
            })
        })

        client.on('message', (topic, message) => {
            handleIncomingMessage(topic, message)
        })

        client.on('error', (error) => {
            logger.error('[MQTT] Connection error:', error)
        })

        client.on('close', () => {
            logger.warn('[MQTT] Disconnected')
        })
    })
}

// === Kirim ping ke device tiap 30 detik
setInterval(() => {
    if (!client) return
    const knownDevices = getKnownDevices()
    knownDevices.forEach((nodeId) => {
        const topic = `kebun/ping/${nodeId}`
        client.publish(topic, 'ping')
        logger.debug(`[PING] Sent to "${topic}"`)
    })
}, 30 * 1000)

function controlPump(nodeId, relay, state) {
    const topic = `kebun/pompa/${nodeId}/control`
    const payload = JSON.stringify({ relay, state })

    client.publish(topic, payload, { qos: 0, retain: false }, (err) => {
        if (err) {
            logger.error(`[PUBLISH] Failed to send to "${topic}": ${err.message}`)
        } else {
            logger.info(`[PUBLISH] Sent control to "${topic}": ${payload}`)
        }
    })
}

module.exports = {
    initMQTT,
    controlPump
}
