const { pool } = require("../db/postgres");

/**
 * ProspectModel - Couche d'acces aux donnees pour les prospects et clients.
 */
class ProspectModel {

  static async create(data) {
    const { rows } = await pool.query(
      `INSERT INTO prospects (
        company_name, firstname, lastname, email, phone, location,
        event_type, event_date, participants, message
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id, status, created_at`,
      [
        data.company_name, data.firstname, data.lastname,
        data.email, data.phone, data.location,
        data.event_type, data.event_date, data.participants,
        data.message
      ]
    );
    return rows[0];
  }

  static async findAll({ status, limit = 50 } = {}) {
    const where = [];
    const values = [];

    if (status && String(status).trim() !== "") {
      values.push(String(status).trim());
      where.push(`status = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    values.push(limit);
    const { rows } = await pool.query(
      `SELECT id, company_name, firstname, lastname, email, phone, location,
              event_type, event_date, participants, status, created_at
       FROM prospects
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${values.length}`,
      values
    );
    return rows;
  }

  static async findById(id) {
    const { rows } = await pool.query(
      `SELECT
        p.id, p.company_name, p.firstname, p.lastname, p.email, p.phone,
        p.location, p.event_type, p.event_date, p.participants, p.message,
        p.status, p.created_at, p.client_id,
        d.id as devis_id, d.reference as devis_reference
       FROM prospects p
       LEFT JOIN devis d ON d.client_id = p.client_id
       WHERE p.id = $1
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async updateStatus(id, status) {
    const { rows } = await pool.query(
      `UPDATE prospects SET status = $1 WHERE id = $2
       RETURNING id, status, created_at`,
      [status, id]
    );
    return rows[0] || null;
  }

  static async findAllClients() {
    const { rows } = await pool.query(`
      SELECT id, company_name, firstname, lastname, email, phone, location, is_active, created_at
      FROM clients
      WHERE is_active = TRUE
      ORDER BY company_name ASC
    `);
    return rows;
  }

  static async findFullProspect(id) {
    const { rows } = await pool.query(
      `SELECT id, company_name, firstname, lastname, email, phone, location, client_id,
              event_type, event_date, participants, message
       FROM prospects
       WHERE id = $1
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async createClient(data) {
    const { rows } = await pool.query(
      `INSERT INTO clients (company_name, firstname, lastname, email, phone, location)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, company_name, firstname, lastname, email, created_at`,
      [data.company_name, data.firstname, data.lastname, data.email, data.phone, data.location]
    );
    return rows[0];
  }

  static async findUserByEmail(email) {
    const { rows } = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    return rows[0] || null;
  }

  static async linkClientToUser(clientId, userId) {
    await pool.query(
      "UPDATE clients SET user_id = $1 WHERE id = $2",
      [userId, clientId]
    );
  }

  static async markConverted(prospectId, clientId) {
    await pool.query(
      `UPDATE prospects SET client_id = $1, converted_at = NOW(), status = 'qualifie'
       WHERE id = $2`,
      [clientId, prospectId]
    );
  }

  static async createDraftDevis({ clientId, customMessage, validUntil }) {
    const { rows } = await pool.query(
      `INSERT INTO devis (client_id, status, custom_message, valid_until)
       VALUES ($1, 'brouillon', $2, $3)
       RETURNING id, reference`,
      [clientId, customMessage, validUntil]
    );
    return rows[0];
  }
}

module.exports = ProspectModel;
