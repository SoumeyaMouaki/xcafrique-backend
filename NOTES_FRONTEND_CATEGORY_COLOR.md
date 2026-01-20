# ⚠️ Erreur : categoryColor is not defined

## 🔍 Problème

Le frontend essaie d'accéder à une variable `categoryColor` qui n'existe pas, causant l'erreur :
```
ReferenceError: categoryColor is not defined
```

## ✅ Solution

### Accès correct à la couleur de catégorie

La couleur de catégorie est disponible dans `article.category.color`, pas dans une variable séparée `categoryColor`.

**❌ Incorrect :**
```javascript
// Ne fonctionne pas - categoryColor n'existe pas
const color = categoryColor; // ReferenceError!
```

**✅ Correct :**
```javascript
// Accès via l'objet category
const color = article.category?.color || '#007bff';
```

### Exemples d'utilisation

#### React / Next.js
```javascript
function ArticleCard({ article }) {
  // Récupérer la couleur de la catégorie
  const categoryColor = article.category?.color || '#007bff';
  
  return (
    <div className="article-card">
      <div 
        className="category-badge"
        style={{ backgroundColor: categoryColor }}
      >
        {article.category?.name}
      </div>
      <h2>{article.title}</h2>
      <p>{article.excerpt}</p>
    </div>
  );
}
```

#### Avec destructuration
```javascript
function ArticleCard({ article }) {
  // Destructurer la catégorie
  const { category } = article;
  const categoryColor = category?.color || '#007bff';
  const categoryName = category?.name || 'Sans catégorie';
  
  return (
    <div>
      <span style={{ color: categoryColor }}>
        {categoryName}
      </span>
      <h2>{article.title}</h2>
    </div>
  );
}
```

#### Avec valeur par défaut
```javascript
// Toujours fournir une valeur par défaut
const getCategoryColor = (article) => {
  return article?.category?.color || '#007bff';
};

// Utilisation
const color = getCategoryColor(article);
```

## 📋 Structure de l'objet Category

L'API retourne toujours la catégorie avec ces champs :

```typescript
{
  _id: string;
  name: string;
  slug: string;
  color: string;        // Toujours présent (défaut: '#007bff')
  description?: string; // Optionnel
}
```

## 🔍 Vérification

Pour vérifier que la couleur est bien présente dans la réponse API :

```javascript
// Tester dans la console
fetch('https://xcafrique-backend.vercel.app/api/articles')
  .then(res => res.json())
  .then(data => {
    console.log('Premier article:', data.data[0]);
    console.log('Couleur catégorie:', data.data[0]?.category?.color);
  });
```

## 🛠️ Correction dans le code frontend

Si vous avez du code qui utilise `categoryColor` directement, remplacez-le par :

```javascript
// Avant (❌)
const color = categoryColor;

// Après (✅)
const color = article.category?.color || '#007bff';
```

Ou si vous travaillez avec une liste d'articles :

```javascript
// Avant (❌)
articles.map(article => {
  const color = categoryColor; // Erreur !
  return <ArticleCard color={color} />;
});

// Après (✅)
articles.map(article => {
  const color = article.category?.color || '#007bff';
  return <ArticleCard color={color} />;
});
```

## 📝 Notes importantes

1. ✅ **La couleur est toujours présente** : Le modèle MongoDB a une valeur par défaut `#007bff`
2. ✅ **Utilisez l'optional chaining** : `article.category?.color` pour éviter les erreurs si category est null
3. ✅ **Fournissez une valeur par défaut** : `|| '#007bff'` pour être sûr
4. ✅ **Vérifiez la structure** : `article.category.color` et non `categoryColor`

---

**Dernière mise à jour :** 20 Janvier 2025

