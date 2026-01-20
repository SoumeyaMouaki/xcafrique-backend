# 🎥 Guide d'Intégration YouTube

## Problème : Erreur X-Frame-Options

Si vous voyez cette erreur :
```
Refused to display 'https://www.youtube.com/' in a frame because it set 'X-Frame-Options' to 'sameorigin'.
```

C'est parce que YouTube bloque l'affichage de ses pages `watch` dans des iframes pour des raisons de sécurité.

---

## ✅ Solution : Utiliser l'URL Embed

### 1. Le Backend convertit automatiquement

Le backend convertit automatiquement les URLs YouTube en URLs embed et ajoute un champ `videoEmbedUrl` dans la réponse API.

**Exemple de réponse API :**
```json
{
  "success": true,
  "data": {
    "title": "Mon article",
    "videoUrl": "https://www.youtube.com/watch?v=_LcJ7hSZuX0",
    "videoEmbedUrl": "https://www.youtube.com/embed/_LcJ7hSZuX0",
    ...
  }
}
```

### 2. Utilisation côté Frontend

#### Option A : Utiliser `videoEmbedUrl` (Recommandé)

```javascript
function ArticleVideo({ article }) {
  if (!article.videoEmbedUrl) {
    return null;
  }

  return (
    <div className="video-container" style={{
      position: 'relative',
      paddingBottom: '56.25%', // 16:9 aspect ratio
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
      ></iframe>
    </div>
  );
}
```

#### Option B : Utiliser React YouTube (Plus simple)

Installez le package :
```bash
npm install react-youtube
```

Utilisation :
```javascript
import YouTube from 'react-youtube';

function ArticleVideo({ article }) {
  if (!article.videoUrl) {
    return null;
  }

  // Extraire l'ID de la vidéo depuis l'URL
  const videoId = article.videoUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/)?.[1];
  
  if (!videoId) {
    return null;
  }

  const opts = {
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: 0,
    },
  };

  return (
    <div className="video-container" style={{
      position: 'relative',
      paddingBottom: '56.25%',
      height: 0,
      overflow: 'hidden',
      maxWidth: '100%'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      }}>
        <YouTube videoId={videoId} opts={opts} />
      </div>
    </div>
  );
}
```

#### Option C : Utiliser l'URL embed directement

Si vous préférez utiliser directement `videoEmbedUrl` :

```javascript
function ArticleVideo({ article }) {
  if (!article.videoEmbedUrl) {
    return null;
  }

  return (
    <div className="video-wrapper">
      <iframe
        width="560"
        height="315"
        src={article.videoEmbedUrl}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
}
```

---

## 📝 Formats d'URL YouTube Supportés

Le backend convertit automatiquement ces formats :

- ✅ `https://www.youtube.com/watch?v=VIDEO_ID`
- ✅ `https://youtu.be/VIDEO_ID`
- ✅ `https://www.youtube.com/embed/VIDEO_ID` (déjà au bon format)

---

## 🎨 CSS Responsive (Recommandé)

Pour un affichage responsive, utilisez ce CSS :

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

## 🔧 Utilisation dans un Composant Article Complet

```javascript
function ArticlePage({ article }) {
  return (
    <article>
      <h1>{article.title}</h1>
      
      {/* Image principale */}
      {article.featuredImage && (
        <img src={article.featuredImage} alt={article.title} />
      )}
      
      {/* Vidéo YouTube */}
      {article.videoEmbedUrl && (
        <ArticleVideo article={article} />
      )}
      
      {/* Contenu */}
      <div dangerouslySetInnerHTML={{ __html: article.content }} />
      
      {/* Sources */}
      {article.sources && article.sources.length > 0 && (
        <ArticleSources sources={article.sources} />
      )}
    </article>
  );
}
```

---

## ⚠️ Notes Importantes

1. **Toujours utiliser `videoEmbedUrl`** au lieu de `videoUrl` pour l'intégration dans une iframe
2. **Le champ `videoUrl`** reste disponible pour afficher un lien vers la vidéo si besoin
3. **Si `videoEmbedUrl` est `null`**, cela signifie que l'URL n'est pas une URL YouTube valide
4. **Le backend ajoute automatiquement** `videoEmbedUrl` à tous les articles qui ont un `videoUrl`

---

## 🆘 Dépannage

### La vidéo ne s'affiche pas

1. Vérifiez que `article.videoEmbedUrl` existe dans la réponse API
2. Vérifiez que l'URL YouTube est valide dans `article.videoUrl`
3. Vérifiez la console du navigateur pour les erreurs CORS ou X-Frame-Options

### L'iframe est vide

1. Vérifiez que la vidéo YouTube n'est pas privée ou restreinte
2. Vérifiez que l'URL embed est correcte : `https://www.youtube.com/embed/VIDEO_ID`
3. Testez l'URL embed directement dans le navigateur

---

## 📚 Ressources

- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)
- [react-youtube Package](https://www.npmjs.com/package/react-youtube)
- [Responsive Video Embed](https://css-tricks.com/fluid-width-video/)

