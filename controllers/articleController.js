const mongoose = require('mongoose');
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
      search 
    } = req.query;

    // Construire le filtre
    const filter = {};
    
    // Si l'utilisateur n'est pas admin, ne montrer que les articles publiés
    if (!req.user || req.user.role !== 'admin') {
      filter.status = 'published';
    } else if (status) {
      filter.status = status;
    }

    // Filtrer par catégorie si fourni
    if (category) {
      // Vérifier si c'est un ObjectId valide
      if (mongoose.Types.ObjectId.isValid(category)) {
        // C'est un ObjectId, l'utiliser directement
        filter.category = category;
      } else {
        // Ce n'est pas un ObjectId, chercher par slug ou nom
        const categoryDoc = await Category.findOne({
          $or: [
            { slug: category.toLowerCase() },
            { name: { $regex: new RegExp(`^${category}$`, 'i') } }
          ],
          isActive: true
        });
        
        if (categoryDoc) {
          filter.category = categoryDoc._id;
        } else {
          // Catégorie non trouvée, retourner un tableau vide
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

    // Récupérer les articles avec pagination
    let query = Article.find(filter)
      .populate('category', 'name slug color');
    
    // Trier par date de publication (plus récent en premier)
    query = query.sort({ publishedAt: -1, createdAt: -1 });
    
    const articles = await query
      .skip(skip)
      .limit(limitNum)
      .select('-__v');

    // Compter le total d'articles pour la pagination
    const total = await Article.countDocuments(filter);

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
 * @route   GET /api/articles/:id
 * @desc    Récupérer un article par son ID
 * @access  Public
 */
exports.getArticleById = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('category', 'name slug color description');

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    // Vérifier que l'article est publié (sauf si admin)
    if (article.status !== 'published' && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    // Incrémenter le compteur de vues
    article.views += 1;
    await article.save();

    res.status(200).json({
      success: true,
      data: article
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/articles
 * @desc    Créer un nouvel article
 * @access  Private (Admin uniquement)
 */
exports.createArticle = async (req, res, next) => {
  try {
    // Vérifier que la catégorie existe
    const category = await Category.findById(req.body.category);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }

    // Créer l'article
    const article = await Article.create({
      ...req.body,
      author: req.body.author || req.user.username || 'Admin XC Afrique'
    });

    // Populate la catégorie pour la réponse
    await article.populate('category', 'name slug color');

    res.status(201).json({
      success: true,
      message: 'Article créé avec succès',
      data: article
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/articles/:id
 * @desc    Modifier un article existant
 * @access  Private (Admin uniquement)
 */
exports.updateArticle = async (req, res, next) => {
  try {
    let article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    // Vérifier la catégorie si elle est modifiée
    if (req.body.category) {
      const category = await Category.findById(req.body.category);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Catégorie non trouvée'
        });
      }
    }

    // Mettre à jour l'article
    article = await Article.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('category', 'name slug color');

    res.status(200).json({
      success: true,
      message: 'Article modifié avec succès',
      data: article
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/articles/:id
 * @desc    Supprimer un article
 * @access  Private (Admin uniquement)
 */
exports.deleteArticle = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    await Article.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Article supprimé avec succès'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/articles/search/suggestions
 * @desc    Obtenir des suggestions d'articles pour la barre de recherche
 * @access  Public
 */
exports.getSearchSuggestions = async (req, res, next) => {
  try {
    const { q, limit = 5 } = req.query;

    // Si aucun terme de recherche n'est fourni, retourner des articles récents
    if (!q || q.trim().length === 0) {
      const recentArticles = await Article.find({ status: 'published' })
        .populate('category', 'name slug color')
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(parseInt(limit))
        .select('title slug excerpt category featuredImage publishedAt views');

      return res.status(200).json({
        success: true,
        count: recentArticles.length,
        data: recentArticles
      });
    }

    // Recherche avec regex insensible à la casse
    const searchTerm = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(searchTerm, 'i');

    // Rechercher d'abord dans le titre (priorité haute)
    const titleMatches = await Article.find({
      status: 'published',
      title: searchRegex
    })
      .populate('category', 'name slug color')
      .sort({ publishedAt: -1, views: -1 })
      .limit(parseInt(limit))
      .select('title slug excerpt category featuredImage publishedAt views tags');

    // Si on n'a pas assez de résultats, chercher aussi dans excerpt et tags
    let suggestions = titleMatches;
    if (titleMatches.length < parseInt(limit)) {
      const remainingLimit = parseInt(limit) - titleMatches.length;
      const titleIds = titleMatches.map(a => a._id);
      
      const otherMatches = await Article.find({
        status: 'published',
        _id: { $nin: titleIds },
        $or: [
          { excerpt: searchRegex },
          { tags: { $in: [searchRegex] } }
        ]
      })
        .populate('category', 'name slug color')
        .sort({ publishedAt: -1, views: -1 })
        .limit(remainingLimit)
        .select('title slug excerpt category featuredImage publishedAt views tags');
      
      suggestions = [...titleMatches, ...otherMatches];
    }

    res.status(200).json({
      success: true,
      count: suggestions.length,
      query: q,
      data: suggestions
    });

  } catch (error) {
    next(error);
  }
};

