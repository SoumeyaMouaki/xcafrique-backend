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
    
    // 3. Répondre IMMÉDIATEMENT au client
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

    // 4. Envoyer les emails EN ARRIÈRE-PLAN (ne pas bloquer la réponse)
    // Utiliser un setTimeout pour s'assurer que la réponse est partie
    console.log(`📧 Planification envoi emails en arrière-plan pour ${contact.email}...`);
    setTimeout(async () => {
      console.log(`📧 [BACKGROUND] Début traitement emails pour ${contact.email}`);
      
      try {
        // Email de confirmation à l'utilisateur
        console.log(`📧 [BACKGROUND] Envoi email confirmation à ${contact.email}...`);
        const confirmationStart = Date.now();
        const confirmationResult = await sendContactConfirmation(
          contact.email,
          contact.name,
          contact.subject
        );
        const confirmationDuration = Date.now() - confirmationStart;
        
        if (confirmationResult && confirmationResult.success) {
          console.log(`✅ [BACKGROUND] Email confirmation envoyé à ${contact.email} en ${confirmationDuration}ms`);
          if (confirmationResult.messageId) {
            console.log(`   Message ID: ${confirmationResult.messageId}`);
          }
        } else {
          const errorMsg = confirmationResult?.error || confirmationResult?.message || 'Erreur inconnue';
          console.error(`❌ [BACKGROUND] Échec email confirmation à ${contact.email} (${confirmationDuration}ms):`, errorMsg);
          if (confirmationResult?.code) {
            console.error(`   Code erreur: ${confirmationResult.code}`);
          }
        }
      } catch (err) {
        console.error(`❌ [BACKGROUND] Exception email confirmation (${contact.email}):`, err.message);
        if (err.code) {
          console.error(`   Code: ${err.code}`);
        }
        if (err.stack) {
          console.error(`   Stack: ${err.stack.substring(0, 500)}`);
        }
      }

      try {
        // Email de notification à l'équipe
        const contactEmail = process.env.CONTACT_EMAIL || 'contact@xcafrique.org';
        console.log(`📧 [BACKGROUND] Envoi email notification à ${contactEmail}...`);
        const notificationStart = Date.now();
        const notificationResult = await sendContactNotification({
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          subject: contact.subject,
          message: contact.message
        });
        const notificationDuration = Date.now() - notificationStart;
        
        if (notificationResult && notificationResult.success) {
          console.log(`✅ [BACKGROUND] Email notification envoyé à ${contactEmail} en ${notificationDuration}ms`);
          if (notificationResult.messageId) {
            console.log(`   Message ID: ${notificationResult.messageId}`);
          }
        } else {
          const errorMsg = notificationResult?.error || notificationResult?.message || 'Erreur inconnue';
          console.error(`❌ [BACKGROUND] Échec email notification à ${contactEmail} (${notificationDuration}ms):`, errorMsg);
          if (notificationResult?.code) {
            console.error(`   Code erreur: ${notificationResult.code}`);
          }
        }
      } catch (err) {
        console.error(`❌ [BACKGROUND] Exception email notification:`, err.message);
        if (err.code) {
          console.error(`   Code: ${err.code}`);
        }
        if (err.stack) {
          console.error(`   Stack: ${err.stack.substring(0, 500)}`);
        }
      }
      
      console.log(`📧 [BACKGROUND] Fin traitement emails pour ${contact.email}`);
    }, 100); // Augmenter légèrement pour s'assurer que la réponse est partie

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
