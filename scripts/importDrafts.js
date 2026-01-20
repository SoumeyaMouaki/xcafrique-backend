require('dotenv').config();
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/database');
const Article = require('../models/Article');
const Category = require('../models/Category');

/**
 * Script pour importer les articles depuis Prod/articles/drafts/
 * Transforme les articles dans la structure MongoDB et les importe
 * 
 * Usage: node scripts/importDrafts.js [--publish] [--dry-run]
 * 
 * Options:
 *   --publish: Publie les articles directement (status: published)
 *   --dry-run: Affiche ce qui sera fait sans importer
 */

// Mapping des catégories (ancien format -> nouveau format)
const categoryMapping = {
  'finance': {
    name: 'Finance',
    slug: 'finance',
    description: 'Actualités financières du secteur aéronautique africain',
    color: '#FF6B35'
  },
  'connectivite': {
    name: 'Connectivité',
    slug: 'connectivite',
    description: 'Connectivité aérienne et routes en Afrique',
    color: '#4ECDC4'
  },
  'connectivité': {
    name: 'Connectivité',
    slug: 'connectivite',
    description: 'Connectivité aérienne et routes en Afrique',
    color: '#4ECDC4'
  },
  'aviation': {
    name: 'Aviation',
    slug: 'aviation',
    description: 'Actualités générales de l\'aviation africaine',
    color: '#95E1D3'
  },
  'actualites-aeronautiques': {
    name: 'Actualités Aéronautiques',
    slug: 'actualites-aeronautiques',
    description: 'Les dernières actualités du secteur aéronautique africain',
    color: '#45B7D1'
  }
};

async function importDrafts() {
  try {
    const args = process.argv.slice(2);
    const shouldPublish = args.includes('--publish');
    const isDryRun = args.includes('--dry-run');

    console.log('📦 Import des articles depuis Prod/articles/drafts/\n');
    
    if (isDryRun) {
      console.log('🔍 Mode DRY-RUN : Aucun article ne sera importé\n');
    }
    
    if (shouldPublish) {
      console.log('✅ Les articles seront publiés directement (status: published)\n');
    } else {
      console.log('📝 Les articles seront importés en brouillon (status: draft)\n');
    }

    // Connexion à MongoDB
    await connectDB();
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Connecté à MongoDB\n');

    // Chemin vers les drafts
    const draftsPath = path.join(__dirname, '..', 'Prod', 'articles', 'drafts');
    
    if (!fs.existsSync(draftsPath)) {
      console.error(`❌ Le dossier ${draftsPath} n'existe pas`);
      process.exit(1);
    }

    // Lire tous les fichiers JSON
    const files = fs.readdirSync(draftsPath)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(draftsPath, file));

    if (files.length === 0) {
      console.log('ℹ️  Aucun fichier JSON trouvé dans les drafts');
      process.exit(0);
    }

    console.log(`📄 ${files.length} fichier(s) trouvé(s)\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    const errors = [];

    // Traiter chaque fichier
    for (const filePath of files) {
      try {
        const fileName = path.basename(filePath);
        console.log(`📖 Traitement: ${fileName}`);

        // Lire le fichier JSON
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const draftArticle = JSON.parse(fileContent);

        // Transformer l'article
        const transformedArticle = await transformArticle(draftArticle, shouldPublish);

        if (!transformedArticle) {
          console.log(`   ⚠️  Article ignoré (catégorie non trouvée ou invalide)\n`);
          skipCount++;
          continue;
        }

        // Vérifier si l'article existe déjà (par slug)
        const existingArticle = await Article.findOne({ slug: transformedArticle.slug });
        if (existingArticle) {
          console.log(`   ⚠️  Article déjà existant: ${transformedArticle.slug}`);
          console.log(`   💡 Utilisez --update pour mettre à jour les articles existants\n`);
          skipCount++;
          continue;
        }

        if (isDryRun) {
          console.log(`   ✅ Serait importé: ${transformedArticle.title}`);
          console.log(`      Slug: ${transformedArticle.slug}`);
          console.log(`      Catégorie: ${transformedArticle.categoryName}`);
          console.log(`      Status: ${transformedArticle.status}\n`);
          successCount++;
        } else {
          // Créer l'article dans MongoDB
          const article = await Article.create(transformedArticle);
          console.log(`   ✅ Importé: ${article.title}`);
          console.log(`      Slug: ${article.slug}`);
          console.log(`      ID: ${article._id}\n`);
          successCount++;
        }

      } catch (error) {
        console.error(`   ❌ Erreur: ${error.message}\n`);
        errors.push({ file: path.basename(filePath), error: error.message });
        errorCount++;
      }
    }

    // Résumé
    console.log('='.repeat(50));
    console.log('📊 Résumé de l\'import');
    console.log('='.repeat(50));
    console.log(`✅ Articles importés: ${successCount}`);
    console.log(`⚠️  Articles ignorés: ${skipCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Détails des erreurs:');
      errors.forEach(({ file, error }) => {
        console.log(`   ${file}: ${error}`);
      });
    }

    if (!isDryRun) {
      console.log('\n🎉 Import terminé !');
    } else {
      console.log('\n💡 Exécutez sans --dry-run pour importer réellement');
    }

    const mongoose = require('mongoose');
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Transforme un article draft en structure MongoDB
 */
async function transformArticle(draftArticle, shouldPublish) {
  try {
    // 1. Trouver ou créer la catégorie
    // Essayer d'extraire la catégorie du contenu si elle n'est pas dans le champ category
    let categorySlug = draftArticle.category?.toLowerCase().trim() || '';
    
    // Si pas de catégorie, essayer de l'extraire du contenu (chercher "CATÉGORIE :")
    if (!categorySlug && draftArticle.content) {
      const categoryMatch = draftArticle.content.match(/\*\*CATÉGORIE\s*:\*\*\s*([^\n]+)/i);
      if (categoryMatch) {
        categorySlug = categoryMatch[1].trim().toLowerCase();
      }
    }
    
    // Si toujours pas de catégorie, utiliser la valeur par défaut
    if (!categorySlug) {
      categorySlug = 'actualites-aeronautiques';
    }
    
    const categoryInfo = categoryMapping[categorySlug] || categoryMapping['actualites-aeronautiques'];
    
    let category = await Category.findOne({ slug: categoryInfo.slug });
    
    if (!category) {
      // Créer la catégorie si elle n'existe pas
      category = await Category.create(categoryInfo);
      console.log(`   📁 Catégorie créée: ${category.name}`);
    }

    // 2. Générer le slug à partir du titre
    const slug = draftArticle.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // 3. Nettoyer l'excerpt (limiter à 500 caractères et retirer le markdown du début)
    let excerpt = draftArticle.excerpt || '';
    // Retirer les balises markdown comme **TITRE XCAFRIQUE:** au début
    excerpt = excerpt.replace(/^\*\*TITRE XCAFRIQUE[:\*]?\*\*\s*/i, '');
    excerpt = excerpt.replace(/^\*\*[^\*]+\*\*\s*/g, ''); // Retirer autres balises ** au début
    excerpt = excerpt.trim();
    // Limiter à 500 caractères
    if (excerpt.length > 500) {
      excerpt = excerpt.substring(0, 497) + '...';
    }

    // 4. Nettoyer le contenu (retirer les balises markdown du début si nécessaire)
    let content = draftArticle.content || '';
    // Retirer les balises markdown comme **TITRE XCAFRIQUE:** au début
    content = content.replace(/^\*\*TITRE XCAFRIQUE[:\*]?\*\*\s*/i, '');
    content = content.trim();

    // 5. Préparer la date de publication
    let publishedAt = null;
    if (shouldPublish || draftArticle.status === 'published') {
      if (draftArticle.publishedAt) {
        publishedAt = new Date(draftArticle.publishedAt);
      } else {
        publishedAt = new Date();
      }
    }

    // 6. Construire l'article transformé
    const transformedArticle = {
      title: draftArticle.title,
      slug: slug,
      content: content,
      excerpt: excerpt,
      category: category._id,
      author: draftArticle.author || 'XCAfrique AI',
      featuredImage: draftArticle.featuredImage || '',
      videoUrl: draftArticle.videoUrl || '',
      sources: draftArticle.sources || [],
      tags: (draftArticle.tags || []).map(tag => tag.trim()).filter(tag => tag.length > 0),
      status: shouldPublish ? 'published' : (draftArticle.status === 'published' ? 'published' : 'draft'),
      views: 0,
      publishedAt: publishedAt
    };

    // Stocker le nom de la catégorie pour l'affichage
    transformedArticle.categoryName = category.name;

    return transformedArticle;

  } catch (error) {
    console.error(`   ❌ Erreur transformation: ${error.message}`);
    return null;
  }
}

// Exécuter le script
importDrafts();

