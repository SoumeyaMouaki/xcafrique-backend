# 🚨 CORRECTION URGENTE : Erreur X-Frame-Options YouTube

## ❌ Problème Actuel

Vous voyez cette erreur dans la console :
```
Refused to display 'https://www.youtube.com/' in a frame because it set 'X-Frame-Options' to 'sameorigin'.
```

**Cause :** Le frontend utilise `article.videoUrl` directement dans une iframe, ce qui ne fonctionne pas.

---

## ✅ Solution Immédiate

### Étape 1 : Vérifier la réponse API

Le backend ajoute maintenant automatiquement un champ `videoEmbedUrl` dans la réponse API.

**Testez dans votre navigateur :**
```
https://xcafrique-backend.vercel.app/api/articles/infrastructures-ethiopie-deploie-ses-ailes-mega-aeroport-12-5-milliards-dollars
```

Vous devriez voir :
```json
{
  "success": true,
  "data": {
    "title": "...",
    "videoUrl": "https://www.youtube.com/watch?v=_LcJ7hSZuX0",
    "videoEmbedUrl": "https://www.youtube.com/embed/_LcJ7hSZuX0",  // ← NOUVEAU CHAMP
    ...
  }
}
```

### Étape 2 : Modifier le Frontend

**❌ AVANT (ne fonctionne pas) :**
```javascript
// ❌ MAUVAIS - Ne pas utiliser videoUrl dans iframe
<iframe src={article.videoUrl} />
```

**✅ APRÈS (fonctionne) :**
```javascript
// ✅ BON - Utiliser videoEmbedUrl
{article.videoEmbedUrl && (
  <div className="video-container">
    <iframe src={article.videoEmbedUrl} />
  </div>
)}
```

---

## 🔧 Code de Correction

### Pour Vue.js / Nuxt

**Trouvez votre composant qui affiche les vidéos** (probablement dans un composant Article ou VideoPlayer) :

```vue
<template>
  <!-- ❌ REMPLACEZ CECI -->
  <iframe v-if="article.videoUrl" :src="article.videoUrl" />
  
  <!-- ✅ PAR CECI -->
  <div v-if="article.videoEmbedUrl" class="video-container">
    <iframe :src="article.videoEmbedUrl" />
  </div>
</template>
```

### Pour React / Next.js

**Trouvez votre composant qui affiche les vidéos** :

```jsx
// ❌ REMPLACEZ CECI
{article.videoUrl && (
  <iframe src={article.videoUrl} />
)}

// ✅ PAR CECI
{article.videoEmbedUrl && (
  <div className="video-container" style={{
    position: 'relative',
    paddingBottom: '56.25%', // 16:9
    height: 0,
    overflow: 'hidden',
    maxWidth: '100%'
  }}>
    <iframe
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      }}
      src={article.videoEmbedUrl}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  </div>
)}
```

### Pour HTML/JavaScript pur

```html
<!-- ❌ REMPLACEZ CECI -->
<iframe src="{{ article.videoUrl }}"></iframe>

<!-- ✅ PAR CECI -->
<div class="video-container">
  <iframe src="{{ article.videoEmbedUrl }}"></iframe>
</div>
```

---

## 📝 Où Chercher dans le Code Frontend

Cherchez ces patterns dans votre code frontend :

1. **Recherchez :** `videoUrl` dans les fichiers de composants
2. **Recherchez :** `<iframe` ou `iframe` dans les templates
3. **Recherchez :** Composants nommés : `VideoPlayer`, `ArticleVideo`, `YouTubeVideo`, etc.

**Fichiers probables :**
- `components/Article.vue` ou `Article.jsx`
- `components/VideoPlayer.vue` ou `VideoPlayer.jsx`
- `pages/article/[slug].vue` ou `pages/article/[slug].jsx`
- `components/ArticleContent.vue` ou `ArticleContent.jsx`

---

## 🎨 CSS Responsive (Recommandé)

Ajoutez ce CSS pour un affichage responsive :

```css
.video-container {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;
  max-width: 100%;
  background: #000;
}

.video-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0;
}
```

---

## ✅ Vérification

Après la correction :

1. **Videz le cache du navigateur** (Ctrl+F5)
2. **Rechargez la page** avec l'article contenant la vidéo
3. **Vérifiez la console** - l'erreur X-Frame-Options ne devrait plus apparaître
4. **Vérifiez que la vidéo s'affiche** correctement

---

## 🔍 Test Rapide

Pour tester rapidement si `videoEmbedUrl` est disponible :

```javascript
// Dans la console du navigateur
fetch('https://xcafrique-backend.vercel.app/api/articles/infrastructures-ethiopie-deploie-ses-ailes-mega-aeroport-12-5-milliards-dollars')
  .then(r => r.json())
  .then(data => {
    console.log('videoUrl:', data.data.videoUrl);
    console.log('videoEmbedUrl:', data.data.videoEmbedUrl); // Doit exister !
  });
```

---

## 📚 Documentation Complète

Consultez `GUIDE_INTEGRATION_YOUTUBE.md` pour plus de détails et d'exemples.

---

## ⚠️ Important

- **Ne supprimez PAS** `videoUrl` - il reste disponible pour afficher un lien vers la vidéo
- **Utilisez TOUJOURS** `videoEmbedUrl` pour les iframes
- **Vérifiez** que `videoEmbedUrl` existe avant de l'utiliser : `if (article.videoEmbedUrl)`

---

**Dernière mise à jour :** Janvier 2026

