/**
 * Configuration API pour le frontend React
 * 
 * Copiez ce fichier dans votre projet frontend et configurez-le selon votre environnement
 * 
 * Usage:
 * import { API_BASE_URL, apiConfig } from './config/api';
 * 
 * const response = await fetch(`${API_BASE_URL}/articles`);
 */

// ============================================
// Configuration de base
// ============================================

// Option 1 : Utiliser une variable d'environnement (recommandé)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Option 2 : Configuration directe (si pas de variables d'environnement)
// const API_BASE_URL = 'http://localhost:5000/api';

// Option 3 : Détection automatique selon l'environnement
// const API_BASE_URL = 
//   import.meta.env.MODE === 'production'
//     ? 'https://api.xcafrique.com/api'
//     : 'http://localhost:5000/api';

// ============================================
// Configuration Axios (si vous utilisez Axios)
// ============================================

import axios from 'axios';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 secondes
});

// Intercepteur pour les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Erreur de réponse du serveur
      console.error('API Error:', error.response.data);
      return Promise.reject({
        message: error.response.data.message || 'Erreur serveur',
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      // Requête envoyée mais pas de réponse
      console.error('Network Error:', error.request);
      return Promise.reject({
        message: 'Erreur de connexion au serveur',
        status: 0,
      });
    } else {
      // Erreur lors de la configuration de la requête
      console.error('Request Error:', error.message);
      return Promise.reject({
        message: error.message || 'Erreur inconnue',
        status: 0,
      });
    }
  }
);

// ============================================
// Fonctions utilitaires
// ============================================

/**
 * Fonction générique pour les requêtes GET
 */
export const get = async (endpoint, params = {}) => {
  try {
    const response = await apiClient.get(endpoint, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fonction générique pour les requêtes POST
 */
export const post = async (endpoint, data = {}) => {
  try {
    const response = await apiClient.post(endpoint, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ============================================
// Exports
// ============================================

export { API_BASE_URL };

export default {
  API_BASE_URL,
  apiClient,
  get,
  post,
};

