const DashboardService = require("../services/DashboardService");

/**
 * DashboardController - Couche HTTP pour le tableau de bord.
 */
class DashboardController {

  static async getStats(req, res) {
    try {
      const stats = await DashboardService.getStats();
      return res.json(stats);
    } catch (e) {
      console.error("Erreur GET /dashboard/stats:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }
}

module.exports = DashboardController;
