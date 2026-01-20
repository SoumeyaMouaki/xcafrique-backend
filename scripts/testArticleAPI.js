require('dotenv').config();
const https = require('https');

const SLUG = 'brussels-airlines-valorise-la-richesse-culinaire-africaine-a-bord-de-ses-vols-long-courriers-vers-bruxelles-des-2026';
const API_URL = `https://xcafrique-backend.vercel.app/api/articles/${SLUG}`;

console.log('🔍 Test de l\'API Article\n');
console.log(`📡 URL: ${API_URL}\n`);

https.get(API_URL, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`📊 Status Code: ${res.statusCode}`);
    console.log(`📋 Headers CORS:`);
    console.log(`   Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin'] || 'NON DÉFINI'}`);
    console.log(`   Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods'] || 'NON DÉFINI'}`);
    console.log(`   Content-Type: ${res.headers['content-type'] || 'NON DÉFINI'}\n`);

    try {
      const response = JSON.parse(data);
      
      if (response.success && response.data) {
        const article = response.data;
        console.log('✅ Article trouvé !\n');
        console.log(`📄 Titre: ${article.title}`);
        console.log(`🔗 Slug: ${article.slug}`);
        console.log(`📚 Sources: ${article.sources?.length || 0}`);
        
        if (article.sources && article.sources.length > 0) {
          console.log('\n📚 Sources présentes:');
          article.sources.forEach((s, i) => {
            console.log(`   ${i + 1}. ${s.title || 'Sans titre'}`);
          });
        } else {
          console.log('\n⚠️  Aucune source trouvée');
        }
      } else {
        console.log('❌ Erreur API:');
        console.log(JSON.stringify(response, null, 2));
      }
    } catch (error) {
      console.error('❌ Erreur lors du parsing:', error.message);
      console.log('\n📄 Réponse brute:');
      console.log(data.substring(0, 500));
    }
  });

}).on('error', (error) => {
  console.error('❌ Erreur de connexion:', error.message);
});

