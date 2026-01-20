require('dotenv').config();
const connectDB = require('../config/database');
const Article = require('../models/Article');
const Category = require('../models/Category');

/**
 * Script pour créer un article
 * 
 * Usage: node scripts/createArticle.js
 * 
 * Modifiez les variables ci-dessous avec vos données
 */

async function createArticle() {
  try {
    console.log('📝 Création d\'un article...\n');

    // Connexion à MongoDB
    await connectDB();
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Connecté à MongoDB\n');

    // ============================================
    // MODIFIEZ CES VARIABLES AVEC VOS DONNÉES
    // ============================================
    
    const articleData = {
      title: 'Titre de votre article',
      content: 'Contenu complet de l\'article. Vous pouvez utiliser du HTML ou du Markdown. Le contenu doit contenir au moins 50 caractères.',
      excerpt: 'Résumé court de l\'article (optionnel, max 500 caractères)',
      categorySlug: 'actualites-aeronautiques', // Slug de la catégorie (ou ID)
      author: 'Votre Nom',
      featuredImage: 'https://example.com/image.jpg', // URL de l'image (optionnel)
      videoUrl: '', // URL de la vidéo (optionnel, pour les articles vidéo)
      tags: ['aviation', 'afrique'], // Tableau de tags
      status: 'published' // 'published' ou 'draft'
    };

    // ============================================

    // 1. Trouver la catégorie
    let category = null;
    
    // Essayer par slug d'abord
    if (articleData.categorySlug) {
      category = await Category.findOne({ 
        slug: articleData.categorySlug.toLowerCase().trim(),
        isActive: true
      });
      
      // Si pas trouvé par slug, essayer par ID
      if (!category && /^[0-9a-fA-F]{24}$/.test(articleData.categorySlug)) {
        category = await Category.findById(articleData.categorySlug);
      }
    }
    
    if (!category) {
      console.error('❌ Catégorie non trouvée:', articleData.categorySlug);
      console.error('💡 Créez d\'abord la catégorie ou utilisez un slug/ID valide');
      process.exit(1);
    }
    
    console.log(`✅ Catégorie trouvée: ${category.name} (${category.slug})\n`);

    // 2. Vérifier si un article avec le même slug existe déjà
    const slug = articleData.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const existingArticle = await Article.findOne({ slug });
    if (existingArticle) {
      console.error(`❌ Un article avec le slug "${slug}" existe déjà`);
      console.error('💡 Modifiez le titre ou supprimez l\'article existant');
      process.exit(1);
    }

    // 3. Créer l'article
    const article = await Article.create({
      title: articleData.title,
      content: articleData.content,
      excerpt: articleData.excerpt || '',
      category: category._id,
      author: articleData.author || 'Admin XC Afrique',
      featuredImage: articleData.featuredImage || '',
      videoUrl: articleData.videoUrl || '',
      sources: articleData.sources || [],
      tags: articleData.tags || [],
      status: articleData.status || 'draft'
    });

    console.log('🎉 Article créé avec succès !\n');
    console.log('📄 Détails de l\'article:');
    console.log(`   Titre: ${article.title}`);
    console.log(`   Slug: ${article.slug}`);
    console.log(`   Catégorie: ${category.name}`);
    console.log(`   Auteur: ${article.author}`);
    console.log(`   Status: ${article.status}`);
    console.log(`   Tags: ${article.tags.join(', ')}`);
    if (article.publishedAt) {
      console.log(`   Date de publication: ${article.publishedAt.toLocaleString('fr-FR')}`);
    }
    console.log(`\n🌐 URL de l'article:`);
    console.log(`   https://xcafrique.org/articles/${article.slug}`);
    console.log(`   http://localhost:5000/api/articles/${article.slug}`);

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

// Exécuter le script
createArticle();

