# 🚀 Guide de Publication Simple

## Publier votre premier article (article1.json)

### Étape 1 : Vérifier que MongoDB est configuré

Assurez-vous d'avoir un fichier `.env` à la racine du projet avec :
```
MONGODB_URI=votre_connection_string_mongodb
```

### Étape 2 : Lancer le script de publication

Ouvrez un terminal dans le dossier du projet et exécutez :

```bash
node scripts/publishArticle.js
```

Par défaut, cela publiera `article1.json`.

### Étape 3 : Vérifier la publication

Le script affichera :
- ✅ Confirmation de la connexion MongoDB
- ✅ Catégorie trouvée/créée
- ✅ Article publié avec succès
- 🌐 URLs de l'article

### Publier un autre article

Pour publier un autre article (par exemple article2.json) :

```bash
node scripts/publishArticle.js article2.json
```

### Ce que fait le script

1. ✅ Lit le fichier JSON depuis `ready-to-publish/`
2. ✅ Se connecte à MongoDB
3. ✅ Trouve ou crée la catégorie automatiquement
4. ✅ Vérifie qu'aucun article avec le même slug n'existe
5. ✅ Publie l'article avec le statut `"published"`
6. ✅ Copie le fichier vers `published/` pour archivage

### En cas d'erreur

- **"Catégorie non trouvée"** : Le script créera automatiquement la catégorie
- **"Slug existe déjà"** : Un article avec ce slug existe déjà. Modifiez le slug dans le JSON ou supprimez l'article existant
- **"MONGODB_URI non défini"** : Vérifiez votre fichier `.env`

---

**C'est tout !** Votre article est maintenant publié et accessible sur votre site. 🎉

