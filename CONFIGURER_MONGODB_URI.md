# 🔧 Configurer MONGODB_URI dans Vercel - Guide Rapide

## ⚠️ Erreur actuelle

```
❌ Erreur: MONGODB_URI n'est pas défini dans les variables d'environnement
Node.js process exited with exit status: 1
```

## ✅ Solution en 3 étapes

### Étape 1 : Ouvrir Vercel Dashboard

1. Allez sur **https://vercel.com/dashboard**
2. Cliquez sur votre projet **xcafrique-backend**

### Étape 2 : Ajouter la variable MONGODB_URI

1. Cliquez sur **Settings** (Paramètres) en haut
2. Dans le menu de gauche, cliquez sur **Environment Variables**
3. Cliquez sur le bouton **Add New** (Ajouter)
4. Remplissez le formulaire :

   **Key (Clé) :** 
   ```
   MONGODB_URI
   ```

   **Value (Valeur) :**
   ```
   mongodb+srv://dawini-user:2005Xad5@cluster0.kcwr1dx.mongodb.net/XCAfrique
   ```

   **Environments (Environnements) :**
   - ✅ **Production** (cocher)
   - ✅ **Preview** (cocher)
   - ✅ **Development** (cocher)

5. Cliquez sur **Save** (Enregistrer)

### Étape 3 : Redéployer

**Option A : Redéploiement manuel**
1. Allez dans **Deployments**
2. Trouvez le dernier déploiement
3. Cliquez sur les **trois points (⋯)** à droite
4. Cliquez sur **Redeploy**

**Option B : Déclencher un nouveau déploiement**
1. Faites un petit changement dans votre code (ex: ajouter un commentaire)
2. Commitez et poussez :
   ```bash
   git add .
   git commit -m "Trigger redeploy"
   git push
   ```

---

## 🔍 Vérification

### 1. Vérifier que la variable est bien ajoutée

1. Allez dans **Settings → Environment Variables**
2. Vous devriez voir `MONGODB_URI` dans la liste
3. Vérifiez que les 3 environnements sont cochés

### 2. Vérifier les logs après redéploiement

1. Allez dans **Deployments → Logs**
2. Cherchez dans les logs :
   - ✅ `✅ MongoDB connecté` (succès)
   - ❌ Plus d'erreur `MONGODB_URI n'est pas défini`

### 3. Tester l'API

```bash
curl https://xcafrique-backend.vercel.app/
```

**Résultat attendu :** JSON avec les endpoints (pas d'erreur 500)

---

## 📋 Checklist

- [ ] Variable `MONGODB_URI` ajoutée dans Vercel Dashboard
- [ ] Valeur correcte : `mongodb+srv://dawini-user:2005Xad5@cluster0.kcwr1dx.mongodb.net/XCAfrique`
- [ ] Les 3 environnements sont cochés (Production, Preview, Development)
- [ ] Backend redéployé après configuration
- [ ] Logs Vercel montrent `✅ MongoDB connecté` (ou pas d'erreur)
- [ ] Test de l'API réussi

---

## 🐛 Si ça ne fonctionne toujours pas

### Vérifier le format de la variable

**✅ Correct :**
```
mongodb+srv://dawini-user:2005Xad5@cluster0.kcwr1dx.mongodb.net/XCAfrique
```

**❌ Incorrect :**
- Avec des guillemets : `"mongodb+srv://..."`
- Avec des espaces : ` mongodb+srv://... `
- Avec des retours à la ligne

### Vérifier MongoDB Atlas

1. Allez sur **MongoDB Atlas Dashboard**
2. Cliquez sur **Network Access**
3. Vérifiez que vous avez une entrée autorisant `0.0.0.0/0` (toutes les IPs)
4. Si ce n'est pas le cas, cliquez sur **Add IP Address** → **Allow Access from Anywhere**

### Vérifier que vous avez redéployé

**Important :** Après avoir ajouté une variable d'environnement, vous DEVEZ redéployer pour que la variable soit disponible.

---

## 💡 Note importante

**Les variables d'environnement doivent être configurées dans Vercel Dashboard**, pas dans un fichier `.env`.

Le fichier `.env` est uniquement pour le développement local sur votre machine.

---

**Après avoir configuré `MONGODB_URI` et redéployé, l'erreur devrait disparaître !** ✅

