# 📧 Script d'envoi de confirmation aux abonnés existants

## 🎯 Description

Ce script permet d'envoyer un email de confirmation à tous les abonnés existants dans la base de données. Utile lors de la mise en place du système de confirmation d'email.

## 🚀 Utilisation

### Envoyer à tous les abonnés existants

```bash
npm run send-confirmations
```

ou

```bash
node scripts/sendConfirmationToExistingSubscribers.js
```

### Envoyer uniquement aux abonnés non confirmés

```bash
node scripts/sendConfirmationToExistingSubscribers.js --only-unconfirmed
```

### Mode test (dry-run) - Ne pas envoyer d'emails

```bash
node scripts/sendConfirmationToExistingSubscribers.js --dry-run
```

### Combiner les options

```bash
node scripts/sendConfirmationToExistingSubscribers.js --only-unconfirmed --dry-run
```

## 📋 Ce que fait le script

1. **Se connecte à MongoDB** via la configuration `.env`
2. **Récupère les abonnés** selon les filtres :
   - Par défaut : Tous les abonnés actifs (non désabonnés)
   - Avec `--only-unconfirmed` : Uniquement les non confirmés
3. **Génère un nouveau token** de confirmation pour chaque abonné
4. **Met à jour la base de données** avec le nouveau token
5. **Envoie l'email de confirmation** avec le lien
6. **Affiche un résumé** avec les succès et erreurs

## ⚙️ Options

### `--only-unconfirmed`

Envoie uniquement aux abonnés qui ne sont pas encore confirmés (`confirmed: false`).

**Utile pour :** Envoyer uniquement aux nouveaux abonnés qui n'ont pas encore confirmé.

### `--dry-run`

Mode test qui :
- Génère les tokens
- Affiche les liens de confirmation
- **N'envoie PAS d'emails**
- **Ne modifie PAS la base de données**

**Utile pour :** Tester le script avant de l'exécuter réellement.

## 📊 Exemple de sortie

```
🚀 Script d'envoi de confirmation aux abonnés existants

🔄 Connexion à la base de données...
✅ MongoDB connecté : localhost:27017

📋 Mode : Tous les abonnés existants
📧 25 abonné(s) trouvé(s)
📤 Envoi des emails de confirmation...

[1/25] ✅ user1@example.com - Email envoyé
[2/25] ✅ user2@example.com - Email envoyé
[3/25] ❌ user3@example.com - Erreur: SMTP connection failed
...

==================================================
✅ 23 email(s) envoyé(s) avec succès
❌ 2 erreur(s)

Détails des erreurs:
  - user3@example.com: SMTP connection failed
  - user5@example.com: Invalid email address

==================================================

🔌 Connexion à la base de données fermée
```

## ⚠️ Important

### Avant d'exécuter

1. **Vérifiez votre configuration SMTP** dans `.env`
2. **Testez avec `--dry-run`** d'abord
3. **Vérifiez `FRONTEND_URL`** dans `.env` (pour construire les liens)
4. **Assurez-vous que MongoDB est accessible**

### Limites

- Le script attend **500ms entre chaque email** pour éviter de surcharger le serveur SMTP
- Pour un grand nombre d'abonnés, l'exécution peut prendre du temps
- Les erreurs SMTP sont loggées mais n'arrêtent pas le script

### Sécurité

- Les tokens sont générés de manière sécurisée (64 caractères hex)
- Chaque token expire après 48 heures
- Les tokens précédents sont remplacés par les nouveaux

## 🔄 Réexécution

Vous pouvez réexécuter le script plusieurs fois :
- Les tokens existants seront remplacés par de nouveaux
- Les abonnés déjà confirmés seront marqués comme non confirmés (pour qu'ils confirment à nouveau)
- Les emails seront renvoyés

## 📝 Notes

- Le script utilise `FRONTEND_URL` de `.env` pour construire les liens
- Si `FRONTEND_URL` n'est pas défini, utilise `http://localhost:5173` par défaut
- Les abonnés désabonnés (`unsubscribedAt` non null) sont exclus automatiquement

## 🐛 Dépannage

### Erreur : "Cannot find module"

Assurez-vous d'être dans le répertoire racine du projet :
```bash
cd XCAfrique-backend
node scripts/sendConfirmationToExistingSubscribers.js
```

### Erreur : "MongoDB connection failed"

Vérifiez `MONGODB_URI` dans `.env` et que MongoDB est en cours d'exécution.

### Erreurs SMTP

Vérifiez la configuration SMTP dans `.env` :
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`

### Aucun abonné trouvé

Vérifiez que vous avez des abonnés dans la base de données :
```bash
npm run check-db
```

