require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import des routes
const articleRoutes = require('./routes/articleRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const videoRoutes = require('./routes/videoRoutes');
// Routes optionnelles (activées car utilisées par le frontend)
const authRoutes = require('./routes/authRoutes');
const contactRoutes = require('./routes/contactRoutes');

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

// Initialiser le service email au démarrage pour afficher la configuration SMTP
const emailService = require('./utils/emailService');
// Initialiser le transporteur sans envoyer d'email
emailService.initTransporter();

// Middleware de sécurité - Configuration Helmet renforcée
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Désactivé pour compatibilité
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Configuration CORS
// Support des domaines de développement et production
const getAllowedOrigins = () => {
  // Détecter si on est en développement local (pas sur Vercel)
  // Vercel définit automatiquement VERCEL=1
  // En développement si : NODE_ENV=development OU pas de VERCEL ET pas de NODE_ENV=production
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
  const isProduction = process.env.NODE_ENV === 'production';
  const isLocalDevelopment = !isVercel && (!isProduction || process.env.NODE_ENV === 'development');
  
  // En développement local, toujours autoriser localhost
  if (isLocalDevelopment) {
    const localhostOrigins = [
      'http://localhost:5173',  // Vite dev server
      'http://localhost:3000',  // React dev server
      'http://localhost:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000'
    ];
    
    // Log pour debug
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔧 Mode développement détecté - Origines localhost autorisées');
    }
    
    return localhostOrigins;
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
  
  // En production, autoriser aussi localhost si ALLOW_LOCALHOST_IN_PROD est défini
  // Utile pour tester le frontend local avec le backend de production
  if (isProduction && process.env.ALLOW_LOCALHOST_IN_PROD === 'true') {
    allowedOrigins.push('http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000');
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
    
    // En développement, toujours autoriser localhost même si pas dans la liste
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
    const isProduction = process.env.NODE_ENV === 'production';
    const isLocalDevelopment = !isVercel && (!isProduction || process.env.NODE_ENV === 'development');
    
    // Autoriser localhost en développement local
    if (isLocalDevelopment && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
      return callback(null, true);
    }
    
    // Autoriser localhost même en production si ALLOW_LOCALHOST_IN_PROD=true (pour tests)
    // ⚠️  À utiliser uniquement pour le développement/test, pas en production réelle
    if (isProduction && process.env.ALLOW_LOCALHOST_IN_PROD === 'true' && 
        (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
      console.warn(`⚠️  [CORS] Autorisation localhost en production (ALLOW_LOCALHOST_IN_PROD=true): ${origin}`);
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
      // Log détaillé pour debug
      const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
      const isProduction = process.env.NODE_ENV === 'production';
      const isLocalDev = !isVercel && (!isProduction || process.env.NODE_ENV === 'development');
      
      console.warn(`⚠️  Origine non autorisée: ${origin}`);
      console.warn(`   Origines autorisées: ${allowedOrigins.join(', ')}`);
      console.warn(`   NODE_ENV: ${process.env.NODE_ENV || 'non défini'}`);
      console.warn(`   VERCEL: ${process.env.VERCEL || 'non défini'}`);
      console.warn(`   Mode développement: ${isLocalDev ? 'OUI' : 'NON'}`);
      
      // Aide pour les preview deployments Vercel
      if (origin && origin.includes('.vercel.app')) {
        console.warn(`   💡 Cette origine semble être un preview deployment Vercel`);
        console.warn(`   💡 Le wildcard https://.*\\.vercel\\.app devrait l'autoriser`);
      }
      
      // Aide pour localhost
      if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        console.warn(`   💡 Origine localhost détectée`);
        console.warn(`   💡 Vérifiez que NODE_ENV=development dans votre .env`);
        console.warn(`   💡 Ou redémarrez le serveur avec NODE_ENV=development`);
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
  // Ne pas compter certaines routes dans le rate limiting si nécessaire
  skip: (req) => false,
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

// Middleware pour parser le JSON avec limites de taille
app.use(express.json({ limit: '10mb' })); // Limite de 10MB pour éviter les attaques DoS
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging des requêtes
// En production, ne logger que les erreurs pour éviter les fuites d'informations
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else if (process.env.NODE_ENV === 'production') {
  // Logging minimal en production (uniquement les erreurs)
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400
  }));
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
      contact: '/api/contact'
    }
  });
});

// Routes API
app.use('/api/articles', articleRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/videos', videoRoutes);
// Routes optionnelles (activées car utilisées par le frontend)
app.use('/api/auth', authRoutes); // Activé pour l'administration
app.use('/api/contact', contactRoutes);

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

