const DevisService = require("../services/DevisService");

/**
 * DevisController - Couche HTTP pour les devis.
 */
class DevisController {

  static async list(req, res) {
    try {
      const devis = await DevisService.listDevis(req.query);
      return res.json({ devis, count: devis.length });
    } catch (e) {
      console.error("Erreur GET /devis:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async clientList(req, res) {
    try {
      const devis = await DevisService.getClientDevis(req.user.id);
      return res.json({ devis });
    } catch (e) {
      console.error("Erreur GET /devis/client:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async getById(req, res) {
    try {
      const devis = await DevisService.getDevisById(req.params.id, req.user);
      return res.json({ devis });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur GET /devis/:id:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async create(req, res) {
    try {
      const devis = await DevisService.createDevis(req.body, req.user.id);
      return res.status(201).json({ message: "Devis cree avec succes", devis });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur POST /devis:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async update(req, res) {
    try {
      const devis = await DevisService.updateDevis(req.params.id, req.body);
      return res.json({ message: "Devis mis a jour", devis });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur PUT /devis/:id:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async addLigne(req, res) {
    try {
      const ligne = await DevisService.addLigne(req.params.id, req.body);
      return res.status(201).json({ message: "Ligne ajoutee", ligne });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur POST /devis/:id/lignes:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async deleteLigne(req, res) {
    try {
      await DevisService.deleteLigne(req.params.devisId, req.params.ligneId);
      return res.json({ message: "Ligne supprimee" });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur DELETE ligne:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async send(req, res) {
    try {
      const result = await DevisService.sendDevis(req.params.id, req.user.id);
      return res.json(result);
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur POST /devis/:id/send:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async accept(req, res) {
    try {
      await DevisService.acceptDevis(req.params.id, req.user);
      return res.json({ message: "Devis accepte" });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur POST /devis/:id/accept:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async refuse(req, res) {
    try {
      await DevisService.refuseDevis(req.params.id, req.user);
      return res.json({ message: "Devis refuse" });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur POST /devis/:id/refuse:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async requestModification(req, res) {
    try {
      await DevisService.requestModification(req.params.id, req.user, req.body);
      return res.json({ message: "Demande de modification envoyee" });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur POST /devis/:id/request-modification:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async getPdf(req, res) {
    try {
      const { pdfBuffer, reference } = await DevisService.generatePdf(req.params.id, req.user);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="devis-${reference}.pdf"`);
      return res.send(pdfBuffer);
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur GET /devis/:id/pdf:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }
}

module.exports = DevisController;
