/**
 * Script de test pour vérifier qu'un article publié est accessible
 * Usage: node scripts/testPublishedArticle.js [slug]
 * 
 * Exemple: 
 *   node scripts/testPublishedArticle.js
 *   node scripts/testPublishedArticle.js brussels-airlines-valorise-la-richesse-culinaire-africaine-a-bord-de-ses-vols-long-courriers-vers-bruxelles-des-2026
 */

const axios = require('axios');

// URL de base de l'API
const BASE_URL = process.env.API_BASE_URL || 'https://xcafrique-backend.vercel.app/api';

// Slug de l'article à tester (par défaut article1)
const ARTICLE_SLUG = process.argv[2] || 'brussels-airlines-valorise-la-richesse-culinaire-africaine-a-bord-de-ses-vols-long-courriers-vers-bruxelles-des-2026';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

async function testArticle() {
  console.log(`${colors.cyan}🧪 Test de l'article publié${colors.reset}`);
  console.log(`${colors.blue}Base URL: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.blue}Slug: ${ARTICLE_SLUG}${colors.reset}\n`);

  try {
    // Test 1: Vérifier que l'article apparaît dans la liste
    console.log(`${colors.yellow}📋 Test 1: Liste des articles${colors.reset}`);
    const listResponse = await axios.get(`${BASE_URL}/articles`);
    
    if (listResponse.data.success) {
      const articles = listResponse.data.data || [];
      const articleInList = articles.find(a => a.slug === ARTICLE_SLUG);
      
      if (articleInList) {
        console.log(`${colors.green}✅ Article trouvé dans la liste${colors.reset}`);
        console.log(`   Titre: ${articleInList.title}`);
        console.log(`   Status: ${articleInList.status}`);
        console.log(`   Catégorie: ${articleInList.category?.name || 'N/A'}`);
        console.log(`   Vues: ${articleInList.views}`);
      } else {
        console.log(`${colors.red}❌ Article non trouvé dans la liste${colors.reset}`);
        console.log(`   Total d'articles: ${listResponse.data.total}`);
        console.log(`   Articles sur cette page: ${articles.length}`);
        if (articles.length > 0) {
          console.log(`   Premier article: ${articles[0].slug}`);
        }
      }
    } else {
      console.log(`${colors.red}❌ Erreur lors de la récupération de la liste${colors.reset}`);
      console.log(`   Message: ${listResponse.data.message || 'Erreur inconnue'}`);
    }

    console.log('');

    // Test 2: Récupérer l'article par slug
    console.log(`${colors.yellow}📄 Test 2: Récupération par slug${colors.reset}`);
    const articleResponse = await axios.get(`${BASE_URL}/articles/${ARTICLE_SLUG}`);
    
    if (articleResponse.data.success) {
      const article = articleResponse.data.data;
      console.log(`${colors.green}✅ Article récupéré avec succès${colors.reset}\n`);
      
      console.log(`${colors.magenta}📝 Détails de l'article:${colors.reset}`);
      console.log(`   ID: ${article._id}`);
      console.log(`   Titre: ${article.title}`);
      console.log(`   Slug: ${article.slug}`);
      console.log(`   Status: ${article.status}`);
      console.log(`   Auteur: ${article.author}`);
      console.log(`   Catégorie: ${article.category?.name || 'N/A'} (${article.category?.slug || 'N/A'})`);
      console.log(`   Vues: ${article.views}`);
      console.log(`   Date de publication: ${article.publishedAt ? new Date(article.publishedAt).toLocaleString('fr-FR') : 'N/A'}`);
      console.log(`   Tags: ${article.tags?.join(', ') || 'Aucun'}`);
      console.log(`   Image: ${article.featuredImage ? '✅' : '❌'}`);
      console.log(`   Contenu: ${article.content ? `${article.content.substring(0, 100)}...` : 'Vide'}`);
      
      // Vérifications importantes
      console.log(`\n${colors.cyan}🔍 Vérifications:${colors.reset}`);
      
      if (article.status === 'published') {
        console.log(`${colors.green}✅ Status: published${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ Status: ${article.status} (devrait être "published")${colors.reset}`);
      }
      
      if (article.category) {
        console.log(`${colors.green}✅ Catégorie associée${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ Pas de catégorie associée${colors.reset}`);
      }
      
      if (article.publishedAt) {
        console.log(`${colors.green}✅ Date de publication définie${colors.reset}`);
      } else {
        console.log(`${colors.yellow}⚠️  Date de publication non définie${colors.reset}`);
      }
      
      console.log(`\n${colors.green}🌐 URL de l'article:${colors.reset}`);
      console.log(`   ${BASE_URL.replace('/api', '')}/articles/${article.slug}`);
      
    } else {
      console.log(`${colors.red}❌ Erreur lors de la récupération de l'article${colors.reset}`);
      console.log(`   Message: ${articleResponse.data.message || 'Erreur inconnue'}`);
    }

  } catch (error) {
    if (error.response) {
      // Erreur HTTP
      const status = error.response.status;
      const data = error.response.data;
      
      console.log(`${colors.red}❌ Erreur HTTP ${status}${colors.reset}`);
      console.log(`   Message: ${data.message || 'Erreur inconnue'}`);
      
      if (status === 404) {
        console.log(`\n${colors.yellow}💡 Suggestions:${colors.reset}`);
        console.log(`   1. Vérifiez que le slug est correct: ${ARTICLE_SLUG}`);
        console.log(`   2. Vérifiez que l'article a le status "published" dans MongoDB`);
        console.log(`   3. Vérifiez que l'article existe dans la base de données`);
      }
    } else if (error.request) {
      // Pas de réponse du serveur
      console.log(`${colors.red}❌ Impossible de contacter le serveur${colors.reset}`);
      console.log(`   URL: ${BASE_URL}`);
      console.log(`   Vérifiez que le serveur est accessible`);
    } else {
      // Autre erreur
      console.log(`${colors.red}❌ Erreur: ${error.message}${colors.reset}`);
    }
    
    process.exit(1);
  }
}

// Exécuter le test
testArticle();

