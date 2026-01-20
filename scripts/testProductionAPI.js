require('dotenv').config();
const https = require('https');

const API_BASE_URL = 'https://xcafrique-backend.vercel.app/api';
const ARTICLE_SLUG = 'asky-togo-et-taag-angola-lancent-leurs-ateliers-mro-independants-pour-renforcer-l-aviation-africaine-en-2026';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (error) {
          reject(new Error(`Erreur parsing JSON: ${error.message}\nRéponse: ${data.substring(0, 200)}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function testProductionAPI() {
  try {
    console.log('🔍 Test de l\'API de production\n');
    console.log(`📡 Base URL: ${API_BASE_URL}\n`);

    // Test 1: Liste des articles
    console.log('1️⃣ Test GET /api/articles\n');
    const listResponse = await makeRequest(`${API_BASE_URL}/articles`);
    
    if (listResponse.status === 200 && listResponse.data.success) {
      const articles = listResponse.data.data || [];
      console.log(`✅ ${listResponse.data.total || articles.length} article(s) trouvé(s)`);
      console.log(`   Count: ${listResponse.data.count || articles.length}`);
      
      if (articles.length > 0) {
        console.log('\n📄 Premiers articles:');
        articles.slice(0, 5).forEach((article, index) => {
          console.log(`   ${index + 1}. ${article.title}`);
          console.log(`      Slug: ${article.slug}`);
          console.log(`      Status: ${article.status}`);
          console.log(`      PublishedAt: ${article.publishedAt || 'Non défini'}`);
          console.log(`      Catégorie: ${article.category?.name || 'N/A'}`);
          console.log('');
        });
        
        // Vérifier si notre article est dans la liste
        const ourArticle = articles.find(a => a.slug === ARTICLE_SLUG);
        if (ourArticle) {
          console.log(`✅ Notre article est dans la liste (position ${articles.indexOf(ourArticle) + 1})`);
        } else {
          console.log(`⚠️  Notre article n'est PAS dans les premiers résultats`);
          console.log(`   Vérifions avec une requête directe...`);
        }
      } else {
        console.log('❌ Aucun article dans la réponse');
      }
    } else {
      console.log(`❌ Erreur: Status ${listResponse.status}`);
      console.log('Réponse:', JSON.stringify(listResponse.data, null, 2));
    }

    // Test 2: Article spécifique
    console.log('\n2️⃣ Test GET /api/articles/:slug\n');
    console.log(`   Slug: ${ARTICLE_SLUG}\n`);
    
    const articleResponse = await makeRequest(`${API_BASE_URL}/articles/${ARTICLE_SLUG}`);
    
    if (articleResponse.status === 200 && articleResponse.data.success) {
      const article = articleResponse.data.data;
      console.log('✅ Article trouvé via API !');
      console.log(`   Titre: ${article.title}`);
      console.log(`   Slug: ${article.slug}`);
      console.log(`   Status: ${article.status}`);
      console.log(`   PublishedAt: ${article.publishedAt || 'Non défini'}`);
      console.log(`   Catégorie: ${article.category?.name || 'N/A'} (${article.category?.slug || 'N/A'})`);
      console.log(`   Auteur: ${article.author || 'N/A'}`);
      console.log(`   Vues: ${article.views || 0}`);
      console.log(`   Tags: ${article.tags?.join(', ') || 'Aucun'}`);
    } else if (articleResponse.status === 404) {
      console.log('❌ Article non trouvé (404)');
      console.log('   Message:', articleResponse.data.message || 'Non spécifié');
    } else {
      console.log(`❌ Erreur: Status ${articleResponse.status}`);
      console.log('Réponse:', JSON.stringify(articleResponse.data, null, 2));
    }

    // Test 3: Filtre par catégorie
    console.log('\n3️⃣ Test GET /api/articles?category=flotte-technologie\n');
    const categoryResponse = await makeRequest(`${API_BASE_URL}/articles?category=flotte-technologie`);
    
    if (categoryResponse.status === 200 && categoryResponse.data.success) {
      const articles = categoryResponse.data.data || [];
      console.log(`✅ ${categoryResponse.data.total || articles.length} article(s) dans la catégorie "flotte-technologie"`);
      
      if (articles.length > 0) {
        console.log('\n📄 Articles de cette catégorie:');
        articles.forEach((article, index) => {
          console.log(`   ${index + 1}. ${article.title} (${article.slug})`);
        });
        
        const ourArticle = articles.find(a => a.slug === ARTICLE_SLUG);
        if (ourArticle) {
          console.log(`\n✅ Notre article est dans les résultats de la catégorie`);
        } else {
          console.log(`\n⚠️  Notre article n'est PAS dans les résultats de la catégorie`);
        }
      }
    } else {
      console.log(`❌ Erreur: Status ${categoryResponse.status}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Résumé');
    console.log('='.repeat(60));
    console.log('✅ Les tests sont terminés');
    console.log('\n💡 Si l\'article n\'apparaît pas sur votre site:');
    console.log('   1. Vérifiez que le frontend utilise la bonne URL API');
    console.log('   2. Vérifiez le cache du navigateur (Ctrl+F5)');
    console.log('   3. Vérifiez la console du navigateur pour les erreurs');
    console.log('   4. Attendez quelques minutes (cache Vercel)');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.stack) {
      console.error('\nStack:', error.stack);
    }
  }
}

testProductionAPI();

