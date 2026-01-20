require('dotenv').config();
const connectDB = require('../config/database');
const Category = require('../models/Category');

/**
 * Script pour lister toutes les catégories avec leur statut
 * 
 * Usage: 
 *   node scripts/listCategories.js
 *   MONGODB_URI_PROD="..." node scripts/listCategories.js
 */

async function listCategories() {
  try {
    console.log('📂 Liste des catégories\n');

    // Utiliser MONGODB_URI_PROD si disponible, sinon MONGODB_URI
    const mongoUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ Erreur: MONGODB_URI_PROD ou MONGODB_URI n\'est pas défini');
      process.exit(1);
    }

    // Connexion à MongoDB
    await connectDB();
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Connecté à MongoDB\n');

    // Récupérer toutes les catégories
    const categories = await Category.find({}).sort({ name: 1 });

    if (categories.length === 0) {
      console.log('❌ Aucune catégorie trouvée dans la base de données\n');
      process.exit(0);
    }

    console.log(`📊 ${categories.length} catégorie(s) trouvée(s):\n`);

    // Séparer les catégories actives et inactives
    const activeCategories = categories.filter(cat => cat.isActive);
    const inactiveCategories = categories.filter(cat => !cat.isActive);

    if (activeCategories.length > 0) {
      console.log('✅ Catégories ACTIVES:');
      activeCategories.forEach((cat, index) => {
        console.log(`   ${index + 1}. ${cat.name}`);
        console.log(`      Slug: ${cat.slug}`);
        console.log(`      Couleur: ${cat.color || 'N/A'}`);
        console.log(`      Description: ${cat.description || 'N/A'}`);
        console.log('');
      });
    }

    if (inactiveCategories.length > 0) {
      console.log('❌ Catégories INACTIVES:');
      inactiveCategories.forEach((cat, index) => {
        console.log(`   ${index + 1}. ${cat.name}`);
        console.log(`      Slug: ${cat.slug}`);
        console.log(`      Couleur: ${cat.color || 'N/A'}`);
        console.log(`      Description: ${cat.description || 'N/A'}`);
        console.log('');
      });
    }

    console.log('='.repeat(50));
    console.log(`📊 Résumé:`);
    console.log(`   ✅ Actives: ${activeCategories.length}`);
    console.log(`   ❌ Inactives: ${inactiveCategories.length}`);
    console.log(`   📋 Total: ${categories.length}`);

    const mongoose = require('mongoose');
    await mongoose.connection.close();
    console.log('\n✅ Déconnexion de MongoDB\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
listCategories();

