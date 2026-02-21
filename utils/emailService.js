const nodemailer = require('nodemailer');

/**
 * Service d'envoi d'emails pour XCAfrique
 * Utilise nodemailer pour envoyer des emails via SMTP
 */

// Configuration du transporteur email
let transporter = null;
let smtpWarningShown = false; // Pour éviter les warnings répétés

/**
 * Crée un nouveau transporteur email (sans cache sur Vercel)
 * @param {boolean} forceNew - Forcer la création d'un nouveau transporteur même si un existe
 */
function createTransporter(forceNew = false) {
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
  
  // Sur Vercel, toujours créer un nouveau transporteur (pas de cache)
  // En local, on peut réutiliser le transporteur
  if (!forceNew && !isVercel && transporter) {
    return transporter;
  }

  // Configuration SMTP depuis les variables d'environnement
  // Support pour différents services : Gmail, SendGrid, Mailgun, Hostinger, etc.
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  let smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const isHostinger = smtpHost.includes('hostinger');
  
  // Sur Vercel avec Hostinger, FORCER le port 465 (SSL) pour éviter les timeouts
  // Le port 587 (STARTTLS) a des problèmes de timeout récurrents sur Vercel
  if (isHostinger && isVercel) {
    if (smtpPort !== 465) {
      console.warn(`⚠️  Hostinger sur Vercel: Forçage du port 465 (SSL) au lieu de ${smtpPort} pour éviter les timeouts`);
      smtpPort = 465;
    }
  }
  
  // Configuration spécifique pour Hostinger et Vercel (timeouts très longs)
  // Sur Vercel, les connexions peuvent être plus lentes, donc on augmente les timeouts
  let connectionTimeout, greetingTimeout, socketTimeout;
  
  // Timeouts RÉDUITS pour éviter les blocages longs
  // Si la connexion ne fonctionne pas rapidement, mieux vaut échouer vite et réessayer
  if (isHostinger && isVercel) {
    // Hostinger sur Vercel : timeouts modérés (échouer vite si problème)
    connectionTimeout = 30000; // 30s (réduit de 90s)
    greetingTimeout = 30000; // 30s (réduit de 90s)
    socketTimeout = 60000; // 60s (réduit de 180s)
  } else if (isHostinger) {
    // Hostinger local : timeouts moyens
    connectionTimeout = 20000; // 20s
    greetingTimeout = 20000; // 20s
    socketTimeout = 45000; // 45s
  } else if (isVercel) {
    // Autres providers sur Vercel : timeouts moyens
    connectionTimeout = 20000; // 20s
    greetingTimeout = 20000; // 20s
    socketTimeout = 30000; // 30s
  } else {
    // Autres providers local : timeouts courts
    connectionTimeout = 15000; // 15s
    greetingTimeout = 15000; // 15s
    socketTimeout = 25000; // 25s
  }
  
  // Déterminer si on utilise SSL (secure) ou STARTTLS
  // Port 465 = SSL direct (secure: true)
  // Port 587 = STARTTLS (secure: false)
  // Sur Vercel avec Hostinger, FORCER SSL pour le port 465
  let useSecure = process.env.SMTP_SECURE === 'true';
  if (isHostinger && isVercel) {
    // Sur Vercel avec Hostinger, forcer SSL pour éviter les problèmes STARTTLS
    if (smtpPort === 465) {
      useSecure = true; // Forcer SSL pour le port 465
    } else {
      // Si on est sur un autre port, avertir et forcer SSL
      console.warn(`⚠️  Hostinger sur Vercel: Recommandation d'utiliser le port 465 avec SSL pour éviter les timeouts`);
      useSecure = smtpPort === 465; // SSL uniquement si port 465
    }
  } else if (process.env.SMTP_SECURE === undefined) {
    // Si non spécifié, déterminer automatiquement selon le port
    useSecure = smtpPort === 465;
  }
  
  // Configuration SMTP simplifiée et optimisée pour éviter les timeouts
  const smtpConfig = {
    host: smtpHost,
    port: smtpPort,
    secure: useSecure, // true pour 465 (SSL), false pour 587 (STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    // Timeouts optimisés
    connectionTimeout: connectionTimeout,
    greetingTimeout: greetingTimeout,
    socketTimeout: socketTimeout,
    // DÉSACTIVER le pool sur Vercel (obligatoire pour serverless)
    pool: false, // TOUJOURS false pour éviter les problèmes de connexion persistante
    // Options critiques pour Vercel/Serverless
    disableFileAccess: true,
    disableUrlAccess: true,
    // Options TLS simplifiées pour Hostinger
    ...(isHostinger ? {
      tls: {
        rejectUnauthorized: false, // Accepter les certificats
        minVersion: 'TLSv1.2', // Version TLS minimale
        ...(useSecure ? {} : {
          // Pour STARTTLS (port 587), ne pas forcer requireTLS si ça cause des problèmes
          // requireTLS: false // Désactivé pour éviter les timeouts STARTTLS
        })
      }
    } : {
      // Pour les autres providers, configuration TLS standard
      tls: {
        rejectUnauthorized: false
      }
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
      console.log(`   ⚙️  Configuration Hostinger sur Vercel avec timeouts très longs (90s/180s)`);
      console.log(`   ⚙️  Port 465 (SSL) forcé pour éviter les timeouts STARTTLS`);
    } else if (isHostinger) {
      console.log(`   ⚙️  Configuration Hostinger avec timeouts augmentés (45s/120s)`);
    } else if (isVercel) {
      console.log(`   ⚙️  Configuration Vercel avec timeouts augmentés (30s/45s)`);
    }
    smtpWarningShown = true; // Marquer comme affiché pour éviter les répétitions
  }

  const newTransporter = nodemailer.createTransport(smtpConfig);
  
  // Sur Vercel, ne pas mettre en cache (créer un nouveau à chaque fois)
  // En local, mettre en cache pour réutilisation
  if (!isVercel) {
    transporter = newTransporter;
  }
  
  return newTransporter;
}

/**
 * Initialise le transporteur email (alias pour compatibilité)
 */
function initTransporter() {
  return createTransporter();
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
/**
 * Envoie un email de manière asynchrone et non-bloquante
 * Cette fonction peut être appelée sans await pour ne pas bloquer l'application
 */
async function sendEmail(options) {
  // Vérifier si l'envoi d'email est désactivé (variable d'environnement)
  if (process.env.DISABLE_EMAIL === 'true' || process.env.DISABLE_EMAIL === '1') {
    console.log('📧 Envoi d\'email désactivé (DISABLE_EMAIL=true)');
    return { success: false, message: 'Service email désactivé' };
  }

  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
  
  // Vérifier la configuration SMTP
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('❌ Email non envoyé : transporteur non configuré');
    console.error('   Vérifiez que SMTP_USER et SMTP_PASSWORD sont définis dans les variables d\'environnement');
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

    // Vérifier la taille de l'email (peut causer des timeouts si trop volumineux)
    const emailSize = Buffer.byteLength(JSON.stringify(mailOptions), 'utf8');
    const emailSizeKB = (emailSize / 1024).toFixed(2);
    if (emailSize > 1024 * 1024) { // Plus de 1MB
      console.warn(`⚠️  Email volumineux détecté (${emailSizeKB} KB). Cela peut causer des timeouts.`);
    }

    // Log de l'adresse "from" utilisée pour le diagnostic
    if (process.env.NODE_ENV === 'development') {
      console.log(`   From: ${fromAddress} (SMTP_USER: ${smtpUser})`);
      console.log(`   Taille email: ${emailSizeKB} KB`);
    }

    // Log avant l'envoi pour le diagnostic (toujours en production aussi pour le suivi)
    console.log(`📧 Tentative d'envoi d'email à ${options.to} (sujet: ${options.subject})...`);
    
    // Retry logic simplifié avec timeout plus court pour éviter les blocages
    const maxRetries = isVercel ? 2 : 1; // Réduire à 2 tentatives max sur Vercel
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      let currentTransporter = null;
      let timeoutId = null;
      try {
        // Créer un NOUVEAU transporteur pour chaque tentative
        currentTransporter = createTransporter(true);
        if (!currentTransporter) {
          throw new Error('Impossible de créer le transporteur SMTP');
        }
        
        if (attempt > 1) {
          const delay = Math.min(2000 * (attempt - 1), 5000); // Délai progressif max 5s
          if (process.env.NODE_ENV === 'development') {
            console.log(`   🔄 Nouvelle tentative (${attempt}/${maxRetries}) après ${delay}ms...`);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Timeout global RÉDUIT pour éviter les blocages longs
        // Hostinger peut être lent, mais pas plus de 60s par tentative
        const timeoutMs = isVercel ? 60000 : 45000; // 60s sur Vercel, 45s en local
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error(`Timeout global de ${timeoutMs}ms dépassé`));
          }, timeoutMs);
        });
        
        // Envoyer l'email avec timeout
        const sendPromise = currentTransporter.sendMail(mailOptions);
        const info = await Promise.race([sendPromise, timeoutPromise]);
        
        // Annuler le timeout si l'envoi réussit
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
    
        // Toujours logger les envois réussis (important pour le diagnostic)
        if (attempt > 1) {
          console.log(`✅ Email envoyé à ${options.to} après ${attempt} tentative(s):`, info.messageId);
        } else {
          console.log(`✅ Email envoyé à ${options.to}:`, info.messageId);
        }
        
        // Fermer la connexion immédiatement après l'envoi pour éviter les timeouts
        // Important surtout sur Vercel/serverless
        if (currentTransporter && typeof currentTransporter.close === 'function') {
          try {
            currentTransporter.close();
          } catch (closeError) {
            // Ignorer les erreurs de fermeture
            console.warn('   ⚠️  Erreur lors de la fermeture du transporteur (non bloquant):', closeError.message);
          }
        }
        
        return { success: true, messageId: info.messageId };
      } catch (error) {
        lastError = error;
        
        // Annuler le timeout si présent
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        // Fermer la connexion en cas d'erreur (CRITIQUE pour éviter les fuites)
        if (currentTransporter) {
          try {
            if (typeof currentTransporter.close === 'function') {
              currentTransporter.close();
            }
            // Forcer la destruction du transporteur
            currentTransporter = null;
          } catch (closeError) {
            // Ignorer les erreurs de fermeture
          }
        }
        
        // Détecter les erreurs de timeout
        const isTimeoutError = error.code === 'ETIMEDOUT' || 
                              error.code === 'ECONNRESET' || 
                              error.code === 'EENVELOPE' ||
                              error.message?.includes('Timeout global') ||
                              error.message?.includes('timeout') ||
                              (error.responseCode === 421);
        
        // Si c'est un timeout et qu'on a encore des tentatives, continuer
        if (isTimeoutError && attempt < maxRetries) {
          // Logger seulement en dev ou si c'est la dernière tentative
          if (process.env.NODE_ENV === 'development' || attempt === maxRetries - 1) {
            console.warn(`   ⚠️  Tentative ${attempt} échouée (${error.code || error.responseCode || error.message}), nouvelle tentative...`);
          }
          // Attendre un peu avant de réessayer
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        // Si c'est la dernière tentative ou erreur non-timeout, propager l'erreur
        if (attempt >= maxRetries || !isTimeoutError) {
          throw error;
        }
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
    } else if (error.code === 'EENVELOPE' || (error.responseCode === 421 && error.command === 'DATA')) {
      // Erreur spécifique DATA command timeout sur Hostinger
      errorMessage = 'Timeout lors de l\'envoi des données email. Le serveur SMTP a expiré pendant la transmission des données.';
      console.error('❌ Erreur envoi email (DATA timeout):', errorMessage);
      console.error('   Host:', process.env.SMTP_HOST);
      console.error('   Port:', process.env.SMTP_PORT);
      console.error('   Response:', error.response || error.message);
      console.error('   Response Code:', error.responseCode);
      console.error('   Command:', error.command);
      
      if (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('hostinger')) {
        console.error('   🔧 Solutions pour Hostinger:');
        console.error('      1. ✅ Utilisez le port 465 avec SSL direct (plus fiable):');
        console.error('         SMTP_PORT=465');
        console.error('         SMTP_SECURE=true');
        console.error('      2. 💡 Vérifiez la taille de l\'email (peut être trop volumineux)');
        console.error('      3. 💡 Les timeouts ont été augmentés à 120s sur Vercel (90s en local)');
        console.error('      4. 💡 Le système réessaiera automatiquement (2 tentatives sur Vercel)');
        console.error('      5. 💡 Vérifiez votre connexion réseau et la charge du serveur SMTP');
        console.error('      6. 💡 Si le problème persiste, contactez le support Hostinger');
      } else {
        console.error('   💡 Solutions générales:');
        console.error('      - Vérifiez la taille de l\'email (réduire si > 1MB)');
        console.error('      - Vérifiez votre connexion réseau');
        console.error('      - Le système réessaiera automatiquement');
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

/**
 * Envoie un email de notification lorsqu'un article est partagé
 * @param {Object} articleData - Données de l'article partagé
 * @param {string} platform - Plateforme de partage (facebook, twitter, linkedin, etc.)
 */
async function sendShareNotification(articleData, platform) {
  const platformNames = {
    facebook: 'Facebook',
    twitter: 'Twitter/X',
    linkedin: 'LinkedIn',
    whatsapp: 'WhatsApp',
    email: 'Email',
    copy: 'Lien copié',
    other: 'Autre plateforme'
  };

  const platformName = platformNames[platform] || platform || 'une plateforme';
  const articleUrl = process.env.FRONTEND_URL 
    ? `${process.env.FRONTEND_URL.split(',')[0]}/article/${articleData.slug}`
    : `https://xcafrique.org/article/${articleData.slug}`;

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
        .article-box { background-color: white; padding: 15px; border-left: 4px solid #1a1a1a; margin: 15px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #1a1a1a; color: white; text-decoration: none; border-radius: 4px; margin-top: 15px; }
        .stats { background-color: #e9ecef; padding: 10px; border-radius: 4px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📤 Article partagé</h1>
        </div>
        <div class="content">
          <p>Bonjour,</p>
          <p>Votre article <strong>"${articleData.title}"</strong> vient d'être partagé sur <strong>${platformName}</strong>.</p>
          
          <div class="article-box">
            <h3>${articleData.title}</h3>
            ${articleData.excerpt ? `<p>${articleData.excerpt.substring(0, 150)}...</p>` : ''}
            <a href="${articleUrl}" class="button">Voir l'article</a>
          </div>

          <div class="stats">
            <p><strong>Statistiques de l'article:</strong></p>
            <p>👁️ Vues: ${articleData.views || 0}</p>
            <p>📤 Partages: ${articleData.shareCount || 0}</p>
          </div>

          <p>Cordialement,<br>L'équipe XCAfrique</p>
        </div>
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
          <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          <p>© ${new Date().getFullYear()} XCAfrique - Tous droits réservés</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Envoyer à l'auteur de l'article ou à l'email de contact par défaut
  const recipientEmail = process.env.AUTHOR_EMAIL || process.env.CONTACT_EMAIL || 'contact@xcafrique.org';

  return await sendEmail({
    to: recipientEmail,
    from: process.env.CONTACT_EMAIL || 'contact@xcafrique.org',
    subject: `📤 Votre article "${articleData.title}" a été partagé sur ${platformName}`,
    html
  });
}


/**
 * Envoie un email de manière asynchrone et non-bloquante
 * Cette fonction ne bloque JAMAIS l'application, même en cas d'erreur
 * @param {Object} options - Options de l'email
 * @returns {Promise} Résultat de l'envoi (toujours résolu, jamais rejeté)
 */
async function sendEmailAsync(options) {
  // Exécuter l'envoi dans un contexte asynchrone qui ne bloque jamais
  return Promise.resolve().then(async () => {
    try {
      return await sendEmail(options);
    } catch (error) {
      // Logger l'erreur mais ne jamais la propager
      console.error('❌ Erreur lors de l\'envoi asynchrone d\'email (non-bloquant):', error.message);
      return { 
        success: false, 
        error: error.message,
        code: error.code 
      };
    }
  });
}

module.exports = {
  initTransporter,
  sendEmail,
  sendEmailAsync, // Nouvelle fonction non-bloquante
  sendContactConfirmation,
  sendContactNotification,
  sendShareNotification
};

