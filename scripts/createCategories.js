require('dotenv').config();
const connectDB = require('../config/database');
const Category = require('../models/Category');

/**
 * Script pour créer toutes les catégories XCAfrique
 * 
 * Usage: node scripts/createCategories.js
 */

const categories = [
  {
    name: 'Incidents & Sécurité',
    slug: 'incidents-securite',
    description: 'Accidents aériens, incidents de sécurité, passagers bloqués, situations d\'urgence',
    color: '#DC2626', // Rouge pour les incidents
    isActive: true
  },
  {
    name: 'Aéroports & Infrastructures',
    slug: 'aeroports-infrastructures',
    description: 'Construction/rénovation d\'aéroports, problèmes d\'infrastructure, équipements aéroportuaires',
    color: '#2563EB', // Bleu pour les infrastructures
    isActive: true
  },
  {
    name: 'Compagnies aériennes',
    slug: 'compagnies-aeriennes',
    description: 'Actualités des compagnies, résultats financiers, nouvelles routes, changements de direction',
    color: '#059669', // Vert pour les compagnies
    isActive: true
  },
  {
    name: 'Opérations & Météo',
    slug: 'operations-meteo',
    description: 'Perturbations météo, retards, annulations, problèmes opérationnels',
    color: '#7C3AED', // Violet pour les opérations
    isActive: true
  },
  {
    name: 'Passagers & Service',
    slug: 'passagers-service',
    description: 'Expérience passagers, service client, compensations, confort en cabine',
    color: '#EA580C', // Orange pour le service
    isActive: true
  },
  {
    name: 'Réglementation & Conformité',
    slug: 'reglementation-conformite',
    description: 'Nouvelles régulations, certifications, conformité, audits',
    color: '#0891B2', // Cyan pour la réglementation
    isActive: true
  },
  {
    name: 'Flotte & Technologie',
    slug: 'flotte-technologie',
    description: 'Commandes d\'avions, nouvelles technologies, modernisation de flotte',
    color: '#BE185D', // Rose pour la technologie
    isActive: true
  },
  {
    name: 'Économie & Finance',
    slug: 'economie-finance',
    description: 'Résultats financiers, investissements, subventions, rentabilité',
    color: '#CA8A04', // Jaune/Or pour la finance
    isActive: true
  },
  {
    name: 'Développement durable',
    slug: 'developpement-durable',
    description: 'Initiatives écologiques, carburants durables, réduction d\'émissions',
    color: '#16A34A', // Vert clair pour l\'écologie
    isActive: true
  },
  {
    name: 'Formation & Emploi',
    slug: 'formation-emploi',
    description: 'Création d\'emplois, programmes de formation, pénurie de personnel',
    color: '#9333EA', // Violet clair pour la formation
    isActive: true
  },
  {
    name: 'Aviation africaine',
    slug: 'aviation-africaine',
    description: 'Articles généraux sur l\'aviation en Afrique sans catégorie spécifique',
    color: '#FF6B35', // Orange XCAfrique (couleur principale)
    isActive: true
  }
];

/**
 * Mapping des anciennes catégories vers les nouvelles
 */
const categoryMapping = {
  'finance': 'economie-finance',
  'connectivite': 'aviation-africaine',
  'actualites-aeronautiques': 'aviation-africaine',
  'securite': 'incidents-securite',
  'technologie': 'flotte-technologie',
  'reglementation': 'reglementation-conformite',
  'aviation': 'aviation-africaine'
};

async function createCategories() {
  try {
    console.log('📂 Création des catégories XCAfrique...\n');

    // Connexion à MongoDB
    await connectDB();
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Connecté à MongoDB\n');

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

    // Afficher le mapping des catégories
    console.log('\n📋 Mapping des anciennes catégories:');
    Object.entries(categoryMapping).forEach(([old, newSlug]) => {
      const newCategory = categories.find(c => c.slug === newSlug);
      console.log(`   ${old} → ${newCategory?.name || newSlug}`);
    });

    const mongoose = require('mongoose');
    await mongoose.connection.close();
    console.log('\n✅ Catégories créées avec succès !');

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
createCategories();

