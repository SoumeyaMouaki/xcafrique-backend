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
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️  MongoDB non connecté, tentative de connexion...');
      const connectDB = require('../config/database');
      try {
        await Promise.race([
          connectDB(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('MongoDB connection timeout')), 8000)
          )
        ]);
        console.log('✅ MongoDB connecté');
      } catch (dbError) {
        console.error('❌ Impossible de se connecter à MongoDB:', dbError.message);
        // Continuer quand même pour envoyer les emails (sans sauvegarder en base)
        // Mais informer l'utilisateur que le message sera traité
      }
    }

    // 2. Sauvegarder le message en base de données (si MongoDB est connecté)
    let contact = null;
    if (mongoose.connection.readyState === 1) {
      try {
        contact = await Promise.race([
          Contact.create(req.body),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Contact creation timeout')), 5000)
          )
        ]);
        console.log(`✅ Message de contact sauvegardé: ${contact.name} (${contact.email}) - ${contact.subject}`);
      } catch (createError) {
        console.error('❌ Erreur lors de la sauvegarde du contact:', createError.message);
        // Continuer pour envoyer les emails même si la sauvegarde échoue
        contact = {
          _id: null,
          name: req.body.name,
          email: req.body.email,
          subject: req.body.subject,
          phone: req.body.phone,
          message: req.body.message
        };
      }
    } else {
      // Si MongoDB n'est pas connecté, utiliser les données de la requête
      contact = {
        _id: null,
        name: req.body.name,
        email: req.body.email,
        subject: req.body.subject,
        phone: req.body.phone,
        message: req.body.message
      };
      console.log('⚠️  MongoDB non disponible, emails seront envoyés sans sauvegarde en base');
    }
    
    // 3. Répondre IMMÉDIATEMENT au client
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

    // 3. Envoyer les emails EN ARRIÈRE-PLAN (ne pas bloquer la réponse)
    // Utiliser un setTimeout(0) pour s'assurer que la réponse est partie
    setTimeout(async () => {
      try {
        // Email de confirmation à l'utilisateur
        console.log(`📧 Envoi email confirmation à ${contact.email}...`);
        const confirmationResult = await sendContactConfirmation(
          contact.email,
          contact.name,
          contact.subject
        );
        
        if (confirmationResult.success) {
          console.log(`✅ Email confirmation envoyé à ${contact.email}`);
        } else {
          console.error(`❌ Échec email confirmation à ${contact.email}:`, confirmationResult.error || confirmationResult.message);
        }
      } catch (err) {
        console.error(`❌ Erreur email confirmation (${contact.email}):`, err.message);
      }

      try {
        // Email de notification à l'équipe
        const contactEmail = process.env.CONTACT_EMAIL || 'contact@xcafrique.org';
        console.log(`📧 Envoi email notification à ${contactEmail}...`);
        const notificationResult = await sendContactNotification({
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          subject: contact.subject,
          message: contact.message
        });
        
        if (notificationResult.success) {
          console.log(`✅ Email notification envoyé à ${contactEmail}`);
        } else {
          console.error(`❌ Échec email notification à ${contactEmail}:`, notificationResult.error || notificationResult.message);
        }
      } catch (err) {
        console.error(`❌ Erreur email notification:`, err.message);
      }
    }, 0);

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
