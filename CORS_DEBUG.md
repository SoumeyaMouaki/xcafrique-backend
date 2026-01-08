# 🐛 Débogage CORS - Guide de résolution

## 🚨 Erreur actuelle

```
Erreur CORS: Le backend n'autorise pas les requêtes depuis cette origine.
```

## ✅ Solution immédiate

### 1. Vérifier que le backend est en mode développement

Le backend autorise automatiquement toutes les origines `localhost` en développement.

Vérifiez votre fichier `.env` du backend :

```env
NODE_ENV=development
```

### 2. Redémarrer le backend

```bash
# Arrêtez le serveur (Ctrl+C)
npm start
# ou
npm run dev
```

### 3. Vérifier l'origine dans les logs

Le backend devrait maintenant accepter toutes les origines localhost. Si le problème persiste, vérifiez les logs du backend pour voir quelle origine est bloquée.

## 🔍 Diagnostic

### Étape 1 : Vérifier l'origine de la requête

Ouvrez les DevTools (F12) → Onglet Network → Cliquez sur la requête → Headers

Cherchez :
- **Request URL** : Quelle URL est appelée ?
- **Origin** : Quelle origine est envoyée ? (ex: `http://localhost:5173`)

### Étape 2 : Vérifier la réponse du backend

Dans les DevTools Network, regardez la réponse :

- **Status** : 403 ou 200 ?
- **Response Headers** : Y a-t-il `Access-Control-Allow-Origin` ?

### Étape 3 : Tester directement le backend

Ouvrez dans le navigateur :
```
http://localhost:5000/api/articles
```

Si ça fonctionne, le backend est OK. Le problème vient de la configuration CORS.

## 🔧 Solutions

### Solution 1 : Configuration simplifiée (Déjà appliquée)

Le backend a été modifié pour autoriser automatiquement toutes les origines `localhost` en développement.

**Redémarrez simplement le backend :**

```bash
npm start
```

### Solution 2 : Utiliser le proxy Vite (Recommandé)

Si le problème persiste, utilisez le proxy Vite pour éviter complètement les problèmes CORS.

**Créez `vite.config.js` dans votre projet frontend :**

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

**Puis utilisez des URLs relatives :**

```javascript
// ✅ Avec proxy
const response = await fetch('/api/articles');
```

**Redémarrez le serveur de développement frontend :**

```bash
npm run dev
```

### Solution 3 : Vérifier la variable d'environnement

Si vous avez défini `FRONTEND_URL` dans le `.env` du backend, assurez-vous qu'elle inclut votre origine :

```env
FRONTEND_URL=http://localhost:5173
```

Ou laissez-la vide pour utiliser les valeurs par défaut.

## 📋 Checklist de dépannage

- [ ] Backend redémarré après modification
- [ ] `NODE_ENV=development` dans le `.env` du backend
- [ ] Backend accessible directement : `http://localhost:5000/api/articles`
- [ ] Origine vérifiée dans DevTools Network
- [ ] Proxy Vite configuré (si Solution 2 utilisée)
- [ ] Frontend redémarré (si proxy utilisé)

## 🧪 Test rapide

### Test 1 : Backend direct

```bash
curl http://localhost:5000/api/articles
```

Doit retourner du JSON.

### Test 2 : Avec origine

```bash
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:5000/api/articles
```

Doit retourner des headers CORS.

### Test 3 : Depuis le navigateur

Ouvrez la console et testez :

```javascript
fetch('http://localhost:5000/api/articles')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

## 🆘 Si rien ne fonctionne

1. **Vérifiez les logs du backend** : Y a-t-il des erreurs ?
2. **Vérifiez le port** : Le backend tourne-t-il bien sur 5000 ?
3. **Vérifiez le firewall** : Bloque-t-il les connexions ?
4. **Testez avec Postman** : Fonctionne-t-il sans CORS ?

## 📝 Logs utiles

Le backend devrait maintenant afficher dans les logs (en développement) :
- Les origines autorisées
- Les origines bloquées (avec warning)

Si vous voyez un warning, notez l'origine et ajoutez-la à `FRONTEND_URL` si nécessaire.

---

**La configuration a été simplifiée pour autoriser automatiquement toutes les origines localhost en développement. Redémarrez simplement le backend !**

