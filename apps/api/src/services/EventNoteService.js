const EventNoteModel = require("../models/EventNoteModel");

/**
 * EventNoteService - Logique metier pour les notes d'evenements.
 */
class EventNoteService {

  static _parseId(id, label = "ID") {
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      const error = new Error(`${label} invalide`);
      error.status = 400;
      throw error;
    }
    return parsed;
  }

  static async getNotes(eventId, userId) {
    const parsedEventId = this._parseId(eventId, "ID evenement");

    const exists = await EventNoteModel.eventExists(parsedEventId);
    if (!exists) {
      const error = new Error("Evenement introuvable");
      error.status = 404;
      throw error;
    }

    return EventNoteModel.findByEventId(parsedEventId, userId);
  }

  static async createNote(eventId, userId, data, user) {
    const parsedEventId = this._parseId(eventId, "ID evenement");

    const { content, is_private } = data || {};

    if (!content || String(content).trim() === "") {
      const error = new Error("Contenu obligatoire");
      error.status = 400;
      throw error;
    }

    const exists = await EventNoteModel.eventExists(parsedEventId);
    if (!exists) {
      const error = new Error("Evenement introuvable");
      error.status = 404;
      throw error;
    }

    const note = await EventNoteModel.create({
      eventId: parsedEventId,
      userId,
      content: content.trim(),
      isPrivate: is_private
    });

    return {
      ...note,
      firstname: user.firstname,
      lastname: user.lastname
    };
  }

  static async deleteNote(noteId, user) {
    const parsedNoteId = this._parseId(noteId, "ID note");

    const note = await EventNoteModel.findById(parsedNoteId);
    if (!note) {
      const error = new Error("Note introuvable");
      error.status = 404;
      throw error;
    }

    if (note.user_id !== user.id && user.role !== "admin") {
      const error = new Error("Non autorise");
      error.status = 403;
      throw error;
    }

    await EventNoteModel.delete(parsedNoteId);
    return true;
  }
}

module.exports = EventNoteService;
