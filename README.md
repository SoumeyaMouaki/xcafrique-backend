# XC Afrique Backend

Backend API minimal et évolutif pour **XC Afrique – Le Cross-check de l'info aérienne**.

## 🎯 Objectif

Backend conçu comme une **couche d'exposition API** pour le frontend React. Les articles sont générés via n8n + IA + GitHub, et publiés sans CMS.

## 📋 Prérequis

- Node.js (version 14 ou supérieure)
- MongoDB (local ou MongoDB Atlas)
- npm ou yarn

## 🛠️ Installation

1. **Installer les dépendances**
   ```bash
   npm install
   ```

2. **Configurer les variables d'environnement**
   ```bash
   cp env.example .env
   ```
   
   Puis éditer le fichier `.env` avec vos configurations :
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/xcafrique
   JWT_SECRET=votre_secret_jwt_tres_securise
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:3000
   ```

3. **Démarrer le serveur**
   ```bash
   npm start
   ```
   
   Pour le développement avec rechargement automatique :
   ```bash
   npm run dev
   ```

Le serveur sera accessible sur `http://localhost:5000`

## 📚 Endpoints API

### Articles

- `GET /api/articles` - Lister tous les articles publiés (avec pagination et filtres)
- `GET /api/articles/:slug` - Obtenir un article par son slug

**Paramètres de requête pour GET /api/articles :**
- `category` : Filtrer par catégorie (slug ou ID)
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'articles par page (défaut: 10)
- `search` : Recherche textuelle dans le titre, contenu, excerpt et tags

**Exemple de réponse :**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "pages": 5,
  "data": [...]
}
```

**Champs d'un article :**
- `title` : Titre de l'article
- `slug` : Slug unique (généré automatiquement)
- `excerpt` : Résumé court
- `content` : Contenu complet (HTML ou Markdown)
- `category` : Catégorie (référence)
- `author` : Auteur
- `featuredImage` : URL de l'image principale
- `tags` : Tableau de tags
- `publishedAt` : Date de publication
- `views` : Nombre de vues
- `status` : Statut (draft, published)

## 📝 Structure du projet

```
xcafrique-backend/
├── config/
│   └── database.js          # Configuration MongoDB
├── controllers/
│   └── articleController.js # Logique métier des articles
├── middleware/
│   ├── auth.js              # Middleware d'authentification JWT (pour routes futures)
│   ├── validation.js        # Middleware de validation
│   └── errorHandler.js      # Gestionnaire d'erreurs global
├── models/
│   ├── Article.js           # Modèle Mongoose Article
│   └── Category.js          # Modèle Mongoose Category
├── routes/
│   └── articleRoutes.js     # Routes des articles
├── services/
│   └── sseService.js         # Service Server-Sent Events (optionnel)
├── .env.example             # Exemple de fichier d'environnement
├── package.json             # Dépendances et scripts
├── README.md                # Documentation
└── server.js                # Point d'entrée de l'application
```

## 🔒 Sécurité

- **Helmet** : Protection contre les vulnérabilités HTTP
- **CORS** : Configuration pour autoriser uniquement le frontend autorisé
- **Rate Limiting** : Limitation du nombre de requêtes par IP
- **Validation** : Validation des entrées avec express-validator
- **Variables d'environnement** : Aucune clé API en dur

## 📦 Dépendances principales

- **express** : Framework web
- **mongoose** : ODM pour MongoDB
- **helmet** : Sécurité HTTP
- **cors** : Gestion CORS
- **express-rate-limit** : Limitation de débit
- **dotenv** : Variables d'environnement
- **morgan** : Logging HTTP (développement uniquement)

## 🚀 Déploiement

Le backend est prêt pour le déploiement sur :
- **Vercel** : Configuration automatique via `vercel.json` (à créer si nécessaire)
- **Railway** : Déploiement direct depuis GitHub
- **Render** : Déploiement avec variables d'environnement

**Variables d'environnement requises en production :**
- `PORT` : Port du serveur (généralement défini automatiquement)
- `NODE_ENV=production`
- `MONGODB_URI` : URI de connexion MongoDB
- `JWT_SECRET` : Secret JWT sécurisé
- `FRONTEND_URL` : URL du frontend en production

## 🔄 Prochaines étapes recommandées

1. **Intégration avec n8n** : Configurer le workflow pour publier automatiquement les articles depuis GitHub
2. **Cache** : Ajouter un système de cache (Redis) pour améliorer les performances
3. **CDN** : Configurer un CDN pour les images et assets statiques
4. **Monitoring** : Ajouter des outils de monitoring (Sentry, LogRocket, etc.)
5. **Tests** : Ajouter des tests unitaires et d'intégration

## 📄 Licence

ISC

---

**XC Afrique – Le Cross-check de l'info aérienne** ✈️
