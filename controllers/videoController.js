const Article = require('../models/Article');
const Category = require('../models/Category');
const { convertToEmbedUrl } = require('../utils/youtubeHelper');

/**
 * Controller pour la gestion des vidéos
 * Les vidéos sont des articles avec un champ videoUrl
 */

/**
 * @route   GET /api/videos
 * @desc    Récupérer toutes les vidéos (articles avec videoUrl)
 * @access  Public
 */
exports.getAllVideos = async (req, res, next) => {
  try {
    const { 
      category, 
      page = 1, 
      limit = 6,  // Par défaut, limiter à 6 vidéos
      search 
    } = req.query;

    // Construire le filtre pour les vidéos uniquement
    const filter = {
      status: 'published',
      videoUrl: { $exists: true, $ne: '' }  // Uniquement les articles avec videoUrl
    };

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

    // Récupérer les vidéos avec pagination
    let query = Article.find(filter)
      .populate('category', 'name slug color');
    
    // Trier par date de publication (plus récent en premier)
    query = query.sort({ publishedAt: -1, createdAt: -1 });
    
    const videos = await query
      .skip(skip)
      .limit(limitNum)
      .select('-__v')
      .lean();

    // Convertir les URLs YouTube en URLs embed pour chaque vidéo
    const videosWithEmbedUrl = videos.map(video => {
      if (video.videoUrl) {
        const embedUrl = convertToEmbedUrl(video.videoUrl);
        return {
          ...video,
          videoEmbedUrl: embedUrl || video.videoUrl
        };
      }
      return video;
    });

    // Compter le total de vidéos pour la pagination
    const total = await Article.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: videosWithEmbedUrl.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: videosWithEmbedUrl
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/videos/:slug
 * @desc    Récupérer une vidéo par son slug
 * @access  Public
 */
exports.getVideoBySlug = async (req, res, next) => {
  try {
    const video = await Article.findOne({ 
      slug: req.params.slug,
      videoUrl: { $exists: true, $ne: '' }  // Doit avoir un videoUrl
    })
      .populate('category', 'name slug color description');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Vidéo non trouvée'
      });
    }

    // Vérifier que la vidéo est publiée
    if (video.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Vidéo non trouvée'
      });
    }

    // Convertir l'URL YouTube en URL embed si présente
    let videoWithEmbed = video.toObject ? video.toObject() : video;
    if (videoWithEmbed.videoUrl) {
      const embedUrl = convertToEmbedUrl(videoWithEmbed.videoUrl);
      videoWithEmbed = {
        ...videoWithEmbed,
        videoEmbedUrl: embedUrl || videoWithEmbed.videoUrl
      };
    }

    // Incrémenter le compteur de vues
    video.views += 1;
    await video.save();

    // Ajouter la vue incrémentée à la réponse
    const videoResponse = {
      ...videoWithEmbed,
      views: video.views
    };

    res.status(200).json({
      success: true,
      data: videoResponse
    });

  } catch (error) {
    next(error);
  }
};

