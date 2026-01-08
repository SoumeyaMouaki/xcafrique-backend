# 🚨 Correction rapide - Erreur 404

## Problème

Le frontend appelle `http://localhost:5173/api/articles` au lieu de `http://localhost:5000/api/articles`.

**Le port 5173 est le serveur de développement React, pas le backend !**

## ✅ Solution immédiate

### Étape 1 : Vérifier que le backend tourne

```bash
# Dans le dossier backend
cd XCAfrique-backend
npm start
```

Vous devriez voir : `🚀 Serveur démarré sur le port 5000`

### Étape 2 : Tester le backend directement

Ouvrez dans votre navigateur :
```
http://localhost:5000/api/articles
```

Vous devriez voir une réponse JSON avec les articles.

### Étape 3 : Corriger l'URL dans le frontend

#### Si vous utilisez Axios :

**Trouvez votre fichier de configuration Axios** (ex: `src/config/axios.js` ou `src/api/index.js`) :

```javascript
// ❌ AVANT (incorrect)
const api = axios.create({
  baseURL: '/api',  // ❌ Appelle le frontend
});

// ✅ APRÈS (correct)
const api = axios.create({
  baseURL: 'http://localhost:5000/api',  // ✅ Appelle le backend
});
```

#### Si vous utilisez Fetch :

**Trouvez où vous faites les appels API** (ex: `src/components/Categories.jsx`) :

```javascript
// ❌ AVANT (incorrect)
const response = await fetch('/api/articles');

// ✅ APRÈS (correct)
const API_URL = 'http://localhost:5000/api';
const response = await fetch(`${API_URL}/articles`);
```

#### Si vous utilisez des variables d'environnement :

**Créez un fichier `.env` à la racine du projet frontend** :

```env
VITE_API_URL=http://localhost:5000/api
```

**Puis dans votre code** :

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const response = await fetch(`${API_URL}/articles`);
```

### Étape 4 : Redémarrer le frontend

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis redémarrez
npm run dev
```

## 🔍 Vérification

1. Ouvrez les DevTools (F12)
2. Onglet **Network**
3. Filtrez par "articles"
4. Cliquez sur la requête
5. Vérifiez que l'URL est `http://localhost:5000/api/articles` (pas 5173)

## 📝 Fichiers à modifier

Cherchez dans votre projet frontend les fichiers qui contiennent :
- `/api/`
- `baseURL`
- `axios.create`
- `fetch('/api`

Et remplacez par l'URL complète du backend : `http://localhost:5000/api`

## ⚠️ Warning React : Clés dupliquées

Si vous voyez :
```
Warning: Encountered two children with the same key, `/categories`
```

**Trouvez votre composant qui affiche les catégories** et utilisez une clé unique :

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

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez que le backend tourne** : `http://localhost:5000/api/articles` doit fonctionner
2. **Vérifiez les DevTools Network** : quelle URL est réellement appelée ?
3. **Vérifiez les erreurs CORS** : le backend autorise-t-il `localhost:5173` ?
4. **Vérifiez les logs du backend** : y a-t-il des erreurs ?

---

**Besoin d'aide ?** Partagez les logs des DevTools Network et du backend.

