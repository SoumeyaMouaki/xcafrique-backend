# ⚡ Correction CORS Rapide - Vercel

## 🚨 Problème

```
Access to XMLHttpRequest at 'https://xcafrique-backend.vercel.app/api/articles' 
from origin 'https://xcafrique-frontend.vercel.app' has been blocked by CORS policy
```

## ✅ Solution en 2 minutes

### Option 1 : Configuration Vercel (Recommandé)

1. **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**

2. **Ajoutez cette variable :**

   **Key :** `ALLOWED_ORIGINS`  
   **Value :** `https://xcafrique-frontend.vercel.app,https://xcafrique.org`  
   **Environments :** ✅ Production, ✅ Preview

3. **Redéployez** : Deployments → ⋯ → Redeploy

### Option 2 : Utiliser les valeurs par défaut

Le backend autorise maintenant automatiquement (sans configuration) :
- ✅ `https://xcafrique-frontend.vercel.app`
- ✅ `https://.*\.vercel\.app` (tous les preview deployments)

**Si ça ne fonctionne pas**, c'est que le backend n'a pas été redéployé avec les dernières modifications.

---

## 🔍 Vérification rapide

### Test 1 : Backend direct
```
https://xcafrique-backend.vercel.app/api/articles
```
Doit retourner du JSON.

### Test 2 : Depuis le frontend
Ouvrez la console du navigateur :
```javascript
fetch('https://xcafrique-backend.vercel.app/api/articles')
  .then(r => r.json())
  .then(console.log)
```
Doit fonctionner sans erreur CORS.

---

## 📋 Checklist

- [ ] Variable `ALLOWED_ORIGINS` ajoutée dans Vercel (optionnel mais recommandé)
- [ ] Backend redéployé avec les dernières modifications
- [ ] Test depuis le frontend réussi

---

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs Vercel** : Dashboard → Deployments → Logs
   - Cherchez `⚠️ Origine non autorisée`
   - Vérifiez les origines listées

2. **Vérifiez que le backend est à jour** : Le code doit inclure le support des wildcards

3. **Testez avec curl** :
   ```bash
   curl -H "Origin: https://xcafrique-frontend.vercel.app" \
        https://xcafrique-backend.vercel.app/api/articles
   ```

---

**Le backend devrait maintenant autoriser automatiquement le frontend Vercel !** ✅

