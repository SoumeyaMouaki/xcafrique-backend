/**
 * Script de test pour l'endpoint newsletter
 * Utilisez ce script pour tester rapidement l'endpoint newsletter
 * 
 * Usage: node scripts/testNewsletter.js
 */

require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function testNewsletter() {
  console.log('🧪 Test de l\'endpoint newsletter\n');
  console.log(`📍 URL: ${API_URL}/newsletter/subscribe\n`);

  // Test 1: Abonnement valide
  console.log('Test 1: Abonnement avec email valide');
  try {
    const response = await axios.post(`${API_URL}/newsletter/subscribe`, {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      source: 'website'
    });
    console.log('✅ Succès:', response.data);
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }

  console.log('\n---\n');

  // Test 2: Email invalide
  console.log('Test 2: Email invalide');
  try {
    const response = await axios.post(`${API_URL}/newsletter/subscribe`, {
      email: 'email-invalide',
      name: 'Test User'
    });
    console.log('✅ Succès:', response.data);
  } catch (error) {
    console.log('✅ Erreur attendue:', error.response?.data || error.message);
  }

  console.log('\n---\n');

  // Test 3: Email manquant
  console.log('Test 3: Email manquant');
  try {
    const response = await axios.post(`${API_URL}/newsletter/subscribe`, {
      name: 'Test User'
    });
    console.log('✅ Succès:', response.data);
  } catch (error) {
    console.log('✅ Erreur attendue:', error.response?.data || error.message);
  }

  console.log('\n✅ Tests terminés');
}

// Exécuter les tests
testNewsletter().catch(console.error);

