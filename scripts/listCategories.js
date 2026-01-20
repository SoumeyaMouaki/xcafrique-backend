require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

async function listCategories() {
  try {
    const mongoUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ ERREUR: MONGODB_URI_PROD ou MONGODB_URI n\'est pas défini');
      process.exit(1);
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const categories = await Category.find({}).sort({ name: 1 });
    
    console.log(`\n📋 ${categories.length} catégorie(s) trouvée(s):\n`);
    categories.forEach(cat => {
      console.log(`   Nom: "${cat.name}"`);
      console.log(`   Slug: ${cat.slug}`);
      console.log(`   Couleur: ${cat.color || '❌ Pas de couleur'}`);
      console.log(`   Active: ${cat.isActive ? '✅' : '❌'}`);
      console.log('');
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

listCategories();
