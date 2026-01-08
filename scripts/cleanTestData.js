require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Article = require('../models/Article');

/**
 * Script pour supprimer tous les articles de test de la base de données
 * Utile pour nettoyer avant d'ajouter le vrai contenu
 * 
 * Usage: node scripts/cleanTestData.js
 */

async function cleanTestData() {
  try {
    // Connexion à la base de données
    await connectDB();
    
    // Attendre un peu pour s'assurer que la connexion est bien établie
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('🧹 Nettoyage des articles de test...\n');

    // Compter les articles avant suppression
    const articleCount = await Article.countDocuments();
    console.log(`📊 Nombre d'articles trouvés: ${articleCount}`);

    if (articleCount === 0) {
      console.log('✅ Aucun article à supprimer. La base de données est déjà vide.');
      await mongoose.connection.close();
      return;
    }

    // Afficher quelques exemples d'articles qui seront supprimés
    const sampleArticles = await Article.find().limit(5).select('title slug status');
    console.log('\n📝 Exemples d\'articles qui seront supprimés:');
    sampleArticles.forEach(art => {
      console.log(`   - ${art.title} (${art.slug}) [${art.status}]`);
    });

    // Supprimer tous les articles
    const result = await Article.deleteMany({});
    
    console.log(`\n✅ ${result.deletedCount} article(s) supprimé(s) avec succès`);
    console.log('✅ Base de données nettoyée et prête pour le vrai contenu\n');

    // Fermer la connexion
    await mongoose.connection.close();
    console.log('✅ Connexion fermée');

  } catch (error) {
    console.error('\n❌ Erreur lors du nettoyage:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Exécuter le script
cleanTestData();

