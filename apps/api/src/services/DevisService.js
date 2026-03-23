const DevisModel = require("../models/DevisModel");
const { generateDevisPDF } = require("../utils/pdfGenerator");
const { sendDevisEmail, sendDevisAcceptedNotification } = require("../utils/mailer");
const { logAction } = require("../utils/logger");

/**
 * DevisService - Logique metier pour les devis.
 */
class DevisService {

  static async listDevis(query = {}) {
    const { status, client_id, limit = 50, offset = 0 } = query;
    return DevisModel.findAll({
      status,
      clientId: client_id,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  }

  static async getClientDevis(userId) {
    return DevisModel.findByClientUserId(userId);
  }

  static async getDevisById(id, user) {
    const devis = await DevisModel.findById(id);
    if (!devis) {
      const error = new Error("Devis non trouve");
      error.status = 404;
      throw error;
    }

    const isAdmin = user.role === 'admin';
    const isEmploye = user.role === 'employe';
    const isOwner = devis.client_user_id === user.id;

    if (!isAdmin && !isEmploye && !isOwner) {
      const error = new Error("Acces refuse");
      error.status = 403;
      throw error;
    }

    devis.lignes = await DevisModel.findLignes(id);
    return devis;
  }

  static async createDevis(data, userId) {
    const { client_id, event_id, valid_until, custom_message, lignes = [] } = data;

    if (!client_id) {
      const error = new Error("client_id est requis");
      error.status = 400;
      throw error;
    }

    const devis = await DevisModel.create({
      clientId: client_id,
      eventId: event_id,
      validUntil: valid_until,
      customMessage: custom_message,
      createdBy: userId
    });

    // Ajouter les lignes
    for (let i = 0; i < lignes.length; i++) {
      const ligne = lignes[i];
      const quantity = ligne.quantity || 1;
      const unitPriceHt = parseFloat(ligne.unit_price_ht);
      const tvaRate = parseFloat(ligne.tva_rate || 20);
      const totalHt = quantity * unitPriceHt;
      const totalTva = totalHt * (tvaRate / 100);
      const totalTtc = totalHt + totalTva;

      await DevisModel.createLigne({
        devisId: devis.id, label: ligne.label,
        description: ligne.description || null, quantity, unitPriceHt,
        tvaRate, totalHt, totalTva, totalTtc, sortOrder: i
      });
    }

    const updatedDevis = await DevisModel.findFresh(devis.id);

    await logAction({
      type_action: "CREATION_DEVIS",
      userId,
      details: { devis_id: devis.id, reference: devis.reference, client_id }
    });

    return updatedDevis;
  }

  static async updateDevis(id, data) {
    const existing = await DevisModel.findFresh(id);
    if (!existing) {
      const error = new Error("Devis non trouve");
      error.status = 404;
      throw error;
    }
    // Mapping des champs du corps de requete (snake_case) vers le modele (camelCase)
    return DevisModel.update(id, {
      eventId: data.event_id,
      validUntil: data.valid_until,
      customMessage: data.custom_message,
      status: data.status
    });
  }

  static async addLigne(devisId, data) {
    const { label, description, quantity = 1, unit_price_ht, tva_rate = 20 } = data;

    if (!label || !unit_price_ht) {
      const error = new Error("label et unit_price_ht requis");
      error.status = 400;
      throw error;
    }

    const exists = await DevisModel.findFresh(devisId);
    if (!exists) {
      const error = new Error("Devis non trouve");
      error.status = 404;
      throw error;
    }

    const qty = parseInt(quantity);
    const priceHt = parseFloat(unit_price_ht);
    const tva = parseFloat(tva_rate);
    const totalHt = qty * priceHt;
    const totalTva = totalHt * (tva / 100);
    const totalTtc = totalHt + totalTva;

    return DevisModel.addLigne({
      devisId, label, description: description || null,
      quantity: qty, unitPriceHt: priceHt, tvaRate: tva,
      totalHt, totalTva, totalTtc
    });
  }

  static async deleteLigne(devisId, ligneId) {
    const deleted = await DevisModel.deleteLigne(ligneId, devisId);
    if (!deleted) {
      const error = new Error("Ligne non trouvee");
      error.status = 404;
      throw error;
    }
    return true;
  }

  static async sendDevis(id, userId) {
    const devis = await DevisModel.findWithClient(id);
    if (!devis) {
      const error = new Error("Devis non trouve");
      error.status = 404;
      throw error;
    }

    const clientHasAccount = !!devis.client_user_id;

    const count = await DevisModel.countLignes(id);
    if (count === 0) {
      const error = new Error("Le devis doit contenir au moins une ligne");
      error.status = 400;
      throw error;
    }

    await DevisModel.updateStatus(id, 'envoye', { sent_at: "NOW()" });

    sendDevisEmail(devis.client_email, devis.client_firstname, devis.reference)
      .catch(err => console.error("Erreur envoi email devis:", err.message));

    console.log(`[DEV] Email envoye a ${devis.client_email} pour le devis ${devis.reference}`);

    await logAction({
      type_action: "ENVOI_DEVIS",
      userId,
      details: {
        devis_id: id, reference: devis.reference,
        client_email: devis.client_email, client_has_account: clientHasAccount
      }
    });

    return {
      message: clientHasAccount
        ? "Devis envoye au client"
        : "Devis envoye. Note: ce client n'a pas encore de compte. Il devra s'inscrire avec l'email " + devis.client_email + " pour consulter son devis en ligne.",
      sent_to: devis.client_email,
      client_has_account: clientHasAccount
    };
  }

  static async acceptDevis(id, user) {
    const devis = await DevisModel.findWithClientFull(id);
    if (!devis) {
      const error = new Error("Devis non trouve");
      error.status = 404;
      throw error;
    }

    if (devis.client_user_id !== user.id && user.role !== 'admin') {
      const error = new Error("Acces refuse");
      error.status = 403;
      throw error;
    }

    if (!['envoye', 'en_etude'].includes(devis.status)) {
      const error = new Error("Ce devis ne peut pas etre accepte dans son etat actuel");
      error.status = 400;
      throw error;
    }

    await DevisModel.updateStatus(id, 'accepte', { accepted_at: "NOW()" });

    if (devis.event_id) {
      await DevisModel.updateEventStatus(devis.event_id, 'accepte');
    }

    await logAction({
      type_action: "ACCEPTATION_DEVIS",
      userId: user.id,
      details: { devis_id: id, reference: devis.reference }
    });

    const clientName = `${devis.client_firstname || ""} (${devis.client_company || ""})`.trim();
    sendDevisAcceptedNotification(devis.reference, clientName)
      .catch(err => console.error("Erreur envoi notification acceptation:", err.message));

    return true;
  }

  static async refuseDevis(id, user) {
    const devis = await DevisModel.findWithClientFull(id);
    if (!devis) {
      const error = new Error("Devis non trouve");
      error.status = 404;
      throw error;
    }

    if (devis.client_user_id !== user.id && user.role !== 'admin') {
      const error = new Error("Acces refuse");
      error.status = 403;
      throw error;
    }

    if (!['envoye', 'en_etude'].includes(devis.status)) {
      const error = new Error("Ce devis ne peut pas etre refuse dans son etat actuel");
      error.status = 400;
      throw error;
    }

    await DevisModel.updateStatus(id, 'refuse', { refused_at: "NOW()" });

    await logAction({
      type_action: "REFUS_DEVIS",
      userId: user.id,
      details: { devis_id: id, reference: devis.reference }
    });

    return true;
  }

  static async requestModification(id, user, data) {
    const { reason } = data;

    if (!reason || reason.trim() === "") {
      const error = new Error("Le motif de modification est requis");
      error.status = 400;
      throw error;
    }

    const devis = await DevisModel.findWithClientFull(id);
    if (!devis) {
      const error = new Error("Devis non trouve");
      error.status = 404;
      throw error;
    }

    if (devis.client_user_id !== user.id && user.role !== 'admin') {
      const error = new Error("Acces refuse");
      error.status = 403;
      throw error;
    }

    await DevisModel.setModification(id, reason.trim());

    await logAction({
      type_action: "DEMANDE_MODIFICATION_DEVIS",
      userId: user.id,
      details: { devis_id: id, reference: devis.reference, reason: reason.trim() }
    });

    return true;
  }

  static async generatePdf(id, user) {
    const devis = await DevisModel.findForPdf(id);
    if (!devis) {
      const error = new Error("Devis non trouve");
      error.status = 404;
      throw error;
    }

    const isAdmin = user.role === 'admin';
    const isEmploye = user.role === 'employe';
    const isOwner = devis.client_user_id === user.id;

    if (!isAdmin && !isEmploye && !isOwner) {
      const error = new Error("Acces refuse");
      error.status = 403;
      throw error;
    }

    devis.lignes = await DevisModel.findLignes(id);

    await logAction({
      type_action: "GENERATION_PDF_DEVIS",
      userId: user.id,
      details: { devis_id: id, reference: devis.reference }
    });

    return { pdfBuffer: await generateDevisPDF(devis), reference: devis.reference };
  }
}

module.exports = DevisService;
