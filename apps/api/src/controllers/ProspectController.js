const ProspectService = require("../services/ProspectService");

/**
 * ProspectController - Couche HTTP pour les prospects et clients.
 */
class ProspectController {

  static async create(req, res) {
    try {
      const created = await ProspectService.createProspect(req.body);
      return res.status(201).json({
        ok: true,
        prospect: { id: created.id, status: created.status, created_at: created.created_at },
        message: "Merci pour votre demande. Axel vous recontactera dans les plus brefs delais pour discuter de votre projet."
      });
    } catch (e) {
      if (e.status === 400 && e.errors) {
        return res.status(400).json({ ok: false, errors: e.errors });
      }
      if (e.status) return res.status(e.status).json({ ok: false, error: e.message });
      console.error(e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }

  static async list(req, res) {
    try {
      const prospects = await ProspectService.getProspects(req.query);
      return res.json({ ok: true, count: prospects.length, prospects });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }

  static async getById(req, res) {
    try {
      const prospect = await ProspectService.getProspectById(req.params.id);
      return res.json({ ok: true, prospect });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ ok: false, error: e.message });
      console.error(e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }

  static async updateStatus(req, res) {
    try {
      const prospect = await ProspectService.updateStatus(req.params.id, req.body);
      return res.json({ ok: true, prospect });
    } catch (e) {
      if (e.status === 400 && e.allowed) {
        return res.status(400).json({ ok: false, error: e.message, allowed: e.allowed });
      }
      if (e.status) return res.status(e.status).json({ ok: false, error: e.message });
      console.error(e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }

  static async listClients(req, res) {
    try {
      const clients = await ProspectService.getClients();
      return res.json({ ok: true, clients });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }

  static async convert(req, res) {
    try {
      const { client, devis } = await ProspectService.convertToClient(req.params.id);
      return res.status(201).json({ ok: true, client, devis });
    } catch (e) {
      if (e.status === 409) {
        return res.status(409).json({ ok: false, error: e.message, client_id: e.client_id });
      }
      if (e.status) return res.status(e.status).json({ ok: false, error: e.message });
      // Doublon email
      if (String(e?.message || "").includes("duplicate key value")) {
        return res.status(409).json({ ok: false, error: "Email deja utilise par un client" });
      }
      console.error(e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }
}

module.exports = ProspectController;
