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
const authRoutes = require('./routes/authRoutes');
const contactRoutes = require('./routes/contactRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');

// Initialiser l'application Express
const app = express();

// Connexion à la base de données MongoDB
connectDB();

// Initialiser le service SSE
sseService.init();

// Nettoyer les connexions SSE inactives toutes les 5 minutes
setInterval(() => {
  const cleaned = sseService.cleanupInactiveClients(120000); // 2 minutes d'inactivité
  if (cleaned > 0) {
    console.log(`🧹 ${cleaned} connexion(s) SSE inactive(s) nettoyée(s)`);
  }
}, 300000); // Toutes les 5 minutes

// Middleware de sécurité
app.use(helmet()); // Protège contre diverses vulnérabilités HTTP

// Configuration CORS
// Autoriser plusieurs origines pour le développement (React, Vite, etc.)
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',')
  : [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175'
    ];

app.use(cors({
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origine (Postman, mobile apps, etc.) en développement
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Si pas d'origine spécifiée, autoriser en développement
    if (!origin) {
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Non autorisé par CORS'));
    }
    
    // Vérifier si l'origine est autorisée
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️  Origine non autorisée: ${origin}`);
      console.warn(`   Origines autorisées: ${allowedOrigins.join(', ')}`);
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

// Route de test
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API XC Afrique - Le Cross-check de l\'info aérienne',
    version: '1.0.0',
    endpoints: {
      articles: '/api/articles',
      categories: '/api/categories',
      auth: '/api/auth',
      contact: '/api/contact',
      newsletter: '/api/newsletter'
    }
  });
});

// Routes API
app.use('/api/articles', articleRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);

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
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📝 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API disponible sur: http://localhost:${PORT}`);
});

// Gestion de l'arrêt propre du serveur
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} reçu. Arrêt en cours...`);
  
  // Arrêter le service SSE
  sseService.shutdown();
  
  // Fermer le serveur
  server.close(() => {
    console.log('✅ Serveur fermé proprement');
    process.exit(0);
  });
  
  // Forcer l'arrêt après 10 secondes
  setTimeout(() => {
    console.error('⚠️  Arrêt forcé après timeout');
    process.exit(1);
  }, 10000);
};

// Écouter les signaux d'arrêt
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
  console.error('❌ Erreur non gérée:', err);
  gracefulShutdown('unhandledRejection');
});

module.exports = app;

