require('dotenv').config();
const mongoose = require('mongoose');

/**
 * Script final pour nettoyer les catégories dans XCAfrique
 * Supprime TOUTES les catégories sauf les 5 nouvelles
 */

const NEW_CATEGORY_SLUGS = [
  'decryptage-analyse',
  'compagnies-acteurs',
  'infrastructures-marche',
  'reglementation-securite',
  'regards-perspectives'
];

async function finalClean() {
  try {
    console.log('🧹 NETTOYAGE FINAL DES CATÉGORIES DANS "XCAfrique"\n');
    console.log('='.repeat(70));

    const baseUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;
    
    if (!baseUri) {
      console.error('❌ ERREUR: MONGODB_URI_PROD ou MONGODB_URI n\'est pas défini');
      process.exit(1);
    }

    // Se connecter à la base admin pour accéder à toutes les bases
    const uriWithoutDb = baseUri.replace(/\/[^\/\?]+(\?|$)/, '/admin$1');
    
    await mongoose.connect(uriWithoutDb, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Connecté à MongoDB\n');

    // Accéder directement à la base XCAfrique
    const client = mongoose.connection.getClient();
    const db = client.db('XCAfrique');
    
    console.log(`📊 Base de données: ${db.databaseName}\n`);

    const categoriesCollection = db.collection('categories');
    const articlesCollection = db.collection('articles');

    // Récupérer TOUTES les catégories
    const allCategories = await categoriesCollection.find({}).toArray();
    console.log(`📊 ${allCategories.length} catégorie(s) trouvée(s)\n`);

    // Afficher toutes les catégories
    console.log('📋 Liste complète:\n');
    allCategories.forEach((cat, index) => {
      const isNew = NEW_CATEGORY_SLUGS.includes(cat.slug);
      const status = isNew ? '✅ CONSERVÉE' : '❌ À SUPPRIMER';
      console.log(`${index + 1}. ${status} ${cat.name} (${cat.slug})`);
    });

    // Supprimer toutes les catégories qui ne sont PAS dans la liste
    console.log('\n🗑️  Suppression en cours...\n');
    let deletedCount = 0;
    let keptCount = 0;

    for (const category of allCategories) {
      const isNew = NEW_CATEGORY_SLUGS.includes(category.slug);
      
      if (!isNew) {
        // Vérifier les articles
        const articlesCount = await articlesCollection.countDocuments({ category: category._id });
        
        if (articlesCount === 0) {
          await categoriesCollection.deleteOne({ _id: category._id });
          console.log(`✅ ${category.name} (${category.slug}): Supprimée`);
          deletedCount++;
        } else {
          console.log(`⚠️  ${category.name}: ${articlesCount} article(s) - Migration nécessaire`);
        }
      } else {
        console.log(`⏭️  ${category.name}: Conservée`);
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
      console.log('✅ PARFAIT ! Seules les 5 nouvelles catégories:\n');
      finalCategories.sort((a, b) => a.name.localeCompare(b.name)).forEach(cat => {
        console.log(`   ✅ ${cat.name} (${cat.slug}) - ${cat.color || 'Pas de couleur'}`);
      });
    } else {
      console.log(`⚠️  Il reste ${finalCategories.length} catégorie(s):\n`);
      finalCategories.forEach(cat => {
        const isNew = NEW_CATEGORY_SLUGS.includes(cat.slug);
        console.log(`   ${isNew ? '✅ NOUVELLE' : '❌ ANCIENNE'} ${cat.name} (${cat.slug})`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Terminé !\n');
    console.log('💡 Dans MongoDB Compass:');
    console.log('   1. Connectez-vous à la base "XCAfrique" (avec majuscules)');
    console.log('   2. Actualisez la collection "categories" (F5 ou clic droit → Refresh)');
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

finalClean();

