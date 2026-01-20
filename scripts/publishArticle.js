require('dotenv').config();
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/database');
const Article = require('../models/Article');
const Category = require('../models/Category');

/**
 * Script simple pour publier un article depuis ready-to-publish/
 * 
 * Usage: node scripts/publishArticle.js [article1.json]
 * 
 * Si aucun nom de fichier n'est fourni, il publiera article1.json par défaut
 */

async function publishArticle(articleFileName = 'article1.json') {
  try {
    console.log(`📝 Publication de l'article: ${articleFileName}\n`);

    // Connexion à MongoDB
    await connectDB();
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Connecté à MongoDB\n');

    // Chemin vers le fichier article
    const articlePath = path.join(__dirname, '..', 'Prod', 'articles', 'ready-to-publish', articleFileName);
    
    if (!fs.existsSync(articlePath)) {
      console.error(`❌ Le fichier ${articlePath} n'existe pas`);
      process.exit(1);
    }

    // Lire le fichier JSON
    const articleData = JSON.parse(fs.readFileSync(articlePath, 'utf8'));
    console.log(`📄 Article lu: ${articleData.title}\n`);

    // 1. Trouver ou créer la catégorie
    let category = null;
    const categorySlug = articleData.category.toLowerCase().trim();
    
    category = await Category.findOne({ 
      slug: categorySlug,
      isActive: true
    });
    
    if (!category) {
      console.log(`⚠️  Catégorie "${categorySlug}" non trouvée, création...`);
      // Créer la catégorie si elle n'existe pas
      category = await Category.create({
        name: articleData.category,
        slug: categorySlug,
        description: `Catégorie: ${articleData.category}`,
        isActive: true
      });
      console.log(`✅ Catégorie créée: ${category.name} (${category.slug})\n`);
    } else {
      console.log(`✅ Catégorie trouvée: ${category.name} (${category.slug})\n`);
    }

    // 2. Vérifier si un article avec le même slug existe déjà
    const slug = articleData.slug || articleData.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const existingArticle = await Article.findOne({ slug });
    let article;
    
    if (existingArticle) {
      console.log(`⚠️  Un article avec le slug "${slug}" existe déjà`);
      console.log(`   ID: ${existingArticle._id}`);
      console.log(`   Status actuel: ${existingArticle.status}`);
      console.log(`   Titre actuel: ${existingArticle.title}\n`);
      console.log('🔄 Mise à jour de l\'article existant...\n');
      
      // Mettre à jour l'article existant
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
      existingArticle.publishedAt = articleData.publishedAt ? new Date(articleData.publishedAt) : existingArticle.publishedAt || new Date();
      
      // Conserver le nombre de vues existant si non spécifié
      if (articleData.views !== undefined) {
        existingArticle.views = articleData.views;
      }
      
      await existingArticle.save();
      article = existingArticle;
      
      console.log('✅ Article mis à jour avec succès !\n');
    } else {
      // 3. Créer l'article avec le statut "published"
      article = await Article.create({
        title: articleData.title,
        slug: slug,
        content: articleData.content,
        excerpt: articleData.excerpt || '',
        category: category._id,
        author: articleData.author || 'Admin XC Afrique',
        featuredImage: articleData.featuredImage || '',
        imageCredit: articleData.imageCredit || '',
        videoUrl: articleData.videoUrl || '',
        sources: articleData.sources || [],
        tags: articleData.tags || [],
        status: 'published', // Publier directement
        views: articleData.views || 0,
        publishedAt: articleData.publishedAt ? new Date(articleData.publishedAt) : new Date()
      });

      console.log('🎉 Article publié avec succès !\n');
    }
    console.log('📄 Détails de l\'article:');
    console.log(`   Titre: ${article.title}`);
    console.log(`   Slug: ${article.slug}`);
    console.log(`   Catégorie: ${category.name}`);
    console.log(`   Auteur: ${article.author}`);
    console.log(`   Status: ${article.status}`);
    console.log(`   Tags: ${article.tags.join(', ')}`);
    console.log(`   Date de publication: ${article.publishedAt.toLocaleString('fr-FR')}`);
    console.log(`\n🌐 URL de l'article:`);
    console.log(`   https://xcafrique.org/articles/${article.slug}`);
    console.log(`   http://localhost:5000/api/articles/${article.slug}`);

    // Optionnel: Déplacer le fichier vers published/
    const publishedPath = path.join(__dirname, '..', 'Prod', 'articles', 'published', articleFileName);
    const publishedDir = path.dirname(publishedPath);
    
    if (!fs.existsSync(publishedDir)) {
      fs.mkdirSync(publishedDir, { recursive: true });
    }
    
    fs.copyFileSync(articlePath, publishedPath);
    console.log(`\n📦 Fichier copié vers: ${publishedPath}`);

    const mongoose = require('mongoose');
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.code === 11000) {
      console.error('💡 Un article avec ce slug existe déjà');
    }
    if (error.name === 'ValidationError') {
      console.error('💡 Erreur de validation:', Object.values(error.errors).map(e => e.message).join(', '));
    }
    process.exit(1);
  }
}

// Récupérer le nom du fichier depuis les arguments de ligne de commande
const articleFileName = process.argv[2] || 'article1.json';

// Exécuter le script
publishArticle(articleFileName);

