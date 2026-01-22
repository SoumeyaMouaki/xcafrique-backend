require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('../models/Article');
const Category = require('../models/Category');

/**
 * Script pour FORCER la suppression de toutes les anciennes catégories
 * et ne garder que les 5 nouvelles catégories professionnelles
 * 
 * ⚠️ ATTENTION : Ce script supprime TOUTES les catégories sauf les 5 nouvelles
 * 
 * Usage:
 *   node scripts/forceDeleteOldCategories.js
 */

// Liste EXACTE des slugs des nouvelles catégories (seules à conserver)
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

async function forceDeleteOldCategories() {
  try {
    console.log('🗑️  SUPPRESSION FORCÉE DES ANCIENNES CATÉGORIES\n');
    console.log('='.repeat(70));

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
    // ÉTAPE 1 : Créer les nouvelles catégories si elles n'existent pas
    // ============================================
    console.log('📋 ÉTAPE 1 : Création/Vérification des nouvelles catégories\n');
    
    for (const catData of newCategories) {
      let category = await Category.findOne({ slug: catData.slug });
      
      if (!category) {
        category = await Category.create(catData);
        console.log(`✅ ${catData.name}: Créée`);
      } else {
        // Mettre à jour si nécessaire
        if (category.description !== catData.description || category.color !== catData.color || !category.isActive) {
          category.description = catData.description;
          category.color = catData.color;
          category.isActive = true;
          await category.save();
          console.log(`🔄 ${catData.name}: Mise à jour`);
        } else {
          console.log(`⏭️  ${catData.name}: Déjà correcte`);
        }
      }
    }

    // ============================================
    // ÉTAPE 2 : Récupérer TOUTES les catégories
    // ============================================
    console.log('\n📋 ÉTAPE 2 : Analyse de TOUTES les catégories\n');
    const allCategories = await Category.find({});
    console.log(`📊 ${allCategories.length} catégorie(s) trouvée(s) au total\n`);

    // ============================================
    // ÉTAPE 3 : Migrer les articles si nécessaire
    // ============================================
    console.log('📝 ÉTAPE 3 : Vérification des articles\n');
    const articles = await Article.find({}).populate('category');
    console.log(`📄 ${articles.length} article(s) trouvé(s)\n`);

    // Récupérer les nouvelles catégories
    const newCategoryMap = {};
    for (const slug of NEW_CATEGORY_SLUGS) {
      const cat = await Category.findOne({ slug });
      if (cat) {
        newCategoryMap[slug] = cat;
      }
    }

    // Mapping pour migrer les articles
    const migrationMap = {
      'aeroports-infrastructures': 'infrastructures-marche',
      'compagnies-aeriennes': 'compagnies-acteurs',
      'passagers-service': 'compagnies-acteurs',
      'developpement-durable': 'decryptage-analyse',
      'flotte-technologie': 'decryptage-analyse',
      'incidents-securite': 'reglementation-securite',
      'operations-meteo': 'reglementation-securite',
      'reglementation-conformite': 'reglementation-securite',
      'economie-finance': 'infrastructures-marche',
      'formation-emploi': 'compagnies-acteurs',
      'aviation-africaine': 'regards-perspectives'
    };

    let migratedCount = 0;
    for (const article of articles) {
      if (article.category) {
        const oldSlug = article.category.slug;
        if (!NEW_CATEGORY_SLUGS.includes(oldSlug)) {
          const newSlug = migrationMap[oldSlug];
          if (newSlug && newCategoryMap[newSlug]) {
            article.category = newCategoryMap[newSlug]._id;
            await article.save();
            console.log(`✅ ${article.title.substring(0, 50)}...`);
            console.log(`   ${article.category.name} → ${newCategoryMap[newSlug].name}`);
            migratedCount++;
          }
        }
      }
    }

    // ============================================
    // ÉTAPE 4 : SUPPRIMER TOUTES les catégories sauf les 5 nouvelles
    // ============================================
    console.log('\n🗑️  ÉTAPE 4 : SUPPRESSION FORCÉE des anciennes catégories\n');
    let deletedCount = 0;

    for (const category of allCategories) {
      // Vérifier si c'est une nouvelle catégorie
      if (!NEW_CATEGORY_SLUGS.includes(category.slug)) {
        // Vérifier qu'aucun article n'utilise encore cette catégorie
        const articlesUsingCategory = await Article.countDocuments({ category: category._id });
        
        if (articlesUsingCategory === 0) {
          await Category.deleteOne({ _id: category._id });
          console.log(`✅ ${category.name} (${category.slug}): Supprimée`);
          deletedCount++;
        } else {
          console.log(`⚠️  ${category.name}: ${articlesUsingCategory} article(s) utilisent encore cette catégorie`);
          // Forcer la migration puis supprimer
          const newSlug = migrationMap[category.slug];
          if (newSlug && newCategoryMap[newSlug]) {
            await Article.updateMany(
              { category: category._id },
              { category: newCategoryMap[newSlug]._id }
            );
            await Category.deleteOne({ _id: category._id });
            console.log(`✅ ${category.name}: Articles migrés et catégorie supprimée`);
            deletedCount++;
          }
        }
      } else {
        console.log(`⏭️  ${category.name}: Nouvelle catégorie, conservée`);
      }
    }

    // ============================================
    // VÉRIFICATION FINALE
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 RAPPORT FINAL');
    console.log('='.repeat(70));
    console.log(`✅ Catégories créées/vérifiées: ${newCategories.length}`);
    console.log(`✅ Articles migrés: ${migratedCount}`);
    console.log(`🗑️  Catégories supprimées: ${deletedCount}`);

    // Vérification finale
    console.log('\n🔍 Vérification finale:\n');
    const finalCategories = await Category.find({}).sort({ name: 1 });
    console.log(`📊 Total: ${finalCategories.length} catégorie(s)\n`);
    
    if (finalCategories.length === NEW_CATEGORY_SLUGS.length) {
      console.log('✅ PARFAIT ! Seules les 5 nouvelles catégories sont présentes:\n');
      finalCategories.forEach(cat => {
        console.log(`   ✅ ${cat.name} (${cat.slug}) - Couleur: ${cat.color}`);
      });
    } else {
      console.log(`⚠️  ATTENTION: ${finalCategories.length} catégorie(s) trouvée(s) au lieu de ${NEW_CATEGORY_SLUGS.length}\n`);
      finalCategories.forEach(cat => {
        const isNew = NEW_CATEGORY_SLUGS.includes(cat.slug);
        const status = isNew ? '✅ NOUVELLE' : '❌ ANCIENNE';
        console.log(`${status} ${cat.name} (${cat.slug})`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Nettoyage terminé !\n');
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

// Exécuter
forceDeleteOldCategories();

