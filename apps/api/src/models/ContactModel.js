const { pool } = require("../db/postgres");

/**
 * ContactModel - Couche d'acces aux donnees pour les messages de contact.
 * Responsabilite : executer les requetes SQL, rien d'autre.
 */
class ContactModel {

  /**
   * Creer un nouveau message de contact.
   * @param {Object} data - Les champs du message
   * @returns {Object} Le message cree (id, created_at)
   */
  static async create({ firstname, lastname, email, phone, subject, message, userId }) {
    const { rows } = await pool.query(
      `INSERT INTO contact_messages (firstname, lastname, email, phone, subject, message, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, created_at`,
      [firstname, lastname, email, phone, subject, message, userId]
    );
    return rows[0];
  }

  /**
   * Recuperer la liste des messages avec filtres optionnels.
   * @param {Object} filters - { is_read, is_archived, limit }
   * @returns {Array} Liste des messages
   */
  static async findAll({ is_read, is_archived, limit = 50 } = {}) {
    const where = [];
    const values = [];

    if (is_read !== undefined) {
      values.push(is_read);
      where.push(`is_read = $${values.length}`);
    }

    if (is_archived !== undefined) {
      values.push(is_archived);
      where.push(`is_archived = $${values.length}`);
    } else {
      where.push("is_archived = FALSE");
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    values.push(limit);
    const { rows } = await pool.query(
      `SELECT id, firstname, lastname, email, phone, subject, message,
              is_read, is_archived, user_id, created_at
       FROM contact_messages
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${values.length}`,
      values
    );
    return rows;
  }

  /**
   * Recuperer un message par son ID.
   * @param {number} id
   * @returns {Object|null} Le message ou null
   */
  static async findById(id) {
    const { rows } = await pool.query(
      `SELECT id, firstname, lastname, email, phone, subject, message,
              is_read, is_archived, user_id, created_at
       FROM contact_messages
       WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Mettre a jour les champs d'un message (is_read, is_archived).
   * @param {number} id
   * @param {Object} fields - Les champs a mettre a jour
   * @returns {Object|null} Le message mis a jour ou null
   */
  static async update(id, fields) {
    const updates = [];
    const values = [];

    if (fields.is_read !== undefined) {
      values.push(Boolean(fields.is_read));
      updates.push(`is_read = $${values.length}`);
    }

    if (fields.is_archived !== undefined) {
      values.push(Boolean(fields.is_archived));
      updates.push(`is_archived = $${values.length}`);
    }

    if (!updates.length) return null;

    values.push(id);
    const { rows } = await pool.query(
      `UPDATE contact_messages
       SET ${updates.join(", ")}
       WHERE id = $${values.length}
       RETURNING id, is_read, is_archived`,
      values
    );
    return rows[0] || null;
  }

  /**
   * Supprimer un message par son ID.
   * @param {number} id
   * @returns {boolean} true si supprime, false sinon
   */
  static async delete(id) {
    const { rows } = await pool.query(
      "DELETE FROM contact_messages WHERE id = $1 RETURNING id",
      [id]
    );
    return rows.length > 0;
  }
}

module.exports = ContactModel;
