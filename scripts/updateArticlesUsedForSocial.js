/**
 * Script pour ajouter le champ "usedForSocial" à tous les articles existants
 * Usage: node scripts/updateArticlesUsedForSocial.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('../models/Article');

async function updateArticlesUsedForSocial() {
  try {
    // Connexion à MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URI_PROD;
    
    if (!mongoUri) {
      console.error('❌ Erreur: MONGODB_URI ou MONGODB_URI_PROD doit être défini dans .env');
      process.exit(1);
    }

    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connecté à MongoDB\n');

    // Vérifier la base de données utilisée
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Base de données: ${dbName}\n`);

    // Compter les articles
    const totalArticles = await Article.countDocuments();
    console.log(`📝 Total d'articles dans la base: ${totalArticles}\n`);

    // Trouver les articles qui n'ont pas le champ usedForSocial
    const articlesWithoutField = await Article.find({
      usedForSocial: { $exists: false }
    });

    console.log(`🔍 Articles sans le champ "usedForSocial": ${articlesWithoutField.length}\n`);

    if (articlesWithoutField.length === 0) {
      console.log('✅ Tous les articles ont déjà le champ "usedForSocial"');
      await mongoose.disconnect();
      return;
    }

    // Mettre à jour tous les articles sans le champ
    const result = await Article.updateMany(
      { usedForSocial: { $exists: false } },
      { $set: { usedForSocial: false } }
    );

    console.log(`✅ ${result.modifiedCount} article(s) mis à jour avec "usedForSocial: false"\n`);

    // Vérification finale
    const articlesWithField = await Article.countDocuments({ usedForSocial: { $exists: true } });
    const articlesStillWithout = await Article.countDocuments({ usedForSocial: { $exists: false } });

    console.log('📊 Résumé final:');
    console.log(`   - Articles avec "usedForSocial": ${articlesWithField}`);
    console.log(`   - Articles sans "usedForSocial": ${articlesStillWithout}\n`);

    if (articlesStillWithout === 0) {
      console.log('✅ PARFAIT ! Tous les articles ont maintenant le champ "usedForSocial"');
    } else {
      console.log('⚠️  Certains articles n\'ont toujours pas le champ. Vérifiez les erreurs ci-dessus.');
    }

    await mongoose.disconnect();
    console.log('\n✅ Déconnexion de MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Exécuter le script
updateArticlesUsedForSocial();

