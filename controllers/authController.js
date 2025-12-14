const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Controller pour l'authentification
 * Gère le login et le logout des administrateurs
 */

/**
 * Génère un token JWT pour un utilisateur
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * @route   POST /api/auth/login
 * @desc    Authentifier un administrateur
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Vérifier que l'email et le mot de passe sont fournis
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir un email et un mot de passe'
      });
    }

    // Trouver l'utilisateur par email (inclure le mot de passe pour la comparaison)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Vérifier que le compte est actif
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé. Contactez l\'administrateur.'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Mettre à jour la date de dernière connexion
    user.lastLogin = new Date();
    await user.save();

    // Générer le token JWT
    const token = generateToken(user._id);

    // Retourner les informations de l'utilisateur (sans le mot de passe) et le token
    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Récupérer les informations de l'utilisateur connecté
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Déconnexion (côté client, mais endpoint pour la cohérence)
 * @access  Private
 */
exports.logout = async (req, res, next) => {
  try {
    // Avec JWT, la déconnexion se fait côté client en supprimant le token
    // Cet endpoint est fourni pour la cohérence de l'API
    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    next(error);
  }
};

