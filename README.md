# XC Afrique Backend

Backend API pour **XC Afrique – Le Cross-check de l'info aérienne**, un blog professionnel développé avec Node.js, Express et MongoDB.

## 🚀 Fonctionnalités

- ✅ **Gestion des articles** : CRUD complet (création, lecture, modification, suppression)
- ✅ **Gestion des catégories** : Organisation des articles par thème
- ✅ **Authentification admin** : Système de login/logout avec JWT
- ✅ **Formulaire de contact** : Stockage des messages de contact avec notifications email
- ✅ **Newsletter** : Système d'abonnement à la newsletter avec gestion des abonnés
- ✅ **Notifications temps réel** : Server-Sent Events (SSE) pour les notifications en temps réel
- ✅ **Envoi d'emails** : Service d'envoi d'emails avec templates HTML
- ✅ **API REST sécurisée** : Prête pour le frontend React
- ✅ **Sécurité** : CORS, Helmet, rate limiting, validation des entrées
- ✅ **Gestion des erreurs** : Messages clairs et structurés

## 📋 Prérequis

- Node.js (version 14 ou supérieure)
- MongoDB (local ou MongoDB Atlas)
- npm ou yarn

## 🛠️ Installation

1. **Cloner le repository** (si applicable) ou naviguer dans le dossier du projet

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env
   ```
   
   Puis éditer le fichier `.env` avec vos configurations :
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/xcafrique
   JWT_SECRET=votre_secret_jwt_tres_securise
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:3000
   CONTACT_EMAIL=contact@xcafrique.org
   NEWSLETTER_EMAIL=news@xcafrique.org
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=votre_email@gmail.com
   SMTP_PASSWORD=votre_mot_de_passe_app
   ```

4. **Démarrer MongoDB**
   - Si MongoDB est installé localement, assurez-vous qu'il est en cours d'exécution
   - Ou utilisez MongoDB Atlas et mettez à jour `MONGODB_URI` dans `.env`

5. **Lancer le serveur**
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

- `GET /api/articles` - Lister tous les articles (avec pagination et filtres)
- `GET /api/articles/search/suggestions` - Obtenir des suggestions d'articles pour la barre de recherche
- `GET /api/articles/:id` - Obtenir un article par ID
- `POST /api/articles` - Créer un article (admin uniquement)
- `PUT /api/articles/:id` - Modifier un article (admin uniquement)
- `DELETE /api/articles/:id` - Supprimer un article (admin uniquement)

**Paramètres de requête pour GET /api/articles :**
- `category` : Filtrer par catégorie (ID)
- `status` : Filtrer par statut (draft, published) - admin uniquement
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'articles par page (défaut: 10)
- `search` : Recherche textuelle

**Paramètres de requête pour GET /api/articles/search/suggestions :**
- `q` : Terme de recherche (optionnel, si absent retourne les articles récents)
- `limit` : Nombre de suggestions à retourner (défaut: 5)

**Exemple d'utilisation des suggestions :**
```
GET /api/articles/search/suggestions?q=aviation&limit=5
```
Retourne jusqu'à 5 articles dont le titre, le résumé ou les tags correspondent à "aviation", priorisant les correspondances dans le titre.

### Catégories

- `GET /api/categories` - Lister toutes les catégories
- `GET /api/categories/:id` - Obtenir une catégorie par ID
- `POST /api/categories` - Créer une catégorie (admin uniquement)
- `PUT /api/categories/:id` - Modifier une catégorie (admin uniquement)
- `DELETE /api/categories/:id` - Supprimer une catégorie (admin uniquement)

### Authentification

- `POST /api/auth/login` - Connexion admin
  ```json
  {
    "email": "admin@xcafrique.com",
    "password": "motdepasse"
  }
  ```
- `GET /api/auth/me` - Obtenir les informations de l'utilisateur connecté (authentifié)
- `POST /api/auth/logout` - Déconnexion (authentifié)

### Contact

- `POST /api/contact` - Envoyer un message via le formulaire de contact
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Question",
    "message": "Votre message ici",
    "phone": "0123456789" // optionnel
  }
  ```
- `GET /api/contact` - Lister tous les messages (admin uniquement)
- `GET /api/contact/:id` - Obtenir un message par ID (admin uniquement)
- `PUT /api/contact/:id/status` - Mettre à jour le statut d'un message (admin uniquement)

### Newsletter

- `POST /api/newsletter/subscribe` - S'abonner à la newsletter
  ```json
  {
    "email": "user@example.com",
    "name": "Nom de l'utilisateur" // optionnel
  }
  ```
- `POST /api/newsletter/unsubscribe` - Se désabonner de la newsletter
  ```json
  {
    "email": "user@example.com"
  }
  ```
- `GET /api/newsletter/subscribers` - Lister tous les abonnés (admin uniquement)
- `GET /api/newsletter/subscribers/:id` - Obtenir un abonné par ID (admin uniquement)
- `GET /api/newsletter/stream` - Connexion SSE pour recevoir les notifications en temps réel
- `GET /api/newsletter/stream/stats` - Statistiques des connexions SSE

## 🔐 Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification. 

Pour accéder aux routes protégées, inclure le token dans le header :
```
Authorization: Bearer <votre_token_jwt>
```

## 📝 Structure du projet

```
xcafrique-backend/
├── config/
│   └── database.js          # Configuration MongoDB
├── controllers/
│   ├── articleController.js # Logique métier des articles
│   ├── categoryController.js# Logique métier des catégories
│   ├── authController.js    # Logique d'authentification
│   ├── contactController.js # Logique des messages de contact
│   └── newsletterController.js # Logique de la newsletter
├── middleware/
│   ├── auth.js              # Middleware d'authentification JWT
│   ├── validation.js        # Middleware de validation
│   └── errorHandler.js      # Gestionnaire d'erreurs global
├── models/
│   ├── Article.js           # Modèle Mongoose Article
│   ├── Category.js          # Modèle Mongoose Category
│   ├── User.js              # Modèle Mongoose User
│   ├── Contact.js           # Modèle Mongoose Contact
│   └── Newsletter.js        # Modèle Mongoose Newsletter
├── routes/
│   ├── articleRoutes.js     # Routes des articles
│   ├── categoryRoutes.js    # Routes des catégories
│   ├── authRoutes.js        # Routes d'authentification
│   ├── contactRoutes.js     # Routes de contact
│   └── newsletterRoutes.js  # Routes de la newsletter
├── services/
│   └── sseService.js         # Service Server-Sent Events
├── utils/
│   ├── emailService.js       # Service d'envoi d'emails
│   └── contentManager.js     # Gestionnaire de contenu automatique
├── .env.example             # Exemple de fichier d'environnement
├── .gitignore               # Fichiers à ignorer par Git
├── package.json             # Dépendances et scripts
├── README.md                # Documentation
└── server.js                # Point d'entrée de l'application
```

## 🧪 Données de test

Pour créer un utilisateur admin de test, vous pouvez utiliser un script ou créer manuellement via MongoDB :

```javascript
// Script pour créer un admin (à exécuter une fois)
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const admin = await User.create({
    username: 'admin',
    email: 'admin@xcafrique.com',
    password: 'admin123', // Sera automatiquement hashé
    role: 'admin'
  });
  console.log('Admin créé:', admin);
}
```

## 🔒 Sécurité

- **Helmet** : Protection contre les vulnérabilités HTTP
- **CORS** : Configuration pour autoriser uniquement le frontend autorisé
- **Rate Limiting** : Limitation du nombre de requêtes par IP
- **JWT** : Authentification sécurisée avec tokens
- **Validation** : Validation des entrées avec express-validator
- **Hashing** : Mots de passe hashés avec bcryptjs

## 📦 Dépendances principales

- **express** : Framework web
- **mongoose** : ODM pour MongoDB
- **jsonwebtoken** : Authentification JWT
- **bcryptjs** : Hashing des mots de passe
- **express-validator** : Validation des données
- **helmet** : Sécurité HTTP
- **cors** : Gestion CORS
- **express-rate-limit** : Limitation de débit
- **dotenv** : Variables d'environnement
- **morgan** : Logging HTTP
- **nodemailer** : Envoi d'emails

## 🐛 Dépannage

### Erreur de connexion MongoDB
- Vérifiez que MongoDB est en cours d'exécution
- Vérifiez l'URI dans `.env`
- Vérifiez les permissions de connexion

### Erreur JWT
- Vérifiez que `JWT_SECRET` est défini dans `.env`
- Assurez-vous que le token est inclus dans le header `Authorization`

### Port déjà utilisé
- Changez le `PORT` dans `.env`
- Ou arrêtez le processus utilisant le port

## 🤖 ContentManager - Génération automatique de contenu

Le projet inclut un module `ContentManager` qui automatise la sauvegarde de contenu (articles, catégories) dans MongoDB via l'API REST.

### Utilisation rapide

```javascript
const ContentManager = require('./utils/contentManager');

const manager = new ContentManager();
await manager.authenticate();

// Créer un article
await manager.createOrUpdateArticle({
  title: 'Titre',
  slug: 'titre',
  content: 'Contenu...',
  summary: 'Résumé',
  categorySlug: 'categorie-slug',
  tags: ['tag1', 'tag2'],
  author: 'Admin XC Afrique',
  publishedAt: new Date().toISOString(),
  status: 'published'
});
```

### Configuration

Ajoutez dans `.env` :
```env
API_BASE_URL=http://localhost:5000/api
CURSOR_TOKEN=votre_token_jwt  # Optionnel
ADMIN_EMAIL=admin@xcafrique.com
ADMIN_PASSWORD=admin123
```

📚 **Documentation complète** : Voir `utils/README.md`

## 📡 Notifications en temps réel (SSE)

Le backend supporte les Server-Sent Events (SSE) pour notifier le frontend en temps réel lorsqu'un nouvel abonné s'inscrit à la newsletter.

### Utilisation

```javascript
// Frontend
const eventSource = new EventSource('http://localhost:5000/api/newsletter/stream');

eventSource.addEventListener('new_subscriber', (event) => {
  const subscriber = JSON.parse(event.data);
  console.log('Nouvel abonné:', subscriber.email, subscriber.createdAt);
});
```

**Endpoint SSE :** `GET /api/newsletter/stream`

📚 **Documentation complète** : Voir `SSE_DOCUMENTATION.md`

## 📄 Licence

ISC

## 👥 Support

Pour toute question ou problème, veuillez ouvrir une issue sur le repository.

---

**XC Afrique – Le Cross-check de l'info aérienne** ✈️

