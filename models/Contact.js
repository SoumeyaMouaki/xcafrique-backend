const mongoose = require('mongoose');

/**
 * Modèle Mongoose pour les messages de contact
 * Stocke les messages envoyés via le formulaire de contact
 */
const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est obligatoire'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est obligatoire'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Veuillez fournir un email valide']
  },
  subject: {
    type: String,
    required: [true, 'Le sujet est obligatoire'],
    trim: true,
    maxlength: [200, 'Le sujet ne peut pas dépasser 200 caractères']
  },
  message: {
    type: String,
    required: [true, 'Le message est obligatoire'],
    trim: true,
    maxlength: [5000, 'Le message ne peut pas dépasser 5000 caractères']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Le numéro de téléphone ne peut pas dépasser 20 caractères']
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'archived'],
    default: 'new'
  },
  repliedAt: {
    type: Date,
    default: null
  },
  adminNotes: {
    type: String,
    maxlength: [1000, 'Les notes ne peuvent pas dépasser 1000 caractères']
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ email: 1 });

module.exports = mongoose.model('Contact', contactSchema);

