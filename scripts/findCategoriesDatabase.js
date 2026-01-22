require('dotenv').config();
const mongoose = require('mongoose');

/**
 * Script pour trouver dans quelle base de données se trouvent les catégories
 */

async function findCategories() {
  try {
    console.log('🔍 RECHERCHE DES CATÉGORIES DANS TOUTES LES BASES\n');
    console.log('='.repeat(70));

    const baseUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;
    
    if (!baseUri) {
      console.error('❌ ERREUR: MONGODB_URI_PROD ou MONGODB_URI n\'est pas défini');
      process.exit(1);
    }

    // Se connecter sans spécifier de base de données
    const uriWithoutDb = baseUri.replace(/\/[^\/\?]+(\?|$)/, '/admin$1');
    
    await mongoose.connect(uriWithoutDb, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Connecté à MongoDB\n');

    const adminDb = mongoose.connection.db.admin();
    const databases = await adminDb.listDatabases();
    
    console.log('📊 Bases de données disponibles:\n');
    databases.databases.forEach((db, index) => {
      console.log(`${index + 1}. ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });

    // Chercher les catégories dans chaque base
    console.log('\n🔍 Recherche des catégories dans chaque base...\n');
    
    for (const dbInfo of databases.databases) {
      if (dbInfo.name === 'admin' || dbInfo.name === 'local' || dbInfo.name === 'config') {
        continue;
      }
      
      try {
        const db = mongoose.connection.getClient().db(dbInfo.name);
        const categoriesCollection = db.collection('categories');
        const count = await categoriesCollection.countDocuments();
        
        if (count > 0) {
          console.log(`📊 Base "${dbInfo.name}": ${count} catégorie(s) trouvée(s)`);
          
          const categories = await categoriesCollection.find({}).toArray();
          console.log(`   Catégories:`);
          categories.forEach(cat => {
            console.log(`   - ${cat.name} (${cat.slug})`);
          });
          console.log('');
        }
      } catch (error) {
        // Ignorer les erreurs
      }
    }

    await mongoose.connection.close();
    console.log('✅ Recherche terminée !\n');
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

findCategories();

