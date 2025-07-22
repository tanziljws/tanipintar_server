/**
 * Helper untuk standardisasi response API sesuai format yang sudah ada
 */
class ResponseHelper {
    /**
     * Success response
     */
    static success(res, data = null, message = "Berhasil", statusCode = 200) {
        return res.status(statusCode).json({
            status: "success",
            message,
            data,
            timestamp: new Date().toISOString(),
        })
    }

    /**
     * Error response
     */
    static error(res, message = "Terjadi kesalahan", statusCode = 500, errors = null) {
        return res.status(statusCode).json({
            status: "error",
            message,
            ...(errors && { errors }),
            timestamp: new Date().toISOString(),
        })
    }

    /**
     * Fail response (client error)
     */
    static fail(res, message = "Permintaan tidak valid", statusCode = 400, errors = null) {
        return res.status(statusCode).json({
            status: "fail",
            message,
            ...(errors && { errors }),
            timestamp: new Date().toISOString(),
        })
    }

    /**
     * Validation error response
     */
    static validationError(res, errors) {
        return res.status(400).json({
            status: "fail",
            message: "Data yang dikirim tidak valid",
            errors,
            timestamp: new Date().toISOString(),
        })
    }

    /**
     * Not found response
     */
    static notFound(res, message = "Data tidak ditemukan") {
        return res.status(404).json({
            status: "fail",
            message,
            timestamp: new Date().toISOString(),
        })
    }

    /**
     * Unauthorized response
     */
    static unauthorized(res, message = "Tidak memiliki akses") {
        return res.status(401).json({
            status: "fail",
            message,
            timestamp: new Date().toISOString(),
        })
    }

    /**
     * Service unavailable response
     */
    static serviceUnavailable(res, message = "Layanan sedang tidak tersedia") {
        return res.status(503).json({
            status: "error",
            message,
            timestamp: new Date().toISOString(),
        })
    }
}

module.exports = ResponseHelper
