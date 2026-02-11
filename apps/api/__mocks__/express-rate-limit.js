// Mock pour les tests - le rate limiting est desactive en mode test de toute facon
module.exports = function rateLimit() {
  return (req, res, next) => next();
};
