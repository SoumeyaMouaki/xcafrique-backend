# 📧 Configuration de l'envoi d'emails - XCAfrique

## 🔍 Vérification du problème

Si les messages sont bien enregistrés dans la base de données mais que vous ne recevez pas d'emails, c'est que **SMTP n'est pas configuré**.

### Vérifier les logs du serveur

Quand vous envoyez un message de contact, regardez les logs du serveur. Vous devriez voir :

**Si SMTP n'est PAS configuré :**
```
⚠️  Configuration SMTP manquante. Les emails ne seront pas envoyés.
   Configurez SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD dans .env
⚠️  Email non envoyé : transporteur non configuré
```

**Si SMTP est configuré mais qu'il y a une erreur :**
```
❌ Erreur envoi email: [détails de l'erreur]
```

**Si SMTP fonctionne :**
```
✅ Email envoyé: <messageId>
```

---

## ⚙️ Configuration SMTP

### Option 1 : Gmail (Recommandé pour les tests)

1. **Activez l'authentification à deux facteurs** sur votre compte Gmail
   - Allez sur https://myaccount.google.com/security
   - Activez la "Validation en deux étapes"

2. **Générez un mot de passe d'application**
   - Allez sur https://myaccount.google.com/apppasswords
   - Sélectionnez "Mail" et "Autre (nom personnalisé)"
   - Entrez "XCAfrique Backend"
   - Copiez le mot de passe généré (16 caractères)

3. **Configurez dans votre fichier `.env`** :
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=votre_email@gmail.com
   SMTP_PASSWORD=votre_mot_de_passe_app_16_caracteres
   ```

4. **Redémarrez le serveur** :
   ```bash
   npm run dev
   ```

### Option 2 : SendGrid (Recommandé pour la production)

1. **Créez un compte** sur https://sendgrid.com

2. **Créez une API Key** :
   - Allez dans Settings > API Keys
   - Créez une nouvelle clé avec les permissions "Mail Send"
   - Copiez la clé

3. **Configurez dans votre fichier `.env`** :
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASSWORD=votre_api_key_sendgrid
   ```

### Option 3 : Mailgun (Alternative)

1. **Créez un compte** sur https://www.mailgun.com

2. **Récupérez les identifiants SMTP** :
   - Allez dans Sending > Domain Settings
   - Copiez les identifiants SMTP

3. **Configurez dans votre fichier `.env`** :
   ```env
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=votre_username_mailgun
   SMTP_PASSWORD=votre_password_mailgun
   ```

### Option 4 : Autres services SMTP

Vous pouvez utiliser n'importe quel service SMTP. Voici quelques exemples :

**Outlook/Hotmail :**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre_email@outlook.com
SMTP_PASSWORD=votre_mot_de_passe
```

**Yahoo :**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre_email@yahoo.com
SMTP_PASSWORD=votre_mot_de_passe_app
```

---

## 🧪 Tester la configuration

### Méthode 1 : Vérifier les logs

Après avoir configuré SMTP et redémarré le serveur, envoyez un nouveau message de contact et vérifiez les logs :

**Succès :**
```
✅ Email envoyé: <messageId>
```

**Erreur :**
```
❌ Erreur envoi email: [détails]
```

### Méthode 2 : Script de test

Créez un fichier `test-email.js` :

```javascript
require('dotenv').config();
const { sendEmail } = require('./utils/emailService');

async function test() {
  const result = await sendEmail({
    to: 'votre_email@example.com',
    subject: 'Test email XCAfrique',
    html: '<h1>Test</h1><p>Ceci est un test d\'envoi d\'email.</p>'
  });
  
  console.log('Résultat:', result);
}

test();
```

Exécutez :
```bash
node test-email.js
```

---

## 🐛 Dépannage

### Erreur : "Invalid login"

- **Gmail** : Vérifiez que vous utilisez un "Mot de passe d'application" et non votre mot de passe normal
- **Autres services** : Vérifiez vos identifiants

### Erreur : "Connection timeout"

- Vérifiez votre connexion internet
- Vérifiez que le port SMTP n'est pas bloqué par votre firewall
- Essayez un autre port (465 avec SMTP_SECURE=true)

### Erreur : "Authentication failed"

- Vérifiez que `SMTP_USER` et `SMTP_PASSWORD` sont corrects
- Pour Gmail, assurez-vous d'avoir activé "Accès aux applications moins sécurisées" OU utilisez un mot de passe d'application

### Les emails arrivent dans les spams

- Vérifiez votre dossier spam/courrier indésirable
- Pour la production, configurez SPF, DKIM et DMARC pour votre domaine
- Utilisez un service professionnel comme SendGrid ou Mailgun

---

## 📝 Variables d'environnement requises

Pour que l'envoi d'emails fonctionne, vous devez avoir dans votre `.env` :

```env
# Adresses email
CONTACT_EMAIL=contact@xcafrique.org
NEWSLETTER_EMAIL=news@xcafrique.org

# Configuration SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre_email@gmail.com
SMTP_PASSWORD=votre_mot_de_passe_app
```

**Important :** Après avoir modifié `.env`, **redémarrez le serveur** pour que les changements prennent effet.

---

## ✅ Checklist

- [ ] SMTP_HOST est configuré dans `.env`
- [ ] SMTP_PORT est configuré dans `.env`
- [ ] SMTP_USER est configuré dans `.env`
- [ ] SMTP_PASSWORD est configuré dans `.env`
- [ ] Le serveur a été redémarré après modification de `.env`
- [ ] Les logs montrent "✅ Email envoyé" (pas "⚠️ Email non envoyé")
- [ ] Vous recevez les emails (vérifiez aussi les spams)

---

## 💡 Note importante

**En développement**, si vous ne voulez pas configurer SMTP tout de suite, c'est normal. Les messages seront quand même enregistrés dans la base de données, mais les emails ne seront pas envoyés. Vous pouvez configurer SMTP plus tard pour la production.

