# 🔧 Correction des erreurs CORS - XC Afrique

## 🚨 Problème

Vous voyez une erreur CORS comme :
```
Access to fetch at 'http://localhost:5000/api/articles' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

## ✅ Solutions

### Solution 1 : Proxy Vite (Recommandé pour le développement)

Cette solution évite les problèmes CORS en utilisant le proxy de Vite.

#### Étape 1 : Créer/modifier `vite.config.js`

Créez ou modifiez le fichier `vite.config.js` à la racine de votre projet frontend :

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

#### Étape 2 : Modifier les appels API

Avec le proxy configuré, vous pouvez utiliser des URLs relatives :

```javascript
// ✅ Avec proxy Vite
const response = await fetch('/api/articles');
// Vite redirige automatiquement vers http://localhost:5000/api/articles
```

#### Étape 3 : Redémarrer le serveur de développement

```bash
# Arrêtez le serveur (Ctrl+C)
npm run dev
```

**Avantages :**
- ✅ Pas de problème CORS
- ✅ URLs relatives simples (`/api/articles`)
- ✅ Fonctionne automatiquement en développement

**Inconvénients :**
- ⚠️ Ne fonctionne qu'en développement
- ⚠️ Nécessite une configuration pour la production

---

### Solution 2 : Configuration CORS côté backend

Si vous préférez appeler directement le backend sans proxy.

#### Étape 1 : Vérifier la configuration backend

Le backend autorise déjà `localhost:5173` par défaut. Vérifiez votre fichier `.env` du backend :

```env
FRONTEND_URL=http://localhost:5173
```

Ou laissez vide pour utiliser les valeurs par défaut (qui incluent `localhost:5173`).

#### Étape 2 : Utiliser l'URL complète dans le frontend

```javascript
// ✅ URL complète
const API_BASE_URL = 'http://localhost:5000/api';
const response = await fetch(`${API_BASE_URL}/articles`);
```

#### Étape 3 : Redémarrer le backend

```bash
# Dans le dossier backend
npm start
```

---

### Solution 3 : Extension navigateur (Développement uniquement)

⚠️ **À utiliser uniquement pour tester, pas pour la production !**

Installez une extension CORS comme "CORS Unblock" ou "Allow CORS" dans Chrome/Firefox.

**Ne pas utiliser en production !**

---

## 🔍 Vérification

### 1. Vérifier que le backend tourne

```bash
# Testez directement dans le navigateur
http://localhost:5000/api/articles
```

Vous devriez voir une réponse JSON.

### 2. Vérifier la configuration CORS du backend

Le backend autorise par défaut :
- `http://localhost:3000`
- `http://localhost:5173`
- `http://localhost:5174`
- `http://localhost:5175`

### 3. Vérifier les requêtes dans DevTools

1. Ouvrez DevTools (F12)
2. Onglet **Network**
3. Filtrez par "articles"
4. Vérifiez :
   - L'URL appelée
   - Les headers de la requête
   - Les headers de la réponse (notamment `Access-Control-Allow-Origin`)

---

## 📝 Configuration complète avec Proxy Vite

### `vite.config.js` (Frontend)

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        // Optionnel : réécrire le chemin
        // rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
});
```

### Utilisation dans le code

```javascript
// ✅ Avec proxy - URL relative
const response = await fetch('/api/articles');

// ✅ Avec proxy - Axios
import axios from 'axios';
const api = axios.create({
  baseURL: '/api',  // URL relative
});
```

---

## 🚀 Configuration pour la production

En production, vous n'avez pas besoin de proxy. Utilisez directement l'URL du backend :

```javascript
// config/api.js
const API_BASE_URL = 
  import.meta.env.MODE === 'production'
    ? 'https://api.xcafrique.com/api'  // URL de production
    : '/api';  // Proxy en développement

export default API_BASE_URL;
```

Ou avec variable d'environnement :

```env
# .env.production
VITE_API_URL=https://api.xcafrique.com/api
```

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
```

---

## 🐛 Dépannage

### Erreur : "Proxy error: Could not proxy request"

**Cause :** Le backend n'est pas démarré ou n'écoute pas sur le port 5000.

**Solution :**
1. Vérifiez que le backend tourne : `http://localhost:5000/api/articles`
2. Vérifiez le port dans `vite.config.js` (doit être 5000)
3. Redémarrez le serveur de développement

### Erreur : "CORS policy: No 'Access-Control-Allow-Origin' header"

**Cause :** Le backend n'autorise pas l'origine du frontend.

**Solution :**
1. Vérifiez `FRONTEND_URL` dans le `.env` du backend
2. Ajoutez `http://localhost:5173` si nécessaire
3. Redémarrez le backend

### Erreur : "Network Error" ou "Failed to fetch"

**Cause :** Le backend n'est pas accessible.

**Solution :**
1. Vérifiez que le backend tourne
2. Vérifiez l'URL dans `vite.config.js`
3. Vérifiez les logs du backend pour les erreurs

---

## 📋 Checklist

- [ ] Backend démarré sur le port 5000
- [ ] `vite.config.js` configuré avec le proxy
- [ ] Serveur de développement redémarré
- [ ] URLs relatives utilisées (`/api/articles`)
- [ ] Testé dans le navigateur : `http://localhost:5173`
- [ ] Vérifié les requêtes dans DevTools Network

---

## 💡 Recommandation

**Pour le développement :** Utilisez le proxy Vite (Solution 1)
- Plus simple
- Pas de problème CORS
- URLs relatives

**Pour la production :** Utilisez l'URL complète du backend
- Plus explicite
- Pas de dépendance au proxy
- Configuration via variables d'environnement

---

**Besoin d'aide ?** Vérifiez les logs du backend et les DevTools Network pour identifier le problème exact.

