const Newsletter = require('../models/Newsletter');
const {
  sendNewsletterConfirmation,
  sendNewsletterNotification
} = require('../utils/emailService');
const sseService = require('../services/sseService');
const {
  generateConfirmationToken,
  generateTokenExpiration,
  isTokenExpired
} = require('../utils/tokenGenerator');

/**
 * Controller pour la gestion de la newsletter
 * Gère les abonnements et désabonnements à la newsletter
 */

/**
 * @route   POST /api/newsletter/subscribe
 * @desc    S'abonner à la newsletter
 * @access  Public
 */
exports.subscribe = async (req, res, next) => {
  try {
    const { email, name, source } = req.body;

    // Validation de l'email (déjà fait par express-validator, mais double vérification)
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'L\'adresse email est requise.',
        error: 'EMAIL_REQUIRED'
      });
    }

    // Vérifier si l'email existe déjà
    const existingSubscriber = await Newsletter.findOne({ email: email.toLowerCase().trim() });

    // Générer un token de confirmation
    const confirmationToken = generateConfirmationToken();
    const tokenExpiresAt = generateTokenExpiration(48); // 48 heures

    // Construire l'URL de confirmation
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const confirmationUrl = `${frontendUrl}/confirm-email?token=${confirmationToken}`;

    if (existingSubscriber) {
      // Si l'email existe et est confirmé et actif
      if (existingSubscriber.confirmed && !existingSubscriber.unsubscribedAt) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà abonné à la newsletter.',
          error: 'EMAIL_ALREADY_SUBSCRIBED'
      });
      }

      // Si l'email existe mais n'est pas confirmé OU s'était désabonné
      // Régénérer le token et renvoyer l'email
      existingSubscriber.confirmationToken = confirmationToken;
      existingSubscriber.confirmationTokenExpiresAt = tokenExpiresAt;
      existingSubscriber.confirmed = false;
      existingSubscriber.confirmedAt = null;
      existingSubscriber.unsubscribedAt = null;
      if (name) existingSubscriber.name = name.trim();
      if (source) existingSubscriber.source = source;
      await existingSubscriber.save();

      // Envoyer l'email de confirmation avec le lien (non bloquant)
      sendNewsletterConfirmation(existingSubscriber.email, confirmationUrl, existingSubscriber.name)
        .catch(err => console.error('Erreur envoi email confirmation newsletter:', err));

      return res.status(200).json({
        success: true,
        message: 'Un nouvel email de confirmation a été envoyé. Vérifiez votre boîte mail pour confirmer votre email.',
        data: {
          email: existingSubscriber.email,
          subscribedAt: existingSubscriber.createdAt,
          confirmationRequired: true
        }
      });
    }

    // Créer un nouvel abonné
    const subscriber = await Newsletter.create({
      email: email.toLowerCase().trim(),
      name: name ? name.trim() : undefined,
      source: source || 'website',
      confirmationToken: confirmationToken,
      confirmationTokenExpiresAt: tokenExpiresAt,
      confirmed: false
    });

    // Envoyer l'email de confirmation avec le lien (non bloquant)
    sendNewsletterConfirmation(subscriber.email, confirmationUrl, subscriber.name)
      .catch(err => console.error('Erreur envoi email confirmation newsletter:', err));
    
    // Notifier l'équipe (non bloquant)
    sendNewsletterNotification({
      email: subscriber.email,
      name: subscriber.name,
      source: subscriber.source
    }).catch(err => console.error('Erreur envoi email notification newsletter:', err));

    // Émettre l'événement SSE pour les clients connectés
    sseService.broadcast('new_subscriber', {
      email: subscriber.email,
      createdAt: subscriber.createdAt,
      name: subscriber.name,
      source: subscriber.source
    });

    res.status(200).json({
      success: true,
      message: 'Abonnement réussi. Vérifiez votre boîte mail pour confirmer votre email.',
      data: {
        email: subscriber.email,
        subscribedAt: subscriber.createdAt,
        confirmationRequired: true
      }
    });

  } catch (error) {
    // Gérer les erreurs de duplication (email unique)
    if (error.code === 11000 || error.name === 'MongoServerError') {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà abonné à la newsletter.',
        error: 'EMAIL_ALREADY_SUBSCRIBED'
      });
    }

    // Gérer les erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({
        success: false,
        message: message || 'Erreur de validation',
        error: 'VALIDATION_ERROR'
      });
    }

    console.error('❌ Erreur abonnement newsletter:', error);
    console.error('   Stack:', error.stack);
    next(error);
  }
};

/**
 * @route   GET /api/newsletter/subscribers
 * @desc    Récupérer tous les abonnés (admin uniquement)
 * @access  Private (Admin uniquement)
 */
exports.getAllSubscribers = async (req, res, next) => {
  try {
    const { confirmed, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (confirmed !== undefined) {
      filter.confirmed = confirmed === 'true';
    }
    // Exclure les désabonnés par défaut
    filter.unsubscribedAt = null;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const subscribers = await Newsletter.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-__v');

    const total = await Newsletter.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: subscribers.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: subscribers
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/newsletter/subscribers/:id
 * @desc    Récupérer un abonné par son ID (admin uniquement)
 * @access  Private (Admin uniquement)
 */
exports.getSubscriberById = async (req, res, next) => {
  try {
    const subscriber = await Newsletter.findById(req.params.id);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Abonné non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: subscriber
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/newsletter/stats
 * @desc    Récupérer les statistiques de la newsletter (nombre d'abonnés)
 * @access  Public
 */
exports.getStats = async (req, res, next) => {
  try {
    // Total d'abonnés actifs (non désabonnés)
    const totalActive = await Newsletter.countDocuments({
      unsubscribedAt: null
    });

    // Total d'abonnés confirmés
    const totalConfirmed = await Newsletter.countDocuments({
      confirmed: true,
      unsubscribedAt: null
    });

    // Total d'abonnés non confirmés
    const totalUnconfirmed = await Newsletter.countDocuments({
      confirmed: false,
      unsubscribedAt: null
    });

    // Total désabonnés
    const totalUnsubscribed = await Newsletter.countDocuments({
      unsubscribedAt: { $ne: null }
    });

    // Total général (tous les abonnés, y compris désabonnés)
    const totalAll = await Newsletter.countDocuments({});

    res.status(200).json({
      success: true,
      data: {
        total: totalActive,
        confirmed: totalConfirmed,
        unconfirmed: totalUnconfirmed,
        unsubscribed: totalUnsubscribed,
        totalAll: totalAll,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/newsletter/unsubscribe
 * @desc    Se désabonner de la newsletter
 * @access  Public
 */
/**
 * @route   POST /api/newsletter/confirm
 * @desc    Confirmer l'email avec un token de confirmation
 * @access  Public
 */
exports.confirm = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Le token de confirmation est requis.',
        error: 'TOKEN_REQUIRED'
      });
    }

    // Trouver l'abonné par token
    const subscriber = await Newsletter.findOne({ confirmationToken: token });

    if (!subscriber) {
      return res.status(400).json({
        success: false,
        message: 'Lien de confirmation invalide.',
        error: 'TOKEN_INVALID'
      });
    }

    // Vérifier si le token a expiré
    if (isTokenExpired(subscriber.confirmationTokenExpiresAt)) {
      return res.status(410).json({
        success: false,
        message: 'Ce lien de confirmation a expiré. Veuillez vous réabonner.',
        error: 'TOKEN_EXPIRED'
      });
    }

    // Vérifier si déjà confirmé
    if (subscriber.confirmed) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà confirmé.',
        error: 'ALREADY_CONFIRMED'
      });
    }

    // Confirmer l'email
    subscriber.confirmed = true;
    subscriber.confirmedAt = new Date();
    subscriber.confirmationToken = null; // Invalider le token après utilisation
    subscriber.confirmationTokenExpiresAt = null;
    await subscriber.save();

    // Émettre l'événement SSE pour les clients connectés
    sseService.broadcast('subscriber_confirmed', {
      email: subscriber.email,
      confirmedAt: subscriber.confirmedAt
    });

    res.status(200).json({
      success: true,
      message: 'Votre email a été confirmé avec succès !',
      data: {
        email: subscriber.email,
        confirmedAt: subscriber.confirmedAt
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/newsletter/resend-confirmation
 * @desc    Renvoyer un email de confirmation
 * @access  Public
 */
exports.resendConfirmation = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'L\'adresse email est requise.',
        error: 'EMAIL_REQUIRED'
      });
    }

    const subscriber = await Newsletter.findOne({ email: email.toLowerCase().trim() });

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Cet email n\'est pas abonné à la newsletter.',
        error: 'EMAIL_NOT_FOUND'
      });
    }

    // Si déjà confirmé, retourner un message de succès (pour éviter de révéler des informations)
    if (subscriber.confirmed) {
      return res.status(200).json({
        success: true,
        message: 'Cet email est déjà confirmé.'
      });
    }

    // Générer un nouveau token
    const confirmationToken = generateConfirmationToken();
    const tokenExpiresAt = generateTokenExpiration(48);

    subscriber.confirmationToken = confirmationToken;
    subscriber.confirmationTokenExpiresAt = tokenExpiresAt;
    await subscriber.save();

    // Construire l'URL de confirmation
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const confirmationUrl = `${frontendUrl}/confirm-email?token=${confirmationToken}`;

    // Envoyer l'email de confirmation (non bloquant)
    sendNewsletterConfirmation(subscriber.email, confirmationUrl, subscriber.name)
      .catch(err => console.error('Erreur envoi email confirmation newsletter:', err));

    res.status(200).json({
      success: true,
      message: 'Un nouvel email de confirmation a été envoyé.'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/newsletter/unsubscribe
 * @desc    Se désabonner de la newsletter
 * @access  Public
 */
exports.unsubscribe = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'L\'adresse email est requise.',
        error: 'EMAIL_REQUIRED'
      });
    }

    const subscriber = await Newsletter.findOne({ email: email.toLowerCase().trim() });

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Cet email n\'est pas abonné à la newsletter.',
        error: 'EMAIL_NOT_FOUND'
      });
    }

    if (subscriber.unsubscribedAt) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà désabonné.',
        error: 'ALREADY_UNSUBSCRIBED'
      });
    }

    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    res.status(200).json({
      success: true,
      message: 'Vous avez été désabonné de la newsletter avec succès.',
      data: {
        email: subscriber.email,
        unsubscribedAt: subscriber.unsubscribedAt
      }
    });

  } catch (error) {
    next(error);
  }
};

