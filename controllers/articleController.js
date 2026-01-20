const Article = require('../models/Article');
const Category = require('../models/Category');

/**
 * Controller pour la gestion des articles
 * Contient toute la logique métier pour les opérations CRUD sur les articles
 */

/**
 * @route   GET /api/articles
 * @desc    Récupérer tous les articles (avec filtres optionnels)
 * @access  Public
 */
exports.getAllArticles = async (req, res, next) => {
  try {
    const { 
      category, 
      status = 'published', 
      page = 1, 
      limit = 10,
      search,
      type  // Nouveau paramètre: 'video' pour filtrer les vidéos
    } = req.query;

    // Construire le filtre
    const filter = {};
    
    // Ne montrer que les articles publiés (API publique)
    filter.status = 'published';
    
    // Filtrer par type (vidéos uniquement)
    if (type === 'video') {
      filter.videoUrl = { $exists: true, $ne: '' };
    }

    // Filtrer par catégorie si fourni (slug ou ID)
    if (category) {
      try {
        // Normaliser le slug (supprimer les espaces, convertir en minuscules)
        const normalizedCategory = category.trim().toLowerCase();
        
        // Chercher la catégorie avec plusieurs stratégies
        let categoryDoc = null;
        
        // Stratégie 1 : Par slug normalisé
        if (normalizedCategory) {
          categoryDoc = await Category.findOne({
            slug: normalizedCategory,
            isActive: true
          });
        }
        
        // Stratégie 2 : Par slug original (si normalisé n'a pas fonctionné)
        if (!categoryDoc && category !== normalizedCategory) {
          categoryDoc = await Category.findOne({
            slug: category.trim(),
            isActive: true
          });
        }
        
        // Stratégie 3 : Par ID MongoDB (si c'est un ObjectId valide)
        if (!categoryDoc && /^[0-9a-fA-F]{24}$/.test(category.trim())) {
          categoryDoc = await Category.findOne({
            _id: category.trim(),
            isActive: true
          });
        }
        
        if (categoryDoc) {
          // Catégorie trouvée : filtrer par cette catégorie
          filter.category = categoryDoc._id;
        } else {
          // Catégorie non trouvée : retourner un tableau vide (200 OK)
          // Ne JAMAIS retourner 404 pour une liste vide
          return res.status(200).json({
            success: true,
            count: 0,
            total: 0,
            page: parseInt(page),
            pages: 0,
            data: []
          });
        }
      } catch (categoryError) {
        // En cas d'erreur lors de la recherche de catégorie,
        // retourner un tableau vide plutôt qu'une erreur
        // Cela évite que l'errorHandler transforme l'erreur en 404
        if (process.env.NODE_ENV === 'development') {
          console.warn('Erreur lors de la recherche de catégorie:', categoryError.message);
        }
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          page: parseInt(page),
          pages: 0,
          data: []
        });
      }
    }

    // Recherche textuelle si fournie
    if (search) {
      // Utiliser une recherche regex insensible à la casse sur title, content et excerpt
      // Plus flexible que $text et fonctionne sans index textuel
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { title: searchRegex },
        { content: searchRegex },
        { excerpt: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }

    // Calculer la pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Vérifier que MongoDB est connecté
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      // Essayer de se reconnecter
      const connectDB = require('../config/database');
      await connectDB();
    }

    // Récupérer les articles avec pagination
    let query = Article.find(filter)
      .populate('category', 'name slug color description');
    
    // Trier par date de publication (plus récent en premier)
    query = query.sort({ publishedAt: -1, createdAt: -1 });
    
    const articles = await query
      .skip(skip)
      .limit(limitNum)
      .select('-__v')
      .lean(); // Utiliser lean() pour de meilleures performances

    // Compter le total d'articles pour la pagination
    const total = await Article.countDocuments(filter).maxTimeMS(5000); // Timeout de 5 secondes

    res.status(200).json({
      success: true,
      count: articles.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: articles
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/articles/:slug
 * @desc    Récupérer un article par son slug
 * @access  Public
 */
exports.getArticleBySlug = async (req, res, next) => {
  try {
    // Vérifier que MongoDB est connecté
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      // Essayer de se reconnecter
      const connectDB = require('../config/database');
      await connectDB();
    }

    const article = await Article.findOne({ slug: req.params.slug })
      .populate('category', 'name slug color description')
      .lean(); // Utiliser lean() pour de meilleures performances

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    // Vérifier que l'article est publié
    if (article.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    // Incrémenter le compteur de vues (sans attendre pour améliorer les performances)
    // Utiliser updateOne pour éviter de bloquer la réponse
    Article.updateOne(
      { slug: req.params.slug },
      { $inc: { views: 1 } }
    ).catch(err => {
      // Logger l'erreur mais ne pas bloquer la réponse
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur lors de l\'incrément des vues:', err.message);
      }
    });

    // Incrémenter les vues dans la réponse pour l'affichage immédiat
    const articleWithViews = {
      ...article,
      views: (article.views || 0) + 1
    };

    res.status(200).json({
      success: true,
      data: articleWithViews
    });

  } catch (error) {
    next(error);
  }
};


