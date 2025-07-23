const axios = require("axios")
const logger = require("../utils/logger")

class WeatherService {
    constructor() {
        this.baseUrl = "https://api.open-meteo.com/v1"
        this.geocodingUrl = "https://geocoding-api.open-meteo.com/v1/search"
        // Add timeout and retry configuration
        this.axiosConfig = {
            timeout: 10000, // 10 seconds timeout
            retry: 3,
            retryDelay: 1000 // 1 second delay between retries
        }
    }

    /**
     * Retry wrapper for axios requests
     */
    async _retryRequest(requestFn, retries = 3, delay = 1000) {
        for (let i = 0; i < retries; i++) {
            try {
                return await requestFn()
            } catch (error) {
                logger.weather(`Request attempt ${i + 1} failed: ${error.message}`)

                if (i === retries - 1) {
                    throw error
                }

                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, delay))
                delay *= 2 // Exponential backoff
            }
        }
    }

    /**
     * Mendapatkan koordinat berdasarkan nama kota dengan retry logic
     */
    async getCoordinates(city) {
        try {
            logger.weather(`Getting coordinates for city: ${city}`)

            const response = await this._retryRequest(async () => {
                return await axios.get(
                    `${this.geocodingUrl}?name=${city}&count=1&language=id&format=json`,
                    { timeout: this.axiosConfig.timeout }
                )
            }, this.axiosConfig.retry, this.axiosConfig.retryDelay)

            if (response.status === 200 && response.data.results && response.data.results.length > 0) {
                const result = response.data.results[0]
                logger.weather(`Successfully found coordinates for ${city}: ${result.latitude}, ${result.longitude}`)
                return {
                    latitude: result.latitude,
                    longitude: result.longitude,
                    name: result.name,
                    country: result.country,
                }
            } else {
                logger.weather(`City ${city} not found in geocoding results, using Jakarta as default`)
                return this._getDefaultCoordinates()
            }
        } catch (error) {
            logger.error(`Error getting coordinates for ${city} after retries: ${error.message}`)

            // Log specific error types for better debugging
            if (error.code === 'EAI_AGAIN') {
                logger.error(`DNS resolution failed for geocoding API. Check internet connection.`)
            } else if (error.code === 'ECONNABORTED') {
                logger.error(`Request timeout when connecting to geocoding API.`)
            } else if (error.code === 'ENOTFOUND') {
                logger.error(`Geocoding API host not found. Check DNS settings.`)
            }

            error.source = "weather"
            return this._getDefaultCoordinates()
        }
    }

    /**
     * Get default coordinates (Jakarta)
     */
    _getDefaultCoordinates() {
        return {
            latitude: -6.2088,
            longitude: 106.8456,
            name: "Jakarta",
            country: "Indonesia",
        }
    }

    /**
     * Mendapatkan data cuaca berdasarkan koordinat dengan retry logic
     */
    async getWeatherByCoordinates(lat, lon, cityName = null, country = null) {
        try {
            logger.weather(`Getting weather for coordinates: ${lat}, ${lon}`)

            const params = {
                latitude: lat.toString(),
                longitude: lon.toString(),
                current:
                    "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl",
                hourly: "temperature_2m,precipitation_probability,weather_code",
                daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
                timezone: "auto",
                forecast_days: "7",
            }

            const response = await this._retryRequest(async () => {
                return await axios.get(`${this.baseUrl}/forecast`, {
                    params,
                    timeout: this.axiosConfig.timeout
                })
            }, this.axiosConfig.retry, this.axiosConfig.retryDelay)

            if (response.status === 200) {
                const data = response.data

                if (cityName && country) {
                    data.city_name = cityName
                    data.country = country
                }

                logger.weather(`Successfully retrieved weather data for ${cityName || 'coordinates'}`)
                return data
            } else {
                throw new Error(`Failed to get weather data: ${response.status}`)
            }
        } catch (error) {
            logger.error(`Error getting weather data after retries: ${error.message}`)

            // Log specific error types
            if (error.code === 'EAI_AGAIN') {
                logger.error(`DNS resolution failed for weather API. Check internet connection.`)
            } else if (error.code === 'ECONNABORTED') {
                logger.error(`Request timeout when connecting to weather API.`)
            }

            error.source = "weather"
            throw error
        }
    }

    /**
     * Mendapatkan data cuaca berdasarkan kota
     */
    async getWeatherByCity(city) {
        try {
            logger.weather(`Getting weather for city: ${city}`)
            const coordinates = await this.getCoordinates(city)
            return await this.getWeatherByCoordinates(
                coordinates.latitude,
                coordinates.longitude,
                coordinates.name,
                coordinates.country,
            )
        } catch (error) {
            error.source = "weather"
            throw error
        }
    }

    /**
     * Mendapatkan prakiraan cuaca berdasarkan kota
     */
    async getForecastByCity(city) {
        return await this.getWeatherByCity(city)
    }

    /**
     * Mendapatkan prakiraan cuaca berdasarkan koordinat
     */
    async getForecastByCoordinates(lat, lon) {
        return await this.getWeatherByCoordinates(lat, lon)
    }

    /**
     * Format data cuaca menjadi teks yang mudah dibaca
     */
    formatWeatherData(weatherData) {
        try {
            const current = weatherData.current
            const cityName = weatherData.city_name || "lokasi yang ditentukan"
            const country = weatherData.country || "Indonesia"
            const weatherCode = current.weather_code
            const weatherDescription = this._getWeatherDescription(weatherCode)

            return `Cuaca di ${cityName}, ${country}:
- Kondisi: ${weatherDescription}
- Suhu: ${current.temperature_2m}${weatherData.current_units.temperature_2m}
- Kelembaban: ${current.relative_humidity_2m}${weatherData.current_units.relative_humidity_2m}
- Curah hujan: ${current.precipitation}${weatherData.current_units.precipitation}
- Kecepatan angin: ${current.wind_speed_10m}${weatherData.current_units.wind_speed_10m}
- Tekanan udara: ${current.pressure_msl}${weatherData.current_units.pressure_msl}`
        } catch (error) {
            return `Gagal memformat data cuaca: ${error.message}`
        }
    }

    /**
     * Mendapatkan deskripsi cuaca berdasarkan kode cuaca dari Open-Meteo
     */
    _getWeatherDescription(code) {
        const weatherCodes = {
            0: "Cerah",
            1: "Sebagian berawan",
            2: "Berawan",
            3: "Mendung",
            45: "Kabut",
            48: "Kabut tebal",
            51: "Gerimis ringan",
            53: "Gerimis sedang",
            55: "Gerimis lebat",
            56: "Gerimis dingin ringan",
            57: "Gerimis dingin lebat",
            61: "Hujan ringan",
            63: "Hujan sedang",
            65: "Hujan lebat",
            66: "Hujan dingin ringan",
            67: "Hujan dingin lebat",
            71: "Salju ringan",
            73: "Salju sedang",
            75: "Salju lebat",
            77: "Butiran salju",
            80: "Hujan lebat ringan",
            81: "Hujan lebat sedang",
            82: "Hujan lebat ekstrem",
            85: "Salju lebat ringan",
            86: "Salju lebat berat",
            95: "Badai petir",
            96: "Badai petir dengan hujan es ringan",
            99: "Badai petir dengan hujan es berat",
        }

        return weatherCodes[code] || "Tidak diketahui"
    }

    /**
     * Format data prakiraan cuaca menjadi teks yang mudah dibaca
     */
    formatForecastData(forecastData) {
        try {
            const daily = forecastData.daily
            const cityName = forecastData.city_name || "lokasi yang ditentukan"
            const country = forecastData.country || "Indonesia"
            const dates = daily.time.slice(0, 5) // Ambil 5 hari pertama

            let result = `Prakiraan cuaca 5 hari untuk ${cityName}, ${country}:\n`

            for (let i = 0; i < dates.length; i++) {
                const date = new Date(dates[i])
                const weatherCode = daily.weather_code[i]
                const weatherDescription = this._getWeatherDescription(weatherCode)
                const tempMax = daily.temperature_2m_max[i]
                const tempMin = daily.temperature_2m_min[i]
                const precipSum = daily.precipitation_sum[i]
                const precipProb = daily.precipitation_probability_max[i]

                result += `${this._formatDate(date)}:
- Kondisi: ${weatherDescription}
- Suhu: min ${tempMin}${forecastData.daily_units.temperature_2m_min}, max ${tempMax}${forecastData.daily_units.temperature_2m_max}
- Curah hujan: ${precipSum}${forecastData.daily_units.precipitation_sum}
- Probabilitas hujan: ${precipProb}${forecastData.daily_units.precipitation_probability_max}
`
            }

            return result
        } catch (error) {
            return `Gagal memformat data prakiraan cuaca: ${error.message}`
        }
    }

    /**
     * Helper untuk memformat tanggal ke bentuk hari dan tanggal
     */
    _formatDate(date) {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

        if (targetDate.getTime() === today.getTime()) {
            return `Hari ini (${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()})`
        } else if (targetDate.getTime() === tomorrow.getTime()) {
            return `Besok (${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()})`
        } else {
            const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
            return `${days[date.getDay()]} (${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()})`
        }
    }
}

module.exports = WeatherService
