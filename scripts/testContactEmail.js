/**
 * Script de test pour vérifier l'envoi d'emails de contact
 * Usage: node scripts/testContactEmail.js
 */

require('dotenv').config();
const { sendContactConfirmation, sendContactNotification } = require('../utils/emailService');

async function testContactEmails() {
  console.log('🧪 Test d\'envoi d\'emails de contact...\n');
  
  // Vérifier la configuration
  console.log('📋 Configuration SMTP:');
  console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || 'non défini'}`);
  console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || 'non défini'}`);
  console.log(`   SMTP_USER: ${process.env.SMTP_USER || 'non défini'}`);
  console.log(`   SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? '***défini***' : 'non défini'}`);
  console.log(`   CONTACT_EMAIL: ${process.env.CONTACT_EMAIL || 'non défini (utilisera contact@xcafrique.org)'}`);
  console.log(`   DISABLE_EMAIL: ${process.env.DISABLE_EMAIL || 'non défini (activé)'}`);
  console.log('');
  
  // Données de test
  const testContact = {
    name: 'Test User',
    email: process.env.TEST_EMAIL || process.env.SMTP_USER || 'test@example.com',
    phone: '+33123456789',
    subject: 'Test de contact',
    message: 'Ceci est un message de test pour vérifier l\'envoi d\'emails de contact.'
  };
  
  // Test 1: Email de confirmation
  console.log('📧 Test 1: Email de confirmation de contact...');
  console.log(`   Destinataire: ${testContact.email}`);
  try {
    const result1 = await sendContactConfirmation(
      testContact.email,
      testContact.name,
      testContact.subject
    );
    
    if (result1.success) {
      console.log('✅ Email de confirmation envoyé avec succès!');
      console.log(`   Message ID: ${result1.messageId}`);
    } else {
      console.error('❌ Échec envoi email de confirmation:');
      console.error(`   Erreur: ${result1.error || result1.message}`);
      if (result1.code) {
        console.error(`   Code: ${result1.code}`);
      }
    }
  } catch (err) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de confirmation:');
    console.error(`   ${err.message}`);
    if (err.stack) {
      console.error(`   Stack: ${err.stack}`);
    }
  }
  
  console.log('');
  
  // Test 2: Email de notification
  const notificationEmail = process.env.CONTACT_EMAIL || 'contact@xcafrique.org';
  console.log('📧 Test 2: Email de notification de contact...');
  console.log(`   Destinataire: ${notificationEmail}`);
  try {
    const result2 = await sendContactNotification(testContact);
    
    if (result2.success) {
      console.log('✅ Email de notification envoyé avec succès!');
      console.log(`   Message ID: ${result2.messageId}`);
    } else {
      console.error('❌ Échec envoi email de notification:');
      console.error(`   Erreur: ${result2.error || result2.message}`);
      if (result2.code) {
        console.error(`   Code: ${result2.code}`);
      }
    }
  } catch (err) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de notification:');
    console.error(`   ${err.message}`);
    if (err.stack) {
      console.error(`   Stack: ${err.stack}`);
    }
  }
  
  console.log('');
  console.log('✅ Tests terminés. Vérifiez vos boîtes mail (et les spams).');
}

testContactEmails().catch(err => {
  console.error('❌ Erreur lors du test:', err);
  process.exit(1);
});

