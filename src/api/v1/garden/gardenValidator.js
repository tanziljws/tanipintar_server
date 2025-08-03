const { body, validationResult } = require('express-validator');

const gardenValidation = [
    body('name').notEmpty().withMessage('Nama lahan wajib diisi'),
    body('area').isNumeric().withMessage('Luas lahan harus berupa angka'),
    body('area_unit').isIn(['are', 'ha', 'km2']).withMessage('Unit luas tidak valid'),
    (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        next()
    }
]

module.exports = { gardenValidation }