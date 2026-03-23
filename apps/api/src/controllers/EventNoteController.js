const EventNoteService = require("../services/EventNoteService");

/**
 * EventNoteController - Couche HTTP pour les notes d'evenements.
 */
class EventNoteController {

  static async list(req, res) {
    try {
      const notes = await EventNoteService.getNotes(req.params.eventId, req.user.id);
      return res.json({ ok: true, count: notes.length, notes });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ ok: false, error: e.message });
      console.error("Erreur GET /events/:eventId/notes:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }

  static async create(req, res) {
    try {
      const note = await EventNoteService.createNote(
        req.params.eventId, req.user.id, req.body, req.user
      );
      return res.status(201).json({ ok: true, note });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ ok: false, error: e.message });
      console.error("Erreur POST /events/:eventId/notes:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }

  static async delete(req, res) {
    try {
      await EventNoteService.deleteNote(req.params.noteId, req.user);
      return res.json({ ok: true, deleted: true });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ ok: false, error: e.message });
      console.error("Erreur DELETE /events/:eventId/notes/:noteId:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }
}

module.exports = EventNoteController;
