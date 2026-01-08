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
  if (err.name === 'CastError') {
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
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Erreur serveur',
    error: error.statusCode === 500 ? 'SERVER_ERROR' : undefined,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err.message 
    })
  });
};

module.exports = errorHandler;

