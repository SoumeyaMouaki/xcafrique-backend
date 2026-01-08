require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const sseService = require('./services/sseService');

// Import des routes
const articleRoutes = require('./routes/articleRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
// Routes optionnelles (à activer si nécessaire)
// const authRoutes = require('./routes/authRoutes');
// const contactRoutes = require('./routes/contactRoutes');
// const newsletterRoutes = require('./routes/newsletterRoutes');

// Initialiser l'application Express
const app = express();

// Connexion à la base de données MongoDB
connectDB();

// Initialiser le service SSE
sseService.init();

// Nettoyer les connexions SSE inactives toutes les 5 minutes
setInterval(() => {
  sseService.cleanupInactiveClients(120000); // 2 minutes d'inactivité
}, 300000); // Toutes les 5 minutes

// Middleware de sécurité
app.use(helmet()); // Protège contre diverses vulnérabilités HTTP

// Configuration CORS
// En développement, autoriser toutes les origines localhost
// En production, utiliser FRONTEND_URL
const corsOptions = {
  origin: function (origin, callback) {
    // En développement, autoriser toutes les origines localhost
    if (process.env.NODE_ENV === 'development') {
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    // En production, utiliser FRONTEND_URL
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = process.env.FRONTEND_URL 
        ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
        : [];
      
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      console.warn(`⚠️  Origine non autorisée: ${origin}`);
      console.warn(`   Origines autorisées: ${allowedOrigins.join(', ')}`);
      
      return callback(new Error('Non autorisé par CORS'));
    }
    
    // Par défaut, autoriser
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Rate limiting pour éviter les abus
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite de 100 requêtes par IP toutes les 15 minutes
  message: {
    success: false,
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
  },
  // Ne pas compter les connexions SSE dans le rate limiting
  skip: (req) => req.path === '/api/newsletter/stream' || req.path === '/api/newsletter/stream/stats'
});
app.use('/api/', limiter);

// Rate limiting plus strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite de 5 tentatives de connexion par IP toutes les 15 minutes
  message: {
    success: false,
    message: 'Trop de tentatives de connexion, veuillez réessayer plus tard.'
  }
});
app.use('/api/auth/login', authLimiter);

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging des requêtes (uniquement en développement)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Route racine - Informations API
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API XC Afrique - Le Cross-check de l\'info aérienne',
    version: '1.0.0',
    endpoints: {
      articles: '/api/articles',
      categories: '/api/categories'
    }
  });
});

// Routes API
app.use('/api/articles', articleRoutes);
app.use('/api/categories', categoryRoutes);
// Routes optionnelles (à activer si nécessaire)
// app.use('/api/auth', authRoutes);
// app.use('/api/contact', contactRoutes);
// app.use('/api/newsletter', newsletterRoutes);

// Route 404 pour les endpoints non trouvés
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Middleware de gestion des erreurs (doit être le dernier)
app.use(errorHandler);

// Configuration du port
const PORT = process.env.PORT || 5000;

// Démarrer le serveur
const server = app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`🌐 API disponible sur: http://localhost:${PORT}`);
  }
});

// Gestion de l'arrêt propre du serveur
const gracefulShutdown = (signal) => {
  // Arrêter le service SSE
  sseService.shutdown();
  
  // Fermer le serveur
  server.close(() => {
    process.exit(0);
  });
  
  // Forcer l'arrêt après 10 secondes
  setTimeout(() => {
    process.exit(1);
  }, 10000);
};

// Écouter les signaux d'arrêt
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('Erreur non gérée:', err);
  }
  gracefulShutdown('unhandledRejection');
});

module.exports = app;

