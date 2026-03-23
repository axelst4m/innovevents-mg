const ProspectModel = require("../models/ProspectModel");
const { validateEmail } = require("../utils/validators");
const { logAction } = require("../utils/logger");

const ALLOWED_STATUSES = new Set(["a_contacter", "contacte", "qualifie", "refuse"]);

/**
 * ProspectService - Logique metier pour les prospects et clients.
 */
class ProspectService {

  static _parseId(id) {
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      const error = new Error("ID invalide");
      error.status = 400;
      throw error;
    }
    return parsed;
  }

  static async createProspect(data) {
    const {
      company_name, firstname, lastname, email, phone,
      location, event_type, event_date, participants, message
    } = data || {};

    // Validation
    const errors = [];
    const required = { company_name, firstname, lastname, email, phone, location, event_type, event_date, participants, message };

    for (const [k, v] of Object.entries(required)) {
      if (v === undefined || v === null || String(v).trim() === "") {
        errors.push({ field: k, message: "Champ obligatoire" });
      }
    }

    if (email && !validateEmail(email)) {
      errors.push({ field: "email", message: "Email invalide" });
    }

    const participantsInt = Number(participants);
    if (!Number.isInteger(participantsInt) || participantsInt <= 0) {
      errors.push({ field: "participants", message: "Nombre de participants invalide" });
    }

    if (errors.length) {
      const error = new Error("Validation echouee");
      error.status = 400;
      error.errors = errors;
      throw error;
    }

    const created = await ProspectModel.create({
      company_name: company_name.trim(),
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      email: email.trim(),
      phone: phone.trim(),
      location: location.trim(),
      event_type: event_type.trim(),
      event_date,
      participants: participantsInt,
      message: message.trim()
    });

    await logAction({
      type_action: "QUOTE_REQUEST_CREATED",
      userId: null,
      details: { prospect_id: created.id, email: email.trim(), event_type: event_type.trim() }
    });

    return created;
  }

  static async getProspects(query = {}) {
    const { status, limit } = query;
    let limitInt = Number(limit || 50);
    if (!Number.isInteger(limitInt) || limitInt <= 0) limitInt = 50;
    if (limitInt > 200) limitInt = 200;
    return ProspectModel.findAll({ status, limit: limitInt });
  }

  static async getProspectById(id) {
    const parsedId = this._parseId(id);
    const prospect = await ProspectModel.findById(parsedId);
    if (!prospect) {
      const error = new Error("Prospect introuvable");
      error.status = 404;
      throw error;
    }
    return prospect;
  }

  static async updateStatus(id, data) {
    const parsedId = this._parseId(id);
    const nextStatus = String(data?.status || "").trim();

    if (!ALLOWED_STATUSES.has(nextStatus)) {
      const error = new Error("Statut invalide");
      error.status = 400;
      error.allowed = Array.from(ALLOWED_STATUSES);
      throw error;
    }

    const updated = await ProspectModel.updateStatus(parsedId, nextStatus);
    if (!updated) {
      const error = new Error("Prospect introuvable");
      error.status = 404;
      throw error;
    }

    await logAction({
      type_action: "PROSPECT_STATUS_UPDATED",
      userId: null,
      details: { prospect_id: parsedId, status: nextStatus }
    });

    return updated;
  }

  static async getClients() {
    return ProspectModel.findAllClients();
  }

  static async convertToClient(prospectId) {
    const parsedId = this._parseId(prospectId);

    const prospect = await ProspectModel.findFullProspect(parsedId);
    if (!prospect) {
      const error = new Error("Prospect introuvable");
      error.status = 404;
      throw error;
    }

    if (prospect.client_id) {
      const error = new Error("Ce prospect est deja rattache a un client");
      error.status = 409;
      error.client_id = prospect.client_id;
      throw error;
    }

    // Creer le client
    const client = await ProspectModel.createClient({
      company_name: prospect.company_name,
      firstname: prospect.firstname,
      lastname: prospect.lastname,
      email: prospect.email,
      phone: prospect.phone,
      location: prospect.location
    });

    // Lier au compte utilisateur si existant
    const user = await ProspectModel.findUserByEmail(prospect.email);
    if (user) {
      await ProspectModel.linkClientToUser(client.id, user.id);
    }

    // Marquer le prospect comme converti
    await ProspectModel.markConverted(parsedId, client.id);

    // Creer un devis brouillon
    const customMessage = [
      `Demande initiale du ${new Date().toLocaleDateString("fr-FR")}:`,
      `- Type d'evenement: ${prospect.event_type || "Non specifie"}`,
      `- Date souhaitee: ${prospect.event_date || "Non specifiee"}`,
      `- Nombre de participants: ${prospect.participants || "Non specifie"}`,
      prospect.message ? `\nMessage du client:\n${prospect.message}` : ""
    ].filter(Boolean).join("\n");

    const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const devis = await ProspectModel.createDraftDevis({
      clientId: client.id,
      customMessage,
      validUntil
    });

    await logAction({
      type_action: "CREATION_CLIENT",
      userId: null,
      details: {
        client_id: client.id,
        client_name: `${client.firstname} ${client.lastname}`,
        devis_id: devis.id,
        devis_reference: devis.reference
      }
    });

    return { client, devis };
  }
}

module.exports = ProspectService;
