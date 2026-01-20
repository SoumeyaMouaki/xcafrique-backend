require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Article = require('../models/Article');
const Category = require('../models/Category');
const Contact = require('../models/Contact');

/**
 * Script pour vérifier les données restantes dans la base
 */

async function checkRemainingData() {
  try {
    await connectDB();
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('📊 Vérification des données restantes...\n');

    const articleCount = await Article.countDocuments();
    const categoryCount = await Category.countDocuments();
    const contactCount = await Contact.countDocuments();

    console.log(`📝 Articles: ${articleCount}`);
    console.log(`📁 Catégories: ${categoryCount}`);
    console.log(`📧 Contacts: ${contactCount}`);

    if (articleCount === 0 && contactCount === 0) {
      console.log('\n✅ Base de données propre - Prête pour le vrai contenu !');
    } else {
      console.log('\n⚠️  Il reste des données dans la base.');
    }

    await mongoose.connection.close();

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkRemainingData();

