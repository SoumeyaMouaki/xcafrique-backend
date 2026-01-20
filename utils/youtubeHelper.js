/**
 * Utilitaires pour gérer les URLs YouTube
 * Convertit les URLs YouTube watch en URLs embed pour l'intégration dans des iframes
 */

/**
 * Convertit une URL YouTube en URL embed
 * @param {string} youtubeUrl - URL YouTube (watch, youtu.be, ou embed)
 * @returns {string|null} URL embed ou null si l'URL n'est pas valide
 * 
 * @example
 * convertToEmbedUrl('https://www.youtube.com/watch?v=_LcJ7hSZuX0')
 * // Returns: 'https://www.youtube.com/embed/_LcJ7hSZuX0'
 */
function convertToEmbedUrl(youtubeUrl) {
  if (!youtubeUrl || typeof youtubeUrl !== 'string') {
    return null;
  }

  // Nettoyer l'URL
  const url = youtubeUrl.trim();

  // Si c'est déjà une URL embed, la retourner telle quelle
  if (url.includes('youtube.com/embed/')) {
    return url;
  }

  // Extraire l'ID de la vidéo depuis différentes formats d'URL
  let videoId = null;

  // Format: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) {
    videoId = watchMatch[1];
  }

  // Format: https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) {
    videoId = shortMatch[1];
  }

  // Format: https://www.youtube.com/embed/VIDEO_ID (déjà embed)
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) {
    return url; // Déjà au bon format
  }

  // Si on a trouvé un ID, construire l'URL embed
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  // Si aucun format reconnu, retourner null
  return null;
}

/**
 * Extrait l'ID de la vidéo YouTube depuis une URL
 * @param {string} youtubeUrl - URL YouTube
 * @returns {string|null} ID de la vidéo ou null
 */
function extractVideoId(youtubeUrl) {
  if (!youtubeUrl || typeof youtubeUrl !== 'string') {
    return null;
  }

  const url = youtubeUrl.trim();

  // Format: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) {
    return watchMatch[1];
  }

  // Format: https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) {
    return shortMatch[1];
  }

  // Format: https://www.youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) {
    return embedMatch[1];
  }

  return null;
}

/**
 * Génère le code HTML pour intégrer une vidéo YouTube
 * @param {string} youtubeUrl - URL YouTube
 * @param {object} options - Options pour l'iframe
 * @param {number} options.width - Largeur de l'iframe (défaut: 560)
 * @param {number} options.height - Hauteur de l'iframe (défaut: 315)
 * @param {boolean} options.allowFullscreen - Autoriser le plein écran (défaut: true)
 * @returns {string|null} Code HTML de l'iframe ou null si l'URL n'est pas valide
 */
function generateEmbedHtml(youtubeUrl, options = {}) {
  const embedUrl = convertToEmbedUrl(youtubeUrl);
  
  if (!embedUrl) {
    return null;
  }

  const {
    width = 560,
    height = 315,
    allowFullscreen = true
  } = options;

  const fullscreenAttr = allowFullscreen ? 'allowfullscreen' : '';
  
  return `<div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;">
  <iframe 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
    src="${embedUrl}" 
    frameborder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
    ${fullscreenAttr}
  ></iframe>
</div>`;
}

module.exports = {
  convertToEmbedUrl,
  extractVideoId,
  generateEmbedHtml
};

