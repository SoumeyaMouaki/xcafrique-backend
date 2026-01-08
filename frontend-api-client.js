/**
 * Client API pour le frontend React
 * Exemple d'implémentation avec Fetch API
 * 
 * Usage:
 * import { apiClient } from './api-client';
 * 
 * const articles = await apiClient.getArticles({ page: 1, limit: 10 });
 * const article = await apiClient.getArticleBySlug('article-slug');
 * const categories = await apiClient.getCategories();
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Classe utilitaire pour les appels API
 */
class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Méthode générique pour les requêtes
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * GET /api/articles
   * Liste des articles publiés
   */
  async getArticles(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.category) queryParams.append('category', params.category);
    if (params.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const endpoint = `/articles${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  /**
   * GET /api/articles/:slug
   * Détails d'un article par slug
   */
  async getArticleBySlug(slug) {
    return this.request(`/articles/${slug}`);
  }

  /**
   * GET /api/categories
   * Liste des catégories actives
   */
  async getCategories() {
    return this.request('/categories');
  }

  /**
   * GET /api/categories/:id
   * Détails d'une catégorie par ID
   */
  async getCategoryById(id) {
    return this.request(`/categories/${id}`);
  }
}

// Export d'une instance singleton
export const apiClient = new ApiClient();

// Export de la classe pour créer d'autres instances si nécessaire
export default ApiClient;

