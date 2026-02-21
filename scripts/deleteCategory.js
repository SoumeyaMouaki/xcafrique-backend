require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('../models/Article');
const Category = require('../models/Category');

/**
 * Script pour supprimer une catégorie spécifique
 * 
 * Usage: node scripts/deleteCategory.js flotte-technologie
 *        node scripts/deleteCategory.js "Flotte & Technologie"
 */

async function deleteCategory(categoryIdentifier) {
  try {
    console.log('🗑️  Suppression de catégorie\n');
    console.log('='.repeat(60));
    console.log(`📋 Catégorie à supprimer: ${categoryIdentifier}\n`);

    // 1. Vérifier la configuration MongoDB
    let mongoUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ ERREUR: MONGODB_URI_PROD ou MONGODB_URI n\'est pas défini dans votre .env');
      process.exit(1);
    }

    // 2. Connexion à MongoDB
    console.log('📡 Connexion à MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Connecté à MongoDB\n');

    // 3. Trouver la catégorie (par slug ou nom)
    let category = await Category.findOne({ slug: categoryIdentifier });
    
    if (!category) {
      // Essayer par nom (case-insensitive)
      const categoryNameRegex = new RegExp(`^${categoryIdentifier.trim()}$`, 'i');
      category = await Category.findOne({ name: categoryNameRegex });
    }

    if (!category) {
      console.error(`❌ Catégorie "${categoryIdentifier}" non trouvée`);
      console.error('\n💡 Vérifiez le nom ou le slug de la catégorie');
      console.error('   Liste des catégories disponibles:');
      const allCategories = await Category.find({});
      allCategories.forEach(cat => {
        console.log(`   - ${cat.name} (slug: ${cat.slug})`);
      });
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`✅ Catégorie trouvée:`);
    console.log(`   Nom: ${category.name}`);
    console.log(`   Slug: ${category.slug}`);
    console.log(`   ID: ${category._id}\n`);

    // 4. Vérifier si des articles utilisent cette catégorie
    const articlesCount = await Article.countDocuments({ category: category._id });
    
    if (articlesCount > 0) {
      console.log(`⚠️  ATTENTION: ${articlesCount} article(s) utilisent encore cette catégorie !\n`);
      console.log('📄 Articles concernés:');
      const articles = await Article.find({ category: category._id }).select('title slug');
      articles.forEach((article, index) => {
        console.log(`   ${index + 1}. ${article.title} (${article.slug})`);
      });
      console.log('\n❌ Suppression annulée pour éviter de casser les articles');
      console.log('💡 Vous devez d\'abord réassigner ces articles à une autre catégorie');
      await mongoose.connection.close();
      process.exit(1);
    }

    // 5. Supprimer la catégorie
    console.log('✅ Aucun article n\'utilise cette catégorie');
    console.log('🗑️  Suppression de la catégorie...\n');
    
    await Category.deleteOne({ _id: category._id });
    
    console.log(`✅ Catégorie "${category.name}" supprimée avec succès !\n`);

    // 6. Vérifier la suppression
    const verifyCategory = await Category.findOne({ _id: category._id });
    if (verifyCategory) {
      console.log('⚠️  La catégorie existe encore (erreur de suppression)');
    } else {
      console.log('✅ Vérification: La catégorie a bien été supprimée\n');
    }

    // 7. Afficher les catégories restantes
    const remainingCategories = await Category.find({}).sort({ name: 1 });
    console.log(`📋 Catégories restantes: ${remainingCategories.length}`);
    remainingCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name} (${cat.slug})`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Opération terminée !');
    console.log('='.repeat(60));

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Récupérer le nom/slug de la catégorie depuis les arguments
const categoryIdentifier = process.argv[2];

if (!categoryIdentifier) {
  console.error('❌ Usage: node scripts/deleteCategory.js <slug-ou-nom-categorie>');
  console.error('   Exemple: node scripts/deleteCategory.js flotte-technologie');
  console.error('   Exemple: node scripts/deleteCategory.js "Flotte & Technologie"');
  process.exit(1);
}

deleteCategory(categoryIdentifier);

