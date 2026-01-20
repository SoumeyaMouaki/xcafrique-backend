# 📋 Instructions Frontend - Intégration des Articles

## 🎯 Objectif
Ce document explique comment récupérer et afficher les articles publiés depuis l'API backend.

---

## 🔗 Endpoints API Disponibles

### Base URL
- **Production** : `https://xcafrique-backend.vercel.app/api`
- **Local** : `http://localhost:5000/api`

---

## 📡 Endpoints Articles

### 1. Liste des articles publiés
**GET** `/api/articles`

**Paramètres de requête (optionnels) :**
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'articles par page (défaut: 10)
- `category` : Slug de la catégorie (ex: `passagers-service`)
- `search` : Terme de recherche
- `type` : `video` pour filtrer uniquement les vidéos

**Exemple de requête :**
```javascript
// Tous les articles
fetch('https://xcafrique-backend.vercel.app/api/articles')

// Avec pagination
fetch('https://xcafrique-backend.vercel.app/api/articles?page=1&limit=10')

// Par catégorie
fetch('https://xcafrique-backend.vercel.app/api/articles?category=passagers-service')

// Recherche
fetch('https://xcafrique-backend.vercel.app/api/articles?search=Brussels')
```

**Réponse :**
```json
{
  "success": true,
  "count": 1,
  "total": 1,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "...",
      "title": "Brussels Airlines met à l'honneur...",
      "slug": "brussels-airlines-valorise-la-richesse-culinaire-africaine-a-bord-de-ses-vols-long-courriers-vers-bruxelles-des-2026",
      "content": "...",
      "excerpt": "...",
      "category": {
        "_id": "...",
        "name": "Passagers & Service",
        "slug": "passagers-service",
        "color": "#..."
      },
      "author": "Soumeya Mouaki Benani Benani",
      "featuredImage": "https://images.unsplash.com/...",
      "imageCredit": "Photo par [Toni Osmundson] sur Unsplash",
      "videoUrl": "",
      "sources": [
        {
          "title": "Brussels Airlines communique sur sa nouvelle offre culinaire africaine",
          "url": "https://www.brusselsairlines.com",
          "author": "Brussels Airlines",
          "date": "2026-01-15",
          "type": "press-release"
        }
      ],
      "tags": ["Brussels Airlines", "Lufthansa Group", ...],
      "status": "published",
      "views": 0,
      "publishedAt": "2025-01-XX...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

### 2. Détails d'un article par slug
**GET** `/api/articles/:slug`

**Exemple :**
```javascript
fetch('https://xcafrique-backend.vercel.app/api/articles/brussels-airlines-valorise-la-richesse-culinaire-africaine-a-bord-de-ses-vols-long-courriers-vers-bruxelles-des-2026')
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "...",
    "slug": "...",
    "content": "...",
    "excerpt": "...",
    "category": {
      "_id": "...",
      "name": "Passagers & Service",
      "slug": "passagers-service",
      "color": "#...",
      "description": "..."
    },
    "author": "...",
    "featuredImage": "...",
    "imageCredit": "...",
    "videoUrl": "",
    "sources": [
      {
        "title": "Titre de la source",
        "url": "https://exemple.com/article",
        "author": "Nom de l'auteur",
        "date": "2025-01-15",
        "type": "article"
      }
    ],
    "tags": [...],
    "status": "published",
    "views": 1,
    "publishedAt": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Note :** Le compteur de vues (`views`) est automatiquement incrémenté à chaque consultation.

---

## ✅ Points de Vérification

### 1. Vérifier que l'article est accessible

**Test rapide dans le navigateur :**
```
https://xcafrique-backend.vercel.app/api/articles
```

Vous devriez voir l'article dans la liste.

**Test par slug :**
```
https://xcafrique-backend.vercel.app/api/articles/brussels-airlines-valorise-la-richesse-culinaire-africaine-a-bord-de-ses-vols-long-courriers-vers-bruxelles-des-2026
```

**Test avec script (backend) :**
```bash
node scripts/testPublishedArticle.js
```

Ce script vérifie automatiquement que l'article est accessible et affiche tous les détails.

### 2. Vérifier le statut de l'article
L'article doit avoir `"status": "published"` dans la réponse. Les articles avec `"status": "draft"` ne sont **pas** retournés par l'API publique.

### 3. Vérifier la catégorie
La catégorie est automatiquement incluse dans la réponse via `populate`. Vérifiez que :
- `category.name` : Nom de la catégorie
- `category.slug` : Slug de la catégorie
- `category.color` : Couleur de la catégorie (si définie)

---

## 🔍 Dépannage

### L'article n'apparaît pas dans la liste

**⚠️ IMPORTANT :** Si vous avez publié l'article localement, il faut le publier aussi dans la base de données de **production** (MongoDB Atlas utilisée par Vercel).

**Vérifications :**
1. ✅ L'article a bien le statut `"published"` dans MongoDB **de production**
2. ✅ L'article a une date `publishedAt` définie
3. ✅ La catégorie existe et est active (`isActive: true`) dans la base de production
4. ✅ L'URL de l'API est correcte
5. ✅ Pas d'erreur CORS (vérifier la console du navigateur)

**Pour vérifier dans MongoDB local :**
```bash
node scripts/checkArticleInDB.js
```

**Pour publier dans la base de production :**
- Assurez-vous que `MONGODB_URI` dans Vercel pointe vers votre base de données de production
- Exécutez le script de publication avec la connexion à la base de production

**Test direct :**
```bash
curl https://xcafrique-backend.vercel.app/api/articles
```

### Erreur 404 sur un article spécifique

**Vérifications :**
1. ✅ Le slug est exactement le même (sensible à la casse)
2. ✅ L'article existe dans MongoDB
3. ✅ L'article a le statut `"published"`

### Erreur 404 avec filtre de catégorie (`?category=...`)

**Si vous obtenez une erreur 404 avec `/api/articles?category=passagers-service` :**

1. **Vérifiez d'abord que l'API fonctionne sans filtre**
   ```
   https://xcafrique-backend.vercel.app/api/articles
   ```
   Si cela fonctionne, le problème vient du filtre de catégorie.

2. **Vérifiez que la catégorie existe**
   ```
   https://xcafrique-backend.vercel.app/api/categories
   ```
   Vérifiez que le slug de catégorie correspond exactement (ex: `passagers-service`)

3. **Solution temporaire : Filtrer côté client**
   Si le filtre par catégorie ne fonctionne pas, vous pouvez :
   - Récupérer tous les articles : `GET /api/articles`
   - Filtrer côté client par `article.category.slug === 'passagers-service'`

4. **Vérifiez les logs Vercel**
   - Allez dans Vercel Dashboard → Votre projet → Functions → Logs
   - Cherchez les erreurs liées à MongoDB ou aux catégories

**Test direct :**
```bash
curl https://xcafrique-backend.vercel.app/api/articles/[slug-exact]
```

### Erreur CORS

L'API backend est configurée pour accepter les requêtes depuis n'importe quelle origine en développement. En production, vérifiez que votre domaine frontend est autorisé.

---

## 💻 Exemples de Code

### React / Next.js

```javascript
// Hook personnalisé pour récupérer les articles
import { useState, useEffect } from 'react';

const API_BASE_URL = 'https://xcafrique-backend.vercel.app/api';

export function useArticles(params = {}) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.category) queryParams.append('category', params.category);
    if (params.search) queryParams.append('search', params.search);

    fetch(`${API_BASE_URL}/articles?${queryParams}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setArticles(data.data);
        } else {
          setError(data.message);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.page, params.limit, params.category, params.search]);

  return { articles, loading, error };
}

// Utilisation
function ArticlesList() {
  const { articles, loading, error } = useArticles({ page: 1, limit: 10 });

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div>
      {articles.map(article => (
        <article key={article._id}>
          <h2>{article.title}</h2>
          <p>{article.excerpt}</p>
          <a href={`/articles/${article.slug}`}>Lire la suite</a>
        </article>
      ))}
    </div>
  );
}
```

### Récupérer un article par slug

```javascript
export async function getArticleBySlug(slug) {
  const response = await fetch(
    `https://xcafrique-backend.vercel.app/api/articles/${slug}`
  );
  const data = await response.json();
  
  if (data.success) {
    return data.data;
  } else {
    throw new Error(data.message || 'Article non trouvé');
  }
}
```

---

## 📝 Structure de l'Article

```typescript
interface ArticleSource {
  title?: string;
  url?: string;
  author?: string;
  date?: string;
  type?: 'article' | 'press-release' | 'official' | 'report' | 'other';
}

interface Article {
  _id: string;
  title: string;
  slug: string;
  content: string; // HTML
  excerpt: string;
  category: {
    _id: string;
    name: string;
    slug: string;
    color: string; // Toujours présent (valeur par défaut: '#007bff')
    description?: string;
  };
  author: string;
  featuredImage: string; // URL
  imageCredit?: string;
  videoUrl?: string;
  sources?: ArticleSource[]; // Tableau optionnel de sources
  tags: string[];
  status: 'published' | 'draft';
  views: number;
  publishedAt: string; // ISO date
  createdAt: string;
  updatedAt: string;
}
```

### ⚠️ Accès à la couleur de catégorie

**Correct :**
```javascript
// ✅ Accès correct
const color = article.category?.color || '#007bff'; // Valeur par défaut si undefined
const categoryColor = article.category?.color; // Si vous voulez une variable séparée
```

**Incorrect :**
```javascript
// ❌ Ne fonctionne pas - categoryColor n'existe pas directement
const color = categoryColor; // ReferenceError: categoryColor is not defined
```

**Exemple d'utilisation :**
```javascript
// Dans un composant React
function ArticleCard({ article }) {
  // Accéder à la couleur de la catégorie
  const categoryColor = article.category?.color || '#007bff';
  
  return (
    <div style={{ borderLeft: `4px solid ${categoryColor}` }}>
      <h2>{article.title}</h2>
      <span style={{ color: categoryColor }}>
        {article.category?.name}
      </span>
    </div>
  );
}
```

---

## 🎨 Affichage Recommandé

### Liste d'articles
- Afficher `title`, `excerpt`, `featuredImage`
- Afficher la catégorie avec sa couleur (`category.color`)
- Afficher la date de publication (`publishedAt`)
- Lien vers `/articles/${article.slug}`

### Page article
- Afficher `title`, `content` (HTML)
- Afficher `featuredImage` avec `imageCredit`
- Afficher les tags
- Afficher le nombre de vues (`views`)
- Afficher la catégorie
- Afficher les sources (`sources`) si présentes (section "Sources" en bas de l'article)

---

## ⚠️ Erreur : categoryColor is not defined

Si vous obtenez l'erreur `ReferenceError: categoryColor is not defined`, c'est que vous essayez d'accéder à une variable qui n'existe pas.

**Solution :** Accédez à la couleur via `article.category.color` :

```javascript
// ❌ Incorrect
const color = categoryColor; // Erreur !

// ✅ Correct
const color = article.category?.color || '#007bff';
const categoryColor = article.category?.color; // Si vous voulez une variable
```

**Note :** La couleur est toujours présente dans la réponse API (valeur par défaut `#007bff` si non définie).

## 🔧 Solution de Contournement pour le Filtre de Catégorie

Si le filtre par catégorie (`?category=...`) retourne une erreur 404, vous pouvez filtrer côté client :

```javascript
// Récupérer tous les articles
const response = await fetch('https://xcafrique-backend.vercel.app/api/articles');
const data = await response.json();

if (data.success) {
  // Filtrer côté client par catégorie
  const filteredArticles = data.data.filter(
    article => article.category?.slug === 'passagers-service'
  );
  
  // Utiliser filteredArticles
}
```

**Avantages :**
- ✅ Fonctionne même si le filtre backend a un problème
- ✅ Plus rapide pour de petits volumes d'articles
- ✅ Permet des filtres multiples côté client

**Inconvénients :**
- ⚠️ Moins efficace pour de grandes quantités d'articles
- ⚠️ Charge tous les articles même si vous n'en avez besoin que d'un sous-ensemble

## 📚 Affichage des Sources

Les articles peuvent inclure un tableau de sources (`sources`) pour référencer les documents, articles ou communiqués utilisés pour rédiger l'article.

**Exemple d'affichage des sources :**

```javascript
function ArticleSources({ sources }) {
  if (!sources || sources.length === 0) return null;

  return (
    <section className="article-sources">
      <h3>Sources</h3>
      <ul>
        {sources.map((source, index) => (
          <li key={index}>
            {source.url ? (
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {source.title || source.url}
              </a>
            ) : (
              <span>{source.title}</span>
            )}
            {source.author && <span> - {source.author}</span>}
            {source.date && <span> ({source.date})</span>}
            {source.type && (
              <span className="source-type">{source.type}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

// Utilisation dans votre composant Article
function ArticlePage({ article }) {
  return (
    <article>
      <h1>{article.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: article.content }} />
      <ArticleSources sources={article.sources} />
    </article>
  );
}
```

**Types de sources disponibles :**
- `article` : Article de presse ou blog
- `press-release` : Communiqué de presse
- `official` : Document officiel
- `report` : Rapport ou étude
- `other` : Autre type de source

**Note :** Le champ `sources` est optionnel. Vérifiez toujours si `article.sources` existe et n'est pas vide avant de l'afficher.

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs du backend (Vercel Dashboard)
2. Testez les endpoints directement dans le navigateur
3. Vérifiez que MongoDB est accessible
4. Contactez l'équipe backend avec les détails de l'erreur

---

**Dernière mise à jour :** Janvier 2025

