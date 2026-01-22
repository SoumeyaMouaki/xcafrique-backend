require('dotenv').config();
const mongoose = require('mongoose');

/**
 * Script pour migrer les articles de la base locale vers les nouvelles catégories
 * 
 * Usage:
 *   node scripts/migrateLocalArticles.js
 */

// Mapping des anciennes catégories vers les nouvelles
const categoryMapping = {
  'Aéroports & Infrastructures': 'Infrastructures & Marché',
  'aeroports-infrastructures': 'Infrastructures & Marché',
  'Compagnies aériennes': 'Compagnies & Acteurs',
  'compagnies-aeriennes': 'Compagnies & Acteurs',
  'Passagers & Service': 'Compagnies & Acteurs',
  'passagers-service': 'Compagnies & Acteurs',
  'Flotte & Technologie': 'Décryptage & Analyse',
  'flotte-technologie': 'Décryptage & Analyse',
  'Développement durable': 'Décryptage & Analyse',
  'developpement-durable': 'Décryptage & Analyse'
};

async function migrateLocalArticles() {
  try {
    console.log('🔄 MIGRATION DES ARTICLES - BASE LOCALE\n');
    console.log('='.repeat(70));

    const localUri = 'mongodb://localhost:27017/xcafrique';
    console.log(`🔌 MongoDB URI locale: ${localUri}\n`);

    await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 5000,
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Connecté à MongoDB local\n');

    const db = mongoose.connection.db;
    const categoriesCollection = db.collection('categories');
    const articlesCollection = db.collection('articles');

    // Récupérer toutes les catégories
    const allCategories = await categoriesCollection.find({}).toArray();
    
    // Créer un mapping des anciennes catégories vers les nouvelles
    const categoryMap = {};
    for (const cat of allCategories) {
      const newCategoryName = categoryMapping[cat.name] || categoryMapping[cat.slug];
      if (newCategoryName) {
        const newCategory = allCategories.find(c => c.name === newCategoryName);
        if (newCategory) {
          categoryMap[cat._id.toString()] = newCategory._id;
          console.log(`📋 Mapping: ${cat.name} → ${newCategoryName}`);
        }
      }
    }

    // Récupérer tous les articles avec leurs catégories
    const articles = await articlesCollection.find({}).toArray();
    console.log(`\n📄 ${articles.length} article(s) trouvé(s)\n`);

    let migratedCount = 0;
    for (const article of articles) {
      if (article.category) {
        const oldCategoryId = article.category.toString();
        const newCategoryId = categoryMap[oldCategoryId];
        
        if (newCategoryId) {
          await articlesCollection.updateOne(
            { _id: article._id },
            { $set: { category: newCategoryId } }
          );
          
          const oldCat = allCategories.find(c => c._id.toString() === oldCategoryId);
          const newCat = allCategories.find(c => c._id.toString() === newCategoryId.toString());
          
          console.log(`✅ ${article.title?.substring(0, 50) || 'Article sans titre'}...`);
          console.log(`   ${oldCat?.name} → ${newCat?.name}`);
          migratedCount++;
        }
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 RAPPORT FINAL');
    console.log('='.repeat(70));
    console.log(`✅ Articles migrés: ${migratedCount}`);

    await mongoose.connection.close();
    console.log('\n✅ Migration terminée !\n');
    console.log('💡 Exécutez maintenant: node scripts/syncLocalCategories.js');
    console.log('   pour supprimer les anciennes catégories');
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

migrateLocalArticles();

