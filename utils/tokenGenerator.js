const crypto = require('crypto');

/**
 * Génère un token de confirmation sécurisé
 * @returns {string} Token cryptographiquement sécurisé (64 caractères hex)
 */
function generateConfirmationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Génère une date d'expiration pour le token (par défaut 48 heures)
 * @param {number} hours - Nombre d'heures avant expiration (défaut: 48)
 * @returns {Date} Date d'expiration
 */
function generateTokenExpiration(hours = 48) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/**
 * Vérifie si un token a expiré
 * @param {Date} expirationDate - Date d'expiration du token
 * @returns {boolean} True si le token a expiré
 */
function isTokenExpired(expirationDate) {
  if (!expirationDate) {
    return true;
  }
  return new Date() > new Date(expirationDate);
}

module.exports = {
  generateConfirmationToken,
  generateTokenExpiration,
  isTokenExpired
};

