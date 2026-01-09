const mongoose = require('mongoose');

/**
 * Modèle Mongoose pour les articles du blog
 * Contient toutes les informations nécessaires pour un article
 */
const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre est obligatoire'],
    trim: true,
    maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Le contenu est obligatoire'],
    minlength: [50, 'Le contenu doit contenir au moins 50 caractères']
  },
  excerpt: {
    type: String,
    maxlength: [500, 'Le résumé ne peut pas dépasser 500 caractères'],
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'La catégorie est obligatoire']
  },
  author: {
    type: String,
    default: 'Admin XC Afrique',
    trim: true
  },
  featuredImage: {
    type: String,
    default: ''
  },
  videoUrl: {
    type: String,
    default: '',
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  views: {
    type: Number,
    default: 0
  },
  publishedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Ajoute automatiquement createdAt et updatedAt
});

// Index pour améliorer les performances de recherche
articleSchema.index({ title: 'text', content: 'text' });
articleSchema.index({ category: 1, status: 1 });
articleSchema.index({ publishedAt: -1 });

// Middleware pre-save pour générer le slug à partir du titre
articleSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Si l'article passe en published, définir publishedAt
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

module.exports = mongoose.model('Article', articleSchema);

