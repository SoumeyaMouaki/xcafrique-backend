require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/database');
const User = require('../models/User');

/**
 * Script pour mettre à jour l'email et/ou le mot de passe de l'admin
 * 
 * Usage: node scripts/updateAdmin.js
 * 
 * Le script demandera interactivement :
 * - L'email actuel de l'admin
 * - Le nouveau email (optionnel)
 * - Le nouveau mot de passe (optionnel)
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function updateAdmin() {
  try {
    console.log('🔐 Mise à jour de l\'administrateur\n');

    // Connexion à MongoDB
    await connectDB();
    console.log('✅ Connecté à MongoDB\n');

    // Demander l'email actuel
    const currentEmail = await question('Email actuel de l\'admin: ');
    
    // Trouver l'admin
    const admin = await User.findOne({ email: currentEmail });
    
    if (!admin) {
      console.log(`\n❌ Aucun admin trouvé avec l'email: ${currentEmail}`);
      process.exit(1);
    }

    console.log(`\n✅ Admin trouvé: ${admin.username} (${admin.email})\n`);

    // Demander le nouveau email
    const newEmail = await question('Nouvel email (laissez vide pour ne pas changer): ');
    
    // Demander le nouveau mot de passe
    const newPassword = await question('Nouveau mot de passe (laissez vide pour ne pas changer): ');

    // Mettre à jour l'email si fourni
    if (newEmail.trim()) {
      // Vérifier si l'email existe déjà
      const existingUser = await User.findOne({ email: newEmail.trim() });
      if (existingUser && existingUser._id.toString() !== admin._id.toString()) {
        console.log('\n❌ Cet email est déjà utilisé par un autre utilisateur');
        process.exit(1);
      }
      admin.email = newEmail.trim();
      console.log('✅ Email mis à jour');
    }

    // Mettre à jour le mot de passe si fourni
    if (newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        console.log('\n❌ Le mot de passe doit contenir au moins 6 caractères');
        process.exit(1);
      }
      
      // Hasher le nouveau mot de passe
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(newPassword.trim(), salt);
      console.log('✅ Mot de passe mis à jour');
    }

    // Sauvegarder
    await admin.save();
    
    console.log('\n🎉 Admin mis à jour avec succès !');
    console.log(`   Email: ${admin.email}`);
    if (newPassword.trim()) {
      console.log(`   Mot de passe: ${newPassword.trim()}`);
    }
    
    rl.close();
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    rl.close();
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Exécuter le script
updateAdmin();

