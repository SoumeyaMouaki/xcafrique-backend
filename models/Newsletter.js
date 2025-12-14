const mongoose = require('mongoose');

/**
 * Modèle Mongoose pour les abonnés à la newsletter
 * Stocke les informations des utilisateurs abonnés à la newsletter
 */
const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'L\'email est obligatoire'],
    lowercase: true,
    trim: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Veuillez fournir un email valide']
  },
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  source: {
    type: String,
    trim: true,
    maxlength: [50, 'La source ne peut pas dépasser 50 caractères'],
    default: 'website'
  },
  confirmationToken: {
    type: String,
    trim: true,
    default: null
  },
  confirmationTokenExpiresAt: {
    type: Date,
    default: null
  },
  confirmed: {
    type: Boolean,
    default: false
  },
  confirmedAt: {
    type: Date,
    default: null
  },
  unsubscribedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
newsletterSchema.index({ email: 1 }, { unique: true });
newsletterSchema.index({ confirmationToken: 1 });
newsletterSchema.index({ confirmed: 1, createdAt: -1 });
newsletterSchema.index({ unsubscribedAt: 1 });

// Méthode pour vérifier si l'email est actif (abonné et non désabonné)
newsletterSchema.methods.isActive = function() {
  return this.confirmed && !this.unsubscribedAt;
};

module.exports = mongoose.model('Newsletter', newsletterSchema);

