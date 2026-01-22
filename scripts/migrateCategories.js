require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('../models/Article');
const Category = require('../models/Category');

/**
 * Script de migration des catégories vers la nouvelle architecture éditoriale
 * 
 * Usage:
 *   node scripts/migrateCategories.js [--dry-run]
 * 
 * Options:
 *   --dry-run: Affiche ce qui sera fait sans effectuer les modifications
 */

// Nouvelles catégories à créer
const newCategories = [
  {
    name: 'Décryptage & Analyse',
    slug: 'decryptage-analyse',
    description: 'Analyses stratégiques, lectures approfondies et mises en perspective de l\'actualité aéronautique africaine. Cette rubrique vise à expliquer les enjeux, impacts et dynamiques de fond du secteur pour les professionnels et décideurs.',
    color: '#7C3AED', // Violet
    isActive: true
  },
  {
    name: 'Compagnies & Acteurs',
    slug: 'compagnies-acteurs',
    description: 'Suivi et analyse des compagnies aériennes africaines et internationales opérant sur le continent, ainsi que des acteurs clés du secteur (dirigeants, partenaires, industriels). Approche factuelle et stratégique, sans contenu promotionnel.',
    color: '#059669', // Vert
    isActive: true
  },
  {
    name: 'Infrastructures & Marché',
    slug: 'infrastructures-marche',
    description: 'Projets aéroportuaires, hubs régionaux, investissements, données de marché et dynamiques économiques liées au transport aérien africain.',
    color: '#2563EB', // Bleu
    isActive: true
  },
  {
    name: 'Réglementation & Sécurité',
    slug: 'reglementation-securite',
    description: 'Évolutions réglementaires, normes internationales, décisions institutionnelles, sécurité aérienne et conformité dans le contexte africain.',
    color: '#0891B2', // Cyan
    isActive: true
  },
  {
    name: 'Regards & Perspectives',
    slug: 'regards-perspectives',
    description: 'Tribunes, analyses de fond et réflexions prospectives sur l\'avenir de l\'aviation africaine et de son écosystème.',
    color: '#9333EA', // Violet clair
    isActive: true
  }
];

// Mapping des anciennes catégories vers les nouvelles
const categoryMigration = {
  'Aéroports & Infrastructures': 'Infrastructures & Marché',
  'aeroports-infrastructures': 'Infrastructures & Marché',
  'Compagnies aériennes': 'Compagnies & Acteurs',
  'compagnies-aeriennes': 'Compagnies & Acteurs',
  'passagers-service': 'Compagnies & Acteurs', // À convertir en tag
  'passagers & service': 'Compagnies & Acteurs',
  'Passagers & Service': 'Compagnies & Acteurs'
};

// Catégories à supprimer (devenir tags)
const categoriesToRemove = [
  'Développement durable',
  'developpement-durable',
  'Flotte & Technologie',
  'flotte-technologie',
  'Passagers & Service',
  'passagers-service'
];

// Mapping spécifique des articles par slug
const articleRecategorization = {
  'infrastructures-ethiopie-deploie-ses-ailes-mega-aeroport-12-5-milliards-dollars': {
    newCategory: 'Infrastructures & Marché',
    addTags: []
  },
  'kenya-airways-retour-strategique-boeing-777-croissance-2026': {
    newCategory: 'Compagnies & Acteurs',
    addTags: []
  },
  'ciel-vert-sur-le-continent-afrique-coeur-revolution-carburants-durables-saf': {
    newCategory: 'Décryptage & Analyse',
    addTags: ['Développement durable']
  },
  'asky-togo-et-taag-angola-lancent-leurs-ateliers-mro-independants-pour-renforcer-l-aviation-africaine-en-2026': {
    newCategory: 'Décryptage & Analyse',
    addTags: ['Flotte', 'MRO', 'Technologie']
  },
  'brussels-airlines-valorise-la-richesse-culinaire-africaine-a-bord-de-ses-vols-long-courriers-vers-bruxelles-des-2026': {
    newCategory: 'Compagnies & Acteurs',
    addTags: ['Expérience passager', 'Marque']
  }
};

async function migrateCategories(dryRun = false) {
  try {
    console.log('🔄 Migration des catégories vers la nouvelle architecture\n');
    console.log('='.repeat(70));
    
    if (dryRun) {
      console.log('⚠️  MODE DRY-RUN : Aucune modification ne sera effectuée\n');
    }

    // Utiliser MONGODB_URI_PROD si disponible, sinon MONGODB_URI
    const mongoUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ ERREUR: MONGODB_URI_PROD ou MONGODB_URI n\'est pas défini');
      process.exit(1);
    }

    const uriPreview = mongoUri.replace(/\/\/.*:.*@/, '//***:***@').substring(0, 60) + '...';
    console.log(`🔌 MongoDB URI: ${uriPreview}\n`);

    // Connexion à MongoDB
    console.log('📡 Connexion à MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Connecté à MongoDB\n');

    // ============================================
    // ÉTAPE 1 : Créer les nouvelles catégories
    // ============================================
    console.log('📋 ÉTAPE 1 : Création des nouvelles catégories\n');
    const createdCategories = {};
    
    for (const catData of newCategories) {
      let category = await Category.findOne({ slug: catData.slug });
      
      if (category) {
        console.log(`⏭️  ${catData.name}: Existe déjà`);
        // Mettre à jour la description et couleur si nécessaire
        if ((category.description !== catData.description || category.color !== catData.color) && !dryRun) {
          category.description = catData.description;
          category.color = catData.color;
          category.isActive = true;
          await category.save();
          console.log(`   ✅ Description et couleur mises à jour`);
        }
      } else {
        if (dryRun) {
          console.log(`➕ ${catData.name} (${catData.slug}): SERAIT créée`);
          // Créer un objet temporaire pour le dry-run
          createdCategories[catData.name] = { _id: 'dry-run-id', name: catData.name, slug: catData.slug };
        } else {
          category = await Category.create(catData);
          console.log(`✅ ${catData.name} (${catData.slug}): Créée`);
        }
      }
      
      if (category) {
        createdCategories[catData.name] = category;
      }
    }
    
    // Vérifier que toutes les catégories sont disponibles
    if (!dryRun) {
      for (const catData of newCategories) {
        if (!createdCategories[catData.name]) {
          const found = await Category.findOne({ slug: catData.slug });
          if (found) {
            createdCategories[catData.name] = found;
          }
        }
      }
    }

    // ============================================
    // ÉTAPE 2 : Migrer les articles
    // ============================================
    console.log('\n📝 ÉTAPE 2 : Migration des articles\n');
    let migratedCount = 0;
    let notFoundCount = 0;
    const migrationReport = [];

    // Récupérer tous les articles publiés
    const articles = await Article.find({ status: 'published' }).populate('category');
    console.log(`📄 ${articles.length} article(s) publié(s) trouvé(s)\n`);

    for (const article of articles) {
      const slug = article.slug;
      const recat = articleRecategorization[slug];
      
      if (recat) {
        // Migration spécifique par slug
        const newCategory = createdCategories[recat.newCategory];
        
        if (!newCategory) {
          console.log(`❌ ${article.title}: Catégorie "${recat.newCategory}" non trouvée`);
          notFoundCount++;
          continue;
        }

        const oldCategoryName = article.category?.name || 'Sans catégorie';
        const oldTags = article.tags || [];
        const newTags = [...new Set([...oldTags, ...recat.addTags])];

        if (dryRun) {
          console.log(`🔄 ${article.title}`);
          console.log(`   Catégorie: ${oldCategoryName} → ${recat.newCategory}`);
          if (recat.addTags.length > 0) {
            console.log(`   Tags ajoutés: ${recat.addTags.join(', ')}`);
          }
        } else {
          article.category = newCategory._id;
          article.tags = newTags;
          await article.save();
          console.log(`✅ ${article.title}`);
          console.log(`   ${oldCategoryName} → ${recat.newCategory}`);
          if (recat.addTags.length > 0) {
            console.log(`   Tags: ${newTags.join(', ')}`);
          }
        }

        migrationReport.push({
          title: article.title,
          slug: slug,
          oldCategory: oldCategoryName,
          newCategory: recat.newCategory,
          tagsAdded: recat.addTags
        });
        migratedCount++;
      } else {
        // Migration générique par nom de catégorie
        const oldCategoryName = article.category?.name || '';
        const oldCategorySlug = article.category?.slug || '';
        const newCategoryName = categoryMigration[oldCategoryName] || categoryMigration[oldCategorySlug];
        
        if (newCategoryName) {
          const newCategory = createdCategories[newCategoryName];
          
          if (newCategory) {
            // Vérifier si c'est une catégorie à supprimer (devenir tag)
            if (categoriesToRemove.includes(oldCategoryName) || categoriesToRemove.includes(oldCategorySlug)) {
              const oldTags = article.tags || [];
              const categoryAsTag = oldCategoryName || oldCategorySlug;
              const newTags = [...new Set([...oldTags, categoryAsTag])];
              
              if (dryRun) {
                console.log(`🔄 ${article.title}`);
                console.log(`   Catégorie: ${oldCategoryName} → ${newCategoryName}`);
                console.log(`   Tag ajouté: ${categoryAsTag}`);
              } else {
                article.category = newCategory._id;
                article.tags = newTags;
                await article.save();
                console.log(`✅ ${article.title}`);
                console.log(`   ${oldCategoryName} → ${newCategoryName} (tag: ${categoryAsTag})`);
              }
              
              migrationReport.push({
                title: article.title,
                slug: slug,
                oldCategory: oldCategoryName,
                newCategory: newCategoryName,
                tagsAdded: [categoryAsTag]
              });
              migratedCount++;
            } else {
              if (dryRun) {
                console.log(`🔄 ${article.title}`);
                console.log(`   Catégorie: ${oldCategoryName} → ${newCategoryName}`);
              } else {
                article.category = newCategory._id;
                await article.save();
                console.log(`✅ ${article.title}: ${oldCategoryName} → ${newCategoryName}`);
              }
              
              migrationReport.push({
                title: article.title,
                slug: slug,
                oldCategory: oldCategoryName,
                newCategory: newCategoryName,
                tagsAdded: []
              });
              migratedCount++;
            }
          }
        } else {
          console.log(`⏭️  ${article.title}: Pas de migration définie (${oldCategoryName})`);
        }
      }
    }

    // ============================================
    // ÉTAPE 3 : Supprimer les anciennes catégories
    // ============================================
    console.log('\n🗑️  ÉTAPE 3 : Suppression des anciennes catégories\n');
    let deletedCount = 0;
    const processedCategories = new Set();

    // Liste complète des anciennes catégories à supprimer
    const allOldCategories = [
      ...categoriesToRemove,
      'Aéroports & Infrastructures',
      'aeroports-infrastructures',
      'Compagnies aériennes',
      'compagnies-aeriennes'
    ];

    for (const oldCatName of allOldCategories) {
      // Chercher par nom ou slug
      let oldCategory = await Category.findOne({ name: oldCatName });
      if (!oldCategory) {
        oldCategory = await Category.findOne({ slug: oldCatName });
      }

      if (oldCategory && !processedCategories.has(oldCategory._id.toString())) {
        processedCategories.add(oldCategory._id.toString());
        
        // Vérifier qu'aucun article n'utilise encore cette catégorie
        const articlesUsingCategory = await Article.countDocuments({ category: oldCategory._id });
        
        if (articlesUsingCategory === 0) {
          if (dryRun) {
            console.log(`🗑️  ${oldCategory.name} (${oldCategory.slug}): SERAIT supprimée (${articlesUsingCategory} article)`);
          } else {
            await Category.deleteOne({ _id: oldCategory._id });
            console.log(`✅ ${oldCategory.name} (${oldCategory.slug}): Supprimée`);
          }
          deletedCount++;
        } else {
          console.log(`⚠️  ${oldCategory.name}: ${articlesUsingCategory} article(s) utilisent encore cette catégorie - NON supprimée`);
        }
      }
    }

    // ============================================
    // RAPPORT FINAL
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 RAPPORT DE MIGRATION');
    console.log('='.repeat(70));
    console.log(`✅ Catégories créées/vérifiées: ${newCategories.length}`);
    console.log(`✅ Articles migrés: ${migratedCount}`);
    console.log(`❌ Articles non trouvés: ${notFoundCount}`);
    console.log(`🗑️  Catégories supprimées: ${deletedCount}`);

    if (migrationReport.length > 0) {
      console.log('\n📋 Détail des migrations:\n');
      migrationReport.forEach((report, index) => {
        console.log(`${index + 1}. ${report.title}`);
        console.log(`   ${report.oldCategory} → ${report.newCategory}`);
        if (report.tagsAdded.length > 0) {
          console.log(`   Tags ajoutés: ${report.tagsAdded.join(', ')}`);
        }
      });
    }

    // Vérification finale
    console.log('\n🔍 Vérification finale des catégories actives:\n');
    const activeCategories = await Category.find({ isActive: true }).sort({ name: 1 });
    activeCategories.forEach(cat => {
      console.log(`✅ ${cat.name} (${cat.slug})`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Migration terminée !\n');
    
    if (dryRun) {
      console.log('💡 Pour appliquer les changements, relancez sans --dry-run');
    } else {
      console.log('💡 Rechargez votre site (Ctrl+F5) pour voir les nouvelles catégories');
    }
    
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

// Vérifier les arguments
const dryRun = process.argv.includes('--dry-run');

// Exécuter la migration
migrateCategories(dryRun);

