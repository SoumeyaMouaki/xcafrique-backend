# 📡 Documentation Server-Sent Events (SSE) - XCAfrique

## 🎯 Vue d'ensemble

Le système SSE permet au frontend de recevoir des notifications en temps réel lorsqu'un nouvel abonné s'inscrit à la newsletter. Les événements sont émis automatiquement et diffusés à tous les clients connectés.

---

## 🔌 Endpoints

### 1. Connexion SSE

**Endpoint :** `GET /api/newsletter/stream`

**Description :** Établit une connexion SSE pour recevoir les événements en temps réel.

**Headers requis :**
- `Accept: text/event-stream`
- `Cache-Control: no-cache`

**Exemple de requête (JavaScript) :**
```javascript
const eventSource = new EventSource('http://localhost:5000/api/newsletter/stream');

eventSource.onopen = () => {
  console.log('Connexion SSE établie');
};

eventSource.addEventListener('connected', (event) => {
  const data = JSON.parse(event.data);
  console.log('Connecté:', data);
});

eventSource.addEventListener('new_subscriber', (event) => {
  const subscriber = JSON.parse(event.data);
  console.log('Nouvel abonné:', subscriber);
  // subscriber.email
  // subscriber.createdAt
  // subscriber.name (optionnel)
  // subscriber.source (optionnel)
});

eventSource.addEventListener('ping', (event) => {
  // Heartbeat pour maintenir la connexion
  const data = JSON.parse(event.data);
  console.log('Ping:', data.timestamp);
});

eventSource.onerror = (error) => {
  console.error('Erreur SSE:', error);
  // La connexion sera automatiquement reconnectée
};

// Fermer la connexion
// eventSource.close();
```

**Exemple de requête (cURL) :**
```bash
curl -N -H "Accept: text/event-stream" http://localhost:5000/api/newsletter/stream
```

---

### 2. Statistiques des connexions

**Endpoint :** `GET /api/newsletter/stream/stats`

**Description :** Retourne le nombre de clients SSE actuellement connectés.

**Réponse :**
```json
{
  "success": true,
  "data": {
    "connectedClients": 3,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 📨 Format des événements

### Événement : `new_subscriber`

Émis lorsqu'un nouvel abonné s'inscrit à la newsletter.

**Données :**
```json
{
  "email": "user@example.com",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "name": "John Doe",
  "source": "website"
}
```

**Exemple de réception :**
```javascript
eventSource.addEventListener('new_subscriber', (event) => {
  const subscriber = JSON.parse(event.data);
  
  // Afficher une notification
  showNotification(`Nouvel abonné: ${subscriber.email}`);
  
  // Mettre à jour l'interface
  updateSubscriberList(subscriber);
});
```

### Événement : `connected`

Émis lors de l'établissement de la connexion SSE.

**Données :**
```json
{
  "clientId": "client_1_1705312200000",
  "message": "Connexion SSE établie",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Événement : `ping`

Émis toutes les 30 secondes pour maintenir la connexion active (heartbeat).

**Données :**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🔒 Sécurité

### CORS

Les connexions SSE respectent la configuration CORS du serveur. Les origines autorisées sont définies dans `FRONTEND_URL` ou par défaut :
- `http://localhost:3000`
- `http://localhost:5173`
- `http://localhost:5174`
- `http://localhost:5175`

### Rate Limiting

Les connexions SSE sont **exclues** du rate limiting standard pour permettre des connexions longues.

### Authentification (optionnel)

Pour protéger l'endpoint SSE, vous pouvez ajouter l'authentification dans `routes/newsletterRoutes.js` :

```javascript
// Route protégée - Stream SSE
router.get('/stream', authenticate, isAdmin, stream);
```

---

## 🛠️ Configuration

### Variables d'environnement

Aucune variable d'environnement spécifique n'est requise. Le service SSE utilise la configuration CORS existante.

### Heartbeat

Le heartbeat est configuré pour envoyer un ping toutes les 30 secondes. Cela permet de :
- Maintenir la connexion active
- Détecter les connexions mortes
- Éviter les timeouts

### Nettoyage automatique

Les connexions inactives sont automatiquement nettoyées :
- Timeout : 2 minutes d'inactivité
- Nettoyage : Toutes les 5 minutes

---

## 📊 Monitoring

### Logs du serveur

Les connexions SSE sont loggées dans la console :

```
📡 Client SSE connecté: client_1_1705312200000 (Total: 1)
📡 Client SSE déconnecté: client_1_1705312200000 (Total: 0)
```

### Statistiques

Utilisez l'endpoint `/api/newsletter/stream/stats` pour surveiller le nombre de connexions actives.

---

## 🐛 Dépannage

### La connexion se ferme immédiatement

**Causes possibles :**
1. CORS non configuré correctement
2. Proxy/Nginx qui ferme la connexion
3. Firewall qui bloque les connexions longues

**Solutions :**
- Vérifiez la configuration CORS dans `server.js`
- Pour Nginx, ajoutez :
  ```nginx
  proxy_buffering off;
  proxy_cache off;
  ```
- Vérifiez que le port est accessible

### Les événements ne sont pas reçus

**Vérifications :**
1. Vérifiez que le serveur émet bien les événements (logs)
2. Vérifiez que la connexion SSE est active (`eventSource.readyState`)
3. Vérifiez la console du navigateur pour les erreurs

### Erreur CORS

**Solution :**
- Vérifiez que `FRONTEND_URL` dans `.env` contient l'origine du frontend
- Redémarrez le serveur après modification de `.env`

---

## 📝 Exemple complet Frontend

```javascript
class NewsletterSubscriberMonitor {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.eventSource = null;
    this.subscribers = [];
  }

  connect() {
    this.eventSource = new EventSource(`${this.apiUrl}/api/newsletter/stream`);

    this.eventSource.onopen = () => {
      console.log('✅ Connexion SSE établie');
      this.onConnected();
    };

    this.eventSource.addEventListener('connected', (event) => {
      const data = JSON.parse(event.data);
      console.log('Connexion confirmée:', data);
    });

    this.eventSource.addEventListener('new_subscriber', (event) => {
      const subscriber = JSON.parse(event.data);
      console.log('📧 Nouvel abonné:', subscriber);
      this.onNewSubscriber(subscriber);
    });

    this.eventSource.addEventListener('ping', (event) => {
      // Heartbeat - connexion toujours active
    });

    this.eventSource.onerror = (error) => {
      console.error('❌ Erreur SSE:', error);
      this.onError(error);
    };
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('🔌 Connexion SSE fermée');
    }
  }

  onConnected() {
    // Callback personnalisé
    console.log('Connecté au stream SSE');
  }

  onNewSubscriber(subscriber) {
    // Ajouter à la liste
    this.subscribers.push(subscriber);
    
    // Afficher une notification
    this.showNotification(`Nouvel abonné: ${subscriber.email}`);
    
    // Mettre à jour l'UI
    this.updateUI();
  }

  onError(error) {
    // Gérer l'erreur (reconnexion automatique par EventSource)
    console.error('Erreur de connexion SSE:', error);
  }

  showNotification(message) {
    // Implémenter votre système de notification
    console.log('🔔', message);
  }

  updateUI() {
    // Mettre à jour l'interface utilisateur
    console.log(`Total abonnés: ${this.subscribers.length}`);
  }
}

// Utilisation
const monitor = new NewsletterSubscriberMonitor('http://localhost:5000');
monitor.connect();

// Pour fermer la connexion
// monitor.disconnect();
```

---

## ✅ Checklist de test

- [ ] Le serveur démarre sans erreur
- [ ] La connexion SSE s'établit (`GET /api/newsletter/stream`)
- [ ] L'événement `connected` est reçu
- [ ] Les pings sont reçus toutes les 30 secondes
- [ ] Un nouvel abonnement émet l'événement `new_subscriber`
- [ ] Les données de l'événement sont correctes (email, createdAt)
- [ ] La connexion se ferme proprement
- [ ] Les statistiques sont accessibles (`GET /api/newsletter/stream/stats`)
- [ ] CORS fonctionne correctement
- [ ] Le nettoyage automatique fonctionne

---

## 🚀 Production

### Recommandations

1. **Nginx/Reverse Proxy :**
   - Désactivez le buffering pour SSE
   - Configurez les timeouts appropriés

2. **Monitoring :**
   - Surveillez le nombre de connexions actives
   - Alertez si le nombre de connexions est anormalement élevé

3. **Sécurité :**
   - Considérez l'ajout d'authentification pour l'endpoint SSE
   - Limitez le nombre de connexions par IP si nécessaire

4. **Performance :**
   - Le service SSE est optimisé pour gérer des centaines de connexions simultanées
   - Les connexions inactives sont automatiquement nettoyées

---

**Date de création :** 2024  
**Version :** 1.0  
**Dernière mise à jour :** Implémentation SSE pour notifications newsletter

