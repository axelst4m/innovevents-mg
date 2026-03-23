const EventModel = require("../models/EventModel");
const { logAction } = require("../utils/logger");

/**
 * EventService - Logique metier pour les evenements.
 */
class EventService {

  static async getPublicEvents(query = {}) {
    const { type, theme, start_date, end_date, limit = 20, offset = 0 } = query;
    const events = await EventModel.findPublic({
      type, theme,
      startDate: start_date,
      endDate: end_date,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    return { events, limit: parseInt(limit), offset: parseInt(offset) };
  }

  static async getAdminEvents(query = {}) {
    const { status, client_id, limit = 50, offset = 0 } = query;
    return EventModel.findAdmin({
      status,
      clientId: client_id,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  }

  static async getEventById(id, user) {
    const event = await EventModel.findById(id);
    if (!event) {
      const error = new Error("Evenement non trouve");
      error.status = 404;
      throw error;
    }

    // Verification d'acces pour les evenements non publics
    if (!event.is_public || event.status === 'brouillon') {
      if (!user) {
        const error = new Error("Acces refuse");
        error.status = 403;
        throw error;
      }
      const isStaff = ['admin', 'employe'].includes(user.role);
      const isOwner = event.client_id && user.clientId === event.client_id;

      if (!isStaff && !isOwner) {
        const error = new Error("Acces refuse");
        error.status = 403;
        throw error;
      }
    }

    // Ajouter les prestations
    event.prestations = await EventModel.findPrestations(id);

    return event;
  }

  static async createEvent(data, userId) {
    const { name, start_date, end_date, location } = data;

    if (!name || !start_date || !end_date || !location) {
      const error = new Error("Champs obligatoires: name, start_date, end_date, location");
      error.status = 400;
      throw error;
    }

    const event = await EventModel.create({ ...data, created_by: userId });

    await logAction({
      type_action: "CREATION_EVENEMENT",
      userId,
      details: { event_id: event.id, event_name: event.name }
    });

    return event;
  }

  static async updateEvent(id, data, userId) {
    const existing = await EventModel.findById(id);
    if (!existing) {
      const error = new Error("Evenement non trouve");
      error.status = 404;
      throw error;
    }

    const event = await EventModel.update(id, data);

    if (data.status && data.status !== existing.status) {
      await logAction({
        type_action: "MODIFICATION_STATUT_EVENEMENT",
        userId,
        details: { event_id: event.id, ancien_statut: existing.status, nouveau_statut: data.status }
      });
    }

    return event;
  }

  static async deleteEvent(id, userId) {
    const existing = await EventModel.findById(id);
    if (!existing) {
      const error = new Error("Evenement non trouve");
      error.status = 404;
      throw error;
    }

    await EventModel.delete(id);

    await logAction({
      type_action: "SUPPRESSION_EVENEMENT",
      userId,
      details: { event_id: existing.id, event_name: existing.name }
    });

    return true;
  }

  static async addPrestation(eventId, data) {
    const { label, amount_ht, tva_rate = 20 } = data;

    if (!label || !amount_ht) {
      const error = new Error("label et amount_ht sont requis");
      error.status = 400;
      throw error;
    }

    const exists = await EventModel.findById(eventId);
    if (!exists) {
      const error = new Error("Evenement non trouve");
      error.status = 404;
      throw error;
    }

    return EventModel.createPrestation({
      eventId,
      label,
      amountHt: amount_ht,
      tvaRate: tva_rate
    });
  }

  static async deletePrestation(eventId, prestationId) {
    const deleted = await EventModel.deletePrestation(prestationId, eventId);
    if (!deleted) {
      const error = new Error("Prestation non trouvee");
      error.status = 404;
      throw error;
    }
    return true;
  }
}

module.exports = EventService;
