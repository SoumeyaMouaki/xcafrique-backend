# 🖼️ Guide des Images pour les Articles

## ⚠️ Problème avec `/prod/assets/images/...`

Le chemin `/prod/assets/images/articles1.webp` **ne fonctionnera pas** car :
- Le backend ne sert pas de fichiers statiques depuis le dossier `Prod/`
- Ce dossier est uniquement pour l'organisation locale de vos fichiers
- Les images doivent être accessibles via une URL publique

## ✅ Solutions Recommandées

### Option 1 : URL Complète (CDN/Service Externe) ⭐ **RECOMMANDÉ**

Utilisez un service de stockage d'images comme :
- **Cloudinary** : `https://res.cloudinary.com/votre-compte/image/upload/article1.webp`
- **AWS S3** : `https://votre-bucket.s3.amazonaws.com/images/article1.webp`
- **Imgur** : `https://i.imgur.com/xxxxx.webp`
- **Votre propre serveur** : `https://xcafrique.org/images/article1.webp`

**Exemple :**
```json
"featuredImage": "https://res.cloudinary.com/xcafrique/image/upload/v1234567890/article1.webp"
```

### Option 2 : Chemin Relatif depuis le Frontend

Si votre frontend sert les images depuis son dossier `public/` :

**Structure frontend :**
```
frontend/
└── public/
    └── images/
        └── article1.webp
```

**Dans le JSON :**
```json
"featuredImage": "/images/article1.webp"
```

⚠️ **Note** : Le frontend doit copier les images depuis `Prod/assets/images/` vers son dossier `public/images/` lors du build.

### Option 3 : Laisser Vide (Temporaire)

Si vous n'avez pas encore d'image :
```json
"featuredImage": ""
```

Vous pourrez ajouter l'image plus tard via l'API ou MongoDB Compass.

## 📋 Checklist pour les Images

- [ ] L'image est optimisée (format WebP recommandé)
- [ ] L'image est accessible via une URL publique
- [ ] Le chemin dans le JSON correspond au nom réel du fichier
- [ ] La taille de l'image est raisonnable (< 500KB recommandé)
- [ ] L'image respecte les droits d'auteur

## 🔧 Correction du Nom de Fichier

**Fichier réel :** `Prod/assets/images/article1.webp` (sans "s")

**Dans le JSON, utilisez :**
- ✅ URL complète : `"https://votre-cdn.com/images/article1.webp"`
- ✅ Chemin frontend : `"/images/article1.webp"`
- ❌ **ÉVITEZ** : `"/prod/assets/images/articles1.webp"` (ne fonctionne pas)

## 💡 Workflow Recommandé

1. **Préparer l'image** dans `Prod/assets/images/article1.webp`
2. **Uploader l'image** vers votre CDN/service de stockage
3. **Copier l'URL complète** dans le champ `featuredImage` du JSON
4. **Vérifier** que l'URL est accessible publiquement

---

**Note** : Pour l'instant, j'ai mis un placeholder dans votre JSON. Remplacez-le par l'URL réelle de votre image une fois uploadée.

