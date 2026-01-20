require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Article = require('../models/Article');
const Category = require('../models/Category');

/**
 * Script pour mettre à jour un article en PRODUCTION
 * Utilise MONGODB_URI_PROD ou demande confirmation pour MONGODB_URI
 */

async function updateProductionArticle(articleFileName = 'article1.json') {
  try {
    console.log(`📝 Mise à jour de l'article en PRODUCTION: ${articleFileName}\n`);

    // Demander confirmation si on utilise MONGODB_URI au lieu de MONGODB_URI_PROD
    const mongoUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ Erreur: MONGODB_URI_PROD ou MONGODB_URI n\'est pas défini');
      console.error('💡 Définissez MONGODB_URI_PROD dans votre .env');
      process.exit(1);
    }

    if (!process.env.MONGODB_URI_PROD) {
      console.log('⚠️  ATTENTION: Vous utilisez MONGODB_URI au lieu de MONGODB_URI_PROD');
      console.log('   Assurez-vous que MONGODB_URI pointe vers votre base de PRODUCTION\n');
      console.log(`   URI utilisée: ${mongoUri.substring(0, 30)}...\n`);
    } else {
      console.log('✅ Utilisation de MONGODB_URI_PROD\n');
    }

    // Lire le fichier article
    const articlePath = path.join(__dirname, '..', 'Prod', 'articles', 'ready-to-publish', articleFileName);
    if (!fs.existsSync(articlePath)) {
      console.error(`❌ Le fichier ${articlePath} n'existe pas`);
      process.exit(1);
    }

    const articleData = JSON.parse(fs.readFileSync(articlePath, 'utf8'));
    console.log(`📄 Article lu: ${articleData.title}\n`);

    // Connexion à MongoDB
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Connecté à MongoDB\n');

    // Trouver la catégorie
    // Générer le slug de la même manière que le modèle Category
    const categorySlug = articleData.category
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .trim();
    
    // Chercher d'abord par slug
    let category = await Category.findOne({ 
      slug: categorySlug,
      isActive: true
    });
    
    // Si pas trouvé par slug, chercher par nom (insensible à la casse)
    if (!category) {
      const categoryNameRegex = new RegExp(`^${articleData.category.trim()}$`, 'i');
      category = await Category.findOne({ 
        name: categoryNameRegex,
        isActive: true
      });
    }
    
    if (!category) {
      console.log(`⚠️  Catégorie "${categorySlug}" non trouvée, création...`);
      try {
        category = await Category.create({
          name: articleData.category.trim(),
          slug: categorySlug,
          description: `Catégorie: ${articleData.category}`,
          isActive: true
        });
        console.log(`✅ Catégorie créée: ${category.name} (${category.slug})\n`);
      } catch (error) {
        // Si erreur de clé dupliquée, chercher la catégorie existante
        if (error.code === 11000) {
          console.log(`⚠️  Catégorie avec ce nom existe déjà, recherche...`);
          const categoryNameRegex = new RegExp(`^${articleData.category.trim()}$`, 'i');
          category = await Category.findOne({ 
            name: categoryNameRegex,
            isActive: true
          });
          if (category) {
            console.log(`✅ Catégorie trouvée: ${category.name} (${category.slug})\n`);
          } else {
            // Si toujours pas trouvé, chercher par slug
            category = await Category.findOne({ slug: categorySlug, isActive: true });
            if (category) {
              console.log(`✅ Catégorie trouvée par slug: ${category.name} (${category.slug})\n`);
            } else {
              throw error; // Re-lancer l'erreur si vraiment pas trouvé
            }
          }
        } else {
          throw error; // Re-lancer les autres erreurs
        }
      }
    } else {
      console.log(`✅ Catégorie trouvée: ${category.name} (${category.slug})\n`);
    }

    // Trouver l'article existant
    const slug = articleData.slug || articleData.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const existingArticle = await Article.findOne({ slug });
    
    if (!existingArticle) {
      console.error(`❌ Article avec le slug "${slug}" non trouvé en production`);
      console.error('💡 Publiez d\'abord l\'article avec publishArticleToProduction.js');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`✅ Article trouvé: ${existingArticle.title}`);
    console.log(`   ID: ${existingArticle._id}`);
    console.log(`   Status actuel: ${existingArticle.status}\n`);

    // Afficher les sources actuelles
    console.log(`📚 Sources actuelles (${existingArticle.sources?.length || 0}):`);
    if (existingArticle.sources && existingArticle.sources.length > 0) {
      existingArticle.sources.forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.title || 'Sans titre'}`);
      });
    } else {
      console.log('   ❌ Aucune source');
    }

    // Mettre à jour l'article
    console.log('\n🔄 Mise à jour de l\'article...\n');
    
    existingArticle.title = articleData.title;
    existingArticle.content = articleData.content;
    existingArticle.excerpt = articleData.excerpt || '';
    existingArticle.category = category._id;
    existingArticle.author = articleData.author || 'Admin XC Afrique';
    existingArticle.featuredImage = articleData.featuredImage || '';
    existingArticle.imageCredit = articleData.imageCredit || '';
    existingArticle.videoUrl = articleData.videoUrl || '';
    existingArticle.sources = articleData.sources || [];
    existingArticle.tags = articleData.tags || [];
    existingArticle.status = 'published';
    
    if (articleData.publishedAt) {
      existingArticle.publishedAt = new Date(articleData.publishedAt);
    }

    await existingArticle.save();

    console.log('✅ Article mis à jour avec succès !\n');
    console.log('📄 Détails mis à jour:');
    console.log(`   Titre: ${existingArticle.title}`);
    console.log(`   Contenu: ${existingArticle.content.substring(0, 100)}...`);
    console.log(`   Sources: ${existingArticle.sources?.length || 0}`);
    
    if (existingArticle.sources && existingArticle.sources.length > 0) {
      console.log('\n📚 Sources enregistrées:');
      existingArticle.sources.forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.title || 'Sans titre'}`);
        if (s.url) console.log(`      URL: ${s.url}`);
      });
    }

    console.log(`\n🌐 URL de l'article:`);
    console.log(`   https://xcafrique-backend.vercel.app/api/articles/${slug}`);
    console.log(`   https://xcafrique.org/articles/${slug}`);

    await mongoose.connection.close();
    console.log('\n✅ Déconnexion de MongoDB\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.stack) {
      console.error('\nStack:', error.stack);
    }
    await mongoose.connection.close();
    process.exit(1);
  }
}

const articleFileName = process.argv[2] || 'article1.json';
updateProductionArticle(articleFileName);

