require('dotenv').config();
const connectDB = require('../config/database');
const Category = require('../models/Category');

/**
 * Script pour vérifier les catégories dans MongoDB
 * 
 * Usage: node scripts/checkCategories.js
 */

async function checkCategories() {
  try {
    console.log('🔍 Vérification des catégories dans MongoDB...\n');

    // Connexion à MongoDB
    await connectDB();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ Connecté à MongoDB');
    console.log(`📊 Base de données: ${require('mongoose').connection.db.databaseName}\n`);

    // Récupérer toutes les catégories
    const categories = await Category.find({});
    
    console.log(`📋 Nombre de catégories trouvées: ${categories.length}\n`);

    if (categories.length === 0) {
      console.log('⚠️  Aucune catégorie trouvée dans la base de données');
      console.log('💡 Exécutez: node scripts/createCategories.js');
    } else {
      console.log('📂 Liste des catégories:');
      console.log('='.repeat(60));
      categories.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.name}`);
        console.log(`   Slug: ${cat.slug}`);
        console.log(`   Couleur: ${cat.color}`);
        console.log(`   Active: ${cat.isActive ? '✅' : '❌'}`);
        console.log(`   ID: ${cat._id}`);
        console.log('');
      });
    }

    // Vérifier les catégories actives
    const activeCategories = await Category.find({ isActive: true });
    console.log(`✅ Catégories actives: ${activeCategories.length}`);

    const mongoose = require('mongoose');
    await mongoose.connection.close();
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
checkCategories();

