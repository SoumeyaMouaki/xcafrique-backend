/**
 * Middleware global de gestion des erreurs
 * Capture toutes les erreurs non gérées et renvoie une réponse JSON appropriée
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log de l'erreur pour le débogage (uniquement en développement)
  if (process.env.NODE_ENV === 'development') {
    console.error('Erreur:', err.message || err);
    console.error('Stack:', err.stack);
    console.error('URL:', req.originalUrl);
    console.error('Method:', req.method);
  }

  // Erreur CORS
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'Erreur CORS: Le backend n\'autorise pas les requêtes depuis cette origine.',
      error: 'CORS_ERROR',
      ...(process.env.NODE_ENV === 'development' && { 
        origin: req.headers.origin,
        details: err.message 
      })
    });
  }

  // Erreur Mongoose - ObjectId invalide
  // Ne pas transformer en 404 pour les endpoints de liste (GET /api/articles, etc.)
  // Les listes doivent retourner 200 avec un tableau vide, pas 404
  if (err.name === 'CastError') {
    // Pour les endpoints de liste, retourner 200 avec tableau vide
    // Pour les endpoints de détail (GET /api/articles/:slug), retourner 404
    const isListEndpoint = req.path.includes('/articles') && !req.params.slug && req.method === 'GET';
    
    if (isListEndpoint) {
      // Pour les listes, retourner 200 avec tableau vide plutôt que 404
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        page: parseInt(req.query.page) || 1,
        pages: 0,
        data: []
      });
    }
    
    // Pour les autres endpoints (détail), retourner 404
    const message = 'Ressource non trouvée';
    error = { message, statusCode: 404 };
  }

  // Erreur Mongoose - Duplication (unique constraint)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} déjà utilisé`;
    error = { message, statusCode: 400 };
  }

  // Erreur Mongoose - Validation
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // Erreur de connexion MongoDB
  if (err.name === 'MongoNetworkError' || err.name === 'MongooseError') {
    error = { 
      message: 'Erreur de connexion à la base de données', 
      statusCode: 503 
    };
  }

  // Réponse d'erreur
  // En production, ne pas exposer les détails d'erreur pour éviter les fuites d'informations
  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    message: statusCode === 500 && process.env.NODE_ENV === 'production' 
      ? 'Erreur serveur' 
      : (error.message || 'Erreur serveur'),
  };
  
  // Ajouter le code d'erreur seulement si ce n'est pas une erreur 500 en production
  if (statusCode !== 500 || process.env.NODE_ENV === 'development') {
    response.error = statusCode === 500 ? 'SERVER_ERROR' : undefined;
  }
  
  // Détails de débogage uniquement en développement
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = err.message;
  }
  
  res.status(statusCode).json(response);
};

module.exports = errorHandler;

