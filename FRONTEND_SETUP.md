# 🔧 Configuration Frontend - XC Afrique

## ⚠️ Problème courant : URL incorrecte

Si vous voyez des erreurs 404 avec `http://localhost:5173/api/...`, c'est que le frontend appelle le mauvais serveur.

**Le backend est sur le port 5000, pas 5173 !**

---

## ✅ Solution : Configuration de l'URL de base

### Option 1 : Variable d'environnement (Recommandé)

Créez un fichier `.env` à la racine de votre projet frontend :

```env
# .env (frontend)
VITE_API_URL=http://localhost:5000/api
# ou en production :
# VITE_API_URL=https://votre-backend.com/api
```

Puis dans votre code frontend :

```javascript
// config/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default API_BASE_URL;
```

### Option 2 : Configuration directe

Si vous utilisez Axios :

```javascript
// config/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
```

### Option 3 : Constante globale

```javascript
// config/constants.js
export const API_BASE_URL = 'http://localhost:5000/api';
```

---

## 📝 Exemple de correction

### ❌ Incorrect (appelle le frontend)
```javascript
// ❌ Mauvais - appelle localhost:5173
const response = await fetch('/api/articles');
```

### ✅ Correct (appelle le backend)
```javascript
// ✅ Bon - appelle localhost:5000
const API_URL = 'http://localhost:5000/api';
const response = await fetch(`${API_URL}/articles`);
```

---

## 🔍 Vérification

Pour vérifier que votre configuration est correcte :

1. **Vérifiez que le backend tourne :**
   ```bash
   # Dans le dossier backend
   npm start
   # Doit afficher : "Serveur démarré sur le port 5000"
   ```

2. **Testez l'endpoint directement :**
   ```bash
   # Dans le navigateur ou Postman
   http://localhost:5000/api/articles
   ```

3. **Vérifiez les requêtes réseau :**
   - Ouvrez les DevTools (F12)
   - Onglet Network
   - Les requêtes doivent pointer vers `localhost:5000`, pas `localhost:5173`

---

## 🚀 Configuration pour différents environnements

### Développement
```env
VITE_API_URL=http://localhost:5000/api
```

### Production
```env
VITE_API_URL=https://api.xcafrique.com/api
```

### Staging
```env
VITE_API_URL=https://staging-api.xcafrique.com/api
```

---

## 📋 Checklist de configuration

- [ ] Backend démarré sur le port 5000
- [ ] Variable d'environnement `VITE_API_URL` configurée
- [ ] Toutes les requêtes utilisent la bonne URL de base
- [ ] Pas de requêtes vers `localhost:5173/api`
- [ ] CORS configuré dans le backend pour autoriser `localhost:5173`

---

## 🔧 Correction du fichier Categories.jsx

Si vous avez un fichier `Categories.jsx`, modifiez-le ainsi :

```javascript
// ❌ Avant (incorrect)
const response = await axios.get('/api/articles', { params });

// ✅ Après (correct)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const response = await axios.get(`${API_BASE_URL}/articles`, { params });
```

Ou avec Axios configuré :

```javascript
// ✅ Avec Axios configuré
import api from '../config/axios';
const response = await api.get('/articles', { params });
```

---

## ⚠️ Warning React : Clés dupliquées

Si vous voyez ce warning :
```
Warning: Encountered two children with the same key, `/categories`
```

Cela signifie que vous avez plusieurs éléments avec la même clé dans une liste. Vérifiez votre code :

```javascript
// ❌ Mauvais
{categories.map(cat => (
  <Link key="/categories" to={`/categories/${cat.slug}`}>
    {cat.name}
  </Link>
))}

// ✅ Bon
{categories.map(cat => (
  <Link key={cat.slug} to={`/categories/${cat.slug}`}>
    {cat.name}
  </Link>
))}
```

La clé doit être unique pour chaque élément (utilisez `cat.slug` ou `cat._id`).

---

## 🆘 Dépannage

### Erreur 404 sur toutes les requêtes
- ✅ Vérifiez que le backend tourne sur le port 5000
- ✅ Vérifiez que l'URL de base est correcte
- ✅ Vérifiez les DevTools Network pour voir l'URL réelle appelée

### Erreur CORS
- ✅ Vérifiez que `FRONTEND_URL` est configuré dans le `.env` du backend
- ✅ Ajoutez `http://localhost:5173` dans `FRONTEND_URL` si nécessaire

### Backend ne démarre pas
- ✅ Vérifiez que MongoDB est connecté
- ✅ Vérifiez les variables d'environnement dans `.env`
- ✅ Vérifiez que le port 5000 n'est pas déjà utilisé

---

**Besoin d'aide ?** Vérifiez les logs du backend et les DevTools Network pour identifier le problème exact.

