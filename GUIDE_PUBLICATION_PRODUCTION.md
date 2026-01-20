# 📋 Guide de Publication en Production

## ⚠️ Problème : Article non visible sur le site de production

Si votre article n'apparaît pas sur votre site en production, voici les étapes pour résoudre le problème.

---

## 🔍 Diagnostic

### 1. Vérifier que l'article existe dans la base de production

```bash
node scripts/checkArticleInProduction.js asky-togo-et-taag-angola-lancent-leurs-ateliers-mro-independants-pour-renforcer-l-aviation-africaine-en-2026
```

### 2. Tester l'API de production

```bash
node scripts/testProductionAPI.js
```

---

## 🚨 Problème identifié

**Vercel utilise probablement une base MongoDB différente** de celle configurée localement.

### Solution 1 : Utiliser MONGODB_URI_PROD

1. **Vérifier la variable d'environnement dans Vercel :**
   - Allez sur https://vercel.com
   - Sélectionnez votre projet
   - Allez dans Settings > Environment Variables
   - Vérifiez la valeur de `MONGODB_URI` (c'est celle utilisée par Vercel)

2. **Configurer MONGODB_URI_PROD localement :**
   
   Ajoutez dans votre fichier `.env` :
   ```env
   MONGODB_URI_PROD=mongodb+srv://votre-uri-de-production
   ```
   
   ⚠️ **IMPORTANT** : Utilisez la **même URI** que celle configurée dans Vercel.

3. **Republier l'article :**
   ```bash
   node scripts/publishArticleToProduction.js article2.json
   ```

### Solution 2 : Publier directement avec l'URI de production

Si vous ne voulez pas modifier votre `.env`, vous pouvez passer l'URI directement :

```bash
$env:MONGODB_URI_PROD="mongodb+srv://votre-uri"; node scripts/publishArticleToProduction.js article2.json
```

---

## ✅ Vérifications après publication

### 1. Vérifier dans MongoDB
```bash
node scripts/checkArticleInProduction.js asky-togo-et-taag-angola-lancent-leurs-ateliers-mro-independants-pour-renforcer-l-aviation-africaine-en-2026
```

### 2. Vérifier via l'API
```bash
node scripts/testProductionAPI.js
```

### 3. Vérifier directement dans le navigateur
- Ouvrez : `https://xcafrique-backend.vercel.app/api/articles`
- Cherchez votre article dans la liste
- Ou directement : `https://xcafrique-backend.vercel.app/api/articles/asky-togo-et-taag-angola-lancent-leurs-ateliers-mro-independants-pour-renforcer-l-aviation-africaine-en-2026`

---

## 🔧 Scripts disponibles

| Script | Description |
|--------|-------------|
| `publishArticleToProduction.js` | Publie un article dans la base de production |
| `checkArticleInProduction.js` | Vérifie si un article existe dans la base de production |
| `testProductionAPI.js` | Teste l'API de production |
| `updateProductionArticle.js` | Met à jour un article existant en production |

---

## 📝 Notes importantes

1. **Deux bases MongoDB différentes :**
   - **Base locale** : Utilisée par `publishArticle.js` (MONGODB_URI)
   - **Base production** : Utilisée par Vercel et `publishArticleToProduction.js` (MONGODB_URI_PROD)

2. **Cache Vercel :**
   - Après publication, attendez 1-2 minutes pour que le cache Vercel se mette à jour
   - Vous pouvez forcer le rafraîchissement avec Ctrl+F5 dans le navigateur

3. **Vérification de la base utilisée :**
   - Le script `checkArticleInProduction.js` vous indique quelle base est utilisée
   - Si vous voyez "⚠️ ATTENTION: Utilisation de MONGODB_URI", vous n'utilisez pas la bonne base

---

## 🆘 Si le problème persiste

1. **Vérifiez les logs Vercel :**
   - Allez dans votre projet Vercel > Deployments > Cliquez sur le dernier déploiement > Logs
   - Cherchez les erreurs de connexion MongoDB

2. **Vérifiez la connexion MongoDB :**
   - Testez la connexion avec MongoDB Compass ou un client MongoDB
   - Vérifiez que l'IP est autorisée dans MongoDB Atlas (Network Access)

3. **Vérifiez les variables d'environnement Vercel :**
   - Assurez-vous que `MONGODB_URI` est bien définie dans Vercel
   - Vérifiez qu'elle pointe vers la bonne base de données

---

## 📞 Support

Si le problème persiste après avoir suivi ces étapes, vérifiez :
- Les logs Vercel pour les erreurs
- La console du navigateur pour les erreurs CORS ou API
- Que la base MongoDB est accessible depuis Internet

