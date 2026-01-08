# 📋 Structure Backend - XC Afrique

## ✅ Structure finale

```
xcafrique-backend/
├── config/
│   └── database.js              # Configuration MongoDB (nettoyé)
├── controllers/
│   └── articleController.js     # API Articles uniquement (simplifié)
├── middleware/
│   ├── auth.js                  # Authentification JWT (prêt pour usage futur)
│   ├── errorHandler.js         # Gestion erreurs (logs en dev uniquement)
│   └── validation.js           # Validation des entrées
├── models/
│   ├── Article.js               # Modèle Article (inchangé)
│   └── Category.js             # Modèle Category (inchangé)
├── routes/
│   └── articleRoutes.js        # Routes Articles uniquement (simplifié)
├── services/
│   └── sseService.js            # Service SSE (optionnel, conservé)
├── env.example                  # Variables d'environnement (nettoyé)
├── package.json                 # Scripts simplifiés (start, dev uniquement)
├── README.md                    # Documentation mise à jour
└── server.js                    # Serveur principal (nettoyé, logs minimisés)
```

## 🔌 Endpoints disponibles

### Articles (API publique)

#### `GET /api/articles`
Liste des articles publiés avec pagination et filtres.

**Query parameters :**
- `category` (string) : Slug ou ID de la catégorie
- `page` (number) : Numéro de page (défaut: 1)
- `limit` (number) : Nombre d'articles par page (défaut: 10)
- `search` (string) : Recherche textuelle (titre, contenu, excerpt, tags)

**Exemple :**
```
GET /api/articles?category=finance&page=1&limit=10&search=aviation
```

**Réponse :**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "pages": 5,
  "data": [
    {
      "_id": "...",
      "title": "Titre de l'article",
      "slug": "titre-de-l-article",
      "excerpt": "Résumé...",
      "content": "Contenu complet...",
      "category": {
        "_id": "...",
        "name": "Finance",
        "slug": "finance",
        "color": "#FF5733"
      },
      "author": "Admin XC Afrique",
      "featuredImage": "url-image.jpg",
      "tags": ["tag1", "tag2"],
      "publishedAt": "2026-01-08T10:00:00.000Z",
      "views": 42,
      "status": "published",
      "createdAt": "2026-01-08T10:00:00.000Z",
      "updatedAt": "2026-01-08T10:00:00.000Z"
    }
  ]
}
```

#### `GET /api/articles/:slug`
Détails d'un article par son slug.

**Exemple :**
```
GET /api/articles/ethiopie-2025-2026-ethiopian-airlines
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Titre de l'article",
    "slug": "ethiopie-2025-2026-ethiopian-airlines",
    "excerpt": "Résumé...",
    "content": "Contenu complet...",
    "category": {
      "_id": "...",
      "name": "Finance",
      "slug": "finance",
      "color": "#FF5733",
      "description": "Description de la catégorie"
    },
    "author": "Admin XC Afrique",
    "featuredImage": "url-image.jpg",
    "tags": ["tag1", "tag2"],
    "publishedAt": "2026-01-08T10:00:00.000Z",
    "views": 43,
    "status": "published",
    "createdAt": "2026-01-08T10:00:00.000Z",
    "updatedAt": "2026-01-08T10:00:00.000Z"
  }
}
```

**Note :** Le compteur de vues est incrémenté automatiquement à chaque requête.

## 📦 Champs des articles

Les articles retournés par l'API contiennent les champs suivants :

- `title` (string) : Titre de l'article
- `slug` (string) : Slug unique (généré automatiquement depuis le titre)
- `excerpt` (string) : Résumé court (max 500 caractères)
- `content` (string) : Contenu complet (HTML ou Markdown)
- `category` (object) : Catégorie avec `_id`, `name`, `slug`, `color`, `description`
- `author` (string) : Nom de l'auteur
- `featuredImage` (string) : URL de l'image principale
- `tags` (array) : Tableau de tags
- `publishedAt` (date) : Date de publication
- `views` (number) : Nombre de vues
- `status` (string) : Statut (`draft` ou `published`)
- `createdAt` (date) : Date de création
- `updatedAt` (date) : Date de mise à jour

## 🔒 Sécurité

- ✅ **Helmet** : Protection contre les vulnérabilités HTTP
- ✅ **CORS** : Configuration pour autoriser uniquement le frontend autorisé
- ✅ **Rate Limiting** : 100 requêtes par IP toutes les 15 minutes
- ✅ **Variables d'environnement** : Aucune clé API en dur
- ✅ **Validation** : Validation des entrées avec express-validator
- ✅ **Logs minimisés** : Logs uniquement en développement

## 🚀 Déploiement

### Variables d'environnement requises

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=secret_securise
JWT_EXPIRE=7d
FRONTEND_URL=https://votre-frontend.com
```

### Scripts disponibles

```bash
npm start      # Démarrer le serveur en production
npm run dev    # Démarrer avec nodemon (développement)
```

### Plateformes de déploiement

- **Vercel** : Configuration automatique
- **Railway** : Déploiement direct depuis GitHub
- **Render** : Déploiement avec variables d'environnement

## 🔄 Prochaines étapes recommandées

### 1. Intégration avec n8n + GitHub
- Configurer le workflow n8n pour publier automatiquement les articles depuis `Prod/articles/published/`
- Créer un endpoint POST `/api/articles` (admin uniquement) pour l'intégration
- Ou utiliser directement MongoDB pour insérer les articles

### 2. Cache et performance
- Ajouter Redis pour le cache des articles
- Implémenter un cache des requêtes fréquentes
- Optimiser les requêtes MongoDB avec des index

### 3. CDN et assets
- Configurer un CDN pour les images
- Optimiser les images avant stockage
- Implémenter un système de gestion d'assets

### 4. Monitoring
- Ajouter Sentry pour le suivi des erreurs
- Implémenter des logs structurés (Winston, Pino)
- Ajouter des métriques de performance

### 5. Tests
- Tests unitaires (Jest)
- Tests d'intégration (Supertest)
- Tests E2E pour les endpoints critiques

### 6. Documentation API
- Ajouter Swagger/OpenAPI
- Documenter tous les endpoints
- Créer des exemples de requêtes

## 📝 Notes importantes

- ✅ **Backend minimal** : Seulement les endpoints nécessaires pour l'API Articles
- ✅ **Pas de CMS** : Les articles sont générés via n8n + IA + GitHub
- ✅ **API publique** : Tous les endpoints articles sont publics (pas d'authentification requise)
- ✅ **Routes optionnelles** : Les routes auth, contact, newsletter sont commentées dans `server.js` (à activer si nécessaire)
- ✅ **Logs propres** : Logs minimisés, uniquement en développement
- ✅ **Prêt pour production** : Configuration optimisée pour le déploiement

## 🎯 Workflow recommandé

1. **Génération d'articles** : n8n + IA génère les articles dans `Prod/articles/drafts/`
2. **Révision** : Éditeur humain valide les articles
3. **Publication** : Articles approuvés déplacés vers `Prod/articles/published/`
4. **Intégration** : n8n ou script automatique insère les articles dans MongoDB
5. **Exposition** : API expose les articles au frontend React

---

**Backend prêt pour la production** ✈️

