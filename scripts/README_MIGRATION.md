# 📋 Scripts de Migration des Catégories

## Scripts Essentiels Conservés

### 1. `migrateCategories.js`
**Usage:** `node scripts/migrateCategories.js [--dry-run]`
- Script principal pour migrer les catégories vers la nouvelle architecture
- Fonctionne sur la base de production (MongoDB Atlas)
- Mode `--dry-run` pour tester sans modifier

### 2. `migrateLocalArticles.js`
**Usage:** `node scripts/migrateLocalArticles.js`
- Migre les articles de la base locale vers les nouvelles catégories
- Nécessaire avant de supprimer les anciennes catégories locales

### 3. `syncLocalCategories.js`
**Usage:** `node scripts/syncLocalCategories.js`
- Synchronise les catégories de la base locale avec la production
- Supprime les anciennes catégories et crée les nouvelles
- À exécuter après `migrateLocalArticles.js`

### 4. `findCategoriesDatabase.js`
**Usage:** `node scripts/findCategoriesDatabase.js`
- Utile pour debug : trouve dans quelle base se trouvent les catégories
- Liste toutes les bases de données et leurs catégories

### 5. `checkMongoConnection.js`
**Usage:** `node scripts/checkMongoConnection.js`
- Vérifie la connexion MongoDB et liste les catégories
- Utile pour debug et vérification

## Workflow de Migration

### Pour la Production (MongoDB Atlas)
```bash
node scripts/migrateCategories.js --dry-run  # Tester d'abord
node scripts/migrateCategories.js              # Appliquer
```

### Pour la Base Locale
```bash
node scripts/migrateLocalArticles.js  # Migrer les articles
node scripts/syncLocalCategories.js    # Nettoyer et créer les catégories
```

## Scripts Supprimés (Redondants)

Les scripts suivants ont été supprimés car redondants :
- `cleanAndCreateCategories.js`
- `deleteAllCategoriesExceptNew.js`
- `deleteAllOldCategories.js`
- `forceCleanCategories.js`
- `forceDeleteOldCategories.js`
- `finalCleanCategories.js`
- `deleteOldCategoriesInXcafrique.js`

Leurs fonctionnalités sont couvertes par les scripts essentiels ci-dessus.

