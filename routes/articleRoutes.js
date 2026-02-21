const express = require('express');
const router = express.Router();
const {
  getAllArticles,
  getArticleBySlug,
  shareArticle
} = require('../controllers/articleController');

/**
 * Routes API pour les articles
 * Toutes les routes sont préfixées par /api/articles
 * 
 * Endpoints disponibles:
 * - GET /api/articles - Liste des articles publiés (avec pagination et filtres)
 * - GET /api/articles/:slug - Détails d'un article par son slug
 * - POST /api/articles/:slug/share - Enregistrer un partage d'article
 */

// Route publique - Liste des articles
router.get('/', getAllArticles);

// Route publique - Enregistrer un partage (doit être avant /:slug pour éviter les conflits)
router.post('/:slug/share', shareArticle);

// Route publique - Article par slug
router.get('/:slug', getArticleBySlug);

module.exports = router;

