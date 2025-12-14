const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  subscribe,
  getAllSubscribers,
  getSubscriberById,
  unsubscribe,
  confirm,
  resendConfirmation,
  getStats: getNewsletterStats
} = require('../controllers/newsletterController');
const {
  stream,
  getStats: getSSEStats
} = require('../controllers/sseController');
const { authenticate, isAdmin } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

/**
 * Routes pour la gestion de la newsletter
 * Toutes les routes sont préfixées par /api/newsletter
 */

// Validation pour l'abonnement
const subscribeValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('L\'adresse email est requise.')
    .isEmail().withMessage('Veuillez fournir une adresse email valide.')
    .normalizeEmail(),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Le nom ne peut pas dépasser 100 caractères'),
  body('source')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('La source ne peut pas dépasser 50 caractères'),
  handleValidationErrors
];

// Validation pour le désabonnement
const unsubscribeValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('L\'adresse email est requise.')
    .isEmail().withMessage('Veuillez fournir une adresse email valide.')
    .normalizeEmail(),
  handleValidationErrors
];

// Validation pour la confirmation
const confirmValidation = [
  body('token')
    .trim()
    .notEmpty().withMessage('Le token de confirmation est requis.')
    .isLength({ min: 32 }).withMessage('Le token de confirmation est invalide.'),
  handleValidationErrors
];

// Validation pour le renvoi de confirmation
const resendConfirmationValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('L\'adresse email est requise.')
    .isEmail().withMessage('Veuillez fournir une adresse email valide.')
    .normalizeEmail(),
  handleValidationErrors
];

// Route publique - S'abonner
router.post('/subscribe', subscribeValidation, subscribe);

// Route publique - Confirmer l'email
router.post('/confirm', confirmValidation, confirm);

// Route publique - Renvoyer l'email de confirmation
router.post('/resend-confirmation', resendConfirmationValidation, resendConfirmation);

// Route publique - Se désabonner
router.post('/unsubscribe', unsubscribeValidation, unsubscribe);

// Route publique - Statistiques de la newsletter
router.get('/stats', getNewsletterStats);

// Route publique - Stream SSE pour les notifications en temps réel
router.get('/stream', stream);

// Route publique - Statistiques des connexions SSE
router.get('/stream/stats', getSSEStats);

// Routes protégées (admin uniquement)
router.get('/subscribers', authenticate, isAdmin, getAllSubscribers);
router.get('/subscribers/:id', authenticate, isAdmin, getSubscriberById);

module.exports = router;

