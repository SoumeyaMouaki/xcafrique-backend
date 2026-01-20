# 🚀 Comment Publier un Article en Production

## ✅ Méthode Simple (Recommandée)

**Une seule commande pour tout faire :**

```bash
node scripts/publish.js article2.json
```

Ce script :
- ✅ Publie l'article dans la base MongoDB de production
- ✅ Vérifie automatiquement que tout fonctionne
- ✅ Teste l'API pour confirmer
- ✅ Vous donne les URLs directes

---

## 📋 Prérequis

### 1. Configurer MONGODB_URI_PROD dans votre .env

**⚠️ IMPORTANT :** Utilisez la **MÊME URI** que celle configurée dans Vercel !

1. **Récupérer l'URI depuis Vercel :**
   - Allez sur https://vercel.com
   - Sélectionnez votre projet backend
   - Allez dans **Settings** → **Environment Variables**
   - Copiez la valeur de `MONGODB_URI` (elle commence par `mongodb+srv://`)

2. **Ajouter dans votre `.env` :**
   ```env
   MONGODB_URI_PROD=mongodb+srv://votre-uri-atlas-de-vercel
   ```
   
   ⚠️ **Note :** Le script détecte automatiquement si vous utilisez `localhost` et vous avertira. 
   Vous DEVEZ utiliser une URI MongoDB Atlas (mongodb+srv://...) pour que l'article apparaisse sur le site de production.

---

## 📝 Étapes de Publication

### Étape 1 : Préparer votre article

Placez votre fichier JSON dans :
```
Prod/articles/ready-to-publish/article2.json
```

### Étape 2 : Publier

```bash
node scripts/publish.js article2.json
```

### Étape 3 : Vérifier

Le script vérifie automatiquement, mais vous pouvez aussi vérifier manuellement :

- **Via l'API :** https://xcafrique-backend.vercel.app/api/articles/article2
- **Sur le site :** https://xcafrique.org/articles/article2

---

## 🔧 Scripts Disponibles

| Script | Description |
|--------|-------------|
| `publish.js` | **⭐ Script principal** - Publie directement en production |
| `publishArticleToProduction.js` | Ancien script (utilise MONGODB_URI_PROD) |
| `checkArticleInProduction.js` | Vérifie si un article existe en production |
| `testProductionAPI.js` | Teste l'API de production |

---

## ❓ Problèmes Courants

### "Vous utilisez une base MongoDB LOCALE !"

**Solution :** 
1. Récupérez l'URI MongoDB Atlas depuis Vercel (Settings → Environment Variables → MONGODB_URI)
2. Ajoutez-la dans votre `.env` comme `MONGODB_URI_PROD=mongodb+srv://...`
3. Le script détectera automatiquement et utilisera la bonne base

### "MONGODB_URI_PROD ou MONGODB_URI n'est pas défini"

**Solution :** Ajoutez `MONGODB_URI_PROD` dans votre fichier `.env` avec la même valeur que celle de Vercel.

### "L'article n'apparaît pas sur le site"

**Vérifications :**
1. ✅ L'article a été publié avec succès (message de confirmation)
2. ✅ Attendez 1-2 minutes (cache Vercel)
3. ✅ Vérifiez directement l'API : `https://xcafrique-backend.vercel.app/api/articles/votre-slug`
4. ✅ Vérifiez que `MONGODB_URI` dans `.env` = `MONGODB_URI` dans Vercel

### "Erreur de connexion MongoDB"

**Solutions :**
1. Vérifiez que votre IP est autorisée dans MongoDB Atlas
2. Vérifiez que l'URI est correcte
3. Vérifiez la connexion Internet

---

## 💡 Astuce

Pour publier plusieurs articles rapidement :

```bash
node scripts/publish.js article1.json
node scripts/publish.js article2.json
node scripts/publish.js article3.json
```

---

## 📞 Support

Si le problème persiste :
1. Vérifiez les logs du script
2. Vérifiez les logs Vercel (Dashboard → Deployments → Logs)
3. Vérifiez que `MONGODB_URI` est identique dans `.env` et Vercel

