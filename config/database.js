const mongoose = require('mongoose');

/**
 * Configuration de la connexion à MongoDB
 * Gère la connexion et la déconnexion de la base de données
 */
const connectDB = async () => {
  try {
    // Vérifier que MONGODB_URI est défini
    if (!process.env.MONGODB_URI) {
      console.error('❌ Erreur: MONGODB_URI n\'est pas défini dans les variables d\'environnement');
      console.error('   Configurez MONGODB_URI dans votre fichier .env ou dans les variables d\'environnement de votre plateforme de déploiement');
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Options recommandées pour Mongoose 6+
      // Les options useNewUrlParser et useUnifiedTopology sont maintenant par défaut
    });

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
    process.exit(1);
  }
};

module.exports = connectDB;

