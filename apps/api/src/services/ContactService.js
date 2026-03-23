const ContactModel = require("../models/ContactModel");
const { validateEmail } = require("../utils/validators");
const { logAction } = require("../utils/logger");

/**
 * ContactService - Couche metier pour les messages de contact.
 * Responsabilite : validation, regles metier, orchestration des appels.
 * Ne connait pas req/res (independant du protocole HTTP).
 */
class ContactService {

  /**
   * Envoyer un nouveau message de contact.
   * @param {Object} data - Les donnees du formulaire
   * @param {number|null} userId - L'ID de l'utilisateur connecte (optionnel)
   * @returns {Object} Le message cree
   * @throws {Object} { status: 400, errors: [...] } si validation echoue
   */
  static async sendMessage(data, userId = null) {
    const { firstname, lastname, email, phone, subject, message } = data;

    // Validation des champs obligatoires
    const errors = [];
    const required = { firstname, lastname, email, subject, message };

    for (const [key, value] of Object.entries(required)) {
      if (value === undefined || value === null || String(value).trim() === "") {
        errors.push({ field: key, message: "Champ obligatoire" });
      }
    }

    if (email && !validateEmail(email)) {
      errors.push({ field: "email", message: "Email invalide" });
    }

    if (errors.length) {
      const error = new Error("Validation echouee");
      error.status = 400;
      error.errors = errors;
      throw error;
    }

    // Nettoyage des donnees
    const cleanData = {
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      subject: subject.trim(),
      message: message.trim(),
      userId
    };

    // Creation via le Model
    const created = await ContactModel.create(cleanData);

    // Journalisation
    await logAction({
      type_action: "CONTACT_MESSAGE_SENT",
      userId,
      details: {
        message_id: created.id,
        email: cleanData.email,
        subject: cleanData.subject
      }
    });

    return created;
  }

  /**
   * Recuperer la liste des messages avec filtres.
   * @param {Object} query - Les parametres de filtre
   * @returns {Array} Liste des messages
   */
  static async getMessages(query = {}) {
    const { is_read, is_archived, limit } = query;

    // Normalisation du limit
    let limitInt = Number(limit || 50);
    if (!Number.isInteger(limitInt) || limitInt <= 0) limitInt = 50;
    if (limitInt > 200) limitInt = 200;

    // Normalisation des booleens
    const filters = { limit: limitInt };

    if (is_read !== undefined) {
      filters.is_read = is_read === "true" || is_read === "1" || is_read === true;
    }

    if (is_archived !== undefined) {
      filters.is_archived = is_archived === "true" || is_archived === "1" || is_archived === true;
    }

    return ContactModel.findAll(filters);
  }

  /**
   * Recuperer un message par son ID.
   * @param {number} id
   * @returns {Object} Le message
   * @throws {Object} { status: 404 } si introuvable
   */
  static async getMessageById(id) {
    const parsedId = Number(id);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      const error = new Error("ID invalide");
      error.status = 400;
      throw error;
    }

    const message = await ContactModel.findById(parsedId);
    if (!message) {
      const error = new Error("Message introuvable");
      error.status = 404;
      throw error;
    }

    return message;
  }

  /**
   * Mettre a jour un message (lu/archive).
   * @param {number} id
   * @param {Object} fields - { is_read, is_archived }
   * @returns {Object} Le message mis a jour
   * @throws {Object} { status: 400|404 }
   */
  static async updateMessage(id, fields) {
    const parsedId = Number(id);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      const error = new Error("ID invalide");
      error.status = 400;
      throw error;
    }

    const { is_read, is_archived } = fields || {};
    if (is_read === undefined && is_archived === undefined) {
      const error = new Error("Aucune modification");
      error.status = 400;
      throw error;
    }

    const updated = await ContactModel.update(parsedId, { is_read, is_archived });
    if (!updated) {
      const error = new Error("Message introuvable");
      error.status = 404;
      throw error;
    }

    return updated;
  }

  /**
   * Supprimer un message.
   * @param {number} id
   * @returns {boolean}
   * @throws {Object} { status: 400|404 }
   */
  static async deleteMessage(id) {
    const parsedId = Number(id);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      const error = new Error("ID invalide");
      error.status = 400;
      throw error;
    }

    const deleted = await ContactModel.delete(parsedId);
    if (!deleted) {
      const error = new Error("Message introuvable");
      error.status = 404;
      throw error;
    }

    return true;
  }
}

module.exports = ContactService;
