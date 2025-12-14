const { validationResult } = require('express-validator');

/**
 * Middleware pour gérer les erreurs de validation
 * Vérifie les résultats de la validation express-validator
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors: errors.array()
    });
  }
  
  next();
};

module.exports = { handleValidationErrors };

