const https = require('https');

const API_URL = 'https://xcafrique-backend.vercel.app/api/articles';
const ORIGIN = 'https://www.xcafrique.org';

console.log('🔍 Test CORS pour www.xcafrique.org\n');
console.log(`📡 URL: ${API_URL}`);
console.log(`🌐 Origin: ${ORIGIN}\n`);

const options = {
  hostname: 'xcafrique-backend.vercel.app',
  path: '/api/articles',
  method: 'GET',
  headers: {
    'Origin': ORIGIN
  }
};

// Test OPTIONS (preflight)
console.log('1️⃣ Test OPTIONS (preflight)...\n');
const preflightOptions = {
  ...options,
  method: 'OPTIONS'
};

const preflightReq = https.request(preflightOptions, (res) => {
  console.log(`   Status: ${res.statusCode}`);
  console.log(`   Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin'] || '❌ NON DÉFINI'}`);
  console.log(`   Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods'] || '❌ NON DÉFINI'}`);
  console.log(`   Access-Control-Allow-Credentials: ${res.headers['access-control-allow-credentials'] || '❌ NON DÉFINI'}\n`);

  if (res.headers['access-control-allow-origin'] === ORIGIN || res.headers['access-control-allow-origin'] === '*') {
    console.log('✅ CORS configuré correctement pour OPTIONS\n');
  } else {
    console.log('❌ CORS non configuré pour cette origine\n');
  }

  // Test GET (requête réelle)
  console.log('2️⃣ Test GET (requête réelle)...\n');
  const getReq = https.request(options, (getRes) => {
    let data = '';

    getRes.on('data', (chunk) => {
      data += chunk;
    });

    getRes.on('end', () => {
      console.log(`   Status: ${getRes.statusCode}`);
      console.log(`   Access-Control-Allow-Origin: ${getRes.headers['access-control-allow-origin'] || '❌ NON DÉFINI'}`);
      
      if (getRes.statusCode === 200) {
        try {
          const response = JSON.parse(data);
          console.log(`   Articles trouvés: ${response.count || 0}\n`);
          
          if (getRes.headers['access-control-allow-origin'] === ORIGIN || getRes.headers['access-control-allow-origin'] === '*') {
            console.log('✅ CORS configuré correctement pour GET');
            console.log('✅ Votre frontend sur www.xcafrique.org peut accéder à l\'API\n');
          } else {
            console.log('❌ CORS non configuré pour cette origine');
            console.log('💡 Vérifiez que www.xcafrique.org est dans ALLOWED_ORIGINS sur Vercel\n');
          }
        } catch (e) {
          console.log('   Réponse:', data.substring(0, 200));
        }
      }
    });
  });

  getReq.on('error', (error) => {
    console.error('❌ Erreur GET:', error.message);
  });

  getReq.setHeader('Origin', ORIGIN);
  getReq.end();
});

preflightReq.on('error', (error) => {
  console.error('❌ Erreur OPTIONS:', error.message);
});

preflightReq.end();

