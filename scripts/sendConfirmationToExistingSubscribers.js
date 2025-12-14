/**
 * Script pour envoyer un email de confirmation à tous les abonnés existants
 * 
 * Usage: node scripts/sendConfirmationToExistingSubscribers.js
 * 
 * Ce script :
 * 1. Récupère tous les abonnés existants (confirmés ou non)
 * 2. Génère un nouveau token de confirmation pour chacun
 * 3. Envoie un email de confirmation avec le lien
 * 
 * Options :
 * - --only-unconfirmed : Envoyer uniquement aux abonnés non confirmés
 * - --dry-run : Mode test (ne pas envoyer d'emails, juste afficher)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Newsletter = require('../models/Newsletter');
const { sendNewsletterConfirmation } = require('../utils/emailService');
const {
  generateConfirmationToken,
  generateTokenExpiration
} = require('../utils/tokenGenerator');
const connectDB = require('../config/database');

// Arguments de ligne de commande
const args = process.argv.slice(2);
const onlyUnconfirmed = args.includes('--only-unconfirmed');
const dryRun = args.includes('--dry-run');

async function sendConfirmationsToExistingSubscribers() {
  try {
    console.log('🔄 Connexion à la base de données...');
    await connectDB();

    // Construire le filtre
    const filter = {};
    if (onlyUnconfirmed) {
      filter.confirmed = false;
      console.log('📋 Mode : Uniquement les abonnés non confirmés');
    } else {
      console.log('📋 Mode : Tous les abonnés existants');
    }
    
    // Exclure les désabonnés
    filter.unsubscribedAt = null;

    // Récupérer tous les abonnés
    const subscribers = await Newsletter.find(filter);
    const total = subscribers.length;

    if (total === 0) {
      console.log('✅ Aucun abonné trouvé.');
      process.exit(0);
    }

    console.log(`\n📧 ${total} abonné(s) trouvé(s)`);
    
    if (dryRun) {
      console.log('🧪 MODE TEST - Aucun email ne sera envoyé\n');
    } else {
      console.log('📤 Envoi des emails de confirmation...\n');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Traiter chaque abonné
    for (let i = 0; i < subscribers.length; i++) {
      const subscriber = subscribers[i];
      const progress = `[${i + 1}/${total}]`;

      try {
        // Générer un nouveau token
        const confirmationToken = generateConfirmationToken();
        const tokenExpiresAt = generateTokenExpiration(48);

        // Mettre à jour l'abonné avec le nouveau token
        subscriber.confirmationToken = confirmationToken;
        subscriber.confirmationTokenExpiresAt = tokenExpiresAt;
        
        // Si l'abonné était déjà confirmé, le marquer comme non confirmé pour qu'il confirme à nouveau
        if (subscriber.confirmed) {
          subscriber.confirmed = false;
          subscriber.confirmedAt = null;
        }

        if (!dryRun) {
          await subscriber.save();
        }

        // Construire l'URL de confirmation
        const confirmationUrl = `${frontendUrl}/confirm-email?token=${confirmationToken}`;

        if (dryRun) {
          console.log(`${progress} ✅ ${subscriber.email} - Token généré (non envoyé)`);
          console.log(`   Lien: ${confirmationUrl}\n`);
        } else {
          // Envoyer l'email de confirmation
          const emailResult = await sendNewsletterConfirmation(
            subscriber.email,
            confirmationUrl,
            subscriber.name
          );

          if (emailResult.success) {
            console.log(`${progress} ✅ ${subscriber.email} - Email envoyé`);
            successCount++;
          } else {
            console.log(`${progress} ❌ ${subscriber.email} - Erreur: ${emailResult.error || emailResult.message}`);
            errorCount++;
            errors.push({ email: subscriber.email, error: emailResult.error || emailResult.message });
          }

          // Attendre un peu pour éviter de surcharger le serveur SMTP
          if (i < subscribers.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500)); // 500ms entre chaque email
          }
        }
      } catch (error) {
        console.error(`${progress} ❌ ${subscriber.email} - Erreur:`, error.message);
        errorCount++;
        errors.push({ email: subscriber.email, error: error.message });
      }
    }

    // Résumé
    console.log('\n' + '='.repeat(50));
    if (dryRun) {
      console.log(`🧪 MODE TEST TERMINÉ`);
      console.log(`📋 ${total} abonné(s) traité(s) (aucun email envoyé)`);
    } else {
      console.log(`✅ ${successCount} email(s) envoyé(s) avec succès`);
      if (errorCount > 0) {
        console.log(`❌ ${errorCount} erreur(s)`);
        console.log('\nDétails des erreurs:');
        errors.forEach(({ email, error }) => {
          console.log(`  - ${email}: ${error}`);
        });
      }
    }
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    // Fermer la connexion MongoDB
    await mongoose.connection.close();
    console.log('\n🔌 Connexion à la base de données fermée');
    process.exit(0);
  }
}

// Exécuter le script
console.log('🚀 Script d\'envoi de confirmation aux abonnés existants\n');
if (dryRun) {
  console.log('⚠️  MODE TEST ACTIVÉ - Aucun email ne sera envoyé\n');
}
sendConfirmationsToExistingSubscribers();

