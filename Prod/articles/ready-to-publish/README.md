# 📝 Articles Prêts à Publier

Ce dossier contient les articles qui ont été **corrigés et validés manuellement** et qui sont prêts à être publiés.

## 🎯 Workflow

1. **Drafts** (`drafts/`) → Articles générés automatiquement, en attente de révision
2. **Ready to Publish** (`ready-to-publish/`) → Articles corrigés et validés, prêts pour publication
3. **Published** (`published/`) → Articles déjà publiés sur le site

## ✅ Critères pour un Article "Ready to Publish"

Un article est prêt à être publié quand :
- ✅ Le contenu a été révisé et corrigé
- ✅ Les informations sont vérifiées
- ✅ La catégorie est correcte (utilisez les slugs des nouvelles catégories)
- ✅ Les tags sont pertinents
- ✅ L'excerpt est optimisé (max 500 caractères)
- ✅ Le statut est défini à `"draft"` (sera changé en `"published"` lors de l'import)

## 📋 Structure d'un Article Prêt

```json
{
  "title": "Titre de l'article",
  "slug": "titre-de-l-article",
  "content": "Contenu complet...",
  "excerpt": "Résumé optimisé (max 500 caractères)",
  "category": "compagnies-aeriennes",
  "author": "Votre Nom",
  "featuredImage": "URL de l'image (optionnel)",
  "imageCredit": "Photo par [Nom du photographe] (optionnel)",
  "videoUrl": "",
  "tags": ["tag1", "tag2"],
  "status": "draft",
  "views": 0,
  "publishedAt": null
}
```

## 🚀 Publication

Pour publier un article de ce dossier :

1. **Option 1 : Via Script**
   ```bash
   node scripts/publish.js article2.json   
   node scripts/createArticle.js
   # Modifiez le script pour pointer vers ready-to-publish/
   ```

2. **Option 2 : Import en masse**
   ```bash
   node scripts/importReadyArticles.js
   # (à créer)
   ```

3. **Option 3 : Manuellement**
   - Copiez le contenu JSON
   - Utilisez l'API ou MongoDB Compass
   - Changez `status` à `"published"`

## 📂 Catégories Disponibles

Utilisez ces slugs de catégories :
- `incidents-securite`
- `aeroports-infrastructures`
- `compagnies-aeriennes`
- `operations-meteo`
- `passagers-service`
- `reglementation-conformite`
- `flotte-technologie`
- `economie-finance`
- `developpement-durable`
- `formation-emploi`
- `aviation-africaine`

---

**Note** : Les articles dans ce dossier ont le statut `"draft"` mais sont prêts à être publiés. Changez le statut à `"published"` lors de l'import dans MongoDB.

