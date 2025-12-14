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
    
    // Si l'utilisateur n'est pas admin, ne montrer que les catégories actives
    if (!req.user || req.user.role !== 'admin') {
      filter.isActive = true;
    }

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
 * @desc    Récupérer une catégorie par son ID
 * @access  Public
 */
exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }

    // Vérifier que la catégorie est active (sauf si admin)
    if (!category.isActive && (!req.user || req.user.role !== 'admin')) {
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

/**
 * @route   POST /api/categories
 * @desc    Créer une nouvelle catégorie
 * @access  Private (Admin uniquement)
 */
exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Catégorie créée avec succès',
      data: category
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/categories/:id
 * @desc    Modifier une catégorie existante
 * @access  Private (Admin uniquement)
 */
exports.updateCategory = async (req, res, next) => {
  try {
    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }

    category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Catégorie modifiée avec succès',
      data: category
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/categories/:id
 * @desc    Supprimer une catégorie
 * @access  Private (Admin uniquement)
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }

    // Vérifier s'il y a des articles dans cette catégorie
    const articleCount = await Article.countDocuments({ category: category._id });
    
    if (articleCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer la catégorie. ${articleCount} article(s) y sont associé(s).`
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Catégorie supprimée avec succès'
    });

  } catch (error) {
    next(error);
  }
};

