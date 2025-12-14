const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getSearchSuggestions
} = require('../controllers/articleController');
const { authenticate, isAdmin } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

/**
 * Routes pour la gestion des articles
 * Toutes les routes sont préfixées par /api/articles
 */

// Validation pour la création et la modification d'articles
const articleValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Le titre est obligatoire')
    .isLength({ max: 200 }).withMessage('Le titre ne peut pas dépasser 200 caractères'),
  body('content')
    .trim()
    .notEmpty().withMessage('Le contenu est obligatoire')
    .isLength({ min: 50 }).withMessage('Le contenu doit contenir au moins 50 caractères'),
  body('category')
    .notEmpty().withMessage('La catégorie est obligatoire')
    .isMongoId().withMessage('ID de catégorie invalide'),
  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Le résumé ne peut pas dépasser 500 caractères'),
  body('status')
    .optional()
    .isIn(['draft', 'published']).withMessage('Le statut doit être draft ou published'),
  body('tags')
    .optional()
    .isArray().withMessage('Les tags doivent être un tableau'),
  handleValidationErrors
];

// Routes publiques
router.get('/search/suggestions', getSearchSuggestions);
router.get('/suggestions', getSearchSuggestions); // Alias pour compatibilité avec le frontend
router.get('/', getAllArticles);
router.get('/:id', getArticleById);

// Routes protégées (admin uniquement)
router.post('/', authenticate, isAdmin, articleValidation, createArticle);
router.put('/:id', authenticate, isAdmin, articleValidation, updateArticle);
router.delete('/:id', authenticate, isAdmin, deleteArticle);

module.exports = router;

