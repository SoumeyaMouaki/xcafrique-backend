require('dotenv').config();
const connectDB = require('../config/database');
const Category = require('../models/Category');

/**
 * Script pour supprimer les anciennes catégories et garder uniquement les 11 nouvelles
 * 
 * Usage: node scripts/cleanOldCategories.js
 */

// Liste des slugs des nouvelles catégories à garder
const newCategorySlugs = [
  'incidents-securite',
  'aeroports-infrastructures',
  'compagnies-aeriennes',
  'operations-meteo',
  'passagers-service',
  'reglementation-conformite',
  'flotte-technologie',
  'economie-finance',
  'developpement-durable',
  'formation-emploi',
  'aviation-africaine'
];

async function cleanOldCategories() {
  try {
    console.log('🧹 Nettoyage des anciennes catégories...\n');

    // Connexion à MongoDB
    await connectDB();
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Connecté à MongoDB\n');

    // Récupérer toutes les catégories
    const allCategories = await Category.find({});
    console.log(`📋 Total de catégories: ${allCategories.length}\n`);

    // Identifier les anciennes catégories (celles qui ne sont pas dans la liste des nouvelles)
    const oldCategories = allCategories.filter(
      cat => !newCategorySlugs.includes(cat.slug)
    );

    if (oldCategories.length === 0) {
      console.log('✅ Aucune ancienne catégorie à supprimer');
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`🗑️  Anciennes catégories à supprimer: ${oldCategories.length}\n`);

    // Afficher les catégories qui seront supprimées
    oldCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (${cat.slug})`);
    });

    console.log('\n⚠️  ATTENTION: Cette action est irréversible !');
    console.log('💡 Les articles liés à ces catégories devront être réassignés manuellement.\n');

    // Supprimer les anciennes catégories
    const deleteResult = await Category.deleteMany({
      slug: { $nin: newCategorySlugs }
    });

    console.log(`\n✅ ${deleteResult.deletedCount} ancienne(s) catégorie(s) supprimée(s)`);

    // Afficher les catégories restantes
    const remainingCategories = await Category.find({});
    console.log(`\n📋 Catégories restantes: ${remainingCategories.length}`);
    remainingCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name} (${cat.slug})`);
    });

    const mongoose = require('mongoose');
    await mongoose.connection.close();
    console.log('\n✅ Nettoyage terminé !');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Exécuter le script
cleanOldCategories();

