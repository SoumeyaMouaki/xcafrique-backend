/**
 * Script de test pour vérifier l'envoi d'emails
 * Usage: node scripts/testEmail.js <email>
 */

require('dotenv').config();
const { sendEmail } = require('../utils/emailService');

async function testEmail() {
  const testEmail = process.argv[2];
  
  if (!testEmail) {
    console.error('❌ Usage: node scripts/testEmail.js <email>');
    process.exit(1);
  }
  
  console.log('🧪 Test d\'envoi d\'email...');
  console.log(`   Destinataire: ${testEmail}`);
  console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || 'non défini'}`);
  console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || 'non défini'}`);
  console.log(`   SMTP_USER: ${process.env.SMTP_USER || 'non défini'}`);
  console.log(`   SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? '***défini***' : 'non défini'}`);
  console.log('');
  
  // Test 1: Email simple
  console.log('📧 Test 1: Envoi d\'un email simple...');
  const result1 = await sendEmail({
    to: testEmail,
    subject: 'Test email XCAfrique',
    html: '<h1>Test d\'envoi d\'email</h1><p>Si vous recevez cet email, la configuration SMTP fonctionne !</p>',
    text: 'Test d\'envoi d\'email - Si vous recevez cet email, la configuration SMTP fonctionne !'
  });
  
  if (result1.success) {
    console.log('✅ Email simple envoyé avec succès!');
    console.log(`   Message ID: ${result1.messageId}`);
  } else {
    console.error('❌ Échec envoi email simple:');
    console.error(`   Erreur: ${result1.error || result1.message}`);
    if (result1.code) {
      console.error(`   Code: ${result1.code}`);
    }
  }
  
  console.log('');
  console.log('✅ Tests terminés. Vérifiez votre boîte mail (et les spams).');
}

testEmail().catch(err => {
  console.error('❌ Erreur lors du test:', err);
  process.exit(1);
});

