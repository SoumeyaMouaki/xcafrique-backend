require('dotenv').config();
const mongoose = require('mongoose');

/**
 * Script pour FORCER la suppression de toutes les catégories sauf les 5 nouvelles
 * Utilise directement la collection MongoDB pour être sûr
 * 
 * Usage:
 *   node scripts/forceCleanCategories.js
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

async function forceClean() {
  try {
    console.log('🧹 NETTOYAGE FORCÉ DES CATÉGORIES\n');
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

    // Récupérer TOUTES les catégories directement depuis MongoDB
    const allCategories = await categoriesCollection.find({}).toArray();
    console.log(`📊 ${allCategories.length} catégorie(s) trouvée(s) dans MongoDB\n`);

    // Afficher toutes les catégories
    console.log('📋 Liste complète:\n');
    allCategories.forEach((cat, index) => {
      const isNew = NEW_CATEGORY_SLUGS.includes(cat.slug);
      const status = isNew ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${cat.name} (${cat.slug})`);
    });

    // Créer les nouvelles catégories si elles n'existent pas
    console.log('\n📋 Création/Vérification des nouvelles catégories:\n');
    for (const catData of newCategories) {
      const existing = await categoriesCollection.findOne({ slug: catData.slug });
      
      if (!existing) {
        await categoriesCollection.insertOne({
          ...catData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`✅ ${catData.name}: Créée`);
      } else {
        // Mettre à jour
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
      }
    }

    // Supprimer TOUTES les catégories qui ne sont PAS dans la liste
    console.log('\n🗑️  Suppression des anciennes catégories:\n');
    let deletedCount = 0;

    for (const cat of allCategories) {
      if (!NEW_CATEGORY_SLUGS.includes(cat.slug)) {
        // Vérifier les articles
        const articlesCount = await articlesCollection.countDocuments({ category: cat._id });
        
        if (articlesCount === 0) {
          await categoriesCollection.deleteOne({ _id: cat._id });
          console.log(`✅ ${cat.name} (${cat.slug}): Supprimée`);
          deletedCount++;
        } else {
          console.log(`⚠️  ${cat.name}: ${articlesCount} article(s) - Migration nécessaire`);
        }
      }
    }

    // Vérification finale
    console.log('\n' + '='.repeat(70));
    console.log('📊 RAPPORT FINAL');
    console.log('='.repeat(70));
    console.log(`🗑️  Catégories supprimées: ${deletedCount}`);

    const finalCategories = await categoriesCollection.find({}).toArray();
    console.log(`\n📊 Total final: ${finalCategories.length} catégorie(s)\n`);

    if (finalCategories.length === NEW_CATEGORY_SLUGS.length) {
      console.log('✅ PARFAIT ! Seules les 5 nouvelles catégories:\n');
      finalCategories.forEach(cat => {
        console.log(`   ✅ ${cat.name} (${cat.slug}) - ${cat.color}`);
      });
    } else {
      console.log(`⚠️  Il reste ${finalCategories.length} catégorie(s):\n`);
      finalCategories.forEach(cat => {
        const isNew = NEW_CATEGORY_SLUGS.includes(cat.slug);
        console.log(`   ${isNew ? '✅' : '❌'} ${cat.name} (${cat.slug})`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Terminé !\n');
    console.log('💡 Actualisez MongoDB Compass (F5) pour voir les changements');
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

forceClean();

