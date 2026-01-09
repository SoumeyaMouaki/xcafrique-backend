# 🔧 Configuration Backend pour XCAfrique Frontend

## ✅ Statut de la configuration

### Endpoints requis (✅ Implémentés)

| Endpoint | Méthode | Status | Description |
|----------|---------|--------|-------------|
| `/api/articles` | GET | ✅ | Liste des articles publiés |
| `/api/articles/:slug` | GET | ✅ | Détails d'un article par slug |
| `/api/categories` | GET | ✅ | Liste des catégories actives |
| `/api/categories/:id` | GET | ✅ | Détails d'une catégorie |

### Endpoints optionnels (⚠️ Disponibles mais commentés)

| Endpoint | Méthode | Status | Description |
|----------|---------|--------|-------------|
| `/api/contact` | POST | ⚠️ | Envoi de message (route commentée) |
| `/api/newsletter/*` | GET/POST | ⚠️ | Newsletter (routes commentées) |
| `/api/videos` | GET | ❌ | Non implémenté |

---

## 📋 Configuration CORS

### ✅ Configuration actuelle

Le backend autorise automatiquement :

**En développement :**
- `http://localhost:5173` (Vite)
- `http://localhost:3000` (React)
- `http://localhost:5174`, `http://localhost:5175`

**En production :**
- Domaines configurés via `ALLOWED_ORIGINS` ou `FRONTEND_URL`
- Valeurs par défaut : `https://xcafrique.org`, `https://www.xcafrique.org`, `https://xcafrique-frontend.vercel.app`

### 🔧 Configuration pour Vercel

Dans **Vercel Dashboard → Settings → Environment Variables**, ajoutez :

```env
ALLOWED_ORIGINS=http://localhost:5173,https://xcafrique.org,https://xcafrique-frontend.vercel.app
```

Ou utilisez `FRONTEND_URL` (les deux fonctionnent) :

```env
FRONTEND_URL=http://localhost:5173,https://xcafrique.org,https://xcafrique-frontend.vercel.app
```

**Support des wildcards :**
Le backend supporte les wildcards pour les preview deployments Vercel :
```
https://*.vercel.app
```

---

## 📊 Structure des réponses API

### ✅ Format standardisé

Toutes les réponses suivent ce format :

#### Liste (Articles, Catégories)

```json
{
  "success": true,
  "data": [...],
  "count": 10,
  "total": 50,
  "page": 1,
  "pages": 5
}
```

#### Objet unique (Article, Catégorie)

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "...",
    ...
  }
}
```

#### Erreur

```json
{
  "success": false,
  "message": "Message d'erreur descriptif"
}
```

---

## 📝 Structure des données

### Article

```json
{
  "_id": "string",
  "title": "string",
  "slug": "string",
  "excerpt": "string",
  "content": "string (HTML ou Markdown)",
  "category": {
    "_id": "string",
    "name": "string",
    "slug": "string",
    "color": "#FF5733"
  },
  "author": "string",
  "featuredImage": "string (URL)",
  "tags": ["string"],
  "publishedAt": "ISO date string",
  "views": 0,
  "status": "published",
  "createdAt": "ISO date string",
  "updatedAt": "ISO date string"
}
```

**Points importants :**
- ✅ Utilise le `slug` pour les URLs (pas l'ID)
- ✅ Seuls les articles `status: "published"` sont retournés
- ✅ Catégorie "populée" (objet complet)
- ✅ Tri par `publishedAt` décroissant

### Category

```json
{
  "_id": "string",
  "name": "string",
  "slug": "string",
  "description": "string (optionnel)",
  "color": "#FF5733",
  "isActive": true,
  "articleCount": 12,
  "createdAt": "ISO date string",
  "updatedAt": "ISO date string"
}
```

**Points importants :**
- ✅ Seules les catégories `isActive: true` sont retournées
- ✅ `articleCount` = nombre d'articles publiés

---

## 🔍 Filtres et recherche

### Pagination

```
GET /api/articles?page=1&limit=10
```

**Réponse :**
```json
{
  "success": true,
  "data": [...],
  "count": 10,
  "total": 50,
  "page": 1,
  "pages": 5
}
```

### Filtre par catégorie

```
GET /api/articles?category=finance
GET /api/articles?category=507f1f77bcf86cd799439011
```

Accepte le slug ou l'ID MongoDB.

### Recherche textuelle

```
GET /api/articles?search=aviation
```

Recherche dans : `title`, `content`, `excerpt`, `tags` (insensible à la casse)

---

## 🚀 Configuration Vercel

### Variables d'environnement requises

Dans **Vercel Dashboard → Settings → Environment Variables** :

| Variable | Valeur | Environnements |
|----------|--------|----------------|
| `MONGODB_URI` | `mongodb+srv://...` | Production, Preview, Development |
| `ALLOWED_ORIGINS` | `http://localhost:5173,https://xcafrique.org,https://xcafrique-frontend.vercel.app` | Production |
| `NODE_ENV` | `production` | Production |
| `JWT_SECRET` | `votre_secret_securise` | Production, Preview, Development |
| `JWT_EXPIRE` | `7d` | Production, Preview, Development |

### Fichier `vercel.json`

Le fichier `vercel.json` est déjà configuré :

```json
{
  "version": 2,
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

---

## ✅ Checklist de vérification

### Configuration CORS
- [x] Autorise `http://localhost:5173` en développement
- [x] Autorise `https://xcafrique.org` en production
- [x] Support des wildcards pour Vercel previews
- [x] Configuration via variables d'environnement

### Endpoints requis
- [x] `GET /api/articles` - Liste des articles
- [x] `GET /api/articles/:slug` - Détails article
- [x] `GET /api/categories` - Liste catégories
- [x] `GET /api/categories/:id` - Détails catégorie

### Structure des réponses
- [x] Format `{ success, data, ... }` standardisé
- [x] Pagination avec `count`, `total`, `page`, `pages`
- [x] Codes HTTP appropriés (200, 404, 500)
- [x] Messages d'erreur descriptifs

### Données
- [x] Articles utilisent des slugs (pas IDs)
- [x] Seuls les articles publiés sont retournés
- [x] Catégories populées (objets complets)
- [x] Filtres et recherche fonctionnels

---

## 🧪 Tests

### Test 1 : Vérifier le backend

```bash
curl https://xcafrique-backend.vercel.app/api/articles
```

### Test 2 : Vérifier CORS

```bash
curl -H "Origin: https://xcafrique.org" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://xcafrique-backend.vercel.app/api/articles
```

### Test 3 : Vérifier les endpoints

```bash
# Articles
curl https://xcafrique-backend.vercel.app/api/articles
curl https://xcafrique-backend.vercel.app/api/articles/example-slug

# Catégories
curl https://xcafrique-backend.vercel.app/api/categories
```

---

## 📚 Documentation complète

- **API Frontend** : `FRONTEND_API_DOCUMENTATION.md`
- **Déploiement Vercel** : `VERCEL_DEPLOYMENT.md`
- **Configuration CORS** : `CORS_FIX.md`

---

## 🔄 Prochaines étapes (optionnel)

Si vous avez besoin des endpoints optionnels :

1. **Décommenter les routes** dans `server.js` :
   ```javascript
   app.use('/api/contact', contactRoutes);
   app.use('/api/newsletter', newsletterRoutes);
   ```

2. **Créer l'endpoint `/api/videos`** si nécessaire

3. **Configurer les variables d'environnement** pour les services optionnels

---

**Le backend est configuré et prêt pour le frontend XCAfrique !** ✅

