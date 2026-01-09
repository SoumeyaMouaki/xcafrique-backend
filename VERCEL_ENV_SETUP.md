# 🔧 Configuration Variables d'Environnement Vercel

## ⚠️ Erreur actuelle

```
❌ Erreur: MONGODB_URI n'est pas défini dans les variables d'environnement
```

## ✅ Solution : Configurer les variables dans Vercel

### Étape 1 : Aller sur Vercel Dashboard

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet **xcafrique-backend**
3. Cliquez sur **Settings** (Paramètres)
4. Cliquez sur **Environment Variables** dans le menu latéral

### Étape 2 : Ajouter les variables

Cliquez sur **Add New** et ajoutez ces variables **une par une** :

#### Variable 1 : MONGODB_URI (OBLIGATOIRE)

**Key :** `MONGODB_URI`  
**Value :** `mongodb+srv://dawini-user:2005Xad5@cluster0.kcwr1dx.mongodb.net/XCAfrique`  
**Environments :** ✅ Production, ✅ Preview, ✅ Development

#### Variable 2 : NODE_ENV

**Key :** `NODE_ENV`  
**Value :** `production`  
**Environments :** ✅ Production uniquement

#### Variable 3 : ALLOWED_ORIGINS (Recommandé)

**Key :** `ALLOWED_ORIGINS`  
**Value :** `https://xcafrique-frontend.vercel.app,https://xcafrique.org,https://www.xcafrique.org`  
**Environments :** ✅ Production, ✅ Preview

#### Variable 4 : JWT_SECRET (Si vous utilisez l'authentification)

**Key :** `JWT_SECRET`  
**Value :** `votre_secret_jwt_securise` (générez un secret aléatoire)  
**Environments :** ✅ Production, ✅ Preview, ✅ Development

#### Variable 5 : JWT_EXPIRE (Si vous utilisez l'authentification)

**Key :** `JWT_EXPIRE`  
**Value :** `7d`  
**Environments :** ✅ Production, ✅ Preview, ✅ Development

### Étape 3 : Redéployer

Après avoir ajouté toutes les variables :

1. Allez dans **Deployments**
2. Cliquez sur les trois points (⋯) du dernier déploiement
3. Cliquez sur **Redeploy**

**OU** commitez et poussez un changement pour déclencher un nouveau déploiement.

---

## 🔍 Vérification

### Vérifier que les variables sont bien configurées

1. Allez dans **Settings → Environment Variables**
2. Vous devriez voir toutes les variables listées
3. Vérifiez que `MONGODB_URI` est bien présent

### Vérifier les logs après redéploiement

1. Allez dans **Deployments → Logs**
2. Cherchez : `✅ MongoDB connecté` (pas d'erreur)
3. Si vous voyez encore l'erreur, vérifiez que :
   - La variable `MONGODB_URI` est bien ajoutée
   - Vous avez redéployé après avoir ajouté la variable

---

## 🐛 Si l'erreur persiste

### 1. Vérifier le format de MONGODB_URI

L'URI doit être exactement :
```
mongodb+srv://dawini-user:2005Xad5@cluster0.kcwr1dx.mongodb.net/XCAfrique
```

**Points importants :**
- Pas d'espaces avant/après
- Pas de guillemets
- Format exact comme ci-dessus

### 2. Vérifier MongoDB Atlas

Dans **MongoDB Atlas → Network Access** :
- Autorisez les connexions depuis `0.0.0.0/0` (toutes les IPs)
- OU ajoutez les IPs de Vercel

### 3. Vérifier les permissions MongoDB

Assurez-vous que l'utilisateur `dawini-user` a les permissions nécessaires.

---

## 📋 Checklist

- [ ] Variable `MONGODB_URI` ajoutée dans Vercel
- [ ] Variable `NODE_ENV=production` ajoutée
- [ ] Variable `ALLOWED_ORIGINS` ajoutée (recommandé)
- [ ] Backend redéployé après configuration
- [ ] MongoDB Atlas autorise les connexions depuis Vercel
- [ ] Logs Vercel montrent `✅ MongoDB connecté` (pas d'erreur)

---

## 💡 Note importante

**Les variables d'environnement doivent être configurées dans Vercel Dashboard**, pas dans un fichier `.env` (qui n'est pas utilisé par Vercel en production).

Le fichier `.env` est uniquement pour le développement local.

---

**Après avoir configuré `MONGODB_URI` dans Vercel et redéployé, l'erreur devrait disparaître !** ✅

