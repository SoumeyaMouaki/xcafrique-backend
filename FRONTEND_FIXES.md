# 🔧 Corrections Frontend - Problèmes détectés

## 🚨 Problèmes identifiés

### 1. Double `/api/api/` dans l'URL

**Erreur :**
```
POST https://xcafrique-backend.vercel.app/api/api/contact
```

**Cause :** Le frontend ajoute `/api` alors que l'URL de base contient déjà `/api`.

**Solution :** Vérifier la configuration de l'URL de base dans le frontend.

**Dans votre code frontend, vérifiez :**

```javascript
// ❌ Incorrect - double /api
const API_BASE_URL = 'https://xcafrique-backend.vercel.app/api';
const response = await axios.post(`${API_BASE_URL}/api/contact`, data);

// ✅ Correct - URL de base sans /api
const API_BASE_URL = 'https://xcafrique-backend.vercel.app';
const response = await axios.post(`${API_BASE_URL}/api/contact`, data);

// Ou si vous utilisez une URL relative avec proxy
const response = await axios.post('/api/contact', data);
```

---

### 2. Erreur CORS pour `/api/contact`

**Erreur :**
```
Access to XMLHttpRequest at 'https://xcafrique-backend.vercel.app/api/api/contact' 
from origin 'https://xcafrique-frontend.vercel.app' has been blocked by CORS policy
```

**Causes :**
1. Double `/api/api/` (voir problème 1)
2. L'origine `https://xcafrique-frontend.vercel.app` doit être autorisée

**Solution :** 

Le backend autorise maintenant automatiquement :
- `https://xcafrique-frontend.vercel.app`
- `https://*.vercel.app` (tous les preview deployments)

**Vérifiez dans Vercel Dashboard → Settings → Environment Variables :**

```env
ALLOWED_ORIGINS=https://xcafrique-frontend.vercel.app,https://xcafrique.org,https://*.vercel.app
```

---

### 3. Erreur 500 sur `/api/newsletter/stream`

**Erreur :**
```
GET https://xcafrique-backend.vercel.app/api/newsletter/stream net::ERR_FAILED 500
```

**Cause :** La route existe maintenant (activée), mais peut-être un problème de configuration SSE.

**Solution :** La route est maintenant activée. Si l'erreur persiste, vérifiez les logs Vercel.

---

## ✅ Corrections appliquées côté backend

### 1. Routes activées

Les routes suivantes sont maintenant actives :
- ✅ `/api/contact` - Formulaire de contact
- ✅ `/api/newsletter` - Newsletter (toutes les routes, y compris `/stream`)

### 2. CORS amélioré

Le backend autorise maintenant :
- `https://xcafrique-frontend.vercel.app`
- `https://*.vercel.app` (wildcard pour preview deployments)

### 3. Route racine mise à jour

La route `/` liste maintenant tous les endpoints disponibles.

---

## 🔧 Actions requises côté frontend

### 1. Corriger l'URL de base

**Trouvez votre fichier de configuration API** (ex: `src/config/api.js` ou `src/api/index.js`) :

```javascript
// ❌ AVANT (incorrect - double /api)
const API_BASE_URL = 'https://xcafrique-backend.vercel.app/api';
axios.post(`${API_BASE_URL}/api/contact`, data);

// ✅ APRÈS (correct)
const API_BASE_URL = 'https://xcafrique-backend.vercel.app';
axios.post(`${API_BASE_URL}/api/contact`, data);
```

### 2. Vérifier les appels API

**Cherchez dans votre code frontend :**
```javascript
// Recherchez les occurrences de :
'/api/api/'
'api/api/'
```

**Remplacez par :**
```javascript
'/api/'
```

### 3. Configuration Axios

Si vous utilisez Axios avec `baseURL` :

```javascript
// ❌ Incorrect
const api = axios.create({
  baseURL: 'https://xcafrique-backend.vercel.app/api'
});
api.post('/api/contact', data);  // Devient /api/api/contact

// ✅ Correct
const api = axios.create({
  baseURL: 'https://xcafrique-backend.vercel.app/api'
});
api.post('/contact', data);  // Devient /api/contact

// Ou
const api = axios.create({
  baseURL: 'https://xcafrique-backend.vercel.app'
});
api.post('/api/contact', data);  // Devient /api/contact
```

---

## 📋 Checklist de vérification

### Backend
- [x] Routes `/api/contact` et `/api/newsletter` activées
- [x] CORS configuré pour `https://xcafrique-frontend.vercel.app`
- [x] Support des wildcards `*.vercel.app`
- [x] Route racine mise à jour

### Frontend (à faire)
- [ ] Vérifier l'URL de base (pas de double `/api/api/`)
- [ ] Tester `/api/contact` (devrait fonctionner)
- [ ] Tester `/api/newsletter/stream` (devrait fonctionner)
- [ ] Vérifier les variables d'environnement Vercel

---

## 🧪 Tests

### Test 1 : Contact

```bash
curl -X POST https://xcafrique-backend.vercel.app/api/contact \
  -H "Content-Type: application/json" \
  -H "Origin: https://xcafrique-frontend.vercel.app" \
  -d '{
    "name": "Test",
    "email": "test@example.com",
    "subject": "Test",
    "message": "Message de test"
  }'
```

### Test 2 : Newsletter Stream

```bash
curl -H "Origin: https://xcafrique-frontend.vercel.app" \
     https://xcafrique-backend.vercel.app/api/newsletter/stream
```

### Test 3 : CORS

```bash
curl -H "Origin: https://xcafrique-frontend.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://xcafrique-backend.vercel.app/api/contact
```

---

## 🆘 Si les problèmes persistent

1. **Vérifiez les logs Vercel** : Dashboard → Deployments → Logs
2. **Vérifiez les variables d'environnement** : `ALLOWED_ORIGINS` doit contenir le frontend
3. **Redéployez le backend** après les modifications
4. **Vérifiez l'URL exacte** appelée dans les DevTools Network

---

**Les routes sont maintenant activées. Corrigez l'URL de base dans le frontend pour éviter le double `/api/api/` !** ✅

