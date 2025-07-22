const { query, param, validationResult } = require("express-validator")

/**
 * Validator untuk weather by city
 */
const validateWeatherByCity = [
    param("city")
        .notEmpty()
        .withMessage("Nama kota tidak boleh kosong")
        .isString()
        .withMessage("Nama kota harus berupa string")
        .isLength({ min: 2, max: 100 })
        .withMessage("Nama kota harus antara 2-100 karakter"),

    (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: "fail",
                message: "Data yang dikirim tidak valid",
                errors: errors.array(),
            })
        }
        next()
    },
]

/**
 * Validator untuk weather by coordinates
 */
const validateWeatherByCoordinates = [
    query("lat")
        .notEmpty()
        .withMessage("Latitude tidak boleh kosong")
        .isFloat({ min: -90, max: 90 })
        .withMessage("Latitude harus berupa angka antara -90 dan 90"),

    query("lon")
        .notEmpty()
        .withMessage("Longitude tidak boleh kosong")
        .isFloat({ min: -180, max: 180 })
        .withMessage("Longitude harus berupa angka antara -180 dan 180"),

    query("cityName")
        .optional()
        .isString()
        .withMessage("Nama kota harus berupa string")
        .isLength({ max: 100 })
        .withMessage("Nama kota maksimal 100 karakter"),

    query("country")
        .optional()
        .isString()
        .withMessage("Nama negara harus berupa string")
        .isLength({ max: 100 })
        .withMessage("Nama negara maksimal 100 karakter"),

    (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: "fail",
                message: "Data yang dikirim tidak valid",
                errors: errors.array(),
            })
        }
        next()
    },
]

/**
 * Validator untuk geocoding
 */
const validateGeocoding = [
    param("city")
        .notEmpty()
        .withMessage("Nama kota tidak boleh kosong")
        .isString()
        .withMessage("Nama kota harus berupa string")
        .isLength({ min: 2, max: 100 })
        .withMessage("Nama kota harus antara 2-100 karakter"),

    (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: "fail",
                message: "Data yang dikirim tidak valid",
                errors: errors.array(),
            })
        }
        next()
    },
]

module.exports = {
    validateWeatherByCity,
    validateWeatherByCoordinates,
    validateGeocoding,
}
