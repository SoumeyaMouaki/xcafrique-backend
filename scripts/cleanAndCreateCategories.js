require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('../models/Article');
const Category = require('../models/Category');

/**
 * Script pour nettoyer complètement et recréer les catégories
 * 
 * ⚠️ ATTENTION : Ce script supprime TOUTES les catégories existantes et recrée les nouvelles
 * 
 * Usage:
 *   node scripts/cleanAndCreateCategories.js [--dry-run]
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
const categoryMapping = {
  'Aéroports & Infrastructures': 'Infrastructures & Marché',
  'aeroports-infrastructures': 'Infrastructures & Marché',
  'Compagnies aériennes': 'Compagnies & Acteurs',
  'compagnies-aeriennes': 'Compagnies & Acteurs',
  'passagers-service': 'Compagnies & Acteurs',
  'passagers & service': 'Compagnies & Acteurs',
  'Passagers & Service': 'Compagnies & Acteurs',
  'Développement durable': 'Décryptage & Analyse',
  'developpement-durable': 'Décryptage & Analyse',
  'Flotte & Technologie': 'Décryptage & Analyse',
  'flotte-technologie': 'Décryptage & Analyse',
  'Incidents & Sécurité': 'Réglementation & Sécurité',
  'incidents-securite': 'Réglementation & Sécurité',
  'Opérations & Météo': 'Réglementation & Sécurité',
  'operations-meteo': 'Réglementation & Sécurité',
  'Réglementation & Conformité': 'Réglementation & Sécurité',
  'reglementation-conformite': 'Réglementation & Sécurité',
  'Économie & Finance': 'Infrastructures & Marché',
  'economie-finance': 'Infrastructures & Marché',
  'Formation & Emploi': 'Compagnies & Acteurs',
  'formation-emploi': 'Compagnies & Acteurs',
  'Aviation africaine': 'Regards & Perspectives',
  'aviation-africaine': 'Regards & Perspectives'
};

async function cleanAndCreateCategories(dryRun = false) {
  try {
    console.log('🧹 NETTOYAGE COMPLET ET CRÉATION DES CATÉGORIES\n');
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
    const dbName = mongoUri.split('/').pop().split('?')[0];
    console.log(`🔌 MongoDB URI: ${uriPreview}`);
    console.log(`📊 Base de données: ${dbName}\n`);

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
    // ÉTAPE 1 : Lister toutes les catégories existantes
    // ============================================
    console.log('📋 ÉTAPE 1 : Analyse des catégories existantes\n');
    const allCategories = await Category.find({});
    console.log(`📊 ${allCategories.length} catégorie(s) trouvée(s) dans la base:\n`);
    
    allCategories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.slug}) - Active: ${cat.isActive ? '✅' : '❌'}`);
    });

    // ============================================
    // ÉTAPE 2 : Migrer les articles vers les nouvelles catégories
    // ============================================
    console.log('\n📝 ÉTAPE 2 : Migration des articles\n');
    const articles = await Article.find({ status: 'published' }).populate('category');
    console.log(`📄 ${articles.length} article(s) publié(s) trouvé(s)\n`);

    // Créer temporairement les nouvelles catégories pour la migration
    const tempCategories = {};
    for (const catData of newCategories) {
      let category = await Category.findOne({ slug: catData.slug });
      if (!category && !dryRun) {
        category = await Category.create(catData);
        console.log(`✅ ${catData.name}: Créée temporairement`);
      } else if (category) {
        console.log(`⏭️  ${catData.name}: Existe déjà`);
      }
      if (category) {
        tempCategories[catData.name] = category;
      }
    }

    // Migrer les articles
    let migratedCount = 0;
    for (const article of articles) {
      const oldCategoryName = article.category?.name || '';
      const oldCategorySlug = article.category?.slug || '';
      const newCategoryName = categoryMapping[oldCategoryName] || categoryMapping[oldCategorySlug];
      
      if (newCategoryName && tempCategories[newCategoryName]) {
        if (!dryRun) {
          article.category = tempCategories[newCategoryName]._id;
          await article.save();
        }
        console.log(`✅ ${article.title.substring(0, 50)}...`);
        console.log(`   ${oldCategoryName} → ${newCategoryName}`);
        migratedCount++;
      }
    }

    // ============================================
    // ÉTAPE 3 : Supprimer TOUTES les catégories SAUF les 5 nouvelles
    // ============================================
    console.log('\n🗑️  ÉTAPE 3 : Suppression de TOUTES les catégories sauf les 5 nouvelles\n');
    let deletedCount = 0;

    // Liste des slugs des nouvelles catégories
    const newCategorySlugs = newCategories.map(cat => cat.slug);

    for (const oldCategory of allCategories) {
      // Vérifier si c'est une nouvelle catégorie
      const isNewCategory = newCategorySlugs.includes(oldCategory.slug);
      
      if (!isNewCategory) {
        // Vérifier qu'aucun article n'utilise encore cette catégorie
        const articlesUsingCategory = await Article.countDocuments({ category: oldCategory._id });
        
        if (articlesUsingCategory === 0) {
          if (dryRun) {
            console.log(`🗑️  ${oldCategory.name} (${oldCategory.slug}): SERAIT supprimée`);
          } else {
            await Category.deleteOne({ _id: oldCategory._id });
            console.log(`✅ ${oldCategory.name} (${oldCategory.slug}): Supprimée`);
          }
          deletedCount++;
        } else {
          console.log(`⚠️  ${oldCategory.name}: ${articlesUsingCategory} article(s) utilisent encore cette catégorie - Migration nécessaire`);
          // Migrer les articles vers une nouvelle catégorie
          const newCategoryName = categoryMapping[oldCategory.name] || categoryMapping[oldCategory.slug];
          if (newCategoryName && tempCategories[newCategoryName]) {
            if (!dryRun) {
              await Article.updateMany(
                { category: oldCategory._id },
                { category: tempCategories[newCategoryName]._id }
              );
              console.log(`   ✅ ${articlesUsingCategory} article(s) migré(s) vers ${newCategoryName}`);
              // Maintenant on peut supprimer
              await Category.deleteOne({ _id: oldCategory._id });
              console.log(`   ✅ ${oldCategory.name}: Supprimée après migration`);
            } else {
              console.log(`   🔄 ${articlesUsingCategory} article(s) SERAIENT migré(s) vers ${newCategoryName}`);
              console.log(`   🗑️  ${oldCategory.name}: SERAIT supprimée après migration`);
            }
            deletedCount++;
          }
        }
      } else {
        console.log(`⏭️  ${oldCategory.name}: Nouvelle catégorie, conservée`);
      }
    }

    // ============================================
    // ÉTAPE 4 : S'assurer que les nouvelles catégories existent
    // ============================================
    console.log('\n✅ ÉTAPE 4 : Vérification des nouvelles catégories\n');
    const finalCategories = {};
    
    for (const catData of newCategories) {
      let category = await Category.findOne({ slug: catData.slug });
      
      if (!category) {
        if (dryRun) {
          console.log(`➕ ${catData.name}: SERAIT créée`);
        } else {
          category = await Category.create(catData);
          console.log(`✅ ${catData.name}: Créée`);
        }
      } else {
        // Mettre à jour si nécessaire
        if ((category.description !== catData.description || category.color !== catData.color) && !dryRun) {
          category.description = catData.description;
          category.color = catData.color;
          category.isActive = true;
          await category.save();
          console.log(`🔄 ${catData.name}: Mise à jour`);
        } else {
          console.log(`⏭️  ${catData.name}: Déjà correcte`);
        }
      }
      
      if (category) {
        finalCategories[catData.name] = category;
      }
    }

    // ============================================
    // RAPPORT FINAL
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 RAPPORT FINAL');
    console.log('='.repeat(70));
    console.log(`✅ Catégories créées/vérifiées: ${newCategories.length}`);
    console.log(`✅ Articles migrés: ${migratedCount}`);
    console.log(`🗑️  Anciennes catégories supprimées: ${deletedCount}`);

    // Vérification finale
    console.log('\n🔍 Vérification finale des catégories dans MongoDB:\n');
    const finalCheck = await Category.find({}).sort({ name: 1 });
    console.log(`📊 Total: ${finalCheck.length} catégorie(s)\n`);
    
    finalCheck.forEach(cat => {
      const isNew = newCategories.some(nc => nc.slug === cat.slug);
      const status = isNew ? '✅ NOUVELLE' : '❌ ANCIENNE';
      console.log(`${status} ${cat.name} (${cat.slug}) - Active: ${cat.isActive ? '✅' : '❌'}`);
    });

    if (finalCheck.length !== newCategories.length) {
      console.log(`\n⚠️  ATTENTION: Il reste ${finalCheck.length - newCategories.length} ancienne(s) catégorie(s) !`);
    } else {
      console.log(`\n✅ Parfait ! Seules les ${newCategories.length} nouvelles catégories sont présentes.`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Nettoyage terminé !\n');
    
    if (dryRun) {
      console.log('💡 Pour appliquer les changements, relancez sans --dry-run');
    } else {
      console.log('💡 Vérifiez dans MongoDB Compass que seules les 5 nouvelles catégories sont présentes');
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

// Exécuter
cleanAndCreateCategories(dryRun);

