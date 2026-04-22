/**
 * Middleware pour Angular Dev Server
 * DEPRECATED: Utilisait db.json et json-server
 *
 * ✅ NOUVEAU: Tous les appels API utilisent les endpoints /api
 *    qui pointent vers le backend SQL Server (localhost:7000)
 *
 * Ce middleware n'est plus utilisé.
 */

module.exports = (req, res, next) => {
  // Middleware vide - pas de persistence côté serveur dev
  // Les données sont persistées sur le backend SQL Server
  next();
};
