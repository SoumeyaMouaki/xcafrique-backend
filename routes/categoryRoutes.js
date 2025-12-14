const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { authenticate, isAdmin } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

/**
 * Routes pour la gestion des catégories
 * Toutes les routes sont préfixées par /api/categories
 */

// Validation pour la création et la modification de catégories
const categoryValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Le nom de la catégorie est obligatoire')
    .isLength({ max: 100 }).withMessage('Le nom ne peut pas dépasser 100 caractères'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La description ne peut pas dépasser 500 caractères'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('La couleur doit être au format hexadécimal'),
  handleValidationErrors
];

// Routes publiques
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Routes protégées (admin uniquement)
router.post('/', authenticate, isAdmin, categoryValidation, createCategory);
router.put('/:id', authenticate, isAdmin, categoryValidation, updateCategory);
router.delete('/:id', authenticate, isAdmin, deleteCategory);

module.exports = router;

