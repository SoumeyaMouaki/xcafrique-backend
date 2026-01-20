require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('../models/Article');
const Category = require('../models/Category');

/**
 * Script pour vérifier si un article existe dans la base de données de PRODUCTION
 * Usage: node scripts/checkArticleInProduction.js [slug]
 */

async function checkArticleInProduction(slug = null) {
  try {
    console.log('🔍 Vérification des articles dans MongoDB PRODUCTION\n');

    // Utiliser MONGODB_URI_PROD si disponible, sinon MONGODB_URI
    const mongoUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ Erreur: MONGODB_URI_PROD ou MONGODB_URI n\'est pas défini');
      console.error('💡 Définissez MONGODB_URI_PROD dans votre .env');
      process.exit(1);
    }

    if (!process.env.MONGODB_URI_PROD) {
      console.log('⚠️  ATTENTION: Utilisation de MONGODB_URI (vérifiez que c\'est bien la base de production)\n');
    } else {
      console.log('✅ Utilisation de MONGODB_URI_PROD\n');
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

    // Si un slug est fourni, chercher cet article spécifique
    if (slug) {
      console.log(`📄 Recherche de l'article avec le slug: ${slug}\n`);
      
      const article = await Article.findOne({ slug })
        .populate('category', 'name slug color isActive');
      
      if (article) {
        console.log('✅ Article trouvé !\n');
        console.log('📄 Détails:');
        console.log(`   ID: ${article._id}`);
        console.log(`   Titre: ${article.title}`);
        console.log(`   Slug: ${article.slug}`);
        console.log(`   Status: ${article.status}`);
        console.log(`   Auteur: ${article.author}`);
        console.log(`   Date de publication: ${article.publishedAt ? new Date(article.publishedAt).toLocaleString('fr-FR') : '❌ Non définie'}`);
        console.log(`   Catégorie: ${article.category ? `${article.category.name} (${article.category.slug})` : '❌ Non définie'}`);
        console.log(`   Catégorie active: ${article.category?.isActive ? '✅' : '❌'}`);
        console.log(`   Vues: ${article.views || 0}`);
        console.log(`   Tags: ${article.tags?.join(', ') || 'Aucun'}`);
        console.log(`   Créé le: ${article.createdAt ? new Date(article.createdAt).toLocaleString('fr-FR') : 'N/A'}`);
        console.log(`   Modifié le: ${article.updatedAt ? new Date(article.updatedAt).toLocaleString('fr-FR') : 'N/A'}`);
        
        if (article.status !== 'published') {
          console.log('\n⚠️  ATTENTION: L\'article n\'est pas publié (status: ' + article.status + ')');
        }
        
        if (!article.publishedAt) {
          console.log('\n⚠️  ATTENTION: L\'article n\'a pas de date de publication');
        }
        
        if (!article.category || !article.category.isActive) {
          console.log('\n⚠️  ATTENTION: La catégorie n\'existe pas ou n\'est pas active');
        }
      } else {
        console.log(`❌ Article avec le slug "${slug}" non trouvé dans la base de production`);
        console.log('\n💡 Pour publier cet article en production:');
        console.log(`   node scripts/publishArticleToProduction.js article2.json`);
      }
    } else {
      // Lister tous les articles publiés
      console.log('📋 Liste des articles publiés en production:\n');
      
      const publishedArticles = await Article.find({ status: 'published' })
        .populate('category', 'name slug')
        .sort({ publishedAt: -1, createdAt: -1 })
        .select('title slug status publishedAt category views');
      
      if (publishedArticles.length === 0) {
        console.log('❌ Aucun article publié trouvé dans la base de production\n');
      } else {
        console.log(`✅ ${publishedArticles.length} article(s) publié(s) trouvé(s):\n`);
        publishedArticles.forEach((article, index) => {
          console.log(`${index + 1}. ${article.title}`);
          console.log(`   Slug: ${article.slug}`);
          console.log(`   Catégorie: ${article.category ? article.category.name : 'N/A'}`);
          console.log(`   Publié le: ${article.publishedAt ? new Date(article.publishedAt).toLocaleString('fr-FR') : 'Non défini'}`);
          console.log(`   Vues: ${article.views || 0}`);
          console.log('');
        });
      }
      
      // Compter les articles par statut
      const draftCount = await Article.countDocuments({ status: 'draft' });
      const publishedCount = await Article.countDocuments({ status: 'published' });
      
      console.log('\n📊 Statistiques:');
      console.log(`   Publiés: ${publishedCount}`);
      console.log(`   Brouillons: ${draftCount}`);
      console.log(`   Total: ${publishedCount + draftCount}`);
    }

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

// Récupérer le slug depuis les arguments de ligne de commande
const slug = process.argv[2] || null;

// Exécuter le script
checkArticleInProduction(slug);

