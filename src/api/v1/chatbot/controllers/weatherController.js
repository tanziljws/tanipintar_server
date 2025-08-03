const WeatherService = require("../services/weatherService")
const logger = require("../../../../utils/logger")

class WeatherController {
    constructor() {
        this.weatherService = new WeatherService()
    }

    /**
     * Mendapatkan cuaca berdasarkan nama kota
     * Endpoint: GET /api/weather/city/:city
     */
    async getWeatherByCity(req, res) {
        try {
            const { city } = req.params
            logger.api(`Weather request for city: ${city}`)

            if (!city) {
                return res.status(400).json({
                    status: "fail",
                    message: "Nama kota harus disediakan",
                })
            }

            const weatherData = await this.weatherService.getWeatherByCity(city)

            res.json({
                status: "success",
                message: "Data cuaca berhasil diambil",
                data: weatherData,
                formatted: {
                    current: this.weatherService.formatWeatherData(weatherData),
                    forecast: this.weatherService.formatForecastData(weatherData),
                },
            })
        } catch (error) {
            logger.error(`Error in getWeatherByCity: ${error.message}`)
            res.status(500).json({
                status: "error",
                message: "Gagal mendapatkan data cuaca",
            })
        }
    }

    /**
     * Mendapatkan cuaca berdasarkan koordinat
     * Endpoint: GET /api/weather/coordinates
     */
    async getWeatherByCoordinates(req, res) {
        try {
            const { lat, lon, cityName, country } = req.query
            logger.api(`Weather request for coordinates: ${lat}, ${lon}`)

            if (!lat || !lon) {
                return res.status(400).json({
                    status: "fail",
                    message: "Latitude dan longitude harus disediakan",
                })
            }

            const latitude = Number.parseFloat(lat)
            const longitude = Number.parseFloat(lon)

            if (isNaN(latitude) || isNaN(longitude)) {
                return res.status(400).json({
                    status: "fail",
                    message: "Latitude dan longitude harus berupa angka yang valid",
                })
            }

            const weatherData = await this.weatherService.getWeatherByCoordinates(latitude, longitude, cityName, country)

            res.json({
                status: "success",
                message: "Data cuaca berhasil diambil",
                data: weatherData,
                formatted: {
                    current: this.weatherService.formatWeatherData(weatherData),
                    forecast: this.weatherService.formatForecastData(weatherData),
                },
            })
        } catch (error) {
            logger.error(`Error in getWeatherByCoordinates: ${error.message}`)
            res.status(500).json({
                status: "error",
                message: "Gagal mendapatkan data cuaca",
            })
        }
    }

    /**
     * Mendapatkan koordinat berdasarkan nama kota
     * Endpoint: GET /api/weather/geocoding/:city
     */
    async getCoordinates(req, res) {
        try {
            const { city } = req.params
            logger.api(`Geocoding request for city: ${city}`)

            if (!city) {
                return res.status(400).json({
                    status: "fail",
                    message: "Nama kota harus disediakan",
                })
            }

            const coordinates = await this.weatherService.getCoordinates(city)

            res.json({
                status: "success",
                message: "Koordinat berhasil diambil",
                data: coordinates,
            })
        } catch (error) {
            logger.error(`Error in getCoordinates: ${error.message}`)
            res.status(500).json({
                status: "error",
                message: "Gagal mendapatkan koordinat",
            })
        }
    }
}

module.exports = WeatherController
