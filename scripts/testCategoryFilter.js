/**
 * Script pour tester le filtre par catégorie
 */

const axios = require('axios');

const BASE_URL = 'https://xcafrique-backend.vercel.app/api';

async function testCategoryFilter() {
  console.log('🧪 Test du filtre par catégorie\n');

  try {
    // Test 1: Liste sans filtre
    console.log('📋 Test 1: GET /api/articles (sans filtre)');
    const response1 = await axios.get(`${BASE_URL}/articles`);
    console.log(`✅ Status: ${response1.status}`);
    console.log(`   Total articles: ${response1.data.total || 0}`);
    console.log(`   Articles retournés: ${response1.data.count || 0}\n`);

    // Test 2: Avec filtre catégorie
    console.log('📋 Test 2: GET /api/articles?category=passagers-service');
    const response2 = await axios.get(`${BASE_URL}/articles`, {
      params: { category: 'passagers-service' }
    });
    console.log(`✅ Status: ${response2.status}`);
    console.log(`   Total articles: ${response2.data.total || 0}`);
    console.log(`   Articles retournés: ${response2.data.count || 0}`);
    if (response2.data.data && response2.data.data.length > 0) {
      console.log(`   Premier article: ${response2.data.data[0].title}`);
    }
    console.log('');

    // Test 3: Vérifier les catégories disponibles
    console.log('📋 Test 3: GET /api/categories');
    const response3 = await axios.get(`${BASE_URL}/categories`);
    console.log(`✅ Status: ${response3.status}`);
    if (response3.data.data && response3.data.data.length > 0) {
      console.log(`   Catégories disponibles:`);
      response3.data.data.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.slug})`);
      });
    }
    console.log('');

  } catch (error) {
    if (error.response) {
      console.error(`❌ Erreur HTTP ${error.response.status}`);
      console.error(`   Message: ${error.response.data.message || 'Erreur inconnue'}`);
      console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`❌ Erreur: ${error.message}`);
    }
    process.exit(1);
  }
}

testCategoryFilter();

