/**
 * Service Server-Sent Events (SSE) pour les notifications en temps réel
 * Gère les connexions SSE et l'émission d'événements aux clients connectés
 */

class SSEService {
  constructor() {
    // Map pour stocker les connexions actives
    // Clé: clientId, Valeur: { res: Response, lastPing: Date }
    this.clients = new Map();
    this.clientIdCounter = 0;
    this.heartbeatInterval = null;
  }

  /**
   * Initialise le service SSE
   * Démarre le heartbeat pour maintenir les connexions
   */
  init() {
    // Envoie un ping toutes les 30 secondes pour maintenir la connexion
    this.heartbeatInterval = setInterval(() => {
      this.broadcast('ping', { timestamp: new Date().toISOString() });
    }, 30000);

    console.log('✅ Service SSE initialisé');
  }

  /**
   * Arrête le service SSE
   */
  shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Ferme toutes les connexions
    this.clients.forEach((client, clientId) => {
      this.removeClient(clientId);
    });

    console.log('🛑 Service SSE arrêté');
  }

  /**
   * Ajoute un nouveau client SSE
   * @param {Object} res - Response Express
   * @returns {string} - ID du client
   */
  addClient(res) {
    const clientId = `client_${++this.clientIdCounter}_${Date.now()}`;
    
    // Configuration des headers SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Désactive le buffering pour Nginx
    
    // Permet les connexions CORS
    res.setHeader('Access-Control-Allow-Origin', this.getAllowedOrigin(res));
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Stocke la connexion
    this.clients.set(clientId, {
      res,
      lastPing: new Date(),
      ip: res.req.ip || res.req.connection.remoteAddress
    });

    console.log(`📡 Client SSE connecté: ${clientId} (Total: ${this.clients.size})`);

    // Envoie un message de bienvenue
    this.sendToClient(clientId, 'connected', {
      clientId,
      message: 'Connexion SSE établie',
      timestamp: new Date().toISOString()
    });

    // Gère la déconnexion
    res.on('close', () => {
      this.removeClient(clientId);
    });

    return clientId;
  }

  /**
   * Retire un client de la liste
   * @param {string} clientId - ID du client
   */
  removeClient(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        if (!client.res.headersSent && !client.res.destroyed) {
          client.res.end();
        }
      } catch (error) {
        // Ignorer les erreurs de fermeture (connexion déjà fermée)
        const isNormalError = 
          error.code === 'ECONNRESET' || 
          error.message === 'aborted' || 
          error.message.includes('aborted') ||
          error.message === 'write after end' ||
          error.message.includes('destroyed');
        
        if (!isNormalError) {
          console.error(`Erreur lors de la fermeture de la connexion ${clientId}:`, error.message || error);
        }
      }
      
      this.clients.delete(clientId);
      // Logger seulement en mode développement pour éviter le spam
      if (process.env.NODE_ENV === 'development') {
        console.log(`📡 Client SSE déconnecté: ${clientId} (Total: ${this.clients.size})`);
      }
    }
  }

  /**
   * Envoie un événement à un client spécifique
   * @param {string} clientId - ID du client
   * @param {string} event - Nom de l'événement
   * @param {Object} data - Données à envoyer
   */
  sendToClient(clientId, event, data) {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    try {
      const message = this.formatSSEMessage(event, data);
      client.res.write(message);
      client.lastPing = new Date();
    } catch (error) {
      // Ignorer les erreurs "aborted" (déconnexion normale du client)
      if (error.code !== 'ECONNRESET' && error.message !== 'aborted' && !error.message.includes('aborted')) {
        console.error(`Erreur envoi SSE à ${clientId}:`, error.message || error);
      }
      this.removeClient(clientId);
    }
  }

  /**
   * Diffuse un événement à tous les clients connectés
   * @param {string} event - Nom de l'événement
   * @param {Object} data - Données à envoyer
   */
  broadcast(event, data) {
    const message = this.formatSSEMessage(event, data);
    const disconnectedClients = [];

    this.clients.forEach((client, clientId) => {
      try {
        if (!client.res.headersSent) {
          client.res.write(message);
          client.lastPing = new Date();
        }
      } catch (error) {
        // Ignorer les erreurs "aborted" et "ECONNRESET" (déconnexions normales)
        const isNormalDisconnect = 
          error.code === 'ECONNRESET' || 
          error.message === 'aborted' || 
          error.message.includes('aborted') ||
          error.message === 'write after end';
        
        if (!isNormalDisconnect) {
          console.error(`Erreur broadcast SSE à ${clientId}:`, error.message || error);
        }
        disconnectedClients.push(clientId);
      }
    });

    // Nettoie les clients déconnectés
    disconnectedClients.forEach(clientId => this.removeClient(clientId));
  }

  /**
   * Formate un message SSE selon la spécification
   * @param {string} event - Nom de l'événement
   * @param {Object} data - Données à envoyer
   * @returns {string} - Message formaté SSE
   */
  formatSSEMessage(event, data) {
    let message = '';
    
    // ID de l'événement (optionnel mais recommandé)
    if (data.id) {
      message += `id: ${data.id}\n`;
    }
    
    // Nom de l'événement
    message += `event: ${event}\n`;
    
    // Données (JSON stringifié)
    const jsonData = JSON.stringify(data);
    // Les données SSE doivent être sur une seule ligne ou utiliser \n pour les lignes multiples
    message += `data: ${jsonData}\n\n`;
    
    return message;
  }

  /**
   * Récupère l'origine autorisée pour CORS
   * @param {Object} res - Response Express
   * @returns {string} - Origine autorisée
   */
  getAllowedOrigin(res) {
    const origin = res.req.headers.origin;
    const allowedOrigins = process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',')
      : [
          'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:5175'
        ];

    if (origin && allowedOrigins.includes(origin)) {
      return origin;
    }

    // En développement, autorise toutes les origines localhost
    if (process.env.NODE_ENV === 'development' && origin && origin.includes('localhost')) {
      return origin;
    }

    // Par défaut, retourne la première origine autorisée
    return allowedOrigins[0] || '*';
  }

  /**
   * Retourne le nombre de clients connectés
   * @returns {number}
   */
  getClientCount() {
    return this.clients.size;
  }

  /**
   * Nettoie les connexions inactives (heartbeat timeout)
   * @param {number} timeoutMs - Timeout en millisecondes (défaut: 60 secondes)
   */
  cleanupInactiveClients(timeoutMs = 60000) {
    const now = new Date();
    const inactiveClients = [];

    this.clients.forEach((client, clientId) => {
      const timeSinceLastPing = now - client.lastPing;
      if (timeSinceLastPing > timeoutMs) {
        inactiveClients.push(clientId);
      }
    });

    inactiveClients.forEach(clientId => {
      console.log(`🧹 Nettoyage client inactif: ${clientId}`);
      this.removeClient(clientId);
    });

    return inactiveClients.length;
  }
}

// Instance singleton
const sseService = new SSEService();

module.exports = sseService;

