require('dotenv').config();
const https = require('https');

const ARTICLE_SLUG = 'brussels-airlines-valorise-la-richesse-culinaire-africaine-a-bord-de-ses-vols-long-courriers-vers-bruxelles-des-2026';
const API_URL = `https://xcafrique-backend.vercel.app/api/articles/${ARTICLE_SLUG}`;

console.log('🔍 Vérification de l\'article en production...\n');
console.log(`📡 URL: ${API_URL}\n`);

https.get(API_URL, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.success && response.data) {
        const article = response.data;
        
        console.log('✅ Article trouvé en production !\n');
        console.log('📄 Détails:');
        console.log(`   Titre: ${article.title}`);
        console.log(`   Slug: ${article.slug}`);
        console.log(`   Status: ${article.status}`);
        console.log(`   Auteur: ${article.author}`);
        console.log(`   Catégorie: ${article.category?.name || 'N/A'}`);
        
        console.log(`\n📝 Contenu (premiers 200 caractères):`);
        console.log(`   ${article.content.substring(0, 200)}...\n`);
        
        console.log(`📚 Sources (${article.sources?.length || 0}):`);
        if (article.sources && article.sources.length > 0) {
          article.sources.forEach((source, index) => {
            console.log(`\n   ${index + 1}. ${source.title || 'Sans titre'}`);
            if (source.url) console.log(`      URL: ${source.url}`);
            if (source.author) console.log(`      Auteur: ${source.author}`);
            if (source.date) console.log(`      Date: ${source.date}`);
            if (source.type) console.log(`      Type: ${source.type}`);
          });
        } else {
          console.log('   ❌ Aucune source trouvée dans la réponse API');
        }
        
        console.log(`\n🏷️  Tags: ${article.tags?.join(', ') || 'Aucun'}`);
        console.log(`\n📅 Modifié le: ${article.updatedAt ? new Date(article.updatedAt).toLocaleString('fr-FR') : 'N/A'}`);
        
        if (!article.sources || article.sources.length === 0) {
          console.log('\n⚠️  ATTENTION: Les sources ne sont pas présentes dans la réponse API');
          console.log('   Cela peut être dû à:');
          console.log('   1. Le cache Vercel (attendre quelques minutes)');
          console.log('   2. Les sources n\'ont pas été sauvegardées en production');
          console.log('   3. Le modèle Article ne retourne pas les sources');
        }
        
      } else {
        console.log('❌ Erreur:', response.message || 'Article non trouvé');
        console.log('\nRéponse complète:', JSON.stringify(response, null, 2));
      }
    } catch (error) {
      console.error('❌ Erreur lors du parsing:', error.message);
      console.log('\nRéponse brute:', data);
    }
  });

}).on('error', (error) => {
  console.error('❌ Erreur de connexion:', error.message);
  console.log('\n💡 Vérifications:');
  console.log('   1. L\'API est-elle déployée sur Vercel ?');
  console.log('   2. L\'URL est-elle correcte ?');
  console.log('   3. Y a-t-il des problèmes de réseau ?');
});

