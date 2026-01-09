const express = require('express');
const router = express.Router();
const {
  getAllVideos,
  getVideoBySlug
} = require('../controllers/videoController');

/**
 * Routes API pour les vidéos
 * Toutes les routes sont préfixées par /api/videos
 * 
 * Les vidéos sont des articles avec un champ videoUrl
 * 
 * Endpoints disponibles:
 * - GET /api/videos - Liste des vidéos publiées (avec pagination et filtres)
 * - GET /api/videos/:slug - Détails d'une vidéo par son slug
 */

// Route publique - Liste des vidéos
router.get('/', getAllVideos);

// Route publique - Vidéo par slug
router.get('/:slug', getVideoBySlug);

module.exports = router;

