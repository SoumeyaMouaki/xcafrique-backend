require('dotenv').config();
const mongoose = require('mongoose');

/**
 * Script pour supprimer TOUTES les anciennes catégories dans la base "xcafrique" (minuscules)
 * 
 * Usage:
 *   node scripts/deleteOldCategoriesInXcafrique.js
 */

// Slugs des nouvelles catégories à CONSERVER
const NEW_CATEGORY_SLUGS = [
  'decryptage-analyse',
  'compagnies-acteurs',
  'infrastructures-marche',
  'reglementation-securite',
  'regards-perspectives'
];

async function deleteOldCategories() {
  try {
    console.log('🗑️  SUPPRESSION DES ANCIENNES CATÉGORIES DANS "xcafrique"\n');
    console.log('='.repeat(70));

    // Récupérer l'URI de base
    const baseUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;
    
    if (!baseUri) {
      console.error('❌ ERREUR: MONGODB_URI_PROD ou MONGODB_URI n\'est pas défini');
      process.exit(1);
    }

    // Forcer le nom de la base de données à "xcafrique" (minuscules)
    let mongoUri = baseUri;
    
    // Extraire la partie avant le nom de la base
    const uriMatch = baseUri.match(/^(mongodb\+srv:\/\/[^\/]+)\/([^?]+)(\?.*)?$/);
    if (uriMatch) {
      // Remplacer le nom de la base par "xcafrique"
      mongoUri = `${uriMatch[1]}/xcafrique${uriMatch[3] || ''}`;
    } else {
      // Si le format est différent, ajouter /xcafrique à la fin
      if (!baseUri.includes('/xcafrique') && !baseUri.includes('/XCAfrique')) {
        mongoUri = baseUri.replace(/\/([^\/\?]+)(\?|$)/, '/xcafrique$2');
      } else {
        // Remplacer XCAfrique par xcafrique
        mongoUri = baseUri.replace(/\/XCAfrique(\?|$)/i, '/xcafrique$1');
      }
    }

    const uriPreview = mongoUri.replace(/\/\/.*:.*@/, '//***:***@').substring(0, 60) + '...';
    console.log(`🔌 MongoDB URI: ${uriPreview}`);
    console.log(`📊 Base de données: xcafrique (forcée)\n`);

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Connecté à MongoDB\n');

    const db = mongoose.connection.db;
    const actualDbName = db.databaseName;
    console.log(`📊 Base de données actuelle: ${actualDbName}\n`);

    if (actualDbName.toLowerCase() !== 'xcafrique') {
      console.log(`⚠️  ATTENTION: La base de données actuelle est "${actualDbName}" et non "xcafrique"`);
      console.log(`   Vérifiez votre URI MongoDB\n`);
    }

    const categoriesCollection = db.collection('categories');
    const articlesCollection = db.collection('articles');

    // Récupérer TOUTES les catégories
    const allCategories = await categoriesCollection.find({}).toArray();
    console.log(`📊 ${allCategories.length} catégorie(s) trouvée(s) dans la base "${actualDbName}"\n`);

    // Afficher toutes les catégories
    console.log('📋 Liste complète des catégories:\n');
    allCategories.forEach((cat, index) => {
      const isNew = NEW_CATEGORY_SLUGS.includes(cat.slug);
      const status = isNew ? '✅ CONSERVÉE' : '❌ À SUPPRIMER';
      console.log(`${index + 1}. ${status} ${cat.name} (${cat.slug})`);
    });

    // Supprimer toutes les catégories qui ne sont PAS dans la liste des nouvelles
    console.log('\n🗑️  Suppression en cours...\n');
    let deletedCount = 0;
    let keptCount = 0;

    for (const category of allCategories) {
      const isNew = NEW_CATEGORY_SLUGS.includes(category.slug);
      
      if (!isNew) {
        // Vérifier qu'aucun article n'utilise cette catégorie
        const articlesCount = await articlesCollection.countDocuments({ category: category._id });
        
        if (articlesCount === 0) {
          await categoriesCollection.deleteOne({ _id: category._id });
          console.log(`✅ ${category.name} (${category.slug}): Supprimée`);
          deletedCount++;
        } else {
          console.log(`⚠️  ${category.name}: ${articlesCount} article(s) utilisent encore cette catégorie`);
          console.log(`   💡 Les articles doivent être migrés d'abord`);
        }
      } else {
        console.log(`⏭️  ${category.name}: Conservée (nouvelle catégorie)`);
        keptCount++;
      }
    }

    // Vérification finale
    console.log('\n' + '='.repeat(70));
    console.log('📊 RAPPORT FINAL');
    console.log('='.repeat(70));
    console.log(`✅ Catégories conservées: ${keptCount}`);
    console.log(`🗑️  Catégories supprimées: ${deletedCount}`);

    const finalCategories = await categoriesCollection.find({}).toArray();
    console.log(`\n📊 Total final: ${finalCategories.length} catégorie(s)\n`);

    if (finalCategories.length === NEW_CATEGORY_SLUGS.length) {
      console.log('✅ PARFAIT ! Seules les 5 nouvelles catégories sont présentes:\n');
      finalCategories.sort((a, b) => a.name.localeCompare(b.name)).forEach(cat => {
        console.log(`   ✅ ${cat.name} (${cat.slug}) - ${cat.color || 'Pas de couleur'}`);
      });
    } else {
      console.log(`⚠️  Il reste ${finalCategories.length} catégorie(s) au lieu de ${NEW_CATEGORY_SLUGS.length}:\n`);
      finalCategories.forEach(cat => {
        const isNew = NEW_CATEGORY_SLUGS.includes(cat.slug);
        console.log(`   ${isNew ? '✅ NOUVELLE' : '❌ ANCIENNE'} ${cat.name} (${cat.slug})`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Terminé !\n');
    console.log('💡 Dans MongoDB Compass:');
    console.log('   1. Connectez-vous à la base "xcafrique" (minuscules)');
    console.log('   2. Actualisez la collection "categories" (F5)');
    console.log('   3. Vous devriez voir uniquement les 5 nouvelles catégories');
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

deleteOldCategories();

