require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

/**
 * Script pour créer les catégories dans la base XCAfrique (avec majuscules)
 * 
 * Usage: node scripts/createCategoriesInXCAfrique.js
 */

const categories = [
  {
    name: 'Incidents & Sécurité',
    slug: 'incidents-securite',
    description: 'Accidents aériens, incidents de sécurité, passagers bloqués, situations d\'urgence',
    color: '#DC2626',
    isActive: true
  },
  {
    name: 'Aéroports & Infrastructures',
    slug: 'aeroports-infrastructures',
    description: 'Construction/rénovation d\'aéroports, problèmes d\'infrastructure, équipements aéroportuaires',
    color: '#2563EB',
    isActive: true
  },
  {
    name: 'Compagnies aériennes',
    slug: 'compagnies-aeriennes',
    description: 'Actualités des compagnies, résultats financiers, nouvelles routes, changements de direction',
    color: '#059669',
    isActive: true
  },
  {
    name: 'Opérations & Météo',
    slug: 'operations-meteo',
    description: 'Perturbations météo, retards, annulations, problèmes opérationnels',
    color: '#7C3AED',
    isActive: true
  },
  {
    name: 'Passagers & Service',
    slug: 'passagers-service',
    description: 'Expérience passagers, service client, compensations, confort en cabine',
    color: '#EA580C',
    isActive: true
  },
  {
    name: 'Réglementation & Conformité',
    slug: 'reglementation-conformite',
    description: 'Nouvelles régulations, certifications, conformité, audits',
    color: '#0891B2',
    isActive: true
  },
  {
    name: 'Flotte & Technologie',
    slug: 'flotte-technologie',
    description: 'Commandes d\'avions, nouvelles technologies, modernisation de flotte',
    color: '#BE185D',
    isActive: true
  },
  {
    name: 'Économie & Finance',
    slug: 'economie-finance',
    description: 'Résultats financiers, investissements, subventions, rentabilité',
    color: '#CA8A04',
    isActive: true
  },
  {
    name: 'Développement durable',
    slug: 'developpement-durable',
    description: 'Initiatives écologiques, carburants durables, réduction d\'émissions',
    color: '#16A34A',
    isActive: true
  },
  {
    name: 'Formation & Emploi',
    slug: 'formation-emploi',
    description: 'Création d\'emplois, programmes de formation, pénurie de personnel',
    color: '#9333EA',
    isActive: true
  },
  {
    name: 'Aviation africaine',
    slug: 'aviation-africaine',
    description: 'Articles généraux sur l\'aviation en Afrique sans catégorie spécifique',
    color: '#FF6B35',
    isActive: true
  }
];

async function createCategoriesInXCAfrique() {
  try {
    console.log('📂 Création des catégories dans la base XCAfrique...\n');

    // Récupérer l'URI de base
    const baseUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    
    // Extraire l'URI sans le nom de base
    const uriWithoutDb = baseUri.split('/').slice(0, -1).join('/');
    
    // Se connecter à la base XCAfrique (avec majuscules)
    const xcafriqueUri = `${uriWithoutDb}/XCAfrique`;
    
    console.log(`🔗 Connexion à: ${xcafriqueUri.replace(/\/\/.*:.*@/, '//***:***@')}\n`);

    await mongoose.connect(xcafriqueUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });

    console.log('✅ Connecté à MongoDB');
    console.log(`📊 Base de données: ${mongoose.connection.db.databaseName}\n`);

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // Créer ou mettre à jour chaque catégorie
    for (const categoryData of categories) {
      try {
        // Vérifier si la catégorie existe déjà (par slug)
        let category = await Category.findOne({ slug: categoryData.slug });

        if (category) {
          // Mettre à jour si elle existe
          category.name = categoryData.name;
          category.description = categoryData.description;
          category.color = categoryData.color;
          category.isActive = categoryData.isActive;
          await category.save();
          console.log(`🔄 Mise à jour: ${categoryData.name}`);
          updatedCount++;
        } else {
          // Créer si elle n'existe pas
          category = await Category.create(categoryData);
          console.log(`✅ Créée: ${categoryData.name} (${categoryData.slug})`);
          createdCount++;
        }
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️  Catégorie déjà existante (doublon): ${categoryData.name}`);
          skippedCount++;
        } else {
          console.error(`❌ Erreur avec ${categoryData.name}:`, error.message);
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Résumé');
    console.log('='.repeat(50));
    console.log(`✅ Créées: ${createdCount}`);
    console.log(`🔄 Mises à jour: ${updatedCount}`);
    console.log(`⚠️  Ignorées: ${skippedCount}`);
    console.log(`📋 Total: ${categories.length} catégories`);

    // Vérifier le total
    const totalCategories = await Category.countDocuments({});
    console.log(`\n📊 Total de catégories dans la base: ${totalCategories}`);

    await mongoose.connection.close();
    console.log('\n✅ Catégories créées avec succès dans la base XCAfrique !');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Exécuter le script
createCategoriesInXCAfrique();

