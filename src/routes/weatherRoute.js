const express = require("express")
const WeatherController = require("../controllers/weatherController")
const {
    validateWeatherByCity,
    validateWeatherByCoordinates,
    validateGeocoding,
} = require("../validators/weatherValidator")

const router = express.Router()
const weatherController = new WeatherController()

// GET /api/weather/city/:city - Mendapatkan cuaca berdasarkan nama kota
router.get("/city/:city", validateWeatherByCity, (req, res) => weatherController.getWeatherByCity(req, res))

// GET /api/weather/coordinates - Mendapatkan cuaca berdasarkan koordinat
router.get("/coordinates", validateWeatherByCoordinates, (req, res) =>
    weatherController.getWeatherByCoordinates(req, res),
)

// GET /api/weather/geocoding/:city - Mendapatkan koordinat berdasarkan nama kota
router.get("/geocoding/:city", validateGeocoding, (req, res) => weatherController.getCoordinates(req, res))

module.exports = router