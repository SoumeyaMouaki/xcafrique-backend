require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

/**
 * Script pour activer/désactiver une catégorie
 * 
 * Usage: 
 *   node scripts/activateCategory.js [slug] [true|false]
 * 
 * Exemples:
 *   node scripts/activateCategory.js passagers-service true
 *   node scripts/activateCategory.js passagers-service false
 *   node scripts/activateCategory.js passagers-service (active par défaut)
 */

async function activateCategory(categorySlug, shouldActivate = true) {
  try {
    console.log(`📂 ${shouldActivate ? 'Activation' : 'Désactivation'} de la catégorie: ${categorySlug}\n`);

    // Utiliser MONGODB_URI_PROD si disponible, sinon MONGODB_URI
    const mongoUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ Erreur: MONGODB_URI_PROD ou MONGODB_URI n\'est pas défini');
      console.error('💡 Définissez MONGODB_URI_PROD dans votre .env ou passez-le en variable d\'environnement');
      process.exit(1);
    }

    // Afficher un avertissement si on utilise MONGODB_URI (peut être local)
    if (!process.env.MONGODB_URI_PROD && process.env.MONGODB_URI) {
      console.log('⚠️  ATTENTION: Utilisation de MONGODB_URI (vérifiez que c\'est bien la base de production)\n');
    }

    // Connexion à MongoDB
    console.log('🔌 Connexion à MongoDB...');
    const mongoose = require('mongoose');
    
    // Utiliser directement mongoose.connect avec l'URI spécifiée
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Connecté à MongoDB\n');

    // Normaliser le slug
    const normalizedSlug = categorySlug.toLowerCase().trim();

    // Chercher la catégorie
    let category = await Category.findOne({ 
      slug: normalizedSlug 
    });

    if (!category) {
      // Essayer aussi sans normalisation
      category = await Category.findOne({ 
        $or: [
          { slug: categorySlug },
          { name: new RegExp(categorySlug, 'i') }
        ]
      });
    }

    if (!category) {
      console.error(`❌ Catégorie "${categorySlug}" non trouvée\n`);
      console.log('💡 Catégories disponibles:');
      const allCategories = await Category.find({}).sort({ name: 1 });
      if (allCategories.length === 0) {
        console.log('   Aucune catégorie trouvée dans la base de données');
      } else {
        allCategories.forEach(cat => {
          const status = cat.isActive ? '✅' : '❌';
          console.log(`   ${status} ${cat.name} (${cat.slug})`);
        });
      }
      process.exit(1);
    }

    // Afficher l'état actuel
    console.log(`📄 Catégorie trouvée: ${category.name}`);
    console.log(`   Slug: ${category.slug}`);
    console.log(`   État actuel: ${category.isActive ? '✅ Active' : '❌ Inactive'}\n`);

    // Vérifier si un changement est nécessaire
    if (category.isActive === shouldActivate) {
      console.log(`ℹ️  La catégorie est déjà ${shouldActivate ? 'active' : 'inactive'}`);
      console.log('   Aucune modification nécessaire\n');
    } else {
      // Mettre à jour
      category.isActive = shouldActivate;
      await category.save();
      
      console.log(`✅ Catégorie ${shouldActivate ? 'activée' : 'désactivée'} avec succès !\n`);
      console.log(`📄 État final: ${category.isActive ? '✅ Active' : '❌ Inactive'}`);
    }

    // Afficher les détails complets
    console.log('\n📋 Détails de la catégorie:');
    console.log(`   ID: ${category._id}`);
    console.log(`   Nom: ${category.name}`);
    console.log(`   Slug: ${category.slug}`);
    console.log(`   Description: ${category.description || 'N/A'}`);
    console.log(`   Couleur: ${category.color || 'N/A'}`);
    console.log(`   Active: ${category.isActive ? '✅ Oui' : '❌ Non'}`);
    console.log(`   Créée le: ${new Date(category.createdAt).toLocaleString('fr-FR')}`);
    console.log(`   Modifiée le: ${new Date(category.updatedAt).toLocaleString('fr-FR')}`);

    await mongoose.connection.close();
    console.log('\n✅ Déconnexion de MongoDB\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.message.includes('MONGODB_URI')) {
      console.error('\n💡 Vérifiez que MONGODB_URI_PROD est défini dans votre .env');
    }
    process.exit(1);
  }
}

// Récupérer les arguments
const categorySlug = process.argv[2];
const shouldActivate = process.argv[3] !== 'false'; // true par défaut, false seulement si explicitement "false"

if (!categorySlug) {
  console.error('❌ Erreur: Slug de catégorie manquant');
  console.error('\nUsage:');
  console.error('  node scripts/activateCategory.js [slug] [true|false]');
  console.error('\nExemples:');
  console.error('  node scripts/activateCategory.js passagers-service');
  console.error('  node scripts/activateCategory.js passagers-service true');
  console.error('  node scripts/activateCategory.js passagers-service false');
  process.exit(1);
}

// Exécuter le script
activateCategory(categorySlug, shouldActivate);

