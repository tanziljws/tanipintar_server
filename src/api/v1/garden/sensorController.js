const { pool } = require('../../../config/db')
const logger = require('../../../utils/logger')

// Mock sensor data generator untuk demo
const generateMockSensorData = (gardenId) => {
  const sensors = [
    {
      id: `sensor_${gardenId}_001`,
      name: 'NPK Monitor 1',
      type: 'NPK',
      isOnline: true,
      battery: Math.floor(Math.random() * 30) + 70, // 70-100%
      lastUpdate: '2 menit lalu',
      location: 'Area Utara',
      data: {
        temperature: (Math.random() * 10 + 25).toFixed(1), // 25-35°C
        moisture: (Math.random() * 40 + 50).toFixed(1), // 50-90%
        ph: (Math.random() * 2 + 6).toFixed(1), // 6.0-8.0
        nitrogen: (Math.random() * 50 + 30).toFixed(2), // 30-80 mg/kg
        phosphorus: (Math.random() * 30 + 20).toFixed(2), // 20-50 mg/kg
        potassium: (Math.random() * 200 + 200).toFixed(2), // 200-400 mg/kg
        ec: Math.floor(Math.random() * 500 + 1500), // 1500-2000 μS/cm
        tds: Math.floor(Math.random() * 250 + 750), // 750-1000 ppm
      },
    },
    {
      id: `sensor_${gardenId}_002`,
      name: 'NPK Monitor 2',
      type: 'NPK',
      isOnline: true,
      battery: Math.floor(Math.random() * 30) + 70,
      lastUpdate: '5 menit lalu',
      location: 'Area Timur',
      data: {
        temperature: (Math.random() * 10 + 25).toFixed(1),
        moisture: (Math.random() * 40 + 50).toFixed(1),
        ph: (Math.random() * 2 + 6).toFixed(1),
        nitrogen: (Math.random() * 50 + 30).toFixed(2),
        phosphorus: (Math.random() * 30 + 20).toFixed(2),
        potassium: (Math.random() * 200 + 200).toFixed(2),
        ec: Math.floor(Math.random() * 500 + 1500),
        tds: Math.floor(Math.random() * 250 + 750),
      },
    },
    {
      id: `sensor_${gardenId}_003`,
      name: 'Weather Station',
      type: 'Weather',
      isOnline: true,
      battery: Math.floor(Math.random() * 30) + 70,
      lastUpdate: '1 menit lalu',
      location: 'Area Tengah',
      data: {
        temperature: (Math.random() * 10 + 25).toFixed(1),
        humidity: (Math.random() * 30 + 60).toFixed(1), // 60-90%
        rainfall: (Math.random() * 5).toFixed(1), // 0-5 mm
        windSpeed: (Math.random() * 10 + 2).toFixed(1), // 2-12 m/s
        pressure: (Math.random() * 20 + 1000).toFixed(1), // 1000-1020 hPa
        uvIndex: Math.floor(Math.random() * 8 + 2), // 2-10
      },
    },
    {
      id: `sensor_${gardenId}_004`,
      name: 'Moisture Sensor',
      type: 'Moisture',
      isOnline: true,
      battery: Math.floor(Math.random() * 30) + 70,
      lastUpdate: '3 menit lalu',
      location: 'Area Selatan',
      data: {
        moisture: (Math.random() * 40 + 50).toFixed(1),
        temperature: (Math.random() * 10 + 25).toFixed(1),
        salinity: (Math.random() * 0.5 + 0.1).toFixed(1), // 0.1-0.6 dS/m
      },
    },
  ]
  
  return sensors
}

// Mock pump data generator
const generateMockPumpData = (gardenId) => {
  const pumps = [
    {
      id: `pump_${gardenId}_001`,
      name: 'Pompa Utama',
      type: 'Water Pump',
      isOnline: true,
      status: Math.random() > 0.5 ? 'ON' : 'OFF',
      flowRate: Math.floor(Math.random() * 20 + 10), // 10-30 L/min
      pressure: (Math.random() * 2 + 1).toFixed(1), // 1-3 bar
      lastMaintenance: '2 minggu lalu',
      nextMaintenance: '2 minggu lagi',
    },
    {
      id: `pump_${gardenId}_002`,
      name: 'Pompa Cadangan',
      type: 'Water Pump',
      isOnline: true,
      status: 'OFF',
      flowRate: Math.floor(Math.random() * 20 + 10),
      pressure: (Math.random() * 2 + 1).toFixed(1),
      lastMaintenance: '1 bulan lalu',
      nextMaintenance: '1 bulan lagi',
    },
  ]
  
  return pumps
}

// Mock smart decisions generator
const generateMockSmartDecisions = (gardenId) => {
  const decisions = [
    {
      id: `decision_${gardenId}_001`,
      type: 'Irrigation',
      title: 'Rekomendasi Penyiraman',
      description: 'Tanaman membutuhkan penyiraman tambahan karena kelembaban tanah rendah',
      priority: 'high',
      action: 'Aktifkan pompa selama 15 menit',
      confidence: 85,
      timestamp: new Date().toISOString(),
    },
    {
      id: `decision_${gardenId}_002`,
      type: 'Fertilization',
      title: 'Rekomendasi Pemupukan',
      description: 'Kadar nitrogen rendah, disarankan untuk menambah pupuk NPK',
      priority: 'medium',
      action: 'Tambahkan 2kg pupuk NPK 16-16-16',
      confidence: 78,
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 jam lalu
    },
    {
      id: `decision_${gardenId}_003`,
      type: 'Weather',
      title: 'Peringatan Cuaca',
      description: 'Hujan lebat diprediksi dalam 2 jam, kurangi intensitas penyiraman',
      priority: 'high',
      action: 'Matikan sistem irigasi otomatis',
      confidence: 92,
      timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 menit lalu
    },
  ]
  
  return decisions
}

// Get sensor data for a garden
const getSensorData = async (req, res, next) => {
  try {
    const { gardenId } = req.params
    const userId = req.user.id

    // Verify garden belongs to user
    const gardenCheck = await pool.query(
      'SELECT id FROM garden WHERE id = $1 AND user_id = $2',
      [gardenId, userId]
    )

    if (gardenCheck.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Lahan tidak ditemukan'
      })
    }

    // Generate mock sensor data
    const sensors = generateMockSensorData(gardenId)
    
    logger.api(`[getSensorData] Returning ${sensors.length} sensors for garden ${gardenId}`)

    res.json({
      status: 'success',
      message: 'Data sensor berhasil diambil',
      data: {
        sensors,
        gardenId,
        timestamp: new Date().toISOString(),
        totalSensors: sensors.length,
        onlineSensors: sensors.filter(s => s.isOnline).length,
      }
    })
  } catch (err) {
    err.source = 'getSensorData'
    next(err)
  }
}

// Get pump data for a garden
const getPumpData = async (req, res, next) => {
  try {
    const { gardenId } = req.params
    const userId = req.user.id

    // Verify garden belongs to user
    const gardenCheck = await pool.query(
      'SELECT id FROM garden WHERE id = $1 AND user_id = $2',
      [gardenId, userId]
    )

    if (gardenCheck.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Lahan tidak ditemukan'
      })
    }

    // Generate mock pump data
    const pumps = generateMockPumpData(gardenId)
    
    logger.api(`[getPumpData] Returning ${pumps.length} pumps for garden ${gardenId}`)

    res.json({
      status: 'success',
      message: 'Data pompa berhasil diambil',
      data: {
        pumps,
        gardenId,
        timestamp: new Date().toISOString(),
        totalPumps: pumps.length,
        activePumps: pumps.filter(p => p.status === 'ON').length,
      }
    })
  } catch (err) {
    err.source = 'getPumpData'
    next(err)
  }
}

// Get smart decisions for a garden
const getSmartDecisions = async (req, res, next) => {
  try {
    const { gardenId } = req.params
    const userId = req.user.id

    // Verify garden belongs to user
    const gardenCheck = await pool.query(
      'SELECT id FROM garden WHERE id = $1 AND user_id = $2',
      [gardenId, userId]
    )

    if (gardenCheck.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Lahan tidak ditemukan'
      })
    }

    // Generate mock smart decisions
    const decisions = generateMockSmartDecisions(gardenId)
    
    logger.api(`[getSmartDecisions] Returning ${decisions.length} decisions for garden ${gardenId}`)

    res.json({
      status: 'success',
      message: 'Rekomendasi cerdas berhasil diambil',
      data: {
        decisions,
        gardenId,
        timestamp: new Date().toISOString(),
        totalDecisions: decisions.length,
        highPriorityDecisions: decisions.filter(d => d.priority === 'high').length,
      }
    })
  } catch (err) {
    err.source = 'getSmartDecisions'
    next(err)
  }
}

// Get garden overview with real-time data
const getGardenOverview = async (req, res, next) => {
  try {
    const { gardenId } = req.params
    const userId = req.user.id

    // Get garden info
    const gardenResult = await pool.query(
      'SELECT * FROM garden WHERE id = $1 AND user_id = $2',
      [gardenId, userId]
    )

    if (gardenResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Lahan tidak ditemukan'
      })
    }

    const garden = gardenResult.rows[0]
    
    // Generate mock data
    const sensors = generateMockSensorData(gardenId)
    const pumps = generateMockPumpData(gardenId)
    const decisions = generateMockSmartDecisions(gardenId)
    
    // Calculate overall conditions
    const avgTemperature = sensors.reduce((sum, s) => sum + parseFloat(s.data.temperature), 0) / sensors.length
    const avgMoisture = sensors.reduce((sum, s) => sum + parseFloat(s.data.moisture), 0) / sensors.length
    const avgPh = sensors.reduce((sum, s) => sum + parseFloat(s.data.ph), 0) / sensors.length
    
    // Determine overall status
    let overallStatus = 'optimal'
    if (avgMoisture < 40 || avgTemperature > 35) {
      overallStatus = 'warning'
    }
    if (avgMoisture < 25 || avgTemperature > 40) {
      overallStatus = 'critical'
    }

    const overview = {
      garden: {
        id: garden.id,
        name: garden.name,
        area: garden.area,
        area_unit: garden.area_unit,
        created_at: garden.created_at,
      },
      conditions: {
        temperature: avgTemperature.toFixed(1),
        moisture: avgMoisture.toFixed(1),
        ph: avgPh.toFixed(1),
        status: overallStatus,
      },
      sensors: {
        total: sensors.length,
        online: sensors.filter(s => s.isOnline).length,
        data: sensors,
      },
      pumps: {
        total: pumps.length,
        active: pumps.filter(p => p.status === 'ON').length,
        data: pumps,
      },
      smartDecisions: {
        total: decisions.length,
        highPriority: decisions.filter(d => d.priority === 'high').length,
        data: decisions,
      },
      lastUpdate: new Date().toISOString(),
    }
    
    logger.api(`[getGardenOverview] Returning overview for garden ${gardenId}`)

    res.json({
      status: 'success',
      message: 'Overview lahan berhasil diambil',
      data: overview
    })
  } catch (err) {
    err.source = 'getGardenOverview'
    next(err)
  }
}

module.exports = {
  getSensorData,
  getPumpData,
  getSmartDecisions,
  getGardenOverview,
}
