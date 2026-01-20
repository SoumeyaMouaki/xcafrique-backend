const https = require('https');

const ORIGIN = 'https://www.xcafrique.org';

console.log('🔍 Test des endpoints articles avec catégories\n');

// Test 1: Liste des articles avec populate category
console.log('1️⃣ Test GET /api/articles (liste avec catégories)\n');
testEndpoint('/api/articles?page=1&limit=6', 'Liste des articles');

// Test 2: Article spécifique avec populate category
console.log('\n2️⃣ Test GET /api/articles/:slug (article avec catégorie)\n');
const slug = 'brussels-airlines-valorise-la-richesse-culinaire-africaine-a-bord-de-ses-vols-long-courriers-vers-bruxelles-des-2026';
testEndpoint(`/api/articles/${slug}`, 'Article spécifique');

// Test 3: Articles filtrés par catégorie
console.log('\n3️⃣ Test GET /api/articles?category=passagers-service\n');
testEndpoint('/api/articles?category=passagers-service&page=1&limit=6', 'Articles par catégorie');

function testEndpoint(path, description) {
  const options = {
    hostname: 'xcafrique-backend.vercel.app',
    path: path,
    method: 'GET',
    headers: {
      'Origin': ORIGIN,
      'Accept': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';

    console.log(`   📡 ${description}`);
    console.log(`   Status: ${res.statusCode}`);
    console.log(`   CORS: ${res.headers['access-control-allow-origin'] || '❌'}`);

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (res.statusCode === 200 && response.success) {
          console.log(`   ✅ Succès`);
          
          if (response.data) {
            if (Array.isArray(response.data)) {
              console.log(`   📄 Articles: ${response.data.length}`);
              if (response.data.length > 0 && response.data[0].category) {
                console.log(`   📂 Catégorie du premier article: ${response.data[0].category.name || 'N/A'}`);
              }
            } else {
              console.log(`   📄 Article: ${response.data.title || 'N/A'}`);
              if (response.data.category) {
                console.log(`   📂 Catégorie: ${response.data.category.name || 'N/A'}`);
              }
            }
          }
        } else {
          console.log(`   ❌ Erreur: ${response.message || 'Inconnue'}`);
          if (response.message && response.message.includes('base de données')) {
            console.log(`   ⚠️  Problème MongoDB détecté`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Erreur parsing: ${error.message}`);
        console.log(`   Réponse: ${data.substring(0, 200)}`);
      }
    });
  });

  req.on('error', (error) => {
    console.log(`   ❌ Erreur connexion: ${error.message}`);
  });

  req.end();
}

