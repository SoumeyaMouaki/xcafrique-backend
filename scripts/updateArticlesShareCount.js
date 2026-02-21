require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('../models/Article');
const connectDB = require('../config/database');

/**
 * Script pour ajouter le champ shareCount à tous les articles existants
 * Met à jour tous les articles qui n'ont pas encore le champ shareCount
 */

async function updateArticlesShareCount() {
  try {
    console.log('🔄 Mise à jour du champ shareCount pour tous les articles...\n');

    // Connexion à MongoDB
    await connectDB();

    // Trouver tous les articles sans shareCount ou avec shareCount null/undefined
    const articlesToUpdate = await Article.find({
      $or: [
        { shareCount: { $exists: false } },
        { shareCount: null },
        { shareCount: undefined }
      ]
    });

    console.log(`📊 Articles à mettre à jour: ${articlesToUpdate.length}`);

    if (articlesToUpdate.length === 0) {
      console.log('✅ Tous les articles ont déjà le champ shareCount défini.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Mettre à jour tous les articles
    const result = await Article.updateMany(
      {
        $or: [
          { shareCount: { $exists: false } },
          { shareCount: null },
          { shareCount: undefined }
        ]
      },
      { $set: { shareCount: 0 } }
    );

    console.log(`✅ ${result.modifiedCount} article(s) mis à jour avec shareCount: 0`);

    // Vérifier le résultat
    const remainingArticles = await Article.find({
      $or: [
        { shareCount: { $exists: false } },
        { shareCount: null },
        { shareCount: undefined }
      ]
    });

    if (remainingArticles.length === 0) {
      console.log('✅ Tous les articles ont maintenant le champ shareCount défini.');
    } else {
      console.warn(`⚠️  ${remainingArticles.length} article(s) n'ont toujours pas shareCount défini.`);
    }

    // Afficher quelques exemples
    const sampleArticles = await Article.find({ shareCount: { $exists: true } })
      .select('title slug shareCount')
      .limit(5)
      .lean();

    console.log('\n📋 Exemples d\'articles mis à jour:');
    sampleArticles.forEach(article => {
      console.log(`   - ${article.title} (${article.slug}): ${article.shareCount} partage(s)`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Mise à jour terminée avec succès!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Exécuter le script
updateArticlesShareCount();

