# 🔧 Guide : Résoudre l'erreur MongoDB sur Vercel

## Problème
L'API retourne une erreur 503 "Erreur de connexion à la base de données" car Vercel ne peut pas se connecter à MongoDB Atlas.

## Solutions

### Solution 1 : Ajouter l'IP de Vercel à MongoDB Atlas (Recommandé)

Vercel utilise des IPs dynamiques, donc la meilleure solution est d'autoriser toutes les IPs depuis MongoDB Atlas :

1. **Allez sur MongoDB Atlas** :
   - https://cloud.mongodb.com/v2#/security/network/whitelist
   - Connectez-vous à votre compte

2. **Ajoutez l'IP wildcard** :
   - Cliquez sur "Add IP Address"
   - Entrez : `0.0.0.0/0`
   - Cliquez sur "Confirm"
   - ⚠️ **Note** : Cela autorise toutes les IPs. C'est acceptable pour MongoDB Atlas car vous avez déjà un mot de passe, mais assurez-vous que votre mot de passe est fort.

### Solution 2 : Vérifier MONGODB_URI sur Vercel

1. **Vercel Dashboard** → Votre projet backend → **Settings** → **Environment Variables**

2. **Vérifiez que `MONGODB_URI` existe** et contient :
   ```
   mongodb+srv://dawini-user:2005Xad5@cluster0.kcwr1dx.mongodb.net/XCAfrique
   ```

3. **Vérifiez l'environnement** :
   - La variable doit être disponible pour **Production**, **Preview**, et **Development**
   - Cochez les trois cases si nécessaire

4. **Redéployez** :
   - Après avoir modifié les variables d'environnement, vous devez redéployer
   - Allez dans **Deployments** → Cliquez sur les trois points → **Redeploy**

### Solution 3 : Vérifier les logs Vercel

Pour voir l'erreur exacte :

1. **Vercel Dashboard** → Votre projet → **Functions** → **Logs**
2. Cherchez les erreurs MongoDB
3. L'erreur devrait indiquer si c'est un problème de whitelist IP ou de connexion

### Solution 4 : Tester la connexion MongoDB depuis Vercel

Créez une fonction de test sur Vercel pour vérifier la connexion :

```javascript
// api/test-mongo.js
const mongoose = require('mongoose');

export default async function handler(req, res) {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Connexion MongoDB réussie',
      host: mongoose.connection.host
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
```

Puis visitez : `https://xcafrique-backend.vercel.app/api/test-mongo`

## Vérification rapide

Après avoir ajouté `0.0.0.0/0` à MongoDB Atlas :

1. Attendez 1-2 minutes pour que les changements prennent effet
2. Redéployez votre backend sur Vercel
3. Testez à nouveau l'API :
   ```
   https://xcafrique-backend.vercel.app/api/articles/brussels-airlines-valorise-la-richesse-culinaire-africaine-a-bord-de-ses-vols-long-courriers-vers-bruxelles-des-2026
   ```

## Checklist

- [ ] `0.0.0.0/0` ajouté à MongoDB Atlas Network Access
- [ ] `MONGODB_URI` configuré sur Vercel avec la bonne valeur
- [ ] Variable d'environnement disponible pour Production/Preview/Development
- [ ] Backend redéployé sur Vercel après les modifications
- [ ] Test de l'API effectué

