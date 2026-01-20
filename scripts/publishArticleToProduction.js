require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Article = require('../models/Article');
const Category = require('../models/Category');

/**
 * Script pour publier un article dans la base de données de PRODUCTION
 * 
 * ⚠️ ATTENTION : Ce script utilise MONGODB_URI_PROD ou MONGODB_URI
 * 
 * Usage: 
 *   MONGODB_URI_PROD="mongodb+srv://..." node scripts/publishArticleToProduction.js [article1.json]
 * 
 * Ou définissez MONGODB_URI_PROD dans votre .env
 */

async function publishToProduction(articleFileName = 'article1.json') {
  try {
    console.log(`📝 Publication de l'article en PRODUCTION: ${articleFileName}\n`);

    // Utiliser MONGODB_URI_PROD si disponible, sinon MONGODB_URI
    const mongoUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ Erreur: MONGODB_URI_PROD ou MONGODB_URI n\'est pas défini');
      console.error('💡 Définissez MONGODB_URI_PROD dans votre .env ou passez-le en variable d\'environnement');
      process.exit(1);
    }

    // Afficher un avertissement si on utilise MONGODB_URI (peut être local)
    if (!process.env.MONGODB_URI_PROD && process.env.MONGODB_URI) {
      console.log('⚠️  ATTENTION: Utilisation de MONGODB_URI (vérifiez que c\'est bien la base de production)\n');
    }

    // Connexion à MongoDB de production
    console.log('🔌 Connexion à MongoDB de production...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Connecté à MongoDB de production\n');

    // Chemin vers le fichier article
    const articlePath = path.join(__dirname, '..', 'Prod', 'articles', 'ready-to-publish', articleFileName);
    
    // Si pas trouvé dans ready-to-publish, essayer dans published
    const articlePathPublished = path.join(__dirname, '..', 'Prod', 'articles', 'published', articleFileName);
    
    let finalPath = articlePath;
    if (!fs.existsSync(articlePath) && fs.existsSync(articlePathPublished)) {
      finalPath = articlePathPublished;
      console.log(`📄 Fichier trouvé dans published/ au lieu de ready-to-publish/\n`);
    } else if (!fs.existsSync(articlePath)) {
      console.error(`❌ Le fichier ${articleFileName} n'existe pas`);
      console.error(`   Cherché dans: ${articlePath}`);
      console.error(`   Cherché dans: ${articlePathPublished}`);
      process.exit(1);
    }

    // Lire le fichier JSON
    const articleData = JSON.parse(fs.readFileSync(finalPath, 'utf8'));
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
    if (existingArticle) {
      console.log(`⚠️  Un article avec le slug "${slug}" existe déjà`);
      console.log(`   ID: ${existingArticle._id}`);
      console.log(`   Status actuel: ${existingArticle.status}`);
      console.log(`   Titre actuel: ${existingArticle.title}\n`);
      
      // Demander confirmation pour mettre à jour
      console.log('💡 Options:');
      console.log('   1. Mettre à jour l\'article existant (remplacer)');
      console.log('   2. Annuler\n');
      
      // Pour l'instant, on met à jour automatiquement
      console.log('🔄 Mise à jour de l\'article existant...\n');
      
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
      existingArticle.publishedAt = articleData.publishedAt ? new Date(articleData.publishedAt) : new Date();
      
      await existingArticle.save();
      
      console.log('✅ Article mis à jour avec succès !\n');
      console.log('📄 Détails de l\'article:');
      console.log(`   Titre: ${existingArticle.title}`);
      console.log(`   Slug: ${existingArticle.slug}`);
      console.log(`   Catégorie: ${category.name}`);
      console.log(`   Auteur: ${existingArticle.author}`);
      console.log(`   Status: ${existingArticle.status}`);
      console.log(`   Tags: ${existingArticle.tags.join(', ')}`);
      console.log(`   Date de publication: ${existingArticle.publishedAt.toLocaleString('fr-FR')}`);
      
    } else {
      // 3. Créer l'article avec le statut "published"
      const article = await Article.create({
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
        status: 'published',
        views: articleData.views || 0,
        publishedAt: articleData.publishedAt ? new Date(articleData.publishedAt) : new Date()
      });

      console.log('🎉 Article publié avec succès en PRODUCTION !\n');
      console.log('📄 Détails de l\'article:');
      console.log(`   Titre: ${article.title}`);
      console.log(`   Slug: ${article.slug}`);
      console.log(`   Catégorie: ${category.name}`);
      console.log(`   Auteur: ${article.author}`);
      console.log(`   Status: ${article.status}`);
      console.log(`   Tags: ${article.tags.join(', ')}`);
      console.log(`   Date de publication: ${article.publishedAt.toLocaleString('fr-FR')}`);
    }

    console.log(`\n🌐 URL de l'article:`);
    console.log(`   https://xcafrique-backend.vercel.app/api/articles/${slug}`);
    console.log(`   https://xcafrique.org/articles/${slug}`);

    await mongoose.connection.close();
    console.log('\n✅ Déconnexion de MongoDB\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.code === 11000) {
      console.error('💡 Un article avec ce slug existe déjà');
    }
    if (error.name === 'ValidationError') {
      console.error('💡 Erreur de validation:', Object.values(error.errors).map(e => e.message).join(', '));
    }
    if (error.message.includes('MONGODB_URI')) {
      console.error('\n💡 Vérifiez que MONGODB_URI_PROD est défini dans votre .env');
    }
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Récupérer le nom du fichier depuis les arguments de ligne de commande
const articleFileName = process.argv[2] || 'article1.json';

// Exécuter le script
publishToProduction(articleFileName);

