# ContentManager - Gestionnaire de contenu automatique

Le `ContentManager` est un module qui automatise la sauvegarde de contenu (articles, catégories) dans MongoDB via l'API REST de XC Afrique.

## 🚀 Installation

```bash
npm install
```

## 📋 Configuration

Ajoutez ces variables dans votre fichier `.env` :

```env
# URL de base de l'API
API_BASE_URL=http://localhost:5000/api

# Token JWT (optionnel - si non défini, s'authentifiera automatiquement)
CURSOR_TOKEN=votre_token_jwt_ici

# Identifiants admin pour l'authentification automatique
ADMIN_EMAIL=admin@xcafrique.com
ADMIN_PASSWORD=admin123
```

## 💻 Utilisation

### Exemple basique

```javascript
const ContentManager = require('./utils/contentManager');

const manager = new ContentManager();

// S'authentifier (si pas de token)
await manager.authenticate();

// Créer une catégorie
const category = await manager.createOrUpdateCategory({
  title: 'Actualités Aéronautiques',
  slug: 'actualites-aeronautiques',
  description: 'Les dernières actualités du secteur aéronautique'
});

// Créer un article
const article = await manager.createOrUpdateArticle({
  title: 'Titre de l\'article',
  slug: 'titre-de-l-article',
  content: 'Contenu complet de l\'article...',
  summary: 'Résumé de l\'article',
  categorySlug: 'actualites-aeronautiques',
  tags: ['aviation', 'afrique'],
  author: 'Admin XC Afrique',
  publishedAt: new Date().toISOString(),
  heroImage: 'https://example.com/image.jpg',
  status: 'published'
});
```

### Sauvegarder plusieurs articles

```javascript
const articles = [
  {
    title: 'Article 1',
    slug: 'article-1',
    content: '...',
    summary: '...',
    categorySlug: 'categorie-1',
    tags: ['tag1', 'tag2']
  },
  // ... plus d'articles
];

const results = await manager.saveArticles(articles);
console.log(`✅ ${results.success.length} articles sauvegardés`);
console.log(`❌ ${results.failures.length} échecs`);
```

## 📝 Format des données

### Catégorie

```javascript
{
  title: string,        // Nom de la catégorie
  slug: string,         // Slug unique (généré automatiquement si non fourni)
  description: string    // Description de la catégorie
}
```

### Article

```javascript
{
  title: string,              // Titre de l'article
  slug: string,               // Slug unique
  content: string,            // Contenu complet (HTML ou markdown)
  summary: string,            // Résumé/excerpt (optionnel)
  categorySlug: string,       // Slug de la catégorie (créée si n'existe pas)
  tags: [string],             // Tableau de tags
  author: string,             // Auteur (défaut: "Admin XC Afrique")
  publishedAt: string,         // Date ISO (optionnel)
  heroImage: string,          // URL de l'image hero (optionnel)
  status: 'published' | 'draft'  // Statut (défaut: 'published')
}
```

## 🔄 Gestion des doublons

- Si une catégorie existe déjà (même slug), elle sera mise à jour
- Si un article existe déjà (même slug), il sera mis à jour
- Les erreurs 409 (doublon) sont gérées automatiquement

## ❌ Gestion des erreurs

En cas d'échec, les données sont sauvegardées dans le dossier `cursor-failures/` avec :
- Le type de contenu (article/catégorie)
- Les données qui ont échoué
- L'erreur rencontrée
- Le timestamp

## 🔐 Authentification

Le ContentManager gère automatiquement l'authentification :
1. Si `CURSOR_TOKEN` est défini dans `.env`, il l'utilise
2. Sinon, il s'authentifie avec `ADMIN_EMAIL` et `ADMIN_PASSWORD`
3. Le token est conservé pour les requêtes suivantes

## 📚 Exemple complet

Voir `examples/contentGenerator.js` pour un exemple complet d'utilisation.

