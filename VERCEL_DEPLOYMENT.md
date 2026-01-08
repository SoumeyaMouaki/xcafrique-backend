# 🚀 Guide de déploiement sur Vercel - XC Afrique Backend

## ⚠️ Problème courant

Si vous voyez cette erreur :
```
Erreur de connexion à MongoDB: The `uri` parameter to `openUri()` must be a string, got "undefined"
```

Cela signifie que la variable d'environnement `MONGODB_URI` n'est pas configurée sur Vercel.

## ✅ Solution : Configurer les variables d'environnement

### Méthode 1 : Via l'interface Vercel (Recommandé)

1. **Allez sur votre projet Vercel**
   - https://vercel.com/dashboard
   - Sélectionnez votre projet `xcafrique-backend`

2. **Accédez aux Settings**
   - Cliquez sur **Settings** dans le menu
   - Cliquez sur **Environment Variables** dans le menu latéral

3. **Ajoutez les variables d'environnement**

   Cliquez sur **Add New** et ajoutez :

   | Variable | Valeur | Environnements |
   |----------|--------|----------------|
   | `MONGODB_URI` | `mongodb+srv://username:password@cluster.mongodb.net/xcafrique` | Production, Preview, Development |
   | `NODE_ENV` | `production` | Production |
   | `JWT_SECRET` | `votre_secret_jwt_securise` | Production, Preview, Development |
   | `JWT_EXPIRE` | `7d` | Production, Preview, Development |
   | `FRONTEND_URL` | `https://votre-frontend.vercel.app` | Production, Preview, Development |

4. **Redéployez**
   - Allez dans **Deployments**
   - Cliquez sur les trois points (⋯) du dernier déploiement
   - Cliquez sur **Redeploy**

### Méthode 2 : Via Vercel CLI

```bash
# Installer Vercel CLI si ce n'est pas déjà fait
npm i -g vercel

# Se connecter
vercel login

# Ajouter les variables d'environnement
vercel env add MONGODB_URI production
# Collez votre URI MongoDB quand demandé

vercel env add NODE_ENV production
# Entrez: production

vercel env add JWT_SECRET production
# Entrez votre secret JWT

vercel env add FRONTEND_URL production
# Entrez l'URL de votre frontend

# Redéployer
vercel --prod
```

### Méthode 3 : Via `vercel.json` (Non recommandé pour les secrets)

⚠️ **Ne mettez JAMAIS de secrets dans `vercel.json` !**

Utilisez uniquement pour les variables non sensibles :

```json
{
  "env": {
    "NODE_ENV": "production"
  }
}
```

## 📋 Variables d'environnement requises

### Obligatoires

| Variable | Description | Exemple |
|----------|-------------|---------|
| `MONGODB_URI` | URI de connexion MongoDB Atlas | `mongodb+srv://user:pass@cluster.mongodb.net/xcafrique` |
| `JWT_SECRET` | Secret pour signer les tokens JWT | `votre_secret_tres_securise` |

### Optionnelles (avec valeurs par défaut)

| Variable | Description | Défaut |
|----------|-------------|--------|
| `NODE_ENV` | Environnement | `development` |
| `PORT` | Port du serveur | `5000` (Vercel définit automatiquement) |
| `JWT_EXPIRE` | Durée de validité JWT | `7d` |
| `FRONTEND_URL` | URL du frontend (pour CORS) | `http://localhost:3000,http://localhost:5173` |

## 🔧 Configuration Vercel

### Fichier `vercel.json` (optionnel)

Créez un fichier `vercel.json` à la racine du projet :

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Scripts `package.json`

Assurez-vous que votre `package.json` a un script `start` :

```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

## 🔍 Vérification

### 1. Vérifier les variables d'environnement

Dans Vercel Dashboard → Settings → Environment Variables, vous devriez voir :
- ✅ `MONGODB_URI` configuré
- ✅ `JWT_SECRET` configuré
- ✅ `NODE_ENV` = `production`

### 2. Vérifier les logs de déploiement

Dans Vercel Dashboard → Deployments → Cliquez sur un déploiement → Logs

Vous devriez voir :
- ✅ `✅ MongoDB connecté : ...`
- ❌ Pas d'erreur `MONGODB_URI must be a string`

### 3. Tester l'API

Une fois déployé, testez :
```
https://votre-backend.vercel.app/api/articles
```

Vous devriez recevoir une réponse JSON.

## 🐛 Dépannage

### Erreur : "MONGODB_URI must be a string"

**Cause :** Variable d'environnement non configurée.

**Solution :**
1. Vérifiez que `MONGODB_URI` est bien ajoutée dans Vercel
2. Vérifiez que l'environnement est correct (Production/Preview/Development)
3. Redéployez après avoir ajouté la variable

### Erreur : "MongoNetworkError"

**Cause :** MongoDB Atlas bloque les connexions depuis Vercel.

**Solution :**
1. Allez sur MongoDB Atlas → Network Access
2. Cliquez sur **Add IP Address**
3. Cliquez sur **Allow Access from Anywhere** (ou ajoutez les IPs de Vercel)
4. Attendez quelques minutes pour que les changements prennent effet

### Erreur : "Authentication failed"

**Cause :** Identifiants MongoDB incorrects.

**Solution :**
1. Vérifiez votre URI MongoDB dans MongoDB Atlas
2. Vérifiez que le nom d'utilisateur et le mot de passe sont corrects
3. Vérifiez que l'utilisateur a les permissions nécessaires

### Erreur : "Database name not specified"

**Cause :** L'URI MongoDB ne contient pas le nom de la base de données.

**Solution :**
Ajoutez le nom de la base à la fin de l'URI :
```
mongodb+srv://user:pass@cluster.mongodb.net/xcafrique
                                                      ^^^^^^^^^
```

## 📝 Checklist de déploiement

- [ ] Variables d'environnement configurées dans Vercel
- [ ] `MONGODB_URI` avec le nom de la base de données
- [ ] `JWT_SECRET` configuré
- [ ] `NODE_ENV=production` configuré
- [ ] `FRONTEND_URL` configuré (si nécessaire)
- [ ] MongoDB Atlas autorise les connexions depuis Vercel
- [ ] `vercel.json` créé (optionnel)
- [ ] Script `start` dans `package.json`
- [ ] Déploiement réussi sans erreurs
- [ ] API testée et fonctionnelle

## 🔒 Sécurité

### ⚠️ Ne jamais commiter :

- ❌ Fichier `.env`
- ❌ Secrets dans le code
- ❌ Secrets dans `vercel.json`
- ❌ URI MongoDB avec mot de passe

### ✅ Toujours utiliser :

- ✅ Variables d'environnement Vercel
- ✅ `.env.example` pour la documentation
- ✅ Secrets sécurisés (générés avec crypto)

## 🚀 Commandes utiles

```bash
# Déployer en production
vercel --prod

# Déployer en preview
vercel

# Voir les variables d'environnement
vercel env ls

# Supprimer une variable
vercel env rm MONGODB_URI production

# Voir les logs
vercel logs
```

## 📚 Ressources

- [Documentation Vercel - Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Documentation MongoDB Atlas - Connection String](https://www.mongodb.com/docs/atlas/getting-started/)
- [Documentation Vercel - Node.js](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/node-js)

---

**Une fois les variables configurées, redéployez et votre backend devrait fonctionner !** 🎉

