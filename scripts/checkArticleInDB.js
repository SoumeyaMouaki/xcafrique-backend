require('dotenv').config();
const connectDB = require('../config/database');
const Article = require('../models/Article');
const Category = require('../models/Category');

/**
 * Script pour vérifier si un article existe dans MongoDB
 * Usage: node scripts/checkArticleInDB.js [slug]
 */

async function checkArticle(slug = null) {
  try {
    console.log('🔍 Vérification des articles dans MongoDB\n');

    // Connexion à MongoDB
    await connectDB();
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Connecté à MongoDB\n');

    // Si un slug est fourni, chercher cet article spécifique
    if (slug) {
      console.log(`📄 Recherche de l'article avec le slug: ${slug}\n`);
      
      const article = await Article.findOne({ slug })
        .populate('category', 'name slug color isActive');
      
      if (article) {
        console.log('✅ Article trouvé !\n');
        console.log('📝 Détails:');
        console.log(`   ID: ${article._id}`);
        console.log(`   Titre: ${article.title}`);
        console.log(`   Slug: ${article.slug}`);
        console.log(`   Status: ${article.status} ${article.status === 'published' ? '✅' : '❌'}`);
        console.log(`   Auteur: ${article.author}`);
        console.log(`   Catégorie: ${article.category ? article.category.name : 'N/A'} (${article.category ? article.category.slug : 'N/A'})`);
        console.log(`   Catégorie active: ${article.category ? (article.category.isActive ? '✅' : '❌') : 'N/A'}`);
        console.log(`   Vues: ${article.views}`);
        console.log(`   Date de publication: ${article.publishedAt ? new Date(article.publishedAt).toLocaleString('fr-FR') : '❌ Non définie'}`);
        console.log(`   Créé le: ${new Date(article.createdAt).toLocaleString('fr-FR')}`);
        console.log(`   Modifié le: ${new Date(article.updatedAt).toLocaleString('fr-FR')}`);
        
        if (article.status !== 'published') {
          console.log(`\n⚠️  ATTENTION: L'article a le statut "${article.status}" au lieu de "published"`);
          console.log(`   C'est pour cela qu'il n'apparaît pas dans l'API publique.`);
        }
        
        if (!article.publishedAt) {
          console.log(`\n⚠️  ATTENTION: La date de publication n'est pas définie`);
        }
        
        if (!article.category || !article.category.isActive) {
          console.log(`\n⚠️  ATTENTION: La catégorie n'existe pas ou n'est pas active`);
        }
      } else {
        console.log('❌ Article non trouvé dans MongoDB\n');
        console.log('💡 Vérifications:');
        console.log('   1. Le slug est-il correct ?');
        console.log('   2. L\'article a-t-il été publié avec le script publishArticle.js ?');
        console.log('   3. Y a-t-il eu des erreurs lors de la publication ?');
      }
    } else {
      // Lister tous les articles
      console.log('📋 Liste de tous les articles dans MongoDB\n');
      
      const allArticles = await Article.find({})
        .populate('category', 'name slug isActive')
        .sort({ createdAt: -1 });
      
      if (allArticles.length === 0) {
        console.log('❌ Aucun article trouvé dans MongoDB\n');
        console.log('💡 Vous devez d\'abord publier un article avec:');
        console.log('   node scripts/publishArticle.js');
      } else {
        console.log(`✅ ${allArticles.length} article(s) trouvé(s)\n`);
        
        const published = allArticles.filter(a => a.status === 'published');
        const drafts = allArticles.filter(a => a.status === 'draft');
        
        console.log(`   📰 Publiés: ${published.length}`);
        console.log(`   📝 Brouillons: ${drafts.length}\n`);
        
        console.log('📄 Détails des articles:\n');
        
        allArticles.forEach((article, index) => {
          console.log(`${index + 1}. ${article.title}`);
          console.log(`   Slug: ${article.slug}`);
          console.log(`   Status: ${article.status} ${article.status === 'published' ? '✅' : '❌'}`);
          console.log(`   Catégorie: ${article.category ? article.category.name : 'N/A'}`);
          console.log(`   Publié le: ${article.publishedAt ? new Date(article.publishedAt).toLocaleString('fr-FR') : 'Non défini'}`);
          console.log('');
        });
      }
    }

    // Vérifier les catégories
    console.log('\n📂 Catégories disponibles:\n');
    const categories = await Category.find({ isActive: true });
    
    if (categories.length === 0) {
      console.log('❌ Aucune catégorie active trouvée\n');
    } else {
      console.log(`✅ ${categories.length} catégorie(s) active(s):\n`);
      categories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.slug})`);
      });
    }

    const mongoose = require('mongoose');
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.message.includes('MONGODB_URI')) {
      console.error('\n💡 Vérifiez que MONGODB_URI est défini dans votre fichier .env');
    }
    process.exit(1);
  }
}

// Récupérer le slug depuis les arguments
const slug = process.argv[2] || null;

// Exécuter le script
checkArticle(slug);

