require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Gestionnaire de contenu pour XC Afrique
 * Automatise la sauvegarde de contenu (articles, catégories) dans MongoDB via l'API REST
 */

class ContentManager {
  constructor() {
    this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:5000/api';
    this.token = process.env.CURSOR_TOKEN || null;
    this.failuresDir = path.join(__dirname, '..', 'cursor-failures');
    
    // Créer le dossier pour les échecs s'il n'existe pas
    if (!fs.existsSync(this.failuresDir)) {
      fs.mkdirSync(this.failuresDir, { recursive: true });
    }
  }

  /**
   * Authentification et obtention du token JWT
   */
  async authenticate() {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/auth/login`, {
        email: process.env.ADMIN_EMAIL || 'admin@xcafrique.com',
        password: process.env.ADMIN_PASSWORD || 'admin123'
      });

      if (response.data.success && response.data.data.token) {
        this.token = response.data.data.token;
        console.log('✅ Authentification réussie');
        return this.token;
      } else {
        throw new Error('Échec de l\'authentification');
      }
    } catch (error) {
      console.error('❌ Erreur d\'authentification:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obtenir les headers avec authentification
   */
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    } else if (process.env.CURSOR_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.CURSOR_TOKEN}`;
    }

    return headers;
  }

  /**
   * Vérifier si une catégorie existe par son slug
   */
  async getCategoryBySlug(slug) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/categories`, {
        headers: this.getAuthHeaders()
      });

      if (response.data.success) {
        const category = response.data.data.find(
          cat => cat.slug === slug.toLowerCase()
        );
        return category;
      }
      return null;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des catégories:', error.message);
      return null;
    }
  }

  /**
   * Vérifier et renouveler l'authentification si nécessaire
   */
  async ensureAuthenticated() {
    if (!this.token && !process.env.CURSOR_TOKEN) {
      await this.authenticate();
    }
  }

  /**
   * Créer ou mettre à jour une catégorie
   */
  async createOrUpdateCategory(categoryData) {
    try {
      await this.ensureAuthenticated();
      // Vérifier si la catégorie existe déjà
      const existingCategory = await this.getCategoryBySlug(categoryData.slug);

      if (existingCategory) {
        // Mettre à jour la catégorie existante
        console.log(`🔄 Mise à jour de la catégorie: ${categoryData.title}`);
        const response = await axios.put(
          `${this.apiBaseUrl}/categories/${existingCategory._id}`,
          {
            name: categoryData.title,
            description: categoryData.description,
            slug: categoryData.slug
          },
          { headers: this.getAuthHeaders() }
        );

        if (response.data.success) {
          console.log(`✅ Catégorie mise à jour: ${categoryData.title}`);
          return response.data.data;
        }
      } else {
        // Créer une nouvelle catégorie
        console.log(`➕ Création de la catégorie: ${categoryData.title}`);
        const response = await axios.post(
          `${this.apiBaseUrl}/categories`,
          {
            name: categoryData.title,
            description: categoryData.description,
            slug: categoryData.slug
          },
          { headers: this.getAuthHeaders() }
        );

        if (response.data.success) {
          console.log(`✅ Catégorie créée: ${categoryData.title}`);
          return response.data.data;
        }
      }
    } catch (error) {
      // Si erreur 401, réessayer avec nouvelle authentification
      if (error.response?.status === 401) {
        console.log('🔄 Token expiré, réauthentification...');
        this.token = null;
        await this.authenticate();
        // Réessayer une fois
        return this.createOrUpdateCategory(categoryData);
      }

      const errorData = {
        type: 'category',
        data: categoryData,
        error: error.response?.data || error.message,
        timestamp: new Date().toISOString()
      };

      this.logFailure(errorData);
      throw error;
    }
  }

  /**
   * Créer ou mettre à jour un article
   */
  async createOrUpdateArticle(articleData) {
    try {
      await this.ensureAuthenticated();
      // Vérifier et créer la catégorie si nécessaire
      let categoryId = articleData.categoryId;

      if (articleData.categorySlug && !categoryId) {
        let category = await this.getCategoryBySlug(articleData.categorySlug);
        
        if (!category) {
          // Créer la catégorie si elle n'existe pas
          console.log(`⚠️  Catégorie non trouvée, création: ${articleData.categorySlug}`);
          category = await this.createOrUpdateCategory({
            title: articleData.categorySlug,
            slug: articleData.categorySlug,
            description: `Catégorie: ${articleData.categorySlug}`
          });
        }
        
        categoryId = category._id;
      }

      // Vérifier si l'article existe déjà (par slug)
      // Note: L'API ne permet pas de rechercher directement par slug, 
      // donc on essaie de créer et on gère l'erreur 409 si doublon
      let existingArticle = null;

      const articlePayload = {
        title: articleData.title,
        content: articleData.content,
        excerpt: articleData.summary || articleData.excerpt || articleData.content.substring(0, 200) + '...',
        category: categoryId,
        tags: articleData.tags || [],
        author: articleData.author || 'Admin XC Afrique',
        featuredImage: articleData.heroImage || articleData.featuredImage || '',
        status: articleData.status || 'published'
      };

      if (articleData.publishedAt) {
        articlePayload.publishedAt = new Date(articleData.publishedAt);
      }

      if (articleData.sources && Array.isArray(articleData.sources)) {
        articlePayload.sources = articleData.sources;
      }

      if (existingArticle) {
        // Mettre à jour l'article existant
        console.log(`🔄 Mise à jour de l'article: ${articleData.title}`);
        const response = await axios.put(
          `${this.apiBaseUrl}/articles/${existingArticle._id}`,
          articlePayload,
          { headers: this.getAuthHeaders() }
        );

        if (response.data.success) {
          console.log(`✅ Article mis à jour: ${articleData.title}`);
          return response.data.data;
        }
      } else {
        // Créer un nouvel article
        console.log(`➕ Création de l'article: ${articleData.title}`);
        const response = await axios.post(
          `${this.apiBaseUrl}/articles`,
          articlePayload,
          { headers: this.getAuthHeaders() }
        );

        if (response.data.success) {
          console.log(`✅ Article créé: ${articleData.title}`);
          return response.data.data;
        }
      }
    } catch (error) {
      // Si erreur 401, réessayer avec nouvelle authentification
      if (error.response?.status === 401) {
        console.log('🔄 Token expiré, réauthentification...');
        this.token = null;
        await this.authenticate();
        // Réessayer une fois
        return this.createOrUpdateArticle(articleData);
      }

      // Gérer les erreurs 409 (doublon)
      if (error.response?.status === 409) {
        console.log(`⚠️  Doublon détecté, tentative de mise à jour...`);
        // Essayer de trouver et mettre à jour
        return this.createOrUpdateArticle(articleData);
      }

      const errorData = {
        type: 'article',
        data: articleData,
        error: error.response?.data || error.message,
        timestamp: new Date().toISOString()
      };

      this.logFailure(errorData);
      throw error;
    }
  }

  /**
   * Logger les échecs dans un fichier
   */
  logFailure(errorData) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${errorData.type}-failure-${timestamp}.json`;
    const filepath = path.join(this.failuresDir, filename);

    try {
      fs.writeFileSync(filepath, JSON.stringify(errorData, null, 2));
      console.error(`❌ Échec sauvegardé dans: ${filepath}`);
    } catch (err) {
      console.error('❌ Impossible de sauvegarder l\'échec:', err.message);
    }
  }

  /**
   * Sauvegarder plusieurs articles
   */
  async saveArticles(articles) {
    // S'assurer d'être authentifié
    if (!this.token && !process.env.CURSOR_TOKEN) {
      await this.authenticate();
    }

    const results = {
      success: [],
      failures: []
    };

    for (const article of articles) {
      try {
        const saved = await this.createOrUpdateArticle(article);
        results.success.push(saved);
      } catch (error) {
        results.failures.push({
          article,
          error: error.response?.data || error.message
        });
      }
    }

    return results;
  }

  /**
   * Sauvegarder plusieurs catégories
   */
  async saveCategories(categories) {
    // S'assurer d'être authentifié
    if (!this.token && !process.env.CURSOR_TOKEN) {
      await this.authenticate();
    }

    const results = {
      success: [],
      failures: []
    };

    for (const category of categories) {
      try {
        const saved = await this.createOrUpdateCategory(category);
        results.success.push(saved);
      } catch (error) {
        results.failures.push({
          category,
          error: error.response?.data || error.message
        });
      }
    }

    return results;
  }
}

module.exports = ContentManager;

