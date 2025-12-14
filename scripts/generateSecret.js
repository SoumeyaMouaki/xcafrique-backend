/**
 * Script pour générer un secret JWT sécurisé
 * Usage: node scripts/generateSecret.js
 */

const crypto = require('crypto');

// Générer un secret aléatoire de 64 caractères
const secret = crypto.randomBytes(32).toString('hex');

console.log('\n🔐 Secret JWT généré:');
console.log(secret);
console.log('\n📝 Copiez cette valeur dans votre fichier .env comme JWT_SECRET\n');

