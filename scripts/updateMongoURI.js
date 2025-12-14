require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Script interactif pour mettre à jour l'URI MongoDB dans .env
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function updateMongoURI() {
  try {
    console.log('🔧 Mise à jour de l\'URI MongoDB\n');
    
    const envPath = path.join(__dirname, '..', '.env');
    
    // Lire le fichier .env actuel
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    } else {
      console.log('❌ Fichier .env non trouvé. Créez-le d\'abord avec: cp env.example .env');
      process.exit(1);
    }

    // Afficher l'URI actuelle
    const currentMatch = envContent.match(/MONGODB_URI=(.+)/);
    if (currentMatch) {
      const currentURI = currentMatch[1];
      const maskedURI = currentURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
      console.log(`URI actuelle: ${maskedURI}\n`);
    }

    // Demander la nouvelle URI
    console.log('📝 Entrez votre URI MongoDB Atlas');
    console.log('   Format: mongodb+srv://username:password@cluster-name.xxxxx.mongodb.net/xcafrique');
    console.log('   (Vous pouvez la copier depuis MongoDB Atlas → Connect → Connect your application)\n');
    
    const newURI = await question('Nouvelle URI MongoDB: ');

    if (!newURI.trim()) {
      console.log('❌ URI vide, annulation');
      process.exit(1);
    }

    // Vérifier le format
    if (!newURI.includes('mongodb+srv://') && !newURI.includes('mongodb://')) {
      console.log('⚠️  Attention: L\'URI ne semble pas être au format MongoDB');
      const confirm = await question('Continuer quand même ? (o/n): ');
      if (confirm.toLowerCase() !== 'o' && confirm.toLowerCase() !== 'oui') {
        console.log('Annulation');
        process.exit(0);
      }
    }

    // Vérifier que le nom de la base de données est présent
    if (!newURI.match(/\/[^\/\?]+(\?|$)/)) {
      console.log('⚠️  Attention: Le nom de la base de données n\'est pas spécifié dans l\'URI');
      const dbName = await question('Nom de la base de données (défaut: xcafrique): ');
      const finalURI = newURI.trim() + '/' + (dbName.trim() || 'xcafrique');
      console.log(`✅ URI finale: ${finalURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
      
      // Mettre à jour
      const updatedContent = envContent.replace(
        /MONGODB_URI=.*/,
        `MONGODB_URI=${finalURI.trim()}`
      );
      fs.writeFileSync(envPath, updatedContent);
      console.log('\n✅ URI mise à jour dans .env');
    } else {
      // Mettre à jour
      const updatedContent = envContent.replace(
        /MONGODB_URI=.*/,
        `MONGODB_URI=${newURI.trim()}`
      );
      fs.writeFileSync(envPath, updatedContent);
      console.log('\n✅ URI mise à jour dans .env');
    }

    // Proposer de tester la connexion
    console.log('\n🧪 Voulez-vous tester la connexion maintenant ?');
    const test = await question('(o/n): ');
    
    if (test.toLowerCase() === 'o' || test.toLowerCase() === 'oui') {
      console.log('\n⏳ Test de connexion...\n');
      rl.close();
      
      // Exécuter le test
      require('./testMongoConnection.js');
    } else {
      rl.close();
      console.log('\n💡 Pour tester la connexion plus tard, exécutez:');
      console.log('   node scripts/testMongoConnection.js');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    rl.close();
    process.exit(1);
  }
}

updateMongoURI();

