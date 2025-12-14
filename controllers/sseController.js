const sseService = require('../services/sseService');

/**
 * Controller pour Server-Sent Events (SSE)
 * Gère les connexions SSE pour les notifications en temps réel
 */

/**
 * @route   GET /api/newsletter/stream
 * @desc    Établit une connexion SSE pour recevoir les événements en temps réel
 * @access  Public (peut être protégé avec authenticate si nécessaire)
 */
exports.stream = (req, res) => {
  try {
    // Ajoute le client à la liste des connexions SSE
    const clientId = sseService.addClient(res);

    // Gère la déconnexion propre
    req.on('close', () => {
      sseService.removeClient(clientId);
    });

    // Gère les erreurs
    req.on('error', (error) => {
      // Ignorer les erreurs "aborted" et "ECONNRESET" (déconnexions normales)
      const isNormalDisconnect = 
        error.code === 'ECONNRESET' || 
        error.message === 'aborted' || 
        error.message.includes('aborted');
      
      if (!isNormalDisconnect) {
        console.error(`Erreur SSE pour ${clientId}:`, error.message || error);
      }
      sseService.removeClient(clientId);
    });

  } catch (error) {
    console.error('Erreur lors de l\'établissement de la connexion SSE:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'établissement de la connexion SSE'
      });
    }
  }
};

/**
 * @route   GET /api/newsletter/stream/stats
 * @desc    Retourne les statistiques des connexions SSE
 * @access  Public (peut être protégé avec authenticate si nécessaire)
 */
exports.getStats = (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        connectedClients: sseService.getClientCount(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats SSE:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};

