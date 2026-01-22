require('dotenv').config();
const mongoose = require('mongoose');

/**
 * Script pour supprimer TOUTES les anciennes catégories
 * Liste explicite de toutes les anciennes catégories à supprimer
 */

// Liste COMPLÈTE de toutes les anciennes catégories à supprimer
const OLD_CATEGORIES_TO_DELETE = [
  'Incidents & Sécurité',
  'incidents-securite',
  'Aéroports & Infrastructures',
  'aeroports-infrastructures',
  'Compagnies aériennes',
  'compagnies-aeriennes',
  'Opérations & Météo',
  'operations-meteo',
  'Passagers & Service',
  'passagers-service',
  'passagers & service',
  'Réglementation & Conformité',
  'reglementation-conformite',
  'Flotte & Technologie',
  'flotte-technologie',
  'Économie & Finance',
  'economie-finance',
  'Développement durable',
  'developpement-durable',
  'Formation & Emploi',
  'formation-emploi',
  'Aviation africaine',
  'aviation-africaine'
];

// Slugs des nouvelles catégories à CONSERVER
const NEW_CATEGORY_SLUGS = [
  'decryptage-analyse',
  'compagnies-acteurs',
  'infrastructures-marche',
  'reglementation-securite',
  'regards-perspectives'
];

async function deleteAllOldCategories() {
  try {
    console.log('🗑️  SUPPRESSION DE TOUTES LES ANCIENNES CATÉGORIES\n');
    console.log('='.repeat(70));

    const mongoUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ ERREUR: MONGODB_URI_PROD ou MONGODB_URI n\'est pas défini');
      process.exit(1);
    }

    const dbName = mongoUri.split('/').pop().split('?')[0];
    console.log(`📊 Base de données: ${dbName}\n`);

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Connecté à MongoDB\n');

    const db = mongoose.connection.db;
    const categoriesCollection = db.collection('categories');
    const articlesCollection = db.collection('articles');

    // Récupérer TOUTES les catégories
    const allCategories = await categoriesCollection.find({}).toArray();
    console.log(`📊 ${allCategories.length} catégorie(s) trouvée(s) dans MongoDB\n`);

    // Afficher toutes les catégories
    console.log('📋 Liste complète des catégories:\n');
    allCategories.forEach((cat, index) => {
      const isNew = NEW_CATEGORY_SLUGS.includes(cat.slug);
      const isOld = OLD_CATEGORIES_TO_DELETE.includes(cat.name) || OLD_CATEGORIES_TO_DELETE.includes(cat.slug);
      let status = '❓';
      if (isNew) status = '✅ CONSERVÉE (nouvelle)';
      else if (isOld) status = '❌ À SUPPRIMER (ancienne)';
      else status = '❌ À SUPPRIMER (inconnue)';
      
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
    console.log('   1. Actualisez la collection (F5 ou clic droit → Refresh)');
    console.log('   2. Vérifiez que seules les 5 nouvelles catégories sont présentes');
    console.log('   3. Si vous voyez encore des anciennes, vérifiez que vous êtes connecté à la base "XCAfrique"');
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

deleteAllOldCategories();

