# 🔍 Guide de Débogage - Erreur 503 MongoDB sur Vercel

## Problème
L'API retourne parfois une erreur 503 "Erreur de connexion à la base de données" même si CORS fonctionne.

## Causes possibles

### 1. Connexions MongoDB limitées
MongoDB Atlas a des limites sur le nombre de connexions simultanées selon votre plan :
- **Free (M0)** : 500 connexions max
- **Shared (M2/M5)** : Plus de connexions

### 2. Timeout de connexion
Les fonctions serverless Vercel ont des timeouts courts. MongoDB Atlas peut prendre du temps à répondre.

### 3. Pool de connexions épuisé
Si trop de connexions sont ouvertes sans être fermées, le pool se remplit.

## Solutions

### Solution 1 : Vérifier les logs Vercel

1. **Vercel Dashboard** → Votre projet → **Functions** → **Logs**
2. Cherchez les erreurs MongoDB récentes
3. L'erreur devrait indiquer :
   - Timeout de connexion
   - Trop de connexions
   - IP non autorisée
   - Autre erreur

### Solution 2 : Vérifier MongoDB Atlas

1. **MongoDB Atlas Dashboard** → **Metrics**
2. Vérifiez :
   - **Connections** : Nombre de connexions actives
   - **Network** : Si les requêtes passent
   - **Errors** : Erreurs de connexion

### Solution 3 : Optimiser la connexion MongoDB

Le code actuel utilise déjà un cache de connexion, mais on peut améliorer :

```javascript
// config/database.js
const mongoose = require('mongoose');

// Augmenter le pool de connexions
const options = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10, // Nombre max de connexions dans le pool
  minPoolSize: 2,  // Nombre min de connexions dans le pool
};
```

### Solution 4 : Vérifier la whitelist MongoDB Atlas

Assurez-vous que `0.0.0.0/0` est bien dans la whitelist :
1. https://cloud.mongodb.com/v2#/security/network/whitelist
2. Vérifiez que `0.0.0.0/0` est présent
3. Si non, ajoutez-le

### Solution 5 : Redémarrer les fonctions Vercel

Parfois, les fonctions Vercel gardent des connexions ouvertes. Redéployez :
1. **Vercel Dashboard** → **Deployments**
2. Cliquez sur les trois points du dernier déploiement
3. **Redeploy**

## Test de diagnostic

Pour tester si c'est intermittent :

```bash
# Tester plusieurs fois
for i in {1..10}; do
  echo "Test $i"
  node scripts/testArticlesList.js
  sleep 2
done
```

Si certaines requêtes passent et d'autres non, c'est un problème de pool de connexions.

## Vérifications rapides

- [ ] `0.0.0.0/0` dans MongoDB Atlas Network Access
- [ ] `MONGODB_URI` correct sur Vercel
- [ ] Pas de limite de connexions atteinte dans MongoDB Atlas
- [ ] Logs Vercel consultés pour l'erreur exacte
- [ ] Backend redéployé récemment

