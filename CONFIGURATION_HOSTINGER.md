# 📧 Configuration SMTP Hostinger - XCAfrique

## 🔑 Paramètres SMTP Hostinger

Pour utiliser Hostinger pour l'envoi d'emails, utilisez ces paramètres :

### Option 1 : Port 465 (SSL - Recommandé)

```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=contact@xcafrique.org
SMTP_PASSWORD=votre_mot_de_passe_email
```

### Option 2 : Port 587 (TLS/STARTTLS)

```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=contact@xcafrique.org
SMTP_PASSWORD=votre_mot_de_passe_email
```

---

## 📋 Étapes de configuration

### 1. Créer un compte email sur Hostinger

1. Connectez-vous à votre **panneau Hostinger** (hPanel)
2. Allez dans **Email** → **Comptes email**
3. Créez un nouveau compte email :
   - **Email** : `contact@xcafrique.org` (ou votre domaine)
   - **Mot de passe** : Choisissez un mot de passe sécurisé
   - Notez bien ce mot de passe, vous en aurez besoin

### 2. Créer un deuxième compte pour la newsletter (optionnel)

Si vous voulez utiliser `news@xcafrique.org` pour la newsletter :
- Créez un deuxième compte email : `news@xcafrique.org`

### 3. Configurer dans votre fichier `.env`

Ouvrez votre fichier `.env` et modifiez les paramètres SMTP :

```env
# Configuration des emails
CONTACT_EMAIL=contact@xcafrique.org
NEWSLETTER_EMAIL=news@xcafrique.org

# Configuration SMTP Hostinger
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=contact@xcafrique.org
SMTP_PASSWORD=votre_mot_de_passe_email_contact
```

**Important :**
- `SMTP_USER` doit être l'adresse email **complète** (ex: `contact@xcafrique.org`)
- `SMTP_PASSWORD` est le mot de passe que vous avez défini lors de la création du compte email
- Utilisez le même compte pour `SMTP_USER` et `CONTACT_EMAIL` (ou créez un compte séparé)

### 4. Redémarrer le serveur

Après avoir modifié `.env`, redémarrez le serveur :

```bash
# Arrêtez le serveur (Ctrl+C) puis :
npm run dev
```

---

## 🧪 Tester la configuration

Envoyez un nouveau message de contact depuis votre frontend. Dans les logs du serveur, vous devriez voir :

**✅ Succès :**
```
✅ Email envoyé: <messageId>
```

**❌ Erreur d'authentification :**
```
❌ Erreur envoi email: Invalid login
```
→ Vérifiez que `SMTP_USER` et `SMTP_PASSWORD` sont corrects

**❌ Erreur de connexion :**
```
❌ Erreur envoi email: Connection timeout
```
→ Essayez le port 587 avec `SMTP_SECURE=false`

---

## 🐛 Dépannage

### Erreur : "Invalid login" ou "Authentication failed"

**Causes possibles :**
1. Le mot de passe est incorrect
2. L'adresse email dans `SMTP_USER` n'est pas complète (doit être `contact@xcafrique.org`, pas juste `contact`)
3. Le compte email n'existe pas encore sur Hostinger

**Solution :**
- Vérifiez dans le panneau Hostinger que le compte email existe
- Vérifiez que vous utilisez le bon mot de passe
- Assurez-vous que `SMTP_USER` contient l'adresse email complète

### Erreur : "Connection timeout"

**Solution :**
- Essayez le port 587 avec `SMTP_SECURE=false` au lieu de 465
- Vérifiez votre connexion internet
- Vérifiez que le firewall n'bloque pas le port

### Les emails arrivent dans les spams

**Solution :**
- Vérifiez votre dossier spam/courrier indésirable
- Pour la production, configurez SPF, DKIM et DMARC dans les DNS de votre domaine
- Contactez le support Hostinger pour configurer ces enregistrements

---

## 📝 Exemple de configuration complète

Voici un exemple complet de fichier `.env` avec Hostinger :

```env
# Port du serveur
PORT=5000

# Environnement
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/xcafrique

# JWT
JWT_SECRET=votre_secret_jwt
JWT_EXPIRE=7d

# Frontend
FRONTEND_URL=http://localhost:5173

# Emails
CONTACT_EMAIL=contact@xcafrique.org
NEWSLETTER_EMAIL=news@xcafrique.org

# SMTP Hostinger
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=contact@xcafrique.org
SMTP_PASSWORD=votre_mot_de_passe_securise
```

---

## ✅ Checklist

- [ ] Compte email créé sur Hostinger (`contact@xcafrique.org`)
- [ ] Mot de passe noté et sécurisé
- [ ] `SMTP_HOST=smtp.hostinger.com` dans `.env`
- [ ] `SMTP_PORT=465` (ou 587) dans `.env`
- [ ] `SMTP_SECURE=true` (pour port 465) ou `false` (pour port 587) dans `.env`
- [ ] `SMTP_USER=contact@xcafrique.org` (adresse complète) dans `.env`
- [ ] `SMTP_PASSWORD` configuré dans `.env`
- [ ] Serveur redémarré après modification de `.env`
- [ ] Test d'envoi effectué
- [ ] Logs montrent "✅ Email envoyé"

---

## 💡 Note importante

Si vous utilisez le même compte email pour `CONTACT_EMAIL` et `SMTP_USER`, c'est parfait. Sinon, vous pouvez créer deux comptes séparés :
- `contact@xcafrique.org` pour les messages de contact
- `news@xcafrique.org` pour la newsletter

Mais pour `SMTP_USER`, utilisez celui qui a les permissions d'envoi (généralement `contact@xcafrique.org`).

