require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

/**
 * Script pour mettre à jour les couleurs de toutes les catégories
 * 
 * Usage:
 *   node scripts/updateCategoryColors.js
 * 
 * Ce script met à jour les couleurs des catégories dans la base MongoDB
 * en utilisant MONGODB_URI_PROD ou MONGODB_URI
 */

// Mapping des noms de catégories vers leurs couleurs
// Supporte les variations de noms (slug, nom exact, etc.)
const categoryColors = {
  // Noms exacts
  'Incidents & Sécurité': '#DC2626',
  'Aéroports & Infrastructures': '#2563EB',
  'Compagnies aériennes': '#059669',
  'Opérations & Météo': '#7C3AED',
  'Passagers & Service': '#EA580C',
  'Réglementation & Conformité': '#0891B2',
  'Flotte & Technologie': '#BE185D',
  'Économie & Finance': '#CA8A04',
  'Développement durable': '#16A34A',
  'Formation & Emploi': '#9333EA',
  'Aviation africaine': '#FF6B35',
  // Variations de noms (slug, etc.)
  'passagers-service': '#EA580C',
  'passagers & service': '#EA580C',
  'Passagers Service': '#EA580C'
};

// Mapping par slug pour plus de flexibilité
const categoryColorsBySlug = {
  'incidents-securite': '#DC2626',
  'aeroports-infrastructures': '#2563EB',
  'compagnies-aeriennes': '#059669',
  'operations-meteo': '#7C3AED',
  'passagers-service': '#EA580C',
  'reglementation-conformite': '#0891B2',
  'flotte-technologie': '#BE185D',
  'economie-finance': '#CA8A04',
  'developpement-durable': '#16A34A',
  'formation-emploi': '#9333EA',
  'aviation-africaine': '#FF6B35'
};

async function updateCategoryColors() {
  try {
    console.log('🎨 Mise à jour des couleurs de catégories\n');
    console.log('='.repeat(60));

    // Utiliser MONGODB_URI_PROD si disponible, sinon MONGODB_URI
    const mongoUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ ERREUR: MONGODB_URI_PROD ou MONGODB_URI n\'est pas défini');
      console.error('💡 Définissez MONGODB_URI_PROD dans votre .env');
      process.exit(1);
    }

    // Afficher un aperçu de l'URI
    const uriPreview = mongoUri.replace(/\/\/.*:.*@/, '//***:***@').substring(0, 60) + '...';
    const uriType = mongoUri.startsWith('mongodb+srv://') ? 'MongoDB Atlas (Production)' : 'MongoDB';
    console.log(`🔌 MongoDB URI: ${uriPreview}`);
    console.log(`   Type: ${uriType}`);
    if (process.env.MONGODB_URI_PROD) {
      console.log('   ✅ Utilisation de MONGODB_URI_PROD\n');
    } else {
      console.log('   ⚠️  Utilisation de MONGODB_URI (vérifiez que c\'est la base de production)\n');
    }

    // Connexion à MongoDB
    console.log('📡 Connexion à MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Connecté à MongoDB\n');

    // Récupérer toutes les catégories
    const categories = await Category.find({ isActive: true });
    console.log(`📋 ${categories.length} catégorie(s) trouvée(s)\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    const processed = new Set();

    // Mettre à jour chaque catégorie existante
    for (const category of categories) {
      // Chercher la couleur par nom exact
      let color = categoryColors[category.name];
      
      // Si pas trouvé par nom, chercher par slug
      if (!color) {
        color = categoryColorsBySlug[category.slug];
      }
      
      // Si toujours pas trouvé, chercher par nom insensible à la casse
      if (!color) {
        const normalizedName = category.name.toLowerCase().trim();
        for (const [name, col] of Object.entries(categoryColors)) {
          if (name.toLowerCase().trim() === normalizedName) {
            color = col;
            break;
          }
        }
      }
      
      if (color) {
        processed.add(category._id.toString());
        
        // Vérifier si la couleur est déjà correcte
        if (category.color === color) {
          console.log(`⏭️  ${category.name}: Couleur déjà correcte (${color})`);
          skippedCount++;
        } else {
          // Mettre à jour la couleur
          category.color = color;
          await category.save();
          console.log(`✅ ${category.name}: ${category.color || '❌ Pas de couleur'} → ${color}`);
          updatedCount++;
        }
      } else {
        console.log(`⚠️  ${category.name} (${category.slug}): Pas de couleur définie dans le mapping`);
      }
    }

    // Afficher le résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 Résumé');
    console.log('='.repeat(60));
    console.log(`✅ Mises à jour: ${updatedCount}`);
    console.log(`⏭️  Déjà correctes: ${skippedCount}`);
    console.log(`📋 Total traitées: ${updatedCount + skippedCount}`);

    // Vérifier toutes les catégories après mise à jour
    console.log('\n🔍 Vérification finale:\n');
    const allCategories = await Category.find({ isActive: true }).sort({ name: 1 });
    allCategories.forEach(cat => {
      // Chercher la couleur attendue par nom ou slug
      let expectedColor = categoryColors[cat.name] || categoryColorsBySlug[cat.slug];
      
      // Si pas trouvé, chercher par nom insensible à la casse
      if (!expectedColor) {
        const normalizedName = cat.name.toLowerCase().trim();
        for (const [name, col] of Object.entries(categoryColors)) {
          if (name.toLowerCase().trim() === normalizedName) {
            expectedColor = col;
            break;
          }
        }
      }
      
      const status = expectedColor && cat.color === expectedColor ? '✅' : 
                     cat.color && cat.color !== '#007bff' ? '⚠️' : 
                     cat.color ? '⚠️ (défaut)' : '❌';
      console.log(`${status} ${cat.name} (${cat.slug}): ${cat.color || '❌ Pas de couleur'}`);
      if (expectedColor && cat.color !== expectedColor) {
        console.log(`   → Devrait être: ${expectedColor}`);
      }
    });

    await mongoose.connection.close();
    console.log('\n✅ Déconnexion de MongoDB\n');
    console.log('='.repeat(60));
    console.log('✅ Mise à jour terminée !');
    console.log('='.repeat(60));
    console.log('\n💡 Rechargez votre site (Ctrl+F5) pour voir les nouvelles couleurs');
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

// Exécuter le script
updateCategoryColors();

