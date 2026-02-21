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
  const startTime = Date.now();
  
  try {
    // Vérifier rapidement que MongoDB est connecté
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      // Si MongoDB n'est pas connecté, essayer de se reconnecter rapidement
      const connectDB = require('../config/database');
      try {
        await Promise.race([
          connectDB(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('MongoDB connection timeout')), 5000))
        ]);
      } catch (dbError) {
        // Logger l'erreur pour le diagnostic
        const isIPWhitelistError = dbError.message && (
          dbError.message.includes('whitelist') || 
          dbError.message.includes('IP') ||
          dbError.message.includes('not whitelisted')
        );
        
        if (isIPWhitelistError) {
          console.error('❌ Erreur MongoDB: IP non autorisée dans Atlas');
          console.error('   Solution: Ajoutez 0.0.0.0/0 dans MongoDB Atlas → Network Access');
        } else {
          console.error('❌ Erreur connexion MongoDB:', dbError.message);
        }
        
        return res.status(503).json({
          success: false,
          message: 'Service temporairement indisponible. Veuillez réessayer dans quelques instants.',
          error: 'Database connection failed',
          ...(isIPWhitelistError && {
            hint: 'Vérifiez la configuration MongoDB Atlas (IP whitelist)'
          })
        });
      }
    }

    // Créer le contact avec un timeout pour éviter les blocages
    let contact;
    try {
      contact = await Promise.race([
        Contact.create(req.body),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Contact creation timeout')), 8000)
        )
      ]);
    } catch (createError) {
      // Si la création échoue (timeout ou erreur), retourner une erreur rapide
      if (createError.message.includes('timeout')) {
        return res.status(504).json({
          success: false,
          message: 'Le traitement de votre message prend plus de temps que prévu. Votre message sera traité en arrière-plan.',
          error: 'Request timeout'
        });
      }
      throw createError; // Propager les autres erreurs
    }

    // Répondre IMMÉDIATEMENT au client (avant les emails)
    const responseTime = Date.now() - startTime;
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Contact créé et réponse envoyée en ${responseTime}ms`);
    }
    
    res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
      data: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject
      }
    });

    // Envoyer les emails EN ARRIÈRE-PLAN (après la réponse)
    // Utiliser setImmediate pour s'assurer que la réponse est partie avant
    setImmediate(() => {
      // Email de confirmation à l'utilisateur
      sendContactConfirmation(contact.email, contact.name, contact.subject)
        .catch(err => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Erreur envoi email confirmation contact:', err.message);
          }
        });

      // Notification à l'équipe
      sendContactNotification({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        subject: contact.subject,
        message: contact.message
      }).catch(err => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur envoi email notification contact:', err.message);
        }
      });
    });

  } catch (error) {
    // Gestion d'erreur améliorée
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }

    if (error.name === 'MongoServerError' || error.name === 'MongoError') {
      return res.status(503).json({
        success: false,
        message: 'Service temporairement indisponible. Veuillez réessayer dans quelques instants.',
        error: 'Database error'
      });
    }

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

