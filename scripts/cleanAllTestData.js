require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Article = require('../models/Article');
const Category = require('../models/Category');
const Contact = require('../models/Contact');
const Newsletter = require('../models/Newsletter');

/**
 * Script pour supprimer toutes les données de test
 * Supprime: Articles, Contacts, Newsletter
 * Conserve: Catégories (nécessaires pour les articles)
 * 
 * Usage: node scripts/cleanAllTestData.js
 */

async function cleanAllTestData() {
  try {
    await connectDB();
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('🧹 Nettoyage complet des données de test...\n');

    // Compter avant suppression
    const articleCount = await Article.countDocuments();
    const contactCount = await Contact.countDocuments();
    const newsletterCount = await Newsletter.countDocuments();
    const categoryCount = await Category.countDocuments();

    console.log('📊 Données actuelles:');
    console.log(`   Articles: ${articleCount}`);
    console.log(`   Contacts: ${contactCount}`);
    console.log(`   Newsletter: ${newsletterCount}`);
    console.log(`   Catégories: ${categoryCount} (conservées)\n`);

    // Supprimer les articles
    if (articleCount > 0) {
      const articleResult = await Article.deleteMany({});
      console.log(`✅ ${articleResult.deletedCount} article(s) supprimé(s)`);
    } else {
      console.log('✅ Aucun article à supprimer');
    }

    // Supprimer les contacts
    if (contactCount > 0) {
      const contactResult = await Contact.deleteMany({});
      console.log(`✅ ${contactResult.deletedCount} contact(s) supprimé(s)`);
    } else {
      console.log('✅ Aucun contact à supprimer');
    }

    // Supprimer les abonnés newsletter
    if (newsletterCount > 0) {
      const newsletterResult = await Newsletter.deleteMany({});
      console.log(`✅ ${newsletterResult.deletedCount} abonné(s) newsletter supprimé(s)`);
    } else {
      console.log('✅ Aucun abonné newsletter à supprimer');
    }

    console.log('\n✅ Base de données nettoyée !');
    console.log('📁 Les catégories ont été conservées (nécessaires pour les articles)');
    console.log('✅ Prêt pour le vrai contenu\n');

    await mongoose.connection.close();

  } catch (error) {
    console.error('\n❌ Erreur lors du nettoyage:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

cleanAllTestData();

