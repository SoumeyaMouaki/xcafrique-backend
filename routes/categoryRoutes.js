const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  getCategoryById
} = require('../controllers/categoryController');

/**
 * Routes API pour les catégories
 * Toutes les routes sont préfixées par /api/categories
 * 
 * Endpoints disponibles:
 * - GET /api/categories - Liste de toutes les catégories actives
 * - GET /api/categories/:id - Détails d'une catégorie par son ID
 */

// Routes publiques
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

module.exports = router;

