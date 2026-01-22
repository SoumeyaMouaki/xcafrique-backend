require('dotenv').config();
const mongoose = require('mongoose');

/**
 * Script pour supprimer TOUTES les anciennes catégories dans la base "XCAfrique" (avec majuscules)
 * 
 * Usage:
 *   node scripts/deleteOldCategoriesInXCAfrique.js
 */

// Slugs des nouvelles catégories à CONSERVER
const NEW_CATEGORY_SLUGS = [
  'decryptage-analyse',
  'compagnies-acteurs',
  'infrastructures-marche',
  'reglementation-securite',
  'regards-perspectives'
];

// Nouvelles catégories à créer si elles n'existent pas
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

async function deleteOldCategories() {
  try {
    console.log('🗑️  SUPPRESSION DES ANCIENNES CATÉGORIES DANS "XCAfrique"\n');
    console.log('='.repeat(70));

    // Récupérer l'URI de base
    const baseUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;
    
    if (!baseUri) {
      console.error('❌ ERREUR: MONGODB_URI_PROD ou MONGODB_URI n\'est pas défini');
      process.exit(1);
    }

    // Forcer le nom de la base de données à "XCAfrique" (avec majuscules)
    // Remplacer n'importe quel nom de base (xcafrique, XCAfrique, etc.) par "XCAfrique"
    let mongoUri = baseUri.replace(/\/[^\/\?]+(\?|$)/, '/XCAfrique$1');
    
    // Si l'URI se termine sans nom de base, ajouter /XCAfrique
    if (!mongoUri.match(/\/[^\/\?]+(\?|$)/)) {
      if (mongoUri.endsWith('/')) {
        mongoUri = mongoUri + 'XCAfrique';
      } else {
        mongoUri = mongoUri + '/XCAfrique';
      }
    }

    const uriPreview = mongoUri.replace(/\/\/.*:.*@/, '//***:***@').substring(0, 60) + '...';
    console.log(`🔌 MongoDB URI: ${uriPreview}`);
    console.log(`📊 Base de données: XCAfrique (forcée)\n`);

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Connecté à MongoDB\n');

    // Forcer l'utilisation de la base "XCAfrique" avec majuscules
    const client = mongoose.connection.getClient();
    const db = client.db('XCAfrique'); // Forcer le nom avec majuscules
    const actualDbName = db.databaseName;
    console.log(`📊 Base de données actuelle: ${actualDbName}\n`);

    const categoriesCollection = db.collection('categories');
    const articlesCollection = db.collection('articles');

    // Créer les nouvelles catégories si elles n'existent pas
    console.log('📋 Création/Vérification des nouvelles catégories:\n');
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

    // Récupérer TOUTES les catégories
    const allCategories = await categoriesCollection.find({}).toArray();
    console.log(`\n📊 ${allCategories.length} catégorie(s) trouvée(s) au total\n`);

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
    console.log('   1. Connectez-vous à la base "XCAfrique" (avec majuscules)');
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
