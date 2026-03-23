const ContactService = require("../services/ContactService");

/**
 * ContactController - Couche HTTP pour les messages de contact.
 * Responsabilite : lire req, appeler le service, formater la reponse HTTP.
 * Ne contient aucune logique metier ni requete SQL.
 */
class ContactController {

  /**
   * POST /api/contact
   * Envoyer un nouveau message de contact.
   */
  static async send(req, res) {
    try {
      const userId = req.user?.id || null;
      const created = await ContactService.sendMessage(req.body, userId);

      return res.status(201).json({
        ok: true,
        message: "Merci pour votre message ! Nous vous repondrons dans les meilleurs delais.",
        contact: { id: created.id, created_at: created.created_at }
      });

    } catch (e) {
      if (e.status === 400 && e.errors) {
        return res.status(400).json({ ok: false, errors: e.errors });
      }
      console.error("Erreur POST /contact:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }

  /**
   * GET /api/contact
   * Lister les messages (admin).
   */
  static async list(req, res) {
    try {
      const messages = await ContactService.getMessages(req.query);

      return res.json({ ok: true, count: messages.length, messages });

    } catch (e) {
      console.error("Erreur GET /contact:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }

  /**
   * GET /api/contact/:id
   * Detail d'un message (admin).
   */
  static async getById(req, res) {
    try {
      const message = await ContactService.getMessageById(req.params.id);

      return res.json({ ok: true, message });

    } catch (e) {
      if (e.status) {
        return res.status(e.status).json({ ok: false, error: e.message });
      }
      console.error("Erreur GET /contact/:id:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }

  /**
   * PATCH /api/contact/:id
   * Marquer lu/archive (admin).
   */
  static async update(req, res) {
    try {
      const updated = await ContactService.updateMessage(req.params.id, req.body);

      return res.json({ ok: true, message: updated });

    } catch (e) {
      if (e.status) {
        return res.status(e.status).json({ ok: false, error: e.message });
      }
      console.error("Erreur PATCH /contact/:id:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }

  /**
   * DELETE /api/contact/:id
   * Supprimer un message (admin).
   */
  static async delete(req, res) {
    try {
      await ContactService.deleteMessage(req.params.id);

      return res.json({ ok: true, deleted: true });

    } catch (e) {
      if (e.status) {
        return res.status(e.status).json({ ok: false, error: e.message });
      }
      console.error("Erreur DELETE /contact/:id:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }
}

module.exports = ContactController;
