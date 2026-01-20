require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const https = require('https');
const Article = require('../models/Article');
const Category = require('../models/Category');

/**
 * 🚀 Script de publication DIRECTE en production
 * 
 * Ce script publie un article directement dans la base MongoDB utilisée par Vercel
 * et vérifie automatiquement que tout fonctionne.
 * 
 * Usage:
 *   node scripts/publish.js article2.json
 * 
 * ⚠️ IMPORTANT: Ce script utilise MONGODB_URI (la même que Vercel)
 *    Assurez-vous que votre .env contient la même URI que celle configurée dans Vercel
 */

const API_BASE_URL = 'https://xcafrique-backend.vercel.app/api';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (error) {
          reject(new Error(`Erreur parsing JSON: ${error.message}`));
        }
      });
    }).on('error', reject);
  });
}

async function publishArticle(articleFileName) {
  try {
    console.log('🚀 PUBLICATION DIRECTE EN PRODUCTION\n');
    console.log('='.repeat(60));
    console.log(`📄 Article: ${articleFileName}\n`);

    // 1. Vérifier la configuration MongoDB
    // Préférer MONGODB_URI_PROD si disponible, sinon MONGODB_URI
    let mongoUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ ERREUR: MONGODB_URI_PROD ou MONGODB_URI n\'est pas défini dans votre .env');
      console.error('\n💡 SOLUTION:');
      console.error('   1. Allez sur Vercel Dashboard → Settings → Environment Variables');
      console.error('   2. Copiez la valeur de MONGODB_URI (celle utilisée par Vercel)');
      console.error('   3. Ajoutez-la dans votre fichier .env :');
      console.error('      MONGODB_URI_PROD=mongodb+srv://votre-uri-de-vercel');
      console.error('\n⚠️  IMPORTANT: Utilisez la MÊME URI que celle configurée dans Vercel !');
      process.exit(1);
    }

    // Vérifier si c'est une URI locale (localhost)
    const isLocalhost = mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1') || mongoUri.startsWith('mongodb://');
    
    if (isLocalhost && !process.env.MONGODB_URI_PROD) {
      console.error('❌ ERREUR: Vous utilisez une base MongoDB LOCALE !');
      console.error(`   URI détectée: ${mongoUri.substring(0, 50)}...`);
      console.error('\n💡 SOLUTION:');
      console.error('   Vercel utilise une base MongoDB Atlas (mongodb+srv://...), pas localhost !');
      console.error('\n   1. Allez sur Vercel Dashboard → Settings → Environment Variables');
      console.error('   2. Copiez la valeur de MONGODB_URI (elle commence par mongodb+srv://)');
      console.error('   3. Ajoutez-la dans votre fichier .env :');
      console.error('      MONGODB_URI_PROD=mongodb+srv://votre-uri-atlas');
      console.error('\n   OU passez-la directement en ligne de commande :');
      console.error(`      $env:MONGODB_URI_PROD="mongodb+srv://..."; node scripts/publish.js ${articleFileName}`);
      console.error('\n⚠️  Vous devez utiliser la MÊME base que Vercel pour que l\'article apparaisse sur le site !');
      process.exit(1);
    }

    // Afficher un aperçu de l'URI (masqué pour sécurité)
    const uriPreview = mongoUri.replace(/\/\/.*:.*@/, '//***:***@').substring(0, 60) + '...';
    const uriType = mongoUri.startsWith('mongodb+srv://') ? 'MongoDB Atlas (Production)' : 'MongoDB';
    console.log(`🔌 MongoDB URI: ${uriPreview}`);
    console.log(`   Type: ${uriType}`);
    if (process.env.MONGODB_URI_PROD) {
      console.log('   ✅ Utilisation de MONGODB_URI_PROD\n');
    } else {
      console.log('   ⚠️  Utilisation de MONGODB_URI (vérifiez que c\'est la base de production)\n');
    }

    // 2. Connexion à MongoDB
    console.log('📡 Connexion à MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Connecté à MongoDB\n');

    // 3. Lire le fichier article
    const articlePath = path.join(__dirname, '..', 'Prod', 'articles', 'ready-to-publish', articleFileName);
    const articlePathPublished = path.join(__dirname, '..', 'Prod', 'articles', 'published', articleFileName);
    
    let finalPath = articlePath;
    if (!fs.existsSync(articlePath) && fs.existsSync(articlePathPublished)) {
      finalPath = articlePathPublished;
    } else if (!fs.existsSync(articlePath)) {
      console.error(`❌ Le fichier ${articleFileName} n'existe pas`);
      console.error(`   Cherché dans: ${articlePath}`);
      console.error(`   Cherché dans: ${articlePathPublished}`);
      await mongoose.connection.close();
      process.exit(1);
    }

    const articleData = JSON.parse(fs.readFileSync(finalPath, 'utf8'));
    console.log(`📄 Article lu: ${articleData.title}\n`);

    // 4. Gérer la catégorie
    let category = null;
    const categorySlug = articleData.category
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .trim();
    
    category = await Category.findOne({ slug: categorySlug, isActive: true });
    
    if (!category) {
      const categoryNameRegex = new RegExp(`^${articleData.category.trim()}$`, 'i');
      category = await Category.findOne({ name: categoryNameRegex, isActive: true });
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
        if (error.code === 11000) {
          const categoryNameRegex = new RegExp(`^${articleData.category.trim()}$`, 'i');
          category = await Category.findOne({ name: categoryNameRegex, isActive: true });
          if (category) {
            console.log(`✅ Catégorie trouvée: ${category.name} (${category.slug})\n`);
          } else {
            category = await Category.findOne({ slug: categorySlug, isActive: true });
            if (category) {
              console.log(`✅ Catégorie trouvée par slug: ${category.name} (${category.slug})\n`);
            } else {
              throw error;
            }
          }
        } else {
          throw error;
        }
      }
    } else {
      console.log(`✅ Catégorie trouvée: ${category.name} (${category.slug})\n`);
    }

    // 5. Créer ou mettre à jour l'article
    const slug = articleData.slug || articleData.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const existingArticle = await Article.findOne({ slug });
    
    if (existingArticle) {
      console.log(`🔄 Article existant trouvé, mise à jour...\n`);
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
    } else {
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
      console.log('✅ Article créé avec succès !\n');
    }

    // 6. Vérifier dans MongoDB
    console.log('🔍 Vérification dans MongoDB...');
    const verifyArticle = await Article.findOne({ slug }).populate('category', 'name slug');
    if (verifyArticle) {
      console.log(`✅ Article trouvé dans MongoDB:`);
      console.log(`   Titre: ${verifyArticle.title}`);
      console.log(`   Status: ${verifyArticle.status}`);
      console.log(`   Catégorie: ${verifyArticle.category?.name || 'N/A'}`);
      console.log(`   PublishedAt: ${verifyArticle.publishedAt ? verifyArticle.publishedAt.toLocaleString('fr-FR') : 'Non défini'}\n`);
    } else {
      console.log('❌ Article non trouvé dans MongoDB après création !\n');
    }

    await mongoose.connection.close();
    console.log('✅ Déconnexion de MongoDB\n');

    // 7. Vérifier via l'API (attendre quelques secondes pour le cache)
    console.log('⏳ Attente de 3 secondes pour le cache Vercel...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🌐 Vérification via l\'API de production...\n');
    try {
      const apiResponse = await makeRequest(`${API_BASE_URL}/articles/${slug}`);
      
      if (apiResponse.status === 200 && apiResponse.data.success) {
        console.log('🎉 SUCCÈS ! L\'article est accessible via l\'API !\n');
        console.log('📄 Détails:');
        console.log(`   Titre: ${apiResponse.data.data.title}`);
        console.log(`   Slug: ${apiResponse.data.data.slug}`);
        console.log(`   Status: ${apiResponse.data.data.status}`);
        console.log(`\n🌐 URLs:`);
        console.log(`   API: ${API_BASE_URL}/articles/${slug}`);
        console.log(`   Site: https://xcafrique.org/articles/${slug}\n`);
      } else {
        console.log(`⚠️  L'article a été publié mais n'est pas encore accessible via l'API`);
        console.log(`   Status: ${apiResponse.status}`);
        console.log(`   Message: ${apiResponse.data.message || 'Non spécifié'}`);
        console.log(`\n💡 Cela peut être dû au cache Vercel. Attendez 1-2 minutes et réessayez.`);
        console.log(`   Ou vérifiez directement: ${API_BASE_URL}/articles/${slug}\n`);
      }
    } catch (error) {
      console.log(`⚠️  Impossible de vérifier via l'API: ${error.message}`);
      console.log(`   L'article a été publié dans MongoDB, mais la vérification API a échoué.`);
      console.log(`   Vérifiez manuellement: ${API_BASE_URL}/articles/${slug}\n`);
    }

    console.log('='.repeat(60));
    console.log('✅ Publication terminée !');
    console.log('='.repeat(60));
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    if (error.code === 11000) {
      if (error.message.includes('categories')) {
        console.error('💡 Une catégorie avec ce nom existe déjà');
      } else {
        console.error('💡 Un article avec ce slug existe déjà');
      }
    }
    if (error.name === 'ValidationError') {
      console.error('💡 Erreur de validation:', Object.values(error.errors).map(e => e.message).join(', '));
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Récupérer le nom du fichier depuis les arguments
const articleFileName = process.argv[2];

if (!articleFileName) {
  console.error('❌ Usage: node scripts/publish.js <nom-du-fichier.json>');
  console.error('   Exemple: node scripts/publish.js article2.json');
  process.exit(1);
}

publishArticle(articleFileName);

