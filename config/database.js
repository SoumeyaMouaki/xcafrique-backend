const mongoose = require('mongoose');

/**
 * Configuration de la connexion à MongoDB
 * Gère la connexion et la déconnexion de la base de données
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Options recommandées pour Mongoose 6+
      // Les options useNewUrlParser et useUnifiedTopology sont maintenant par défaut
    });

    console.log(`✅ MongoDB connecté : ${conn.connection.host}`);
    
    // Gestion des événements de connexion
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erreur de connexion MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB déconnecté');
    });

    // Gestion propre de la déconnexion lors de l'arrêt de l'application
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB déconnecté suite à l\'arrêt de l\'application');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

