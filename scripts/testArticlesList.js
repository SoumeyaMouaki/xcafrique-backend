const https = require('https');

const API_URL = 'https://xcafrique-backend.vercel.app/api/articles?page=1&limit=6';
const ORIGIN = 'https://www.xcafrique.org';

console.log('🔍 Test de la requête articles depuis www.xcafrique.org\n');
console.log(`📡 URL: ${API_URL}`);
console.log(`🌐 Origin: ${ORIGIN}\n`);

const options = {
  hostname: 'xcafrique-backend.vercel.app',
  path: '/api/articles?page=1&limit=6',
  method: 'GET',
  headers: {
    'Origin': ORIGIN,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'fr,fr-FR;q=0.9,en;q=0.8',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  console.log(`📊 Status Code: ${res.statusCode}`);
  console.log(`📋 Headers CORS:`);
  console.log(`   Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin'] || '❌ NON DÉFINI'}`);
  console.log(`   Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods'] || 'NON DÉFINI'}`);
  console.log(`   Access-Control-Allow-Credentials: ${res.headers['access-control-allow-credentials'] || 'NON DÉFINI'}`);
  console.log(`   Content-Type: ${res.headers['content-type'] || 'NON DÉFINI'}\n`);

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.success) {
        console.log('✅ Requête réussie !\n');
        console.log(`📄 Articles trouvés: ${response.count || 0}`);
        console.log(`📊 Total: ${response.total || 0}`);
        console.log(`📑 Page: ${response.page || 1} sur ${response.pages || 1}\n`);
        
        if (response.data && response.data.length > 0) {
          console.log('📝 Liste des articles:');
          response.data.forEach((article, index) => {
            console.log(`\n   ${index + 1}. ${article.title}`);
            console.log(`      Slug: ${article.slug}`);
            console.log(`      Catégorie: ${article.category?.name || 'N/A'}`);
            console.log(`      Sources: ${article.sources?.length || 0}`);
            console.log(`      Tags: ${article.tags?.length || 0}`);
          });
        }
        
        if (res.headers['access-control-allow-origin'] === ORIGIN) {
          console.log('\n✅ CORS configuré correctement');
          console.log('✅ Votre frontend peut récupérer les articles\n');
        } else {
          console.log('\n⚠️  CORS pourrait être un problème');
          console.log(`   Origin attendu: ${ORIGIN}`);
          console.log(`   Origin reçu: ${res.headers['access-control-allow-origin']}\n`);
        }
      } else {
        console.log('❌ Erreur API:');
        console.log(JSON.stringify(response, null, 2));
      }
    } catch (error) {
      console.error('❌ Erreur lors du parsing:', error.message);
      console.log('\n📄 Réponse brute (premiers 500 caractères):');
      console.log(data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erreur de connexion:', error.message);
});

req.end();

