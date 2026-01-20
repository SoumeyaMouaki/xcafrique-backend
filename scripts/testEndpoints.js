/**
 * Script de test pour tous les endpoints API
 * Usage: node scripts/testEndpoints.js [baseUrl]
 * Exemple: node scripts/testEndpoints.js http://localhost:5000
 *         node scripts/testEndpoints.js https://xcafrique-backend.vercel.app
 */

const axios = require('axios');

// URL de base de l'API
const BASE_URL = process.argv[2] || 'http://localhost:5000';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Statistiques
let stats = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * Test un endpoint
 */
async function testEndpoint(method, path, data = null, expectedStatus = 200) {
  stats.total++;
  const url = `${BASE_URL}${path}`;
  
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: () => true // Ne pas lancer d'erreur pour les status codes
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    if (response.status === expectedStatus) {
      stats.passed++;
      console.log(`${colors.green}✅${colors.reset} ${method} ${path} - ${response.status}`);
      return { success: true, response };
    } else {
      stats.failed++;
      const error = `Status ${response.status} au lieu de ${expectedStatus}`;
      stats.errors.push({ method, path, error });
      console.log(`${colors.red}❌${colors.reset} ${method} ${path} - ${error}`);
      return { success: false, response };
    }
  } catch (error) {
    stats.failed++;
    const errorMsg = error.message || 'Erreur inconnue';
    stats.errors.push({ method, path, error: errorMsg });
    console.log(`${colors.red}❌${colors.reset} ${method} ${path} - ${errorMsg}`);
    return { success: false, error };
  }
}

/**
 * Tests principaux
 */
async function runTests() {
  console.log(`${colors.cyan}🧪 Test des endpoints API${colors.reset}`);
  console.log(`${colors.blue}Base URL: ${BASE_URL}${colors.reset}\n`);
  
  // Test 1: Route racine
  console.log(`${colors.yellow}📋 Route racine${colors.reset}`);
  await testEndpoint('GET', '/');
  
  // Test 2: Articles
  console.log(`\n${colors.yellow}📝 Articles${colors.reset}`);
  await testEndpoint('GET', '/api/articles');
  await testEndpoint('GET', '/api/articles?page=1&limit=5');
  await testEndpoint('GET', '/api/articles?search=test');
  await testEndpoint('GET', '/api/articles?type=video');
  await testEndpoint('GET', '/api/articles/invalid-slug', null, 404);
  
  // Test 3: Catégories
  console.log(`\n${colors.yellow}📂 Catégories${colors.reset}`);
  const categoriesResult = await testEndpoint('GET', '/api/categories');
  if (categoriesResult.success && categoriesResult.response.data?.data?.length > 0) {
    const firstCategoryId = categoriesResult.response.data.data[0]._id;
    await testEndpoint('GET', `/api/categories/${firstCategoryId}`);
  }
  await testEndpoint('GET', '/api/categories/invalid-id', null, 404);
  
  // Test 4: Vidéos
  console.log(`\n${colors.yellow}🎥 Vidéos${colors.reset}`);
  await testEndpoint('GET', '/api/videos');
  await testEndpoint('GET', '/api/videos?limit=6');
  await testEndpoint('GET', '/api/videos/invalid-slug', null, 404);
  
  // Test 5: Contact
  console.log(`\n${colors.yellow}📧 Contact${colors.reset}`);
  await testEndpoint('POST', '/api/contact', {
    name: 'Test User',
    email: 'test@example.com',
    subject: 'Test Subject',
    message: 'Test message for API testing'
  });
  
  // Test 6: CORS
  console.log(`\n${colors.yellow}🔒 CORS${colors.reset}`);
  try {
    const corsResponse = await axios({
      method: 'OPTIONS',
      url: `${BASE_URL}/api/articles`,
      headers: {
        'Origin': 'https://xcafrique-frontend.vercel.app',
        'Access-Control-Request-Method': 'GET'
      },
      validateStatus: () => true
    });
    
    if (corsResponse.headers['access-control-allow-origin']) {
      stats.passed++;
      console.log(`${colors.green}✅${colors.reset} CORS configuré correctement`);
    } else {
      stats.failed++;
      stats.errors.push({ method: 'OPTIONS', path: '/api/articles', error: 'Headers CORS manquants' });
      console.log(`${colors.red}❌${colors.reset} CORS - Headers manquants`);
    }
  } catch (error) {
    stats.failed++;
    console.log(`${colors.red}❌${colors.reset} CORS - ${error.message}`);
  }
  
  // Résumé
  console.log(`\n${colors.cyan}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.cyan}📊 Résumé des tests${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}`);
  console.log(`Total: ${stats.total}`);
  console.log(`${colors.green}✅ Réussis: ${stats.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Échoués: ${stats.failed}${colors.reset}`);
  
  if (stats.errors.length > 0) {
    console.log(`\n${colors.red}Erreurs détaillées:${colors.reset}`);
    stats.errors.forEach((err, index) => {
      console.log(`${index + 1}. ${err.method} ${err.path} - ${err.error}`);
    });
  }
  
  console.log(`\n${colors.cyan}${'='.repeat(50)}${colors.reset}`);
  
  // Code de sortie
  process.exit(stats.failed > 0 ? 1 : 0);
}

// Exécuter les tests
runTests().catch(error => {
  console.error(`${colors.red}Erreur fatale:${colors.reset}`, error);
  process.exit(1);
});

