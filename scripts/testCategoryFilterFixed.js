/**
 * Script de test pour vérifier que le filtre par catégorie fonctionne correctement
 * Après la correction du problème 404
 * 
 * Usage: node scripts/testCategoryFilterFixed.js
 */

const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'https://xcafrique-backend.vercel.app/api';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testEndpoint(name, url, expectedStatus = 200, shouldHaveData = null) {
  try {
    const response = await axios.get(url);
    const status = response.status;
    const data = response.data;
    
    // Vérifier le status
    const statusOk = status === expectedStatus;
    
    // Vérifier la structure
    const structureOk = data.success !== undefined && 
                       data.count !== undefined && 
                       data.total !== undefined && 
                       data.page !== undefined && 
                       data.pages !== undefined && 
                       Array.isArray(data.data);
    
    // Vérifier les données si spécifié
    let dataOk = true;
    if (shouldHaveData !== null) {
      dataOk = shouldHaveData ? data.data.length > 0 : data.data.length === 0;
    }
    
    const allOk = statusOk && structureOk && dataOk;
    
    if (allOk) {
      console.log(`${colors.green}✅${colors.reset} ${name}`);
      console.log(`   Status: ${status} (attendu: ${expectedStatus})`);
      console.log(`   Structure: ✅`);
      console.log(`   Count: ${data.count}, Total: ${data.total}`);
      if (shouldHaveData !== null) {
        console.log(`   Data: ${shouldHaveData ? '✅ A des données' : '✅ Tableau vide'}`);
      }
    } else {
      console.log(`${colors.red}❌${colors.reset} ${name}`);
      if (!statusOk) {
        console.log(`   Status: ${status} (attendu: ${expectedStatus}) ${colors.red}❌${colors.reset}`);
      }
      if (!structureOk) {
        console.log(`   Structure: ${colors.red}❌${colors.reset}`);
      }
      if (!dataOk) {
        console.log(`   Data: ${colors.red}❌${colors.reset}`);
      }
    }
    
    return allOk;
  } catch (error) {
    const status = error.response?.status || 'N/A';
    console.log(`${colors.red}❌${colors.reset} ${name}`);
    console.log(`   Erreur: ${error.message}`);
    console.log(`   Status: ${status}`);
    if (error.response?.data) {
      console.log(`   Response:`, JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function runTests() {
  console.log(`${colors.cyan}🧪 Tests du filtre par catégorie (après correction)${colors.reset}\n`);
  console.log(`${colors.blue}Base URL: ${BASE_URL}${colors.reset}\n`);
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Sans filtre
  console.log(`${colors.yellow}📋 Test 1: Liste sans filtre${colors.reset}`);
  if (await testEndpoint('GET /api/articles', `${BASE_URL}/articles`, 200, null)) passed++;
  else failed++;
  console.log('');
  
  // Test 2: Catégorie existante (passagers-service)
  console.log(`${colors.yellow}📋 Test 2: Catégorie existante${colors.reset}`);
  if (await testEndpoint(
    'GET /api/articles?category=passagers-service',
    `${BASE_URL}/articles?category=passagers-service`,
    200,
    null // Peut avoir des données ou être vide
  )) passed++;
  else failed++;
  console.log('');
  
  // Test 3: Catégorie inexistante
  console.log(`${colors.yellow}📋 Test 3: Catégorie inexistante${colors.reset}`);
  if (await testEndpoint(
    'GET /api/articles?category=categorie-inexistante-123',
    `${BASE_URL}/articles?category=categorie-inexistante-123`,
    200, // Doit être 200, pas 404
    false // Doit être vide
  )) passed++;
  else failed++;
  console.log('');
  
  // Test 4: ID MongoDB invalide
  console.log(`${colors.yellow}📋 Test 4: ID MongoDB invalide${colors.reset}`);
  if (await testEndpoint(
    'GET /api/articles?category=invalid-id-123',
    `${BASE_URL}/articles?category=invalid-id-123`,
    200, // Doit être 200, pas 404
    false // Doit être vide
  )) passed++;
  else failed++;
  console.log('');
  
  // Test 5: Slug avec espaces
  console.log(`${colors.yellow}📋 Test 5: Slug avec espaces (normalisé)${colors.reset}`);
  if (await testEndpoint(
    'GET /api/articles?category=Passagers Service',
    `${BASE_URL}/articles?category=Passagers Service`,
    200,
    null
  )) passed++;
  else failed++;
  console.log('');
  
  // Résumé
  console.log('='.repeat(50));
  console.log(`${colors.cyan}📊 Résumé des tests${colors.reset}`);
  console.log('='.repeat(50));
  console.log(`${colors.green}✅ Réussis: ${passed}${colors.reset}`);
  console.log(`${colors.red}❌ Échoués: ${failed}${colors.reset}`);
  console.log(`📋 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log(`\n${colors.green}🎉 Tous les tests sont passés !${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}⚠️  Certains tests ont échoué${colors.reset}`);
    process.exit(1);
  }
}

// Exécuter les tests
runTests();

