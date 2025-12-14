const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  sendMessage,
  getAllMessages,
  getMessageById,
  updateMessageStatus
} = require('../controllers/contactController');
const { authenticate, isAdmin } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

/**
 * Routes pour la gestion des messages de contact
 * Toutes les routes sont préfixées par /api/contact
 */

// Validation pour l'envoi de message
const contactValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Le nom est obligatoire')
    .isLength({ max: 100 }).withMessage('Le nom ne peut pas dépasser 100 caractères'),
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est obligatoire')
    .isEmail().withMessage('Veuillez fournir un email valide'),
  body('subject')
    .trim()
    .notEmpty().withMessage('Le sujet est obligatoire')
    .isLength({ max: 200 }).withMessage('Le sujet ne peut pas dépasser 200 caractères'),
  body('message')
    .trim()
    .notEmpty().withMessage('Le message est obligatoire')
    .isLength({ max: 5000 }).withMessage('Le message ne peut pas dépasser 5000 caractères'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Le numéro de téléphone ne peut pas dépasser 20 caractères'),
  handleValidationErrors
];

// Route publique
router.post('/', contactValidation, sendMessage);

// Routes protégées (admin uniquement)
router.get('/', authenticate, isAdmin, getAllMessages);
router.get('/:id', authenticate, isAdmin, getMessageById);
router.put('/:id/status', authenticate, isAdmin, updateMessageStatus);

module.exports = router;

