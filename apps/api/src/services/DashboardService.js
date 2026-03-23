const DashboardModel = require("../models/DashboardModel");

/**
 * DashboardService - Logique metier pour le tableau de bord.
 */
class DashboardService {

  static async getStats() {
    const [prospects, clients, devis, events, derniersProspects, derniersDevis, prochainsEvents, dernieresNotes] = await Promise.all([
      DashboardModel.getProspectsStats(),
      DashboardModel.getClientsStats(),
      DashboardModel.getDevisStats(),
      DashboardModel.getEventsStats(),
      DashboardModel.getRecentProspects(5),
      DashboardModel.getRecentDevis(5),
      DashboardModel.getUpcomingEvents(5),
      DashboardModel.getRecentNotes(5)
    ]);

    return {
      prospects,
      clients,
      devis,
      events,
      derniers_prospects: derniersProspects,
      derniers_devis: derniersDevis,
      prochains_events: prochainsEvents,
      dernieres_notes: dernieresNotes
    };
  }
}

module.exports = DashboardService;
