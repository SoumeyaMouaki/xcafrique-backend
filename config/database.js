const mongoose = require('mongoose');

/**
 * Configuration de la connexion à MongoDB
 * Gère la connexion et la déconnexion de la base de données
 */
// Cache de la connexion pour éviter les reconnexions multiples
let cachedConnection = null;

const connectDB = async () => {
  try {
    // Si déjà connecté, réutiliser la connexion
    if (cachedConnection && mongoose.connection.readyState === 1) {
      return cachedConnection;
    }

    // Si la connexion est en cours de connexion, attendre
    if (mongoose.connection.readyState === 2) {
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
        mongoose.connection.once('error', resolve);
      });
      if (mongoose.connection.readyState === 1) {
        return cachedConnection;
      }
    }

    // Vérifier que MONGODB_URI est défini
    if (!process.env.MONGODB_URI) {
      const errorMsg = '❌ Erreur: MONGODB_URI n\'est pas défini dans les variables d\'environnement\n' +
        '   Configurez MONGODB_URI dans Vercel Dashboard → Settings → Environment Variables';
      console.error(errorMsg);
      
      // Sur Vercel, lancer une erreur au lieu de exit pour que Vercel puisse la gérer
      // et afficher un message clair dans les logs
      throw new Error('MONGODB_URI non défini. Configurez cette variable dans Vercel Dashboard → Settings → Environment Variables');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Options recommandées pour Mongoose 6+
      // Les options useNewUrlParser et useUnifiedTopology sont maintenant par défaut
      serverSelectionTimeoutMS: 10000, // Timeout de 10 secondes (augmenté pour Vercel)
      socketTimeoutMS: 45000, // Timeout socket de 45 secondes
      connectTimeoutMS: 10000, // Timeout de connexion de 10 secondes
      maxPoolSize: 10, // Nombre max de connexions dans le pool
      minPoolSize: 2, // Nombre min de connexions dans le pool
      maxIdleTimeMS: 30000, // Fermer les connexions inactives après 30 secondes
      heartbeatFrequencyMS: 10000, // Vérifier la connexion toutes les 10 secondes
    });

    cachedConnection = conn;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ MongoDB connecté : ${conn.connection.host}`);
    }
    
    // Gestion des événements de connexion
    mongoose.connection.on('error', (err) => {
      console.error('Erreur de connexion MongoDB:', err.message);
      // Réinitialiser le cache en cas d'erreur
      cachedConnection = null;
    });

    mongoose.connection.on('disconnected', () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('MongoDB déconnecté');
      }
      // Réinitialiser le cache en cas de déconnexion
      cachedConnection = null;
    });

    // Reconnexion automatique
    mongoose.connection.on('reconnected', () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('MongoDB reconnecté');
      }
    });

    // Gestion propre de la déconnexion lors de l'arrêt de l'application
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('Erreur de connexion à MongoDB:', error.message);
    // Sur Vercel, ne pas faire exit car cela bloque le déploiement
    // L'erreur sera visible dans les logs et les requêtes échoueront proprement
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    // Sur Vercel, on relance l'erreur pour qu'elle soit visible dans les logs
    throw error;
  }
};

module.exports = connectDB;

