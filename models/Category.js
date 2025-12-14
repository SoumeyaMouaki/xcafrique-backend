const mongoose = require('mongoose');

/**
 * Modèle Mongoose pour les catégories d'articles
 * Permet d'organiser les articles par thème
 */
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de la catégorie est obligatoire'],
    unique: true,
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères'],
    trim: true
  },
  color: {
    type: String,
    default: '#007bff', // Couleur par défaut pour l'affichage
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'La couleur doit être au format hexadécimal']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });

// Middleware pre-save pour générer le slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);

