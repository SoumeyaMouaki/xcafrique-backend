const Category = require('../models/Category');
const Article = require('../models/Article');

/**
 * Controller pour la gestion des catégories
 * Contient toute la logique métier pour les opérations CRUD sur les catégories
 */

/**
 * @route   GET /api/categories
 * @desc    Récupérer toutes les catégories actives
 * @access  Public
 */
exports.getAllCategories = async (req, res, next) => {
  try {
    const filter = {};
    
    // Ne montrer que les catégories actives (API publique)
    filter.isActive = true;

    const categories = await Category.find(filter)
      .sort({ name: 1 })
      .select('-__v');

    // Compter le nombre d'articles par catégorie
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const articleCount = await Article.countDocuments({
          category: category._id,
          status: 'published'
        });
        return {
          ...category.toObject(),
          articleCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: categoriesWithCount.length,
      data: categoriesWithCount
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/categories/:id
 * @desc    Récupérer une catégorie par son ID ou slug
 * @access  Public
 */
exports.getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Essayer de trouver par ID d'abord, puis par slug
    let category = null;
    
    // Si c'est un ObjectId valide (24 caractères hexadécimaux)
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      category = await Category.findById(id);
    }
    
    // Si pas trouvé par ID, essayer par slug
    if (!category) {
      category = await Category.findOne({
        slug: id.toLowerCase().trim(),
        isActive: true
      });
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }

    // Vérifier que la catégorie est active
    if (!category.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }

    // Compter les articles de cette catégorie
    const articleCount = await Article.countDocuments({
      category: category._id,
      status: 'published'
    });

    res.status(200).json({
      success: true,
      data: {
        ...category.toObject(),
        articleCount
      }
    });

  } catch (error) {
    next(error);
  }
};


