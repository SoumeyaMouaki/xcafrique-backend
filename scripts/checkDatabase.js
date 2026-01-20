require('dotenv').config();
const mongoose = require('mongoose');

/**
 * Script pour vérifier quelle base de données MongoDB est utilisée
 * 
 * Usage: node scripts/checkDatabase.js
 */

async function checkDatabase() {
  try {
    console.log('🔍 Vérification de la configuration MongoDB...\n');

    const mongodbUri = process.env.MONGODB_URI;
    
    if (!mongodbUri) {
      console.error('❌ MONGODB_URI n\'est pas défini dans .env');
      process.exit(1);
    }

    // Extraire le nom de la base de données de l'URI
    const dbNameFromUri = mongodbUri.split('/').pop().split('?')[0];
    
    console.log('📋 Configuration:');
    console.log(`   MONGODB_URI: ${mongodbUri.replace(/\/\/.*:.*@/, '//***:***@')}`);
    console.log(`   Nom de la base (depuis URI): ${dbNameFromUri}\n`);

    // Se connecter pour vérifier
    await mongoose.connect(mongodbUri, {
      serverSelectionTimeoutMS: 5000
    });

    const actualDbName = mongoose.connection.db.databaseName;
    console.log(`✅ Connecté à MongoDB`);
    console.log(`📊 Base de données actuelle: ${actualDbName}\n`);

    // Lister toutes les bases de données disponibles
    const adminDb = mongoose.connection.db.admin();
    const databases = await adminDb.listDatabases();
    
    console.log('📂 Bases de données disponibles:');
    databases.databases.forEach(db => {
      const marker = db.name === 'XCAfrique' ? ' ⭐' : '';
      console.log(`   - ${db.name}${marker}`);
    });

    // Vérifier si XCAfrique existe
    const xcafriqueExists = databases.databases.some(db => db.name === 'XCAfrique');
    const xcafriqueLowerExists = databases.databases.some(db => db.name === 'xcafrique');

    console.log('\n🔍 Analyse:');
    if (actualDbName === 'XCAfrique') {
      console.log('   ✅ Vous êtes connecté à la base "XCAfrique"');
    } else if (actualDbName === 'xcafrique') {
      console.log('   ⚠️  Vous êtes connecté à la base "xcafrique" (minuscules)');
      console.log('   💡 La base "XCAfrique" existe-t-elle ?', xcafriqueExists ? 'OUI' : 'NON');
    } else {
      console.log(`   ⚠️  Vous êtes connecté à la base "${actualDbName}"`);
      console.log('   💡 La base "XCAfrique" existe-t-elle ?', xcafriqueExists ? 'OUI' : 'NON');
    }

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkDatabase();
