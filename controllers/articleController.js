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
    
    // Ne montrer que les articles publiés (API publique)
    filter.status = 'published';

    // Filtrer par catégorie si fourni (slug ou ID)
    if (category) {
      const categoryDoc = await Category.findOne({
        $or: [
          { slug: category.toLowerCase() },
          { _id: category }
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
 * @route   GET /api/articles/:slug
 * @desc    Récupérer un article par son slug
 * @access  Public
 */
exports.getArticleBySlug = async (req, res, next) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug })
      .populate('category', 'name slug color description');

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


