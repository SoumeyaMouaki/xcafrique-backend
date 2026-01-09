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
const videoRoutes = require('./routes/videoRoutes');
// Routes optionnelles (activées car utilisées par le frontend)
// const authRoutes = require('./routes/authRoutes');
const contactRoutes = require('./routes/contactRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');

// Initialiser l'application Express
const app = express();

// Configurer trust proxy pour Vercel (nécessaire pour rate limiting et IP correcte)
// Vercel utilise 1 proxy, donc on fait confiance au premier proxy uniquement
// Cela est plus sécurisé que trust proxy: true
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Faire confiance au premier proxy uniquement (Vercel)
}

// Connexion à la base de données MongoDB
// Gérer les erreurs de connexion sans faire crasher le serveur
connectDB().catch((error) => {
  console.error('Erreur lors de la connexion à MongoDB:', error.message);
  // Sur Vercel, on continue quand même pour que l'erreur soit visible dans les logs
  // mais on ne fait pas crash le serveur
  if (process.env.VERCEL) {
    console.error('⚠️  Le serveur continue mais les requêtes nécessitant MongoDB échoueront');
  }
});

// Initialiser le service SSE
sseService.init();

// Nettoyer les connexions SSE inactives toutes les 5 minutes
setInterval(() => {
  sseService.cleanupInactiveClients(120000); // 2 minutes d'inactivité
}, 300000); // Toutes les 5 minutes

// Middleware de sécurité
app.use(helmet()); // Protège contre diverses vulnérabilités HTTP

// Configuration CORS
// Support des domaines de développement et production
const getAllowedOrigins = () => {
  // Détecter si on est en développement local (pas sur Vercel)
  // Vercel définit automatiquement VERCEL=1
  const isLocalDevelopment = process.env.NODE_ENV === 'development' && !process.env.VERCEL;
  
  // En développement local uniquement
  if (isLocalDevelopment) {
    return [
      'http://localhost:5173',  // Vite dev server
      'http://localhost:3000',  // React dev server
      'http://localhost:5174',
      'http://localhost:5175'
    ];
  }
  
  // En production (Vercel ou NODE_ENV=production)
  // Utiliser ALLOWED_ORIGINS ou FRONTEND_URL si défini
  const envOrigins = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL;
  
  // Base des origines autorisées
  let allowedOrigins = [];
  
  if (envOrigins) {
    allowedOrigins = envOrigins.split(',').map(url => url.trim()).filter(url => url.length > 0);
  } else {
    // Valeurs par défaut si aucune variable d'environnement
    allowedOrigins = [
      'https://xcafrique.org',
      'https://www.xcafrique.org',
      'https://xcafrique-frontend.vercel.app'
    ];
  }
  
  // Toujours ajouter le wildcard pour les preview deployments Vercel
  // Format: https://*-*-*.vercel.app ou https://*-*.vercel.app
  // Cela couvre tous les preview deployments comme: xcafrique-frontend-f49x4cwry-xcafriques-projects.vercel.app
  // Vérifier si on a déjà une regex pour vercel.app
  const hasVercelRegex = allowedOrigins.some(origin => 
    origin.includes('vercel.app') && (origin.includes('.*') || origin.includes('\\.'))
  );
  
  if (!hasVercelRegex) {
    allowedOrigins.push('https://.*\\.vercel\\.app');  // Regex pour tous les *.vercel.app
  }
  
  return allowedOrigins;
};

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = getAllowedOrigins();
    
    // Autoriser les requêtes sans origine (Postman, mobile apps, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Vérifier si l'origine est autorisée (support des wildcards et regex)
    const isAllowed = allowedOrigins.some(allowed => {
      // Correspondance exacte d'abord
      if (allowed === origin) {
        return true;
      }
      
      // Si c'est déjà une regex (contient \\.)
      if (allowed.includes('\\.')) {
        try {
          const regex = new RegExp(`^${allowed}$`);
          const matches = regex.test(origin);
          if (matches) {
            return true;
          }
        } catch (e) {
          // Si la regex est invalide, continuer avec les autres méthodes
          console.warn(`Regex invalide: ${allowed}`, e.message);
        }
      }
      
      // Support des wildcards comme *.vercel.app
      if (allowed.includes('*')) {
        try {
          // Convertir https://*.vercel.app en regex
          const pattern = allowed
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Échapper les caractères spéciaux
            .replace(/\\\*/g, '.*'); // Remplacer \* par .*
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(origin);
        } catch (e) {
          // Si la regex est invalide, ignorer
          console.warn(`Wildcard invalide: ${allowed}`, e.message);
        }
      }
      
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      // Log en production pour déboguer (toujours logger pour aider au debug)
      console.warn(`⚠️  Origine non autorisée: ${origin}`);
      console.warn(`   Origines autorisées: ${allowedOrigins.join(', ')}`);
      console.warn(`   NODE_ENV: ${process.env.NODE_ENV}`);
      console.warn(`   VERCEL: ${process.env.VERCEL}`);
      
      // Vérifier si c'est un preview deployment Vercel et suggérer la solution
      if (origin && origin.includes('.vercel.app')) {
        console.warn(`   💡 Cette origine semble être un preview deployment Vercel`);
        console.warn(`   💡 Le wildcard https://.*\\.vercel\\.app devrait l'autoriser`);
      }
      
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Range'],
  maxAge: 86400, // 24 heures
  preflightContinue: false,
  optionsSuccessStatus: 200
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
  skip: (req) => req.path === '/api/newsletter/stream' || req.path === '/api/newsletter/stream/stats',
  // Configuration pour Vercel (trust proxy: 1)
  standardHeaders: true, // Retourne les headers rate limit dans `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
});
app.use('/api/', limiter);

// Rate limiting plus strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite de 5 tentatives de connexion par IP toutes les 15 minutes
  message: {
    success: false,
    message: 'Trop de tentatives de connexion, veuillez réessayer plus tard.'
  },
  // Configuration pour Vercel (trust proxy: 1)
  standardHeaders: true,
  legacyHeaders: false,
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
      categories: '/api/categories',
      videos: '/api/videos',
      contact: '/api/contact',
      newsletter: '/api/newsletter'
    }
  });
});

// Routes API
app.use('/api/articles', articleRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/videos', videoRoutes);
// Routes optionnelles (activées car utilisées par le frontend)
// app.use('/api/auth', authRoutes);
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

// Démarrer le serveur uniquement si on n'est pas sur Vercel
// Sur Vercel, le serveur est géré par les Serverless Functions
if (!process.env.VERCEL) {
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
}

// Exporter l'app pour Vercel Serverless Functions
module.exports = app;

