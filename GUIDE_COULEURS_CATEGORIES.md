# 🎨 Guide : Mise à Jour des Couleurs de Catégories

## ✅ Solution Automatique

Un script a été créé pour mettre à jour automatiquement toutes les couleurs de catégories dans MongoDB.

### Utilisation

```bash
node scripts/updateCategoryColors.js
```

Ce script :
- ✅ Se connecte à MongoDB (utilise `MONGODB_URI_PROD` ou `MONGODB_URI`)
- ✅ Met à jour toutes les couleurs des catégories existantes
- ✅ Gère les variations de noms (slug, casse, etc.)
- ✅ Affiche un résumé des modifications

---

## 📋 Couleurs Définies

| Catégorie | Couleur | Code Hex |
|-----------|---------|----------|
| Incidents & Sécurité | Rouge | `#DC2626` |
| Aéroports & Infrastructures | Bleu | `#2563EB` |
| Compagnies aériennes | Vert | `#059669` |
| Opérations & Météo | Violet | `#7C3AED` |
| Passagers & Service | Orange | `#EA580C` |
| Réglementation & Conformité | Cyan | `#0891B2` |
| Flotte & Technologie | Rose | `#BE185D` |
| Économie & Finance | Jaune/Or | `#CA8A04` |
| Développement durable | Vert clair | `#16A34A` |
| Formation & Emploi | Violet clair | `#9333EA` |
| Aviation africaine | Orange XCAfrique | `#FF6B35` |

---

## 🔍 Vérifier les Couleurs Actuelles

Pour voir toutes les catégories et leurs couleurs :

```bash
node scripts/listCategories.js
```

---

## 🛠️ Mise à Jour Manuelle (Alternative)

Si vous préférez mettre à jour manuellement via MongoDB Shell :

```bash
mongosh "mongodb+srv://dawini-user:2005Xad5@cluster0.kcwr1dx.mongodb.net/XCAfrique"
```

Puis exécutez :

```javascript
// Mettre à jour toutes les couleurs
db.categories.updateOne({ name: "Incidents & Sécurité" }, { $set: { color: "#DC2626" } })
db.categories.updateOne({ name: "Aéroports & Infrastructures" }, { $set: { color: "#2563EB" } })
db.categories.updateOne({ name: "Compagnies aériennes" }, { $set: { color: "#059669" } })
db.categories.updateOne({ name: "Opérations & Météo" }, { $set: { color: "#7C3AED" } })
db.categories.updateOne({ name: "Passagers & Service" }, { $set: { color: "#EA580C" } })
db.categories.updateOne({ slug: "passagers-service" }, { $set: { color: "#EA580C" } }) // Pour les variations
db.categories.updateOne({ name: "Réglementation & Conformité" }, { $set: { color: "#0891B2" } })
db.categories.updateOne({ name: "Flotte & Technologie" }, { $set: { color: "#BE185D" } })
db.categories.updateOne({ name: "Économie & Finance" }, { $set: { color: "#CA8A04" } })
db.categories.updateOne({ name: "Développement durable" }, { $set: { color: "#16A34A" } })
db.categories.updateOne({ name: "Formation & Emploi" }, { $set: { color: "#9333EA" } })
db.categories.updateOne({ name: "Aviation africaine" }, { $set: { color: "#FF6B35" } })
```

---

## ✅ Vérification Frontend

Après avoir mis à jour les couleurs :

1. **Videz le cache** du navigateur (Ctrl+F5)
2. **Vérifiez** que chaque catégorie a sa couleur unique
3. **Testez** avec différents articles

### Test API

Pour vérifier que les couleurs sont bien retournées par l'API :

```javascript
// Dans la console du navigateur
fetch('https://xcafrique-backend.vercel.app/api/articles')
  .then(r => r.json())
  .then(data => {
    data.data.forEach(article => {
      console.log(`${article.category.name}: ${article.category.color}`);
    });
  });
```

---

## 🔧 Scripts Disponibles

| Script | Description |
|--------|-------------|
| `updateCategoryColors.js` | Met à jour toutes les couleurs automatiquement |
| `listCategories.js` | Liste toutes les catégories avec leurs couleurs |

---

## 📝 Notes Importantes

1. **Le modèle Category** a une couleur par défaut `#007bff` si aucune couleur n'est définie
2. **L'API retourne toujours** le champ `color` dans la réponse (avec valeur par défaut si nécessaire)
3. **Le frontend doit utiliser** `article.category.color` pour afficher la couleur
4. **Les couleurs sont en format hexadécimal** (ex: `#EA580C`)

---

## 🆘 Dépannage

### Toutes les catégories ont la même couleur

1. Vérifiez que les couleurs sont bien dans MongoDB : `node scripts/listCategories.js`
2. Si les couleurs sont correctes dans MongoDB mais pas sur le site :
   - Vérifiez que le frontend utilise bien `article.category.color`
   - Videz le cache du navigateur
   - Vérifiez la console pour les erreurs

### Certaines catégories n'ont pas de couleur

1. Exécutez `node scripts/updateCategoryColors.js` pour mettre à jour
2. Vérifiez que le nom de la catégorie correspond exactement (casse, espaces, etc.)
3. Si nécessaire, ajoutez la catégorie manquante dans le mapping du script

---

**Dernière mise à jour :** Janvier 2026

