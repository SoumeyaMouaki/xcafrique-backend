# 🚀 Configuration CORS Vercel - Guide Rapide

## ⚠️ Problème actuel

Les requêtes depuis `https://xcafrique-frontend.vercel.app` sont bloquées par CORS.

## ✅ Solution en 3 étapes

### Étape 1 : Aller sur Vercel Dashboard

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet **xcafrique-backend**
3. Cliquez sur **Settings**
4. Cliquez sur **Environment Variables** dans le menu latéral

### Étape 2 : Ajouter les variables d'environnement

Cliquez sur **Add New** et ajoutez ces variables :

#### Variable 1 : ALLOWED_ORIGINS

**Key :** `ALLOWED_ORIGINS`  
**Value :** 
```
https://xcafrique-frontend.vercel.app,https://xcafrique.org,https://www.xcafrique.org
```

**Environments :** ✅ Production, ✅ Preview, ✅ Development

#### Variable 2 : NODE_ENV (si pas déjà défini)

**Key :** `NODE_ENV`  
**Value :** `production`  
**Environments :** ✅ Production uniquement

### Étape 3 : Redéployer

1. Allez dans **Deployments**
2. Cliquez sur les trois points (⋯) du dernier déploiement
3. Cliquez sur **Redeploy**

---

## 🔍 Vérification

### Test rapide

Ouvrez dans votre navigateur :
```
https://xcafrique-backend.vercel.app/api/articles
```

Vous devriez voir du JSON (pas d'erreur CORS).

### Test depuis le frontend

Dans la console du navigateur sur le frontend :
```javascript
fetch('https://xcafrique-backend.vercel.app/api/articles')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**Résultat attendu :** JSON avec les articles (pas d'erreur CORS).

---

## 📋 Variables d'environnement complètes

Pour un fonctionnement optimal, configurez toutes ces variables :

| Variable | Valeur | Environnements |
|----------|--------|----------------|
| `MONGODB_URI` | `mongodb+srv://...` | Production, Preview, Development |
| `ALLOWED_ORIGINS` | `https://xcafrique-frontend.vercel.app,https://xcafrique.org` | Production, Preview |
| `NODE_ENV` | `production` | Production |
| `JWT_SECRET` | `votre_secret` | Production, Preview, Development |
| `JWT_EXPIRE` | `7d` | Production, Preview, Development |

---

## 🐛 Dépannage

### Erreur persiste après configuration

1. **Vérifiez les logs Vercel** : Dashboard → Deployments → Logs
   - Cherchez les messages `⚠️ Origine non autorisée`
   - Vérifiez les origines autorisées listées

2. **Vérifiez le format de la variable** :
   - ✅ Correct : `https://xcafrique-frontend.vercel.app,https://xcafrique.org`
   - ❌ Incorrect : `https://xcafrique-frontend.vercel.app/, https://xcafrique.org` (espaces, slash final)

3. **Vérifiez que vous avez redéployé** après avoir ajouté les variables

4. **Testez avec curl** :
   ```bash
   curl -H "Origin: https://xcafrique-frontend.vercel.app" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS \
        https://xcafrique-backend.vercel.app/api/articles
   ```

---

## 💡 Note importante

Le backend autorise maintenant automatiquement :
- `https://xcafrique-frontend.vercel.app` (valeur par défaut)
- `https://.*\.vercel\.app` (tous les preview deployments Vercel)

Mais il est **recommandé** de configurer `ALLOWED_ORIGINS` explicitement pour plus de contrôle.

---

**Après ces 3 étapes, le CORS devrait fonctionner !** ✅

