# 📂 Guide de Gestion des Catégories

## 🔍 Lister toutes les catégories

Pour voir toutes les catégories et leur statut :

```bash
node scripts/listCategories.js
```

Pour la base de production :
```bash
MONGODB_URI_PROD="mongodb+srv://..." node scripts/listCategories.js
```

## ✅ Activer une catégorie

Pour activer une catégorie (par exemple `passagers-service`) :

```bash
node scripts/activateCategory.js passagers-service
```

Ou explicitement :
```bash
node scripts/activateCategory.js passagers-service true
```

## ❌ Désactiver une catégorie

Pour désactiver une catégorie :

```bash
node scripts/activateCategory.js passagers-service false
```

## 🌐 Pour la base de production

Si vous voulez activer une catégorie dans la base de données de production (MongoDB Atlas) :

1. **Récupérer l'URI MongoDB de production**
   - Allez dans Vercel Dashboard → Votre projet → Settings → Environment Variables
   - Copiez la valeur de `MONGODB_URI`

2. **Activer la catégorie**
   ```bash
   MONGODB_URI_PROD="mongodb+srv://..." node scripts/activateCategory.js passagers-service
   ```

   Ou ajoutez `MONGODB_URI_PROD` dans votre `.env` :
   ```env
   MONGODB_URI_PROD=mongodb+srv://votre_uri_atlas
   ```
   Puis exécutez simplement :
   ```bash
   node scripts/activateCategory.js passagers-service
   ```

## 📋 Catégories disponibles

Les catégories standard sont :
- `incidents-securite` - Incidents & Sécurité
- `aeroports-infrastructures` - Aéroports & Infrastructures
- `compagnies-aeriennes` - Compagnies aériennes
- `operations-meteo` - Opérations & Météo
- `passagers-service` - Passagers & Service
- `reglementation-conformite` - Réglementation & Conformité
- `flotte-technologie` - Flotte & Technologie
- `economie-finance` - Économie & Finance
- `developpement-durable` - Développement durable
- `formation-emploi` - Formation & Emploi
- `aviation-africaine` - Aviation africaine

## ⚠️ Notes importantes

- Les catégories **inactives** ne sont pas retournées par l'API publique (`/api/categories`)
- Les articles avec une catégorie inactive ne peuvent pas être filtrés par catégorie
- Une catégorie doit être **active** pour que le filtre `?category=slug` fonctionne dans l'API

---

**Dernière mise à jour :** Janvier 2025

