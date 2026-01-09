const nodemailer = require('nodemailer');

/**
 * Service d'envoi d'emails pour XCAfrique
 * Utilise nodemailer pour envoyer des emails via SMTP
 */

// Configuration du transporteur email
let transporter = null;
let smtpWarningShown = false; // Pour éviter les warnings répétés

/**
 * Initialise le transporteur email
 */
function initTransporter() {
  if (transporter) {
    return transporter;
  }

  // Configuration SMTP depuis les variables d'environnement
  // Support pour différents services : Gmail, SendGrid, Mailgun, etc.
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true pour 465, false pour autres ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  };

  // Si pas de configuration SMTP, afficher le warning une seule fois
  if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
    if (!smtpWarningShown) {
      // Afficher le warning seulement en développement ou une seule fois
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️  Configuration SMTP manquante. Les emails ne seront pas envoyés.');
        console.warn('   Configurez SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD dans .env');
      }
      smtpWarningShown = true;
    }
    return null;
  }

  transporter = nodemailer.createTransport(smtpConfig);
  return transporter;
}

/**
 * Envoie un email
 * @param {Object} options - Options de l'email
 * @param {string} options.to - Destinataire
 * @param {string} options.subject - Sujet
 * @param {string} options.html - Corps HTML
 * @param {string} options.text - Corps texte (optionnel)
 * @param {string} options.from - Expéditeur (optionnel, utilise CONTACT_EMAIL ou NEWSLETTER_EMAIL par défaut)
 * @returns {Promise} Résultat de l'envoi
 */
async function sendEmail(options) {
  const emailTransporter = initTransporter();
  
  if (!emailTransporter) {
    // Ne pas logger en production si SMTP n'est pas configuré (c'est normal si non utilisé)
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️  Email non envoyé : transporteur non configuré');
    }
    return { success: false, message: 'Service email non configuré' };
  }

  try {
    const mailOptions = {
      from: options.from || process.env.CONTACT_EMAIL || 'contact@xcafrique.org',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '') // Extraire le texte du HTML si pas fourni
    };

    const info = await emailTransporter.sendMail(mailOptions);
    
    console.log('✅ Email envoyé:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envoie un email de confirmation de contact
 * @param {string} to - Email du destinataire
 * @param {string} name - Nom du destinataire
 * @param {string} subject - Sujet du message
 */
async function sendContactConfirmation(to, name, subject) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>XCAfrique</h1>
          <p>Le Cross-check de l'info aérienne</p>
        </div>
        <div class="content">
          <h2>Message reçu</h2>
          <p>Bonjour ${name},</p>
          <p>Nous avons bien reçu votre message concernant : <strong>${subject}</strong></p>
          <p>Notre équipe vous répondra dans les plus brefs délais.</p>
          <p>Cordialement,<br>L'équipe XCAfrique</p>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          <p>© ${new Date().getFullYear()} XCAfrique - Tous droits réservés</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to,
    from: process.env.CONTACT_EMAIL || 'contact@xcafrique.org',
    subject: 'Confirmation de réception - XCAfrique',
    html
  });
}

/**
 * Envoie un email de notification de contact à l'équipe
 * @param {Object} contactData - Données du contact
 */
async function sendContactNotification(contactData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .message-box { background-color: white; padding: 15px; border-left: 4px solid #1a1a1a; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nouveau message de contact</h1>
        </div>
        <div class="content">
          <p><strong>Nom:</strong> ${contactData.name}</p>
          <p><strong>Email:</strong> ${contactData.email}</p>
          ${contactData.phone ? `<p><strong>Téléphone:</strong> ${contactData.phone}</p>` : ''}
          <p><strong>Sujet:</strong> ${contactData.subject}</p>
          <div class="message-box">
            <p><strong>Message:</strong></p>
            <p>${contactData.message.replace(/\n/g, '<br>')}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: process.env.CONTACT_EMAIL || 'contact@xcafrique.org',
    from: process.env.CONTACT_EMAIL || 'contact@xcafrique.org',
    subject: `Nouveau message de contact: ${contactData.subject}`,
    html
  });
}

/**
 * Envoie un email de confirmation d'abonnement newsletter avec lien de confirmation
 * @param {string} to - Email du destinataire
 * @param {string} confirmationUrl - URL de confirmation avec le token
 * @param {string} name - Nom du destinataire (optionnel)
 */
async function sendNewsletterConfirmation(to, confirmationUrl, name = '') {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #FF6B35; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .button:hover { background-color: #e55a2b; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .link-text { word-break: break-all; color: #666; font-size: 12px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>XCAfrique</h1>
          <p>Le Cross-check de l'info aérienne</p>
        </div>
        <div class="content">
          <h2>Bienvenue sur XCAfrique !</h2>
          <p>Bonjour ${name || 'cher abonné'},</p>
          <p>Merci de vous être abonné à la newsletter XCAfrique. Pour recevoir nos actualités aéronautiques africaines, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :</p>
          
          <div style="text-align: center;">
            <a href="${confirmationUrl}" class="button">Confirmer mon email</a>
          </div>
          
          <p>Ou copiez-collez ce lien dans votre navigateur :</p>
          <p class="link-text">${confirmationUrl}</p>
          
          <p><strong>Ce lien expire dans 48 heures.</strong></p>
          
          <p>Si vous n'avez pas demandé cet abonnement, vous pouvez ignorer cet email.</p>
          
          <p>Cordialement,<br>L'équipe XCAfrique</p>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          <p>Email : news@xcafrique.org</p>
          <p>© ${new Date().getFullYear()} XCAfrique - Tous droits réservés</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Bienvenue sur XCAfrique !

Bonjour ${name || 'cher abonné'},

Merci de vous être abonné à la newsletter XCAfrique. Pour recevoir nos actualités aéronautiques africaines, veuillez confirmer votre adresse email en cliquant sur le lien ci-dessous :

${confirmationUrl}

Ce lien expire dans 48 heures.

Si vous n'avez pas demandé cet abonnement, vous pouvez ignorer cet email.

Cordialement,
L'équipe XCAfrique

Email : news@xcafrique.org
  `;

  return await sendEmail({
    to,
    from: process.env.NEWSLETTER_EMAIL || 'news@xcafrique.org',
    subject: 'Confirmez votre abonnement à la newsletter XCAfrique',
    html,
    text
  });
}

/**
 * Envoie une notification d'abonnement newsletter à l'équipe
 * @param {Object} subscriberData - Données de l'abonné
 */
async function sendNewsletterNotification(subscriberData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nouvel abonné à la newsletter</h1>
        </div>
        <div class="content">
          <p><strong>Email:</strong> ${subscriberData.email}</p>
          ${subscriberData.name ? `<p><strong>Nom:</strong> ${subscriberData.name}</p>` : ''}
          <p><strong>Source:</strong> ${subscriberData.source || 'website'}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: process.env.NEWSLETTER_EMAIL || 'news@xcafrique.org',
    from: process.env.NEWSLETTER_EMAIL || 'news@xcafrique.org',
    subject: 'Nouvel abonné à la newsletter XCAfrique',
    html
  });
}

module.exports = {
  sendEmail,
  sendContactConfirmation,
  sendContactNotification,
  sendNewsletterConfirmation,
  sendNewsletterNotification
};

