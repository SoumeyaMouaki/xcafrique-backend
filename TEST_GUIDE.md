# 🧪 Guide de Test - XCAfrique Backend

## 📋 Prérequis

1. **MongoDB doit être en cours d'exécution**
   - Localement ou via MongoDB Atlas
   - Vérifier la connexion : `npm run test-mongo`

2. **Variables d'environnement configurées**
   - Copier `env.example` vers `.env`
   - Configurer au minimum :
     ```env
     MONGODB_URI=mongodb://localhost:27017/xcafrique
     JWT_SECRET=2005Xad5
     CONTACT_EMAIL=contact@xcafrique.org
     NEWSLETTER_EMAIL=news@xcafrique.org
     ```

3. **Démarrer le serveur**
   ```bash
   npm run dev
   ```
   Le serveur sera accessible sur `http://localhost:5000`

---

## 🚀 Tests à effectuer

### 1. Test de base - Vérifier que le serveur fonctionne

**Méthode 1 : Navigateur**
```
http://localhost:5000
```

**Méthode 2 : curl (PowerShell)**
```powershell
curl http://localhost:5000
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "API XC Afrique - Le Cross-check de l'info aérienne",
  "version": "1.0.0",
  "endpoints": {
    "articles": "/api/articles",
    "categories": "/api/categories",
    "auth": "/api/auth",
    "contact": "/api/contact",
    "newsletter": "/api/newsletter"
  }
}
```

---

### 2. Test de l'endpoint Newsletter - S'abonner

#### Méthode 1 : Postman

1. **Créer une nouvelle requête POST**
   - URL : `http://localhost:5000/api/newsletter/subscribe`
   - Headers :
     ```
     Content-Type: application/json
     ```
   - Body (raw JSON) :
     ```json
     {
       "email": "test@example.com",
       "name": "Test User",
       "source": "website"
     }
     ```

2. **Envoyer la requête**

**Résultat attendu (200 OK) :**
```json
{
  "success": true,
  "message": "Abonnement réussi. Vérifiez votre boîte mail pour confirmer.",
  "data": {
    "email": "test@example.com",
    "subscribedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Méthode 2 : curl (PowerShell)

```powershell
curl -X POST http://localhost:5000/api/newsletter/subscribe `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"name\":\"Test User\",\"source\":\"website\"}'
```

#### Méthode 3 : JavaScript (Frontend)

```javascript
fetch('http://localhost:5000/api/newsletter/subscribe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'test@example.com',
    name: 'Test User',
    source: 'website'
  })
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```

---

### 3. Test des cas d'erreur

#### Test 1 : Email invalide

**Requête :**
```json
{
  "email": "email-invalide",
  "name": "Test User"
}
```

**Résultat attendu (400 Bad Request) :**
```json
{
  "success": false,
  "message": "Veuillez fournir une adresse email valide.",
  "error": "INVALID_EMAIL"
}
```

#### Test 2 : Email manquant

**Requête :**
```json
{
  "name": "Test User"
}
```

**Résultat attendu (400 Bad Request) :**
```json
{
  "success": false,
  "message": "L'adresse email est requise.",
  "error": "EMAIL_REQUIRED"
}
```

#### Test 3 : Email déjà abonné

1. S'abonner une première fois avec `test@example.com`
2. Réessayer avec le même email

**Résultat attendu (400 Bad Request) :**
```json
{
  "success": false,
  "message": "Cet email est déjà abonné à la newsletter.",
  "error": "EMAIL_ALREADY_SUBSCRIBED"
}
```

---

### 4. Test de l'endpoint Newsletter - Se désabonner

**Requête POST :**
```
http://localhost:5000/api/newsletter/unsubscribe
```

**Body :**
```json
{
  "email": "test@example.com"
}
```

**Résultat attendu (200 OK) :**
```json
{
  "success": true,
  "message": "Vous avez été désabonné de la newsletter avec succès.",
  "data": {
    "email": "test@example.com",
    "unsubscribedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

---

### 5. Test de l'endpoint Contact (avec emails)

**Requête POST :**
```
http://localhost:5000/api/contact
```

**Body :**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Test de contact",
  "message": "Ceci est un message de test pour vérifier l'envoi d'emails."
}
```

**Résultat attendu (201 Created) :**
```json
{
  "success": true,
  "message": "Message envoyé avec succès. Nous vous répondrons dans les plus brefs délais.",
  "data": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Test de contact"
  }
}
```

**Note :** Si SMTP est configuré, vous devriez recevoir :
- Un email de confirmation à `john@example.com`
- Une notification à `contact@xcafrique.org`

---

### 6. Test des routes Admin (nécessite authentification)

#### Étape 1 : Se connecter

**POST** `http://localhost:5000/api/auth/login`

**Body :**
```json
{
  "email": "admin@xcafrique.com",
  "password": "admin123"
}
```

**Résultat :** Vous recevrez un token JWT

#### Étape 2 : Lister les abonnés

**GET** `http://localhost:5000/api/newsletter/subscribers`

**Headers :**
```
Authorization: Bearer <votre_token_jwt>
```

**Résultat attendu :**
```json
{
  "success": true,
  "count": 1,
  "total": 1,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "...",
      "email": "test@example.com",
      "name": "Test User",
      "source": "website",
      "confirmed": false,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

## 📧 Test de l'envoi d'emails

### Configuration SMTP (optionnel pour les tests)

Pour tester l'envoi d'emails, configurez dans `.env` :

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre_email@gmail.com
SMTP_PASSWORD=votre_mot_de_passe_app
```

**Note :** 
- Pour Gmail, vous devez utiliser un "Mot de passe d'application" (pas votre mot de passe normal)
- Si SMTP n'est pas configuré, les emails ne seront pas envoyés mais l'API fonctionnera quand même

### Vérifier les logs

Quand vous testez l'abonnement newsletter, regardez les logs du serveur :

```
✅ Email envoyé: <messageId>
```

Ou si SMTP n'est pas configuré :

```
⚠️  Email non envoyé : transporteur non configuré
```

---

## 🔍 Vérification dans MongoDB

Vous pouvez vérifier que les données sont bien enregistrées :

### Via MongoDB Compass ou mongo shell

```javascript
// Se connecter à MongoDB
use xcafrique

// Vérifier les abonnés newsletter
db.newsletters.find().pretty()

// Vérifier les messages de contact
db.contacts.find().pretty()
```

---

## ✅ Checklist de test

- [ ] Le serveur démarre sans erreur
- [ ] L'endpoint `/` retourne la liste des endpoints
- [ ] L'abonnement newsletter fonctionne avec un email valide
- [ ] L'abonnement échoue avec un email invalide
- [ ] L'abonnement échoue si l'email est déjà abonné
- [ ] Le désabonnement fonctionne
- [ ] L'envoi de message de contact fonctionne
- [ ] Les emails sont envoyés (si SMTP configuré)
- [ ] Les routes admin nécessitent une authentification
- [ ] Les données sont bien enregistrées dans MongoDB

---

## 🐛 Dépannage

### Erreur : "Cannot find module 'nodemailer'"
```bash
npm install
```

### Erreur : "MongoServerError: connection"
- Vérifiez que MongoDB est en cours d'exécution
- Vérifiez `MONGODB_URI` dans `.env`

### Erreur : "Email non envoyé"
- C'est normal si SMTP n'est pas configuré
- L'API fonctionne quand même, mais les emails ne seront pas envoyés

### Erreur CORS
- Vérifiez `FRONTEND_URL` dans `.env`
- En développement, les origines localhost sont autorisées par défaut

---

## 📞 Support

Pour toute question, consultez le `README.md` principal ou contactez l'équipe.

