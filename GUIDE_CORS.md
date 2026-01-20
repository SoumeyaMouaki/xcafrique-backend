# 🔧 Guide de Résolution des Problèmes CORS

## Problème : Erreur CORS "Le backend n'autorise pas les requêtes depuis cette origine"

### Diagnostic

L'erreur CORS se produit quand le frontend (installHook.js) essaie de récupérer les catégories depuis le backend, mais l'origine du frontend n'est pas autorisée.

### Solutions selon votre configuration

#### 1. Frontend en localhost, Backend en localhost

**Problème** : Le backend n'est pas démarré ou `NODE_ENV` n'est pas défini à `development`.

**Solution** :
```bash
# Dans votre fichier .env
NODE_ENV=development

# Redémarrer le serveur backend
npm start
# ou
node server.js
```

#### 2. Frontend en localhost, Backend sur Vercel (Production)

**Problème** : Le backend en production n'autorise pas localhost par défaut.

**Solution A** : Ajouter `ALLOW_LOCALHOST_IN_PROD=true` dans Vercel
- Vercel Dashboard → Votre projet → Settings → Environment Variables
- Ajouter : `ALLOW_LOCALHOST_IN_PROD=true`
- Redéployer

**Solution B** : Utiliser le backend local pour le développement
- Modifier l'URL de l'API dans votre frontend pour pointer vers `http://localhost:5000`
- Démarrer le backend localement

#### 3. Frontend sur Vercel, Backend sur Vercel

**Problème** : L'URL du frontend n'est pas dans `ALLOWED_ORIGINS`.

**Solution** :
- Vercel Dashboard → Votre projet backend → Settings → Environment Variables
- Ajouter ou modifier `ALLOWED_ORIGINS` avec l'URL de votre frontend :
  ```
  ALLOWED_ORIGINS=https://xcafrique.org,https://www.xcafrique.org,https://xcafrique-frontend.vercel.app
  ```
- Redéployer le backend

#### 4. Frontend sur un domaine personnalisé

**Solution** :
- Ajouter votre domaine dans `ALLOWED_ORIGINS` sur Vercel :
  ```
  ALLOWED_ORIGINS=https://votre-domaine.com,https://www.votre-domaine.com
  ```

### Vérification rapide

Pour vérifier quelle origine est bloquée, regardez les logs du backend sur Vercel :
- Vercel Dashboard → Votre projet → Functions → Logs
- Cherchez les lignes avec `⚠️  Origine non autorisée`

### Configuration recommandée pour le développement

Dans votre `.env` local :
```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/xcafrique
FRONTEND_URL=http://localhost:5173,http://localhost:3000
```

### Configuration recommandée pour la production (Vercel)

Dans Vercel Environment Variables :
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
ALLOWED_ORIGINS=https://xcafrique.org,https://www.xcafrique.org,https://xcafrique-frontend.vercel.app
```

### Test rapide

Pour tester si CORS fonctionne :
```bash
# Tester depuis votre frontend
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://xcafrique-backend.vercel.app/api/categories
```

Si vous voyez les headers CORS dans la réponse, c'est bon !

