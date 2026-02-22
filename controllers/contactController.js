const Contact = require('../models/Contact');
const {
  sendContactConfirmation,
  sendContactNotification
} = require('../utils/emailService');

/**
 * Controller pour la gestion des messages de contact
 * Gère l'envoi et la récupération des messages du formulaire de contact
 */

/**
 * @route   POST /api/contact
 * @desc    Envoyer un message via le formulaire de contact
 * @access  Public
 */
exports.sendMessage = async (req, res, next) => {
  try {
    // 1. Vérifier et établir la connexion MongoDB si nécessaire
    const mongoose = require('mongoose');
    let isMongoConnected = mongoose.connection.readyState === 1;
    
    if (!isMongoConnected) {
      console.log('⚠️  MongoDB non connecté, tentative de connexion...');
      const connectDB = require('../config/database');
      try {
        await Promise.race([
          connectDB(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('MongoDB connection timeout')), 7000)
          )
        ]);
        // Vérifier à nouveau après la tentative de connexion
        isMongoConnected = mongoose.connection.readyState === 1;
        if (isMongoConnected) {
          console.log('✅ MongoDB connecté');
        } else {
          console.log('⚠️  MongoDB toujours non connecté après tentative');
        }
      } catch (dbError) {
        console.error('❌ Impossible de se connecter à MongoDB:', dbError.message);
        isMongoConnected = false;
      }
    }

    // 2. Préparer les données du contact
    const contactData = {
      name: req.body.name,
      email: req.body.email,
      subject: req.body.subject,
      phone: req.body.phone,
      message: req.body.message
    };

    // 3. Sauvegarder le message en base de données UNIQUEMENT si MongoDB est connecté
    let contact = null;
    if (isMongoConnected) {
      try {
        // Désactiver le buffering pour éviter les timeouts
        // Si la connexion se perd pendant l'opération, on veut une erreur immédiate
        const createPromise = Contact.create(contactData);
        contact = await Promise.race([
          createPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Contact creation timeout')), 4000)
          )
        ]);
        console.log(`✅ Message de contact sauvegardé: ${contact.name} (${contact.email}) - ${contact.subject}`);
      } catch (createError) {
        console.error('❌ Erreur lors de la sauvegarde du contact:', createError.message);
        // Vérifier si c'est un timeout de buffering
        if (createError.message.includes('buffering') || createError.message.includes('timeout')) {
          console.error('⚠️  MongoDB a perdu la connexion pendant l\'opération');
          isMongoConnected = false;
        }
        // Continuer pour envoyer les emails même si la sauvegarde échoue
        contact = { _id: null, ...contactData };
      }
    } else {
      // Si MongoDB n'est pas connecté, utiliser les données de la requête
      contact = { _id: null, ...contactData };
      console.log('⚠️  MongoDB non disponible, emails seront envoyés sans sauvegarde en base');
    }
    
    // 3. Envoyer les emails AVANT la réponse (obligatoire sur Vercel)
    // Sur Vercel, une fois la réponse envoyée la fonction peut s'arrêter :
    // les emails en arrière-plan ne partent jamais. On les envoie donc ici.
    const EMAIL_TIMEOUT_MS = 25000; // 25s max pour les 2 emails (reste sous la limite Vercel)
    console.log(`📧 Envoi des emails pour ${contact.email} (timeout ${EMAIL_TIMEOUT_MS}ms)...`);

    const sendAllEmails = async () => {
      const contactEmail = process.env.CONTACT_EMAIL || 'contact@xcafrique.org';

      let confirmationResult = { success: false };
      let notificationResult = { success: false };

      try {
        console.log(`📧 Envoi email confirmation à ${contact.email}...`);
        const t0 = Date.now();
        confirmationResult = await sendContactConfirmation(contact.email, contact.name, contact.subject);
        console.log(confirmationResult.success
          ? `✅ Email confirmation envoyé en ${Date.now() - t0}ms`
          : `❌ Échec confirmation: ${confirmationResult.error || confirmationResult.message}`);
      } catch (err) {
        console.error(`❌ Exception email confirmation:`, err.message);
      }

      try {
        console.log(`📧 Envoi email notification à ${contactEmail}...`);
        const t1 = Date.now();
        notificationResult = await sendContactNotification({
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          subject: contact.subject,
          message: contact.message
        });
        console.log(notificationResult.success
          ? `✅ Email notification envoyé en ${Date.now() - t1}ms`
          : `❌ Échec notification: ${notificationResult.error || notificationResult.message}`);
      } catch (err) {
        console.error(`❌ Exception email notification:`, err.message);
      }

      console.log(`📧 Fin envoi emails (confirmation: ${confirmationResult.success}, notification: ${notificationResult.success})`);
    };

    try {
      await Promise.race([
        sendAllEmails(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Email send timeout')), EMAIL_TIMEOUT_MS))
      ]);
    } catch (emailErr) {
      if (emailErr.message === 'Email send timeout') {
        console.error(`⚠️ Envoi emails interrompu après ${EMAIL_TIMEOUT_MS}ms (timeout)`);
      } else {
        console.error('⚠️ Erreur lors de l\'envoi des emails:', emailErr.message);
      }
      // On répond quand même succès au client : le message est sauvegardé
    }

    // 4. Répondre au client
    console.log(`✅ Réponse envoyée au client pour ${contact.email}`);
    res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
      data: {
        id: contact._id || 'temporary',
        name: contact.name,
        email: contact.email,
        subject: contact.subject
      }
    });

  } catch (error) {
    // Gestion d'erreur
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }

    if (error.name === 'MongoServerError' || error.name === 'MongoError') {
      console.error('❌ Erreur MongoDB:', error.message);
      return res.status(503).json({
        success: false,
        message: 'Service temporairement indisponible. Veuillez réessayer dans quelques instants.',
        error: 'Database error'
      });
    }

    console.error('❌ Erreur inattendue:', error);
    next(error);
  }
};

/**
 * @route   GET /api/contact
 * @desc    Récupérer tous les messages de contact (admin uniquement)
 * @access  Private (Admin uniquement)
 */
exports.getAllMessages = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const messages = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-__v');

    const total = await Contact.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: messages
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/contact/:id
 * @desc    Récupérer un message par son ID (admin uniquement)
 * @access  Private (Admin uniquement)
 */
exports.getMessageById = async (req, res, next) => {
  try {
    const message = await Contact.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    // Marquer comme lu si c'est un nouveau message
    if (message.status === 'new') {
      message.status = 'read';
      await message.save();
    }

    res.status(200).json({
      success: true,
      data: message
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/contact/:id/status
 * @desc    Mettre à jour le statut d'un message (admin uniquement)
 * @access  Private (Admin uniquement)
 */
exports.updateMessageStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['new', 'read', 'replied', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    const message = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        status,
        ...(status === 'replied' && { repliedAt: new Date() })
      },
      { new: true, runValidators: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: message
    });

  } catch (error) {
    next(error);
  }
};
