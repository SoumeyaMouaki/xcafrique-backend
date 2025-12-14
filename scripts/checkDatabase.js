require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Article = require('../models/Article');
const Category = require('../models/Category');
const User = require('../models/User');
const Contact = require('../models/Contact');

/**
 * Script de diagnostic pour vérifier l'état de la base de données MongoDB
 */

async function checkDatabase() {
  try {
    console.log('🔍 Diagnostic de la base de données MongoDB\n');
    console.log('URI MongoDB:', process.env.MONGODB_URI || 'Non défini');
    console.log('');

    // Connexion à MongoDB
    await connectDB();
    await new Promise(resolve => setTimeout(resolve, 1000));

    const db = mongoose.connection.db;
    const dbName = db.databaseName;

    console.log(`📊 Base de données: ${dbName}\n`);

    // Lister toutes les collections
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections trouvées:');
    if (collections.length === 0) {
      console.log('   ⚠️  Aucune collection trouvée !\n');
    } else {
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
      console.log('');
    }

    // Compter les documents dans chaque collection
    console.log('📈 Nombre de documents par collection:\n');

    const articleCount = await Article.countDocuments();
    console.log(`   Articles: ${articleCount}`);

    const categoryCount = await Category.countDocuments();
    console.log(`   Catégories: ${categoryCount}`);

    const userCount = await User.countDocuments();
    console.log(`   Utilisateurs: ${userCount}`);

    const contactCount = await Contact.countDocuments();
    console.log(`   Contacts: ${contactCount}`);

    console.log('');

    // Afficher quelques exemples
    if (articleCount > 0) {
      console.log('📝 Exemples d\'articles:');
      const articles = await Article.find().limit(3).select('title slug status');
      articles.forEach(art => {
        console.log(`   - ${art.title} (${art.slug}) [${art.status}]`);
      });
      console.log('');
    }

    if (categoryCount > 0) {
      console.log('📁 Exemples de catégories:');
      const categories = await Category.find().limit(3).select('name slug');
      categories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.slug})`);
      });
      console.log('');
    }

    if (userCount > 0) {
      console.log('👤 Utilisateurs:');
      const users = await User.find().select('username email role');
      users.forEach(user => {
        console.log(`   - ${user.username} (${user.email}) [${user.role}]`);
      });
      console.log('');
    }

    // Recommandations
    console.log('💡 Recommandations:\n');
    
    if (userCount === 0) {
      console.log('   ⚠️  Aucun utilisateur trouvé. Exécutez: npm run seed');
    }
    
    if (categoryCount === 0) {
      console.log('   ⚠️  Aucune catégorie trouvée. Exécutez: npm run seed');
    }
    
    if (articleCount === 0) {
      console.log('   ⚠️  Aucun article trouvé. Exécutez: npm run seed ou node test-content.js');
    }

    if (userCount > 0 && categoryCount > 0 && articleCount > 0) {
      console.log('   ✅ La base de données semble correctement peuplée !');
    }

    console.log('');

    // Fermer la connexion
    await mongoose.connection.close();
    console.log('✅ Diagnostic terminé');

  } catch (error) {
    console.error('\n❌ Erreur lors du diagnostic:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 MongoDB n\'est pas en cours d\'exécution.');
      console.log('   Démarrez MongoDB avec: mongod');
      console.log('   Ou vérifiez votre URI MongoDB dans .env');
    } else if (error.message.includes('authentication failed')) {
      console.log('\n💡 Erreur d\'authentification MongoDB.');
      console.log('   Vérifiez vos identifiants dans MONGODB_URI');
    }
    
    process.exit(1);
  }
}

// Exécuter le diagnostic
checkDatabase();

