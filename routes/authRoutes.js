const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  login,
  getMe,
  logout
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

/**
 * Routes pour l'authentification
 * Toutes les routes sont préfixées par /api/auth
 */

// Validation pour le login
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est obligatoire')
    .isEmail().withMessage('Veuillez fournir un email valide'),
  body('password')
    .notEmpty().withMessage('Le mot de passe est obligatoire')
    .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  handleValidationErrors
];

// Routes
router.post('/login', loginValidation, login);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

module.exports = router;

