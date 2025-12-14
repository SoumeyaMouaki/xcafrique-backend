require('dotenv').config();
const mongoose = require('mongoose');

/**
 * Script pour tester la connexion MongoDB Atlas
 */

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  
  console.log('🔍 Test de connexion MongoDB Atlas\n');
  console.log('URI:', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Masquer le mot de passe
  console.log('');

  try {
    // Options de connexion pour MongoDB Atlas
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout après 5 secondes
      socketTimeoutMS: 45000,
    };

    console.log('⏳ Tentative de connexion...');
    const conn = await mongoose.connect(uri, options);
    
    console.log('✅ Connexion réussie !');
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   Ready State: ${conn.connection.readyState}`);
    
    // Lister les collections
    const db = conn.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`\n📁 Collections (${collections.length}):`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Test terminé avec succès');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur de connexion:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Problème détecté :');
      console.log('   Le nom du cluster MongoDB Atlas est introuvable.');
      console.log('   Vérifiez que :');
      console.log('   1. Le nom du cluster est correct dans l\'URI');
      console.log('   2. Le format est : mongodb+srv://user:pass@cluster-name.mongodb.net/dbname');
      console.log('   3. Votre IP est autorisée dans MongoDB Atlas (Network Access)');
    } else if (error.message.includes('authentication failed')) {
      console.log('\n💡 Problème d\'authentification :');
      console.log('   Vérifiez votre nom d\'utilisateur et mot de passe dans l\'URI');
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 Timeout de connexion :');
      console.log('   Vérifiez votre connexion internet');
      console.log('   Vérifiez que votre IP est autorisée dans MongoDB Atlas');
    }
    
    process.exit(1);
  }
}

testConnection();

