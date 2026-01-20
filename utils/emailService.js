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
  // Support pour différents services : Gmail, SendGrid, Mailgun, Hostinger, etc.
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  let smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const isHostinger = smtpHost.includes('hostinger');
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
  
  // Sur Vercel avec Hostinger, utiliser le port 465 (SSL) par défaut si non spécifié
  // Le port 587 (STARTTLS) peut avoir des problèmes de timeout sur Vercel
  if (isHostinger && isVercel && !process.env.SMTP_PORT) {
    smtpPort = 465;
    console.log('⚠️  Hostinger sur Vercel détecté - Utilisation du port 465 (SSL) par défaut pour éviter les timeouts STARTTLS');
  }
  
  // Configuration spécifique pour Hostinger et Vercel (timeouts très longs)
  // Sur Vercel, les connexions peuvent être plus lentes, donc on augmente les timeouts
  let connectionTimeout, greetingTimeout, socketTimeout;
  
  if (isHostinger && isVercel) {
    // Hostinger sur Vercel : timeouts très longs
    connectionTimeout = 60000; // 60s
    greetingTimeout = 60000; // 60s
    socketTimeout = 90000; // 90s
  } else if (isHostinger) {
    // Hostinger local : timeouts moyens
    connectionTimeout = 30000; // 30s
    greetingTimeout = 30000; // 30s
    socketTimeout = 60000; // 60s
  } else if (isVercel) {
    // Autres providers sur Vercel : timeouts moyens
    connectionTimeout = 30000; // 30s
    greetingTimeout = 30000; // 30s
    socketTimeout = 45000; // 45s
  } else {
    // Autres providers local : timeouts courts
    connectionTimeout = 20000; // 20s
    greetingTimeout = 20000; // 20s
    socketTimeout = 30000; // 30s
  }
  
  // Déterminer si on utilise SSL (secure) ou STARTTLS
  // Port 465 = SSL direct (secure: true)
  // Port 587 = STARTTLS (secure: false)
  // Sur Vercel avec Hostinger, forcer SSL si port 465
  let useSecure = process.env.SMTP_SECURE === 'true';
  if (isHostinger && isVercel && smtpPort === 465) {
    useSecure = true; // Forcer SSL pour le port 465 sur Vercel
  } else if (isHostinger && isVercel && smtpPort === 587) {
    useSecure = false; // STARTTLS pour le port 587
  } else if (process.env.SMTP_SECURE === undefined) {
    // Si non spécifié, déterminer automatiquement selon le port
    useSecure = smtpPort === 465;
  }
  
  const smtpConfig = {
    host: smtpHost,
    port: smtpPort,
    secure: useSecure, // true pour 465 (SSL), false pour 587 (STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    // Options de connexion avec timeouts adaptés selon le provider et l'environnement
    connectionTimeout: connectionTimeout,
    greetingTimeout: greetingTimeout,
    socketTimeout: socketTimeout,
    // Options supplémentaires pour Vercel/Serverless
    // Sur Vercel, désactiver le pool car chaque fonction est isolée
    pool: !isVercel, // Pool uniquement en local, pas sur Vercel
    ...(isVercel ? {
      // Configuration pour Vercel (pas de pool)
      // Chaque requête crée sa propre connexion
    } : {
      // Configuration pour local (avec pool)
      maxConnections: 1, // Nombre max de connexions simultanées
      maxMessages: 3, // Nombre max de messages par connexion
      rateDelta: 1000, // Délai entre les messages (ms)
      rateLimit: 5, // Nombre max de messages par rateDelta
    }),
    // Options spécifiques pour Hostinger
    ...(isHostinger && {
      // Hostinger nécessite parfois des options supplémentaires
      // Sur Vercel avec port 465, ne pas forcer requireTLS (déjà en SSL)
      ...(useSecure ? {
        // Port 465 (SSL direct) - pas besoin de requireTLS
        tls: {
          rejectUnauthorized: false // Accepter les certificats auto-signés si nécessaire
        }
      } : {
        // Port 587 (STARTTLS)
        requireTLS: true, // Forcer TLS
        tls: {
          rejectUnauthorized: false, // Accepter les certificats auto-signés si nécessaire
          ciphers: 'SSLv3' // Forcer certains ciphers si nécessaire
        }
      })
    })
  };

  // Si pas de configuration SMTP, afficher le warning une seule fois
  if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
    if (!smtpWarningShown) {
      // Toujours afficher le warning pour diagnostiquer les problèmes
    console.warn('⚠️  Configuration SMTP manquante. Les emails ne seront pas envoyés.');
    console.warn('   Configurez SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD dans .env');
      console.warn(`   SMTP_HOST: ${process.env.SMTP_HOST || 'non défini'}`);
      console.warn(`   SMTP_PORT: ${process.env.SMTP_PORT || 'non défini'}`);
      console.warn(`   SMTP_USER: ${process.env.SMTP_USER || 'non défini'}`);
      console.warn(`   SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? '***défini***' : 'non défini'}`);
      smtpWarningShown = true;
    }
    return null;
  }
  
  // Afficher la configuration SMTP au démarrage (toujours, une seule fois)
  if (!smtpWarningShown) {
    console.log('📧 Configuration SMTP détectée:');
    console.log(`   Host: ${smtpConfig.host}`);
    console.log(`   Port: ${smtpConfig.port}`);
    console.log(`   User: ${smtpConfig.auth.user}`);
    console.log(`   Secure: ${smtpConfig.secure}`);
    if (isHostinger && isVercel) {
      console.log(`   ⚙️  Configuration Hostinger sur Vercel avec timeouts très longs (60s/90s)`);
    } else if (isHostinger) {
      console.log(`   ⚙️  Configuration Hostinger avec timeouts augmentés (30s/60s)`);
    } else if (isVercel) {
      console.log(`   ⚙️  Configuration Vercel avec timeouts augmentés (30s/45s)`);
    }
    smtpWarningShown = true; // Marquer comme affiché pour éviter les répétitions
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
 * @param {string} options.from - Expéditeur (optionnel, utilise CONTACT_EMAIL par défaut)
 * @returns {Promise} Résultat de l'envoi
 */
async function sendEmail(options) {
  const emailTransporter = initTransporter();
  
  if (!emailTransporter) {
    // Toujours logger pour diagnostiquer les problèmes
    console.error('❌ Email non envoyé : transporteur non configuré');
    console.error('   Vérifiez que SMTP_USER et SMTP_PASSWORD sont définis dans .env');
    console.error(`   SMTP_USER: ${process.env.SMTP_USER || 'non défini'}`);
    console.error(`   SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? 'défini' : 'non défini'}`);
    return { success: false, message: 'Service email non configuré' };
  }

  try {
    // L'adresse "from" doit correspondre à SMTP_USER ou être une adresse valide sur le même domaine
    // Hostinger exige que l'adresse "from" soit autorisée (généralement la même que SMTP_USER)
    const smtpUser = process.env.SMTP_USER || 'contact@xcafrique.org';
    
    // Utiliser l'adresse fournie, ou SMTP_USER, ou une adresse par défaut
    // Si l'adresse fournie est différente de SMTP_USER, utiliser SMTP_USER pour éviter les erreurs de livraison
    let fromAddress = options.from || smtpUser;
    
    // Si l'adresse "from" est différente du domaine de SMTP_USER, utiliser SMTP_USER
    const smtpDomain = smtpUser.split('@')[1];
    const fromDomain = fromAddress.split('@')[1];
    
    if (fromDomain !== smtpDomain) {
      console.warn(`⚠️  Adresse "from" (${fromAddress}) différente du domaine SMTP (${smtpDomain}). Utilisation de ${smtpUser} pour éviter les erreurs de livraison.`);
      fromAddress = smtpUser;
    }
    
    const mailOptions = {
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '') // Extraire le texte du HTML si pas fourni
    };

    // Log de l'adresse "from" utilisée pour le diagnostic
    if (process.env.NODE_ENV === 'development') {
      console.log(`   From: ${fromAddress} (SMTP_USER: ${smtpUser})`);
    }

    // Log avant l'envoi pour le diagnostic
    console.log(`📧 Tentative d'envoi d'email à ${options.to} (sujet: ${options.subject})...`);
    
    // Retry logic pour les timeouts (surtout sur Vercel)
    const maxRetries = process.env.VERCEL ? 2 : 1; // 2 tentatives sur Vercel, 1 en local
    let lastError = null;
    let currentTransporter = emailTransporter;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 2), 5000); // Délai exponentiel max 5s
          console.log(`   🔄 Nouvelle tentative (${attempt}/${maxRetries}) après ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Recréer le transporteur pour forcer une nouvelle connexion
          transporter = null;
          currentTransporter = initTransporter();
          if (!currentTransporter) {
            throw new Error('Impossible de recréer le transporteur SMTP');
          }
        }
        
        const info = await currentTransporter.sendMail(mailOptions);
    
        // Toujours logger les envois réussis pour le diagnostic
        if (attempt > 1) {
          console.log(`✅ Email envoyé à ${options.to} après ${attempt} tentative(s):`, info.messageId);
        } else {
          console.log(`✅ Email envoyé à ${options.to}:`, info.messageId);
        }
    return { success: true, messageId: info.messageId };
  } catch (error) {
        lastError = error;
        
        // Si c'est un timeout et qu'on a encore des tentatives, continuer
        if ((error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') && attempt < maxRetries) {
          console.warn(`   ⚠️  Tentative ${attempt} échouée (${error.code}), nouvelle tentative...`);
          continue;
        }
        
        // Sinon, propager l'erreur
        throw error;
      }
    }
    
    // Si on arrive ici, toutes les tentatives ont échoué
    throw lastError || new Error('Toutes les tentatives d\'envoi ont échoué');
  } catch (error) {
    // Gestion d'erreur améliorée pour les timeouts et autres erreurs SMTP
    let errorMessage = error.message;
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
      errorMessage = 'Timeout de connexion au serveur SMTP. Le serveur SMTP ne répond pas dans les délais.';
      console.error('❌ Erreur envoi email (timeout):', errorMessage);
      console.error('   Host:', process.env.SMTP_HOST);
      console.error('   Port:', process.env.SMTP_PORT);
      console.error('   Code:', error.code);
      
      // Suggestions spécifiques selon le provider
      if (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('hostinger')) {
        console.error('   💡 Hostinger détecté - Vérifications:');
        console.error('      - Port 587 avec SMTP_SECURE=false (TLS)');
        console.error('      - Port 465 avec SMTP_SECURE=true (SSL)');
        console.error('      - Vérifiez que votre compte email Hostinger est actif');
        console.error('      - Vérifiez les credentials SMTP dans votre panel Hostinger');
      }
    } else if (error.code === 'EAUTH') {
      const response = error.response || '';
      errorMessage = 'Erreur d\'authentification SMTP. Vérifiez SMTP_USER et SMTP_PASSWORD.';
      
      console.error('❌ Erreur envoi email (auth):', errorMessage);
      console.error('   Host:', process.env.SMTP_HOST);
      console.error('   User:', process.env.SMTP_USER);
      console.error('   Response:', response);
      
      if (response.includes('timeout')) {
        console.error('   ⚠️  Le timeout se produit pendant l\'authentification');
        console.error('   💡 Cela peut indiquer:');
        console.error('      - Un problème réseau avec le serveur SMTP');
        console.error('      - Des credentials incorrects');
        console.error('      - Le serveur SMTP est surchargé');
      }
      
      if (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('hostinger')) {
        console.error('   💡 Pour Hostinger:');
        console.error('      - Utilisez l\'adresse email complète comme SMTP_USER');
        console.error('      - Vérifiez le mot de passe dans votre panel Hostinger');
        console.error('      - Essayez le port 465 avec SMTP_SECURE=true');
      }
    } else if (error.code === 'ETLS' || (error.responseCode === 421 && error.command === 'STARTTLS')) {
      // Erreur spécifique STARTTLS sur Hostinger
      errorMessage = 'Erreur lors de l\'upgrade STARTTLS. Le serveur SMTP a expiré pendant la négociation TLS.';
      console.error('❌ Erreur envoi email (STARTTLS timeout):', errorMessage);
      console.error('   Host:', process.env.SMTP_HOST);
      console.error('   Port:', process.env.SMTP_PORT);
      console.error('   Response:', error.response || error.message);
      
      if (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('hostinger')) {
        console.error('   🔧 Solution pour Hostinger sur Vercel:');
        console.error('      ⚠️  Le port 587 (STARTTLS) peut avoir des problèmes de timeout sur Vercel');
        console.error('      ✅ Utilisez le port 465 avec SSL direct:');
        console.error('         SMTP_PORT=465');
        console.error('         SMTP_SECURE=true');
        console.error('      💡 Le port 465 évite les problèmes de STARTTLS et est plus fiable sur Vercel');
      }
    } else {
    console.error('❌ Erreur envoi email:', error);
      if (error.response) {
        console.error('   Response:', error.response);
      }
      if (error.responseCode) {
        console.error('   Response Code:', error.responseCode);
      }
    }
    
    return { success: false, error: errorMessage, code: error.code };
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


module.exports = {
  initTransporter,
  sendEmail,
  sendContactConfirmation,
  sendContactNotification
};

