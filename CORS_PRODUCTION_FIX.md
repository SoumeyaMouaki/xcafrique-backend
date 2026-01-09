# 🔧 Correction CORS en Production - Vercel

## 🚨 Problème

Toutes les requêtes depuis `https://xcafrique-frontend.vercel.app` sont bloquées par CORS :
```
Access to XMLHttpRequest at 'https://xcafrique-backend.vercel.app/api/articles' 
from origin 'https://xcafrique-frontend.vercel.app' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ Solution : Configuration Vercel

### Étape 1 : Configurer les variables d'environnement

Dans **Vercel Dashboard → Votre projet → Settings → Environment Variables**, ajoutez :

**Variable :** `ALLOWED_ORIGINS`  
**Valeur :** 
```
https://xcafrique-frontend.vercel.app,https://xcafrique.org,https://www.xcafrique.org
```

**Environnements :** Production, Preview, Development

### Étape 2 : Vérifier NODE_ENV

Assurez-vous que `NODE_ENV=production` est configuré en production.

**Variable :** `NODE_ENV`  
**Valeur :** `production`  
**Environnements :** Production uniquement

### Étape 3 : Redéployer

Après avoir ajouté les variables :
1. Allez dans **Deployments**
2. Cliquez sur les trois points (⋯) du dernier déploiement
3. Cliquez sur **Redeploy**

---

## 🔍 Vérification

### Test 1 : Vérifier les variables d'environnement

Les logs Vercel devraient maintenant afficher (en cas d'erreur CORS) :
```
⚠️  Origine non autorisée: https://xcafrique-frontend.vercel.app
   Origines autorisées: https://xcafrique-frontend.vercel.app,https://xcafrique.org
   NODE_ENV: production
```

### Test 2 : Tester CORS

```bash
curl -H "Origin: https://xcafrique-frontend.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://xcafrique-backend.vercel.app/api/articles
```

**Réponse attendue :**
```
Access-Control-Allow-Origin: https://xcafrique-frontend.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Test 3 : Tester depuis le frontend

Ouvrez la console du navigateur et testez :
```javascript
fetch('https://xcafrique-backend.vercel.app/api/articles')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

---

## 📋 Checklist

- [ ] Variable `ALLOWED_ORIGINS` configurée dans Vercel
- [ ] Variable `NODE_ENV=production` configurée
- [ ] Backend redéployé après configuration
- [ ] Test CORS réussi
- [ ] Frontend peut appeler l'API

---

## 🐛 Si ça ne fonctionne toujours pas

### 1. Vérifier les logs Vercel

Dans **Vercel Dashboard → Deployments → Logs**, cherchez :
- Les messages d'erreur CORS
- Les origines autorisées listées
- La valeur de `NODE_ENV`

### 2. Vérifier la variable d'environnement

Assurez-vous que `ALLOWED_ORIGINS` contient exactement :
```
https://xcafrique-frontend.vercel.app
```

Sans espaces, sans slash final.

### 3. Tester avec curl

```bash
# Test simple
curl https://xcafrique-backend.vercel.app/api/articles

# Test avec origine
curl -H "Origin: https://xcafrique-frontend.vercel.app" \
     https://xcafrique-backend.vercel.app/api/articles
```

### 4. Vérifier le format de l'URL

L'URL doit être exactement :
- ✅ `https://xcafrique-frontend.vercel.app` (sans slash final)
- ❌ `https://xcafrique-frontend.vercel.app/` (avec slash)

---

## 🔄 Alternative : Autoriser toutes les origines Vercel

Si vous voulez autoriser tous les preview deployments automatiquement, le backend supporte maintenant le pattern :
```
https://.*\.vercel\.app
```

Cela autorisera automatiquement tous les domaines `*.vercel.app`.

---

**Après configuration des variables et redéploiement, le CORS devrait fonctionner !** ✅

