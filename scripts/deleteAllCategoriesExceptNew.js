require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Article = require('../models/Article');

/**
 * Script pour supprimer TOUTES les catégories sauf les 5 nouvelles
 * Utilise directement MongoDB pour être sûr de tout supprimer
 * 
 * Usage:
 *   node scripts/deleteAllCategoriesExceptNew.js
 */

// Liste EXACTE des slugs des nouvelles catégories (seules à conserver)
const NEW_CATEGORY_SLUGS = [
  'decryptage-analyse',
  'compagnies-acteurs',
  'infrastructures-marche',
  'reglementation-securite',
  'regards-perspectives'
];

async function deleteAllExceptNew() {
  try {
    console.log('🗑️  SUPPRESSION DE TOUTES LES CATÉGORIES SAUF LES 5 NOUVELLES\n');
    console.log('='.repeat(70));

    const mongoUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ ERREUR: MONGODB_URI_PROD ou MONGODB_URI n\'est pas défini');
      process.exit(1);
    }

    const dbName = mongoUri.split('/').pop().split('?')[0];
    console.log(`📊 Base de données: ${dbName}\n`);

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Connecté à MongoDB\n');

    // Récupérer TOUTES les catégories
    const allCategories = await Category.find({});
    console.log(`📊 ${allCategories.length} catégorie(s) trouvée(s) au total\n`);

    // Afficher toutes les catégories
    console.log('📋 Liste complète des catégories:\n');
    allCategories.forEach((cat, index) => {
      const isNew = NEW_CATEGORY_SLUGS.includes(cat.slug);
      const status = isNew ? '✅ CONSERVÉE' : '❌ À SUPPRIMER';
      console.log(`${index + 1}. ${status} ${cat.name} (${cat.slug})`);
    });

    // Supprimer toutes les catégories qui ne sont PAS dans la liste des nouvelles
    console.log('\n🗑️  Suppression des catégories...\n');
    let deletedCount = 0;
    let keptCount = 0;

    for (const category of allCategories) {
      if (!NEW_CATEGORY_SLUGS.includes(category.slug)) {
        // Vérifier qu'aucun article n'utilise cette catégorie
        const articlesCount = await Article.countDocuments({ category: category._id });
        
        if (articlesCount === 0) {
          await Category.deleteOne({ _id: category._id });
          console.log(`✅ ${category.name} (${category.slug}): Supprimée`);
          deletedCount++;
        } else {
          console.log(`⚠️  ${category.name}: ${articlesCount} article(s) utilisent encore cette catégorie`);
          console.log(`   💡 Migrez d'abord les articles avec: node scripts/migrateCategories.js`);
        }
      } else {
        console.log(`⏭️  ${category.name}: Conservée (nouvelle catégorie)`);
        keptCount++;
      }
    }

    // Vérification finale
    console.log('\n' + '='.repeat(70));
    console.log('📊 RAPPORT FINAL');
    console.log('='.repeat(70));
    console.log(`✅ Catégories conservées: ${keptCount}`);
    console.log(`🗑️  Catégories supprimées: ${deletedCount}`);

    const finalCategories = await Category.find({}).sort({ name: 1 });
    console.log(`\n📊 Total final: ${finalCategories.length} catégorie(s)\n`);

    if (finalCategories.length === NEW_CATEGORY_SLUGS.length) {
      console.log('✅ PARFAIT ! Seules les 5 nouvelles catégories sont présentes:\n');
      finalCategories.forEach(cat => {
        console.log(`   ✅ ${cat.name} (${cat.slug})`);
      });
    } else {
      console.log(`⚠️  Il reste ${finalCategories.length} catégorie(s):\n`);
      finalCategories.forEach(cat => {
        const isNew = NEW_CATEGORY_SLUGS.includes(cat.slug);
        const status = isNew ? '✅ NOUVELLE' : '❌ ANCIENNE';
        console.log(`   ${status} ${cat.name} (${cat.slug})`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Terminé !\n');
    console.log('💡 Actualisez MongoDB Compass (F5 ou Ctrl+R) pour voir les changements');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    if (error.stack) {
      console.error('\nStack:', error.stack);
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

deleteAllExceptNew();

