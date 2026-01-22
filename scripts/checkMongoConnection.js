require('dotenv').config();
const mongoose = require('mongoose');

/**
 * Script pour vérifier la connexion MongoDB et lister toutes les bases de données
 */

async function checkConnection() {
  try {
    console.log('🔍 VÉRIFICATION DE LA CONNEXION MONGODB\n');
    console.log('='.repeat(70));

    const mongoUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ ERREUR: MONGODB_URI_PROD ou MONGODB_URI n\'est pas défini');
      process.exit(1);
    }

    const uriPreview = mongoUri.replace(/\/\/.*:.*@/, '//***:***@').substring(0, 60) + '...';
    const dbName = mongoUri.split('/').pop().split('?')[0];
    
    console.log(`🔌 MongoDB URI: ${uriPreview}`);
    console.log(`📊 Base de données cible: ${dbName}\n`);

    await mongoose.connect(mongoUri, {
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
      const isTarget = db.name === dbName;
      const marker = isTarget ? '👉' : '  ';
      console.log(`${marker} ${index + 1}. ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });

    // Vérifier la base de données actuelle
    const currentDb = mongoose.connection.db;
    console.log(`\n📊 Base de données actuelle: ${currentDb.databaseName}\n`);

    // Vérifier les collections
    const collections = await currentDb.listCollections().toArray();
    console.log(`📋 Collections dans "${currentDb.databaseName}":\n`);
    collections.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.name}`);
    });

    // Vérifier les catégories
    if (collections.some(c => c.name === 'categories')) {
      const categoriesCollection = currentDb.collection('categories');
      const categoriesCount = await categoriesCollection.countDocuments();
      const categories = await categoriesCollection.find({}).toArray();
      
      console.log(`\n📊 Catégories dans la collection "categories": ${categoriesCount}\n`);
      categories.forEach((cat, index) => {
        console.log(`   ${index + 1}. ${cat.name} (${cat.slug}) - Active: ${cat.isActive ? '✅' : '❌'}`);
      });
    } else {
      console.log('\n⚠️  Collection "categories" introuvable !');
    }

    await mongoose.connection.close();
    console.log('\n✅ Vérification terminée !\n');
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

checkConnection();

