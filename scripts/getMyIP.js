const https = require('https');

console.log('🔍 Récupération de votre adresse IP publique...\n');

https.get('https://api.ipify.org?format=json', (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log(`✅ Votre adresse IP publique: ${result.ip}\n`);
      console.log('📋 Pour ajouter cette IP à MongoDB Atlas:');
      console.log('   1. Allez sur https://cloud.mongodb.com/v2#/security/network/whitelist');
      console.log('   2. Cliquez sur "Add IP Address"');
      console.log(`   3. Entrez: ${result.ip}`);
      console.log('   4. Cliquez sur "Confirm"\n');
    } catch (error) {
      console.error('❌ Erreur:', error.message);
    }
  });

}).on('error', (error) => {
  console.error('❌ Erreur de connexion:', error.message);
  console.log('\n💡 Vous pouvez aussi trouver votre IP sur: https://www.whatismyip.com/');
});

