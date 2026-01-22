require('dotenv').config();
const mongoose = require('mongoose');

/**
 * Script pour synchroniser les catégories de la base locale avec la production
 * 
 * Usage:
 *   node scripts/syncLocalCategories.js
 */

const NEW_CATEGORY_SLUGS = [
  'decryptage-analyse',
  'compagnies-acteurs',
  'infrastructures-marche',
  'reglementation-securite',
  'regards-perspectives'
];

const newCategories = [
  {
    name: 'Décryptage & Analyse',
    slug: 'decryptage-analyse',
    description: 'Analyses stratégiques, lectures approfondies et mises en perspective de l\'actualité aéronautique africaine. Cette rubrique vise à expliquer les enjeux, impacts et dynamiques de fond du secteur pour les professionnels et décideurs.',
    color: '#7C3AED',
    isActive: true
  },
  {
    name: 'Compagnies & Acteurs',
    slug: 'compagnies-acteurs',
    description: 'Suivi et analyse des compagnies aériennes africaines et internationales opérant sur le continent, ainsi que des acteurs clés du secteur (dirigeants, partenaires, industriels). Approche factuelle et stratégique, sans contenu promotionnel.',
    color: '#059669',
    isActive: true
  },
  {
    name: 'Infrastructures & Marché',
    slug: 'infrastructures-marche',
    description: 'Projets aéroportuaires, hubs régionaux, investissements, données de marché et dynamiques économiques liées au transport aérien africain.',
    color: '#2563EB',
    isActive: true
  },
  {
    name: 'Réglementation & Sécurité',
    slug: 'reglementation-securite',
    description: 'Évolutions réglementaires, normes internationales, décisions institutionnelles, sécurité aérienne et conformité dans le contexte africain.',
    color: '#0891B2',
    isActive: true
  },
  {
    name: 'Regards & Perspectives',
    slug: 'regards-perspectives',
    description: 'Tribunes, analyses de fond et réflexions prospectives sur l\'avenir de l\'aviation africaine et de son écosystème.',
    color: '#9333EA',
    isActive: true
  }
];

async function syncLocalCategories() {
  try {
    console.log('🔄 SYNCHRONISATION DES CATÉGORIES - BASE LOCALE\n');
    console.log('='.repeat(70));

    // URI de la base locale
    const localUri = 'mongodb://localhost:27017/xcafrique';
    console.log(`🔌 MongoDB URI locale: ${localUri}\n`);

    // Connexion à la base locale
    await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 5000,
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Connecté à MongoDB local\n');

    const db = mongoose.connection.db;
    const actualDbName = db.databaseName;
    console.log(`📊 Base de données: ${actualDbName}\n`);

    const categoriesCollection = db.collection('categories');
    const articlesCollection = db.collection('articles');

    // Récupérer toutes les catégories existantes
    const allCategories = await categoriesCollection.find({}).toArray();
    console.log(`📊 ${allCategories.length} catégorie(s) trouvée(s) dans la base locale\n`);

    // Afficher les catégories existantes
    if (allCategories.length > 0) {
      console.log('📋 Catégories existantes:\n');
      allCategories.forEach((cat, index) => {
        const isNew = NEW_CATEGORY_SLUGS.includes(cat.slug);
        const status = isNew ? '✅' : '❌';
        console.log(`${index + 1}. ${status} ${cat.name} (${cat.slug})`);
      });
      console.log('');
    }

    // Supprimer toutes les anciennes catégories
    console.log('🗑️  Suppression des anciennes catégories...\n');
    let deletedCount = 0;

    for (const category of allCategories) {
      if (!NEW_CATEGORY_SLUGS.includes(category.slug)) {
        // Vérifier qu'aucun article n'utilise cette catégorie
        const articlesCount = await articlesCollection.countDocuments({ category: category._id });
        
        if (articlesCount === 0) {
          await categoriesCollection.deleteOne({ _id: category._id });
          console.log(`✅ ${category.name} (${category.slug}): Supprimée`);
          deletedCount++;
        } else {
          console.log(`⚠️  ${category.name}: ${articlesCount} article(s) utilisent encore cette catégorie`);
        }
      }
    }

    // Créer/Mettre à jour les nouvelles catégories
    console.log('\n📋 Création/Mise à jour des nouvelles catégories:\n');
    let createdCount = 0;
    let updatedCount = 0;

    for (const catData of newCategories) {
      const existing = await categoriesCollection.findOne({ slug: catData.slug });
      
      if (!existing) {
        await categoriesCollection.insertOne({
          ...catData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`✅ ${catData.name}: Créée`);
        createdCount++;
      } else {
        // Mettre à jour si nécessaire
        const needsUpdate = 
          existing.name !== catData.name ||
          existing.description !== catData.description ||
          existing.color !== catData.color ||
          existing.isActive !== true;

        if (needsUpdate) {
          await categoriesCollection.updateOne(
            { slug: catData.slug },
            { 
              $set: {
                name: catData.name,
                description: catData.description,
                color: catData.color,
                isActive: true,
                updatedAt: new Date()
              }
            }
          );
          console.log(`🔄 ${catData.name}: Mise à jour`);
          updatedCount++;
        } else {
          console.log(`⏭️  ${catData.name}: Déjà à jour`);
        }
      }
    }

    // Vérification finale
    console.log('\n' + '='.repeat(70));
    console.log('📊 RAPPORT FINAL');
    console.log('='.repeat(70));
    console.log(`🗑️  Catégories supprimées: ${deletedCount}`);
    console.log(`✅ Catégories créées: ${createdCount}`);
    console.log(`🔄 Catégories mises à jour: ${updatedCount}`);

    const finalCategories = await categoriesCollection.find({}).toArray();
    console.log(`\n📊 Total final: ${finalCategories.length} catégorie(s)\n`);

    if (finalCategories.length === NEW_CATEGORY_SLUGS.length) {
      console.log('✅ PARFAIT ! Seules les 5 nouvelles catégories sont présentes:\n');
      finalCategories.sort((a, b) => a.name.localeCompare(b.name)).forEach(cat => {
        console.log(`   ✅ ${cat.name} (${cat.slug}) - ${cat.color}`);
      });
    } else {
      console.log(`⚠️  Il reste ${finalCategories.length} catégorie(s):\n`);
      finalCategories.forEach(cat => {
        const isNew = NEW_CATEGORY_SLUGS.includes(cat.slug);
        console.log(`   ${isNew ? '✅ NOUVELLE' : '❌ ANCIENNE'} ${cat.name} (${cat.slug})`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Synchronisation terminée !\n');
    console.log('💡 Dans MongoDB Compass:');
    console.log('   1. Actualisez la collection "categories" (F5)');
    console.log('   2. Vous devriez voir uniquement les 5 nouvelles catégories');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
      console.error('\n💡 Assurez-vous que MongoDB est démarré localement:');
      console.error('   - Windows: net start MongoDB');
      console.error('   - macOS/Linux: brew services start mongodb-community (ou sudo systemctl start mongod)');
    }
    
    if (error.stack) {
      console.error('\nStack:', error.stack);
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

syncLocalCategories();

