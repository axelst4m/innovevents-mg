const EventService = require("../services/EventService");

/**
 * EventController - Couche HTTP pour les evenements.
 */
class EventController {

  static async listPublic(req, res) {
    try {
      const result = await EventService.getPublicEvents(req.query);
      return res.json({
        events: result.events,
        count: result.events.length,
        limit: result.limit,
        offset: result.offset
      });
    } catch (e) {
      console.error("Erreur GET /events:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async listAdmin(req, res) {
    try {
      const events = await EventService.getAdminEvents(req.query);
      return res.json({ events, count: events.length });
    } catch (e) {
      console.error("Erreur GET /events/admin:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async getById(req, res) {
    try {
      const event = await EventService.getEventById(req.params.id, req.user || null);
      return res.json({ event });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur GET /events/:id:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async create(req, res) {
    try {
      const event = await EventService.createEvent(req.body, req.user.id);
      return res.status(201).json({ message: "Evenement cree avec succes", event });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur POST /events:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async update(req, res) {
    try {
      const event = await EventService.updateEvent(req.params.id, req.body, req.user.id);
      return res.json({ message: "Evenement mis a jour", event });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur PUT /events/:id:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async delete(req, res) {
    try {
      await EventService.deleteEvent(req.params.id, req.user.id);
      return res.json({ message: "Evenement supprime" });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur DELETE /events/:id:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async addPrestation(req, res) {
    try {
      const prestation = await EventService.addPrestation(req.params.id, req.body);
      return res.status(201).json({ message: "Prestation ajoutee", prestation });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur POST /events/:id/prestations:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async deletePrestation(req, res) {
    try {
      await EventService.deletePrestation(req.params.eventId, req.params.prestationId);
      return res.json({ message: "Prestation supprimee" });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur DELETE prestation:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async getTypes(req, res) {
    return res.json({
      types: [
        { value: "seminaire", label: "S\u00e9minaire" },
        { value: "conference", label: "Conf\u00e9rence" },
        { value: "soiree_entreprise", label: "Soir\u00e9e d'entreprise" },
        { value: "team_building", label: "Team Building" },
        { value: "inauguration", label: "Inauguration" },
        { value: "autre", label: "Autre" }
      ]
    });
  }

  static async getStatuses(req, res) {
    return res.json({
      statuses: [
        { value: "brouillon", label: "Brouillon" },
        { value: "en_attente", label: "En attente" },
        { value: "accepte", label: "Accept\u00e9" },
        { value: "en_cours", label: "En cours" },
        { value: "termine", label: "Termin\u00e9" },
        { value: "annule", label: "Annul\u00e9" }
      ]
    });
  }
}

module.exports = EventController;
