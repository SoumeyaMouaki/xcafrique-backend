# 🚀 Configuration Vercel - XC Afrique Backend

## ✅ Configuration effectuée

### 1. Fichier `api/index.js` créé
Point d'entrée pour Vercel Serverless Functions qui importe l'app Express.

### 2. `vercel.json` mis à jour
Configuration avec `@vercel/node` pour gérer Express.

### 3. `server.js` modifié
- Ne démarre le serveur que localement (pas sur Vercel)
- Exporte l'app Express pour Vercel

### 4. `config/database.js` amélioré
- Cache de connexion pour éviter les reconnexions multiples
- Gestion des erreurs améliorée pour Vercel

---

## 📋 Variables d'environnement requises

Dans **Vercel Dashboard → Settings → Environment Variables**, configurez :

### Obligatoires
```env
MONGODB_URI=mongodb+srv://dawini-user:2005Xad5@cluster0.kcwr1dx.mongodb.net/XCAfrique
NODE_ENV=production
```

### Optionnelles (recommandées)
```env
ALLOWED_ORIGINS=https://xcafrique-frontend.vercel.app,https://xcafrique.org
JWT_SECRET=votre_secret_securise
JWT_EXPIRE=7d
```

---

## 🔍 Vérification après déploiement

### 1. Vérifier les logs Vercel
Dashboard → Deployments → Logs

Cherchez :
- ✅ `MongoDB connecté` (pas d'erreur)
- ✅ Pas d'erreur `FUNCTION_INVOCATION_FAILED`

### 2. Tester les endpoints
```bash
# Test de base
curl https://xcafrique-backend.vercel.app/

# Test articles
curl https://xcafrique-backend.vercel.app/api/articles

# Test catégories
curl https://xcafrique-backend.vercel.app/api/categories
```

### 3. Vérifier CORS
```bash
curl -H "Origin: https://xcafrique-frontend.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://xcafrique-backend.vercel.app/api/articles
```

---

## 🐛 Dépannage

### Erreur 500: FUNCTION_INVOCATION_FAILED

**Causes possibles :**
1. `MONGODB_URI` non défini → Vérifier les variables d'environnement
2. Connexion MongoDB échoue → Vérifier l'URI et les permissions MongoDB Atlas
3. Erreur dans le code → Vérifier les logs Vercel

**Solutions :**
1. Vérifier que `MONGODB_URI` est bien configuré dans Vercel
2. Vérifier que MongoDB Atlas autorise les connexions depuis Vercel (Network Access)
3. Vérifier les logs Vercel pour l'erreur exacte

### Erreur de connexion MongoDB

**Vérifier :**
1. L'URI MongoDB est correcte
2. MongoDB Atlas autorise les connexions depuis `0.0.0.0/0` (toutes les IPs)
3. Les credentials sont corrects

---

## 📝 Structure des fichiers

```
.
├── api/
│   └── index.js          # Point d'entrée Vercel
├── server.js              # App Express (modifié pour Vercel)
├── vercel.json            # Configuration Vercel
└── config/
    └── database.js        # Connexion MongoDB (améliorée)
```

---

## ✅ Checklist de déploiement

- [x] Fichier `api/index.js` créé
- [x] `vercel.json` configuré avec `@vercel/node`
- [x] `server.js` modifié pour Vercel
- [x] `config/database.js` amélioré avec cache
- [ ] Variables d'environnement configurées sur Vercel
- [ ] MongoDB Atlas autorise les connexions depuis Vercel
- [ ] Backend redéployé
- [ ] Tests des endpoints réussis

---

**Après configuration, redéployez le backend sur Vercel !** 🚀

