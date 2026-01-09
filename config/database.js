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
      serverSelectionTimeoutMS: 5000, // Timeout de 5 secondes
      socketTimeoutMS: 45000, // Timeout socket de 45 secondes
    });

    cachedConnection = conn;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ MongoDB connecté : ${conn.connection.host}`);
    }
    
    // Gestion des événements de connexion
    mongoose.connection.on('error', (err) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Erreur de connexion MongoDB:', err);
      }
    });

    mongoose.connection.on('disconnected', () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('MongoDB déconnecté');
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

